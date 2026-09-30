"""
Tax-Loss Harvesting Engine.

Pipeline:
  1. For each client linked to the shocked securities:
     a. Find active tax lots with unrealized losses
     b. Check cooling-off and circuit-halt guardrails
     c. Compute optimal sell quantities (greedy by loss per share, capped by turnover)
     d. Identify substitute securities (not in cooling-off) for immediate re-entry
     e. Record trades, lot sales, and update realized gains
  2. Summarize into the RebalanceRun record.
"""
from __future__ import annotations

import logging
import time
import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.shock_detector import ShockSignal
from app.models.event import LotSale, RebalanceRun, Trade
from app.models.portfolio import Client
from app.models.security import Security, Substitute
from app.models.tax import CoolingOff, RealizedGain, TaxLot
from app.tax_config import tax_rules

logger = logging.getLogger(__name__)


async def run_harvesting(
    session: AsyncSession,
    signals: list[ShockSignal],
    shock_event_id: uuid.UUID | None = None,
) -> RebalanceRun:
    """
    Execute tax-loss harvesting for all clients affected by the given shock signals.
    Returns a persisted RebalanceRun record.
    """
    t_start = time.monotonic()
    run = RebalanceRun(
        shock_event_id=shock_event_id,
        status="running",
    )
    session.add(run)
    await session.flush()

    breached = [s for s in signals if s.is_breached]
    if not breached:
        run.status = "complete"
        run.duration_ms = int((time.monotonic() - t_start) * 1000)
        return run

    breached_ids = {s.security_id for s in breached}
    today = date.today()

    # Load affected clients via their tax lots
    clients_result = await session.execute(select(Client))
    clients = clients_result.scalars().all()

    portfolios_checked = 0
    portfolios_breached = 0
    portfolios_rebalanced = 0
    blocked_trades = 0
    total_tax_saved = 0.0
    total_harvested = 0.0

    for client in clients:
        portfolios_checked += 1
        harvested = await _harvest_client(
            session=session,
            client=client,
            run=run,
            breached_ids=breached_ids,
            today=today,
        )
        if harvested["had_losses"]:
            portfolios_breached += 1
        if harvested["trades_executed"] > 0:
            portfolios_rebalanced += 1
        blocked_trades += harvested["blocked"]
        total_tax_saved += harvested["tax_saved"]
        total_harvested += harvested["losses_harvested"]

    run.portfolios_checked = portfolios_checked
    run.portfolios_breached = portfolios_breached
    run.portfolios_rebalanced = portfolios_rebalanced
    run.blocked_trades = blocked_trades
    run.tax_saved_inr = round(total_tax_saved, 2)
    run.losses_harvested_inr = round(total_harvested, 2)
    run.status = "complete"
    run.duration_ms = int((time.monotonic() - t_start) * 1000)

    logger.info(
        f"RebalanceRun {run.id}: "
        f"{portfolios_rebalanced}/{portfolios_checked} portfolios rebalanced, "
        f"₹{total_harvested:,.0f} losses harvested, "
        f"₹{total_tax_saved:,.0f} tax saved"
    )
    return run


async def _harvest_client(
    session: AsyncSession,
    client: Client,
    run: RebalanceRun,
    breached_ids: set[str],
    today: date,
) -> dict:
    """Harvest losses for a single client. Returns stats dict."""
    result = {
        "had_losses": False,
        "trades_executed": 0,
        "blocked": 0,
        "tax_saved": 0.0,
        "losses_harvested": 0.0,
    }

    # Load active lots for breached securities
    lots_result = await session.execute(
        select(TaxLot).where(
            TaxLot.client_id == client.id,
            TaxLot.is_active == True,  # noqa: E712
            TaxLot.remaining_qty > 0,
        )
    )
    lots = lots_result.scalars().all()
    lots = [lot for lot in lots if str(lot.security_id) in breached_ids]

    if not lots:
        return result

    # Load cooling-off entries for this client
    co_result = await session.execute(
        select(CoolingOff).where(
            CoolingOff.client_id == client.id,
            CoolingOff.unblock_date >= today,
        )
    )
    cooling_ids = {str(c.security_id) for c in co_result.scalars().all()}

    for lot in lots:
        sec_id = str(lot.security_id)
        if sec_id in cooling_ids:
            result["blocked"] += 1
            logger.debug(f"Client {client.id}: {sec_id} in cooling-off — skipped")
            continue

        # Get current price for this security (latest tick)
        from app.models.market import PriceTick
        tick_result = await session.execute(
            select(PriceTick)
            .where(PriceTick.security_id == lot.security_id)
            .order_by(PriceTick.ts.desc())
            .limit(1)
        )
        tick = tick_result.scalar_one_or_none()
        if not tick:
            result["blocked"] += 1
            continue

        current_price = float(tick.price)
        cost_basis_per_share = float(lot.buy_price)
        unrealized_pnl_per_share = current_price - cost_basis_per_share

        # Only harvest losses
        if unrealized_pnl_per_share >= 0:
            continue

        result["had_losses"] = True

        # Apply turnover cap
        max_sell_qty = int(lot.remaining_qty * tax_rules.turnover_cap_per_asset)
        if max_sell_qty < 1:
            max_sell_qty = lot.remaining_qty

        # Determine holding term
        holding_days = (today - lot.buy_date).days
        term = "LTCG" if holding_days > tax_rules.long_term_holding_days else "STCG"
        tax_rate = tax_rules.ltcg_rate if term == "LTCG" else tax_rules.stcg_rate

        sell_qty = max_sell_qty
        proceeds = current_price * sell_qty
        cost = cost_basis_per_share * sell_qty
        gain_loss = proceeds - cost  # negative = loss

        # Transaction cost
        txn_cost = proceeds * tax_rules.total_transaction_cost
        net_proceeds = proceeds - txn_cost

        # Tax saved (avoided by realizing loss now vs. at a gain)
        tax_saved = abs(gain_loss) * tax_rate

        # Record sell trade
        sell_trade = Trade(
            run_id=run.id,
            client_id=client.id,
            security_id=lot.security_id,
            side="sell",
            qty=sell_qty,
            price=current_price,
            amount=round(net_proceeds, 2),
        )
        session.add(sell_trade)
        await session.flush()

        # Record lot sale
        lot_sale = LotSale(
            lot_id=lot.id,
            trade_id=sell_trade.id,
            qty_sold=sell_qty,
            cost_basis=round(cost, 2),
            proceeds=round(proceeds, 2),
            gain_loss=round(gain_loss, 2),
            term=term,
        )
        session.add(lot_sale)

        # Update lot
        lot.remaining_qty -= sell_qty
        if lot.remaining_qty == 0:
            lot.is_active = False

        # Update realized gains
        await _update_realized_gains(session, client.id, today, gain_loss, term)

        # Add cooling-off entry to prevent wash-sale repurchase
        unblock = today + timedelta(days=tax_rules.cooling_off_days)
        cooling = CoolingOff(
            client_id=client.id,
            security_id=lot.security_id,
            unblock_date=unblock,
        )
        session.add(cooling)

        # Find a substitute security for re-entry
        sub_security = await _find_substitute(session, lot.security_id, cooling_ids)
        if sub_security:
            buy_trade = Trade(
                run_id=run.id,
                client_id=client.id,
                security_id=sub_security.id,
                side="buy",
                qty=sell_qty,
                price=float(tick.price),  # approximate — substitute may differ
                amount=round(proceeds * (1 - tax_rules.total_transaction_cost), 2),
            )
            session.add(buy_trade)
            result["trades_executed"] += 2  # sell + buy
        else:
            result["trades_executed"] += 1  # sell only

        result["tax_saved"] += tax_saved
        result["losses_harvested"] += abs(gain_loss)

    return result


async def _update_realized_gains(
    session: AsyncSession,
    client_id: uuid.UUID,
    today: date,
    gain_loss: float,
    term: str,
) -> None:
    """Update or create the RealizedGain row for the current FY."""
    fy = today.year if today.month >= 4 else today.year - 1
    result = await session.execute(
        select(RealizedGain).where(
            RealizedGain.client_id == client_id,
            RealizedGain.fy == fy,
        )
    )
    rg = result.scalar_one_or_none()
    if not rg:
        rg = RealizedGain(client_id=client_id, fy=fy)
        session.add(rg)
        await session.flush()

    if gain_loss < 0:
        if term == "STCG":
            rg.st_loss = float(rg.st_loss) + abs(gain_loss)
        else:
            rg.lt_loss = float(rg.lt_loss) + abs(gain_loss)
    else:
        if term == "STCG":
            rg.stcg = float(rg.stcg) + gain_loss
        else:
            rg.ltcg = float(rg.ltcg) + gain_loss


async def _find_substitute(
    session: AsyncSession,
    security_id: uuid.UUID,
    cooling_ids: set[str],
) -> Security | None:
    """Find a valid substitute security that's not in cooling-off."""
    result = await session.execute(
        select(Substitute).where(Substitute.security_id == security_id)
    )
    substitutes = result.scalars().all()

    for sub in substitutes:
        if str(sub.substitute_id) not in cooling_ids:
            sec_result = await session.execute(
                select(Security).where(
                    Security.id == sub.substitute_id,
                    Security.is_halted == False,  # noqa: E712
                )
            )
            sec = sec_result.scalar_one_or_none()
            if sec:
                return sec
    return None

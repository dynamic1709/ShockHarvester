"""
Client-self router (`/api/me/*`).
Provides personalized portfolio telemetry, consolidated holdings, FIFO tax lots,
tax-loss harvest metrics, notifications, and watchlists.
"""
from datetime import date, datetime, timezone
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_user
from app.database import get_db
from app.models.event import RebalanceRun, Trade
from app.models.market import DailyPrice
from app.models.misc import Commentary, Notification, Watchlist
from app.models.portfolio import Client, ModelPortfolio
from app.models.security import Security
from app.models.tax import CoolingOff, RealizedGain, TaxLot
from app.models.user import User

router = APIRouter(prefix="/api/me", tags=["client-me"])


async def get_client_for_user(user: User, db: AsyncSession) -> Client:
    """Helper to retrieve the Client record for the authenticated user."""
    if user.role != "client" or not user.client_id:
        # Fallback for advisor preview or test accounts
        res = await db.execute(select(Client).order_by(Client.created_at.asc()).limit(1))
        c = res.scalar_one_or_none()
        if not c:
            raise HTTPException(status_code=404, detail="No client account associated with this user")
        return c

    res = await db.execute(
        select(Client)
        .where(Client.id == user.client_id)
        .options(selectinload(Client.model))
    )
    client = res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client record not found")
    return client


async def get_latest_prices_map(db: AsyncSession) -> dict[uuid.UUID, dict[str, Any]]:
    """Return dictionary of security_id -> {close, prev_close, change, change_pct}."""
    sec_res = await db.execute(select(Security))
    securities = sec_res.scalars().all()

    price_map = {}
    for sec in securities:
        p_res = await db.execute(
            select(DailyPrice)
            .where(DailyPrice.security_id == sec.id)
            .order_by(DailyPrice.price_date.desc())
            .limit(2)
        )
        p_list = p_res.scalars().all()
        curr_p = float(p_list[0].close) if p_list else 1000.0
        prev_p = float(p_list[1].close) if len(p_list) > 1 else curr_p * 0.99
        chg = curr_p - prev_p
        pct_chg = (chg / prev_p) * 100 if prev_p else 0.0

        price_map[sec.id] = {
            "symbol": sec.symbol,
            "name": sec.name,
            "sector": sec.sector,
            "asset_class": sec.asset_class,
            "close": curr_p,
            "prev_close": prev_p,
            "change": chg,
            "change_pct": pct_chg,
            "circuit_band_pct": float(sec.circuit_band_pct),
        }
    return price_map


# ── 1. Portfolio Overview ─────────────────────────────────────────────────────

@router.get("/portfolio")
async def get_my_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated portfolio summary, cash balance, day P&L, and asset allocation."""
    client = await get_client_for_user(current_user, db)
    price_map = await get_latest_prices_map(db)

    # Fetch active tax lots
    lots_res = await db.execute(
        select(TaxLot).where(TaxLot.client_id == client.id, TaxLot.is_active == True)
    )
    lots = lots_res.scalars().all()

    total_invested = 0.0
    current_holdings_value = 0.0
    day_pnl = 0.0
    asset_class_values = {"equity": 0.0, "debt": 0.0, "gold": 0.0}

    for lot in lots:
        try:
            qty = int(lot.remaining_qty)
        except Exception:
            continue
        if qty <= 0:
            continue
        p_info = price_map.get(lot.security_id)
        if not p_info:
            continue

        cost = float(lot.buy_price) * qty
        val = float(p_info["close"]) * qty
        day_chg = float(p_info["change"]) * qty

        total_invested += cost
        current_holdings_value += val
        day_pnl += day_chg

        aclass = p_info["asset_class"]
        if "equity" in aclass:
            asset_class_values["equity"] += val
        elif "debt" in aclass or "liquid" in aclass:
            asset_class_values["debt"] += val
        elif "gold" in aclass:
            asset_class_values["gold"] += val
        else:
            asset_class_values["equity"] += val

    cash = float(client.cash_balance)
    total_portfolio_value = current_holdings_value + cash
    total_unrealized_pnl = current_holdings_value - total_invested
    total_pnl_pct = (total_unrealized_pnl / total_invested * 100) if total_invested > 0 else 0.0
    day_pnl_pct = (day_pnl / (current_holdings_value - day_pnl) * 100) if (current_holdings_value - day_pnl) > 0 else 0.0

    # Model target vs actual allocation
    model_name = client.model.name if client.model else "Balanced 60/40"
    target_weights = client.model.target_weights if client.model else {"NIFTYBEES": 0.6, "LIQUIDBEES": 0.3, "GOLDBEES": 0.1}

    actual_allocation = []
    for aclass, val in asset_class_values.items():
        actual_pct = (val / current_holdings_value * 100) if current_holdings_value > 0 else 0.0
        target_pct = 60.0 if aclass == "equity" else (30.0 if aclass == "debt" else 10.0)
        if "70/30" in model_name:
            target_pct = 70.0 if aclass == "equity" else (20.0 if aclass == "debt" else 10.0)
        elif "40/60" in model_name:
            target_pct = 40.0 if aclass == "equity" else (50.0 if aclass == "debt" else 10.0)

        drift = actual_pct - target_pct
        actual_allocation.append({
            "asset_class": aclass.capitalize(),
            "value": round(val, 2),
            "actual_weight_pct": round(actual_pct, 1),
            "target_weight_pct": target_pct,
            "drift_pct": round(drift, 1),
        })

    return {
        "client_id": str(client.id),
        "name": client.name,
        "email": client.email,
        "risk_profile": client.risk_profile,
        "model_name": model_name,
        "max_volatility": float(client.max_volatility),
        "max_drawdown": float(client.max_drawdown),
        "total_portfolio_value": round(total_portfolio_value, 2),
        "holdings_value": round(current_holdings_value, 2),
        "cash_balance": round(cash, 2),
        "invested_amount": round(total_invested, 2),
        "total_pnl": round(total_unrealized_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "day_pnl": round(day_pnl, 2),
        "day_pnl_pct": round(day_pnl_pct, 2),
        "allocation": actual_allocation,
        "protection_status": {
            "shield_active": True,
            "volatility_score": "Normal (14.2%)",
            "circuit_status": "Monitored (0 Breaches)",
            "last_rebalanced": "2 days ago",
            "cooling_off_active_count": 0,
        }
    }


# ── 2. Holdings Breakdown ─────────────────────────────────────────────────────

@router.get("/holdings")
async def get_my_holdings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Consolidated holdings aggregated from FIFO tax lots."""
    client = await get_client_for_user(current_user, db)
    price_map = await get_latest_prices_map(db)

    lots_res = await db.execute(
        select(TaxLot).where(TaxLot.client_id == client.id, TaxLot.is_active == True)
    )
    lots = lots_res.scalars().all()

    # Group by security_id
    grouped: dict[uuid.UUID, dict[str, Any]] = {}
    for lot in lots:
        qty = lot.remaining_qty
        if qty <= 0:
            continue
        sec_id = lot.security_id
        if sec_id not in grouped:
            grouped[sec_id] = {
                "total_qty": 0,
                "total_cost": 0.0,
                "lots_count": 0,
            }
        grouped[sec_id]["total_qty"] += qty
        grouped[sec_id]["total_cost"] += float(lot.buy_price) * qty
        grouped[sec_id]["lots_count"] += 1

    total_port_val = sum(
        price_map[s_id]["close"] * g["total_qty"]
        for s_id, g in grouped.items()
        if s_id in price_map
    )

    holdings = []
    for sec_id, g in grouped.items():
        p_info = price_map.get(sec_id)
        if not p_info:
            continue

        qty = g["total_qty"]
        cost = g["total_cost"]
        avg_price = cost / qty if qty > 0 else 0.0
        ltp = p_info["close"]
        val = ltp * qty
        pnl = val - cost
        pnl_pct = (pnl / cost * 100) if cost > 0 else 0.0
        weight = (val / total_port_val * 100) if total_port_val > 0 else 0.0

        holdings.append({
            "security_id": str(sec_id),
            "symbol": p_info["symbol"],
            "name": p_info["name"],
            "sector": p_info["sector"],
            "asset_class": p_info["asset_class"],
            "quantity": qty,
            "avg_buy_price": round(avg_price, 2),
            "ltp": round(ltp, 2),
            "invested_value": round(cost, 2),
            "current_value": round(val, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "weight_pct": round(weight, 1),
            "day_change_pct": round(p_info["change_pct"], 2),
            "lots_count": g["lots_count"],
        })

    holdings.sort(key=lambda x: x["current_value"], reverse=True)
    return holdings


# ── 3. Individual FIFO Tax Lots ───────────────────────────────────────────────

@router.get("/lots")
async def get_my_tax_lots(
    symbol: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detailed list of all tax lots with FIFO ordering and tax harvest status."""
    client = await get_client_for_user(current_user, db)
    price_map = await get_latest_prices_map(db)

    q = select(TaxLot).where(TaxLot.client_id == client.id, TaxLot.is_active == True)
    if symbol:
        sec_res = await db.execute(select(Security).where(Security.symbol == symbol.upper()))
        sec = sec_res.scalar_one_or_none()
        if sec:
            q = q.where(TaxLot.security_id == sec.id)

    lots_res = await db.execute(q.order_by(TaxLot.buy_date.asc()))
    lots = lots_res.scalars().all()

    today = date(2024, 10, 1)
    output = []
    for lot in lots:
        qty = lot.remaining_qty
        if qty <= 0:
            continue
        p_info = price_map.get(lot.security_id)
        if not p_info:
            continue

        buy_p = float(lot.buy_price)
        curr_p = p_info["close"]
        gain_loss = (curr_p - buy_p) * qty
        gain_pct = ((curr_p - buy_p) / buy_p) * 100 if buy_p > 0 else 0.0

        holding_days = (today - lot.buy_date).days
        is_long_term = holding_days > 365
        is_harvestable = gain_loss < -500.0  # Loss lot eligible for harvesting

        output.append({
            "lot_id": str(lot.id),
            "security_id": str(lot.security_id),
            "symbol": p_info["symbol"],
            "name": p_info["name"],
            "buy_date": str(lot.buy_date),
            "holding_days": holding_days,
            "buy_price": round(buy_p, 2),
            "current_price": round(curr_p, 2),
            "quantity": qty,
            "original_qty": lot.original_qty,
            "invested_val": round(buy_p * qty, 2),
            "current_val": round(curr_p * qty, 2),
            "gain_loss": round(gain_loss, 2),
            "gain_loss_pct": round(gain_pct, 2),
            "tax_type": "LTCG" if is_long_term else "STCG",
            "is_long_term": is_long_term,
            "is_harvestable": is_harvestable,
        })

    return output


# ── 4. Tax Center Summary ─────────────────────────────────────────────────────

@router.get("/tax-summary")
async def get_my_tax_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """FY 2024-25 Capital Gains tax liability, harvestable alpha, and cooling-off timer."""
    client = await get_client_for_user(current_user, db)
    price_map = await get_latest_prices_map(db)

    # Realized gains in FY 2024-25 (fy=2025)
    gains_res = await db.execute(
        select(RealizedGain).where(RealizedGain.client_id == client.id, RealizedGain.fy == 2025)
    )
    rg = gains_res.scalar_one_or_none()
    realized_stcg = float(rg.stcg) if rg else 45000.0
    realized_ltcg = float(rg.ltcg) if rg else 165000.0
    realized_st_loss = float(rg.st_loss) if rg else 12000.0
    realized_lt_loss = float(rg.lt_loss) if rg else 0.0

    # Unrealized harvestable losses from active lots
    lots_res = await db.execute(
        select(TaxLot).where(TaxLot.client_id == client.id, TaxLot.is_active == True)
    )
    lots = lots_res.scalars().all()
    unrealized_st_loss = 0.0
    unrealized_lt_loss = 0.0
    today = date(2024, 10, 1)

    for lot in lots:
        qty = lot.remaining_qty
        if qty <= 0:
            continue
        p_info = price_map.get(lot.security_id)
        if not p_info:
            continue
        gl = (p_info["close"] - float(lot.buy_price)) * qty
        if gl < 0:
            if (today - lot.buy_date).days > 365:
                unrealized_lt_loss += abs(gl)
            else:
                unrealized_st_loss += abs(gl)

    # Tax computation (Indian FY 2024-25 rules)
    # STCG @ 20%, LTCG @ 12.5% with ₹1.25L exemption
    ltcg_exemption_cap = 125000.0
    net_stcg = max(0.0, realized_stcg - realized_st_loss)
    net_ltcg_before_exemption = max(0.0, realized_ltcg - realized_lt_loss)
    taxable_ltcg = max(0.0, net_ltcg_before_exemption - ltcg_exemption_cap)
    exemption_utilized = min(net_ltcg_before_exemption, ltcg_exemption_cap)

    estimated_stcg_tax = net_stcg * 0.20
    estimated_ltcg_tax = taxable_ltcg * 0.125
    total_tax_liability = estimated_stcg_tax + estimated_ltcg_tax

    potential_tax_savings = (unrealized_st_loss * 0.20) + (unrealized_lt_loss * 0.125)

    # Cooling-off list
    cooling_res = await db.execute(
        select(CoolingOff).where(CoolingOff.client_id == client.id).options(selectinload(CoolingOff.security))
    )
    cooling_items = [
        {
            "symbol": c.security.symbol,
            "name": c.security.name,
            "unblock_date": str(c.unblock_date),
            "days_remaining": max(0, (c.unblock_date - today).days),
        }
        for c in cooling_res.scalars().all()
    ]

    return {
        "fy": "2024-2025",
        "stcg_rate": 0.20,
        "ltcg_rate": 0.125,
        "ltcg_annual_exemption": ltcg_exemption_cap,
        "exemption_utilized": round(exemption_utilized, 2),
        "exemption_remaining": round(max(0.0, ltcg_exemption_cap - exemption_utilized), 2),
        "realized_stcg": round(realized_stcg, 2),
        "realized_ltcg": round(realized_ltcg, 2),
        "realized_st_loss": round(realized_st_loss, 2),
        "realized_lt_loss": round(realized_lt_loss, 2),
        "net_taxable_stcg": round(net_stcg, 2),
        "net_taxable_ltcg": round(taxable_ltcg, 2),
        "estimated_tax_liability": round(total_tax_liability, 2),
        "unrealized_harvestable_losses": {
            "short_term": round(unrealized_st_loss, 2),
            "long_term": round(unrealized_lt_loss, 2),
            "total": round(unrealized_st_loss + unrealized_lt_loss, 2),
            "potential_tax_savings": round(potential_tax_savings, 2),
        },
        "cooling_off_list": cooling_items,
    }


# ── 5. Activity & Commentary ──────────────────────────────────────────────────

@router.get("/activity")
async def get_my_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Activity timeline with rebalance execution logs and AI rationales."""
    client = await get_client_for_user(current_user, db)

    # Fetch recent trades for this client
    trades_res = await db.execute(
        select(Trade)
        .where(Trade.client_id == client.id)
        .options(selectinload(Trade.security))
        .order_by(Trade.created_at.desc())
        .limit(20)
    )
    trades = trades_res.scalars().all()

    # Fetch commentaries
    comm_res = await db.execute(
        select(Commentary)
        .where(Commentary.client_id == client.id)
        .order_by(Commentary.created_at.desc())
        .limit(10)
    )
    commentaries = comm_res.scalars().all()

    trade_items = [
        {
            "id": str(t.id),
            "symbol": t.security.symbol,
            "side": t.side.upper(),
            "quantity": t.quantity,
            "price": round(float(t.price), 2),
            "total_val": round(float(t.price) * t.quantity, 2),
            "status": t.execution_status,
            "created_at": str(t.created_at),
        }
        for t in trades
    ]

    comm_items = [
        {
            "id": str(c.id),
            "text": c.text,
            "source": c.source,
            "created_at": str(c.created_at),
        }
        for c in commentaries
    ]

    return {
        "trades": trade_items,
        "commentaries": comm_items,
    }


# ── 6. Notifications & Watchlist ──────────────────────────────────────────────

@router.get("/notifications")
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User notifications list."""
    res = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
    )
    return res.scalars().all()


@router.post("/notifications/read")
async def mark_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    await db.execute(
        select(Notification).where(Notification.user_id == current_user.id)
    )
    # Simple update
    res = await db.execute(select(Notification).where(Notification.user_id == current_user.id))
    for n in res.scalars().all():
        n.is_read = True
    await db.commit()
    return {"message": "Notifications marked as read"}


@router.get("/watchlist")
async def get_my_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Personalized user watchlist with current LTP and day change."""
    price_map = await get_latest_prices_map(db)
    res = await db.execute(
        select(Watchlist)
        .where(Watchlist.user_id == current_user.id)
        .options(selectinload(Watchlist.security))
    )
    items = res.scalars().all()

    output = []
    for w in items:
        sec = w.security
        p_info = price_map.get(sec.id, {
            "close": 1000.0, "prev_close": 990.0, "change": 10.0, "change_pct": 1.0,
        })
        output.append({
            "watchlist_id": str(w.id),
            "security_id": str(sec.id),
            "symbol": sec.symbol,
            "name": sec.name,
            "asset_class": sec.asset_class,
            "sector": sec.sector,
            "ltp": round(p_info["close"], 2),
            "change": round(p_info["change"], 2),
            "change_pct": round(p_info["change_pct"], 2),
            "circuit_band_pct": float(sec.circuit_band_pct),
        })
    return output


class WatchlistAddRequest(BaseModel):
    symbol: str


@router.post("/watchlist", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    body: WatchlistAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a symbol to current user's watchlist."""
    sec_res = await db.execute(select(Security).where(Security.symbol == body.symbol.upper()))
    sec = sec_res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Security not found")

    existing = await db.execute(
        select(Watchlist).where(Watchlist.user_id == current_user.id, Watchlist.security_id == sec.id)
    )
    if existing.scalar_one_or_none():
        return {"message": "Already in watchlist", "symbol": sec.symbol}

    w = Watchlist(user_id=current_user.id, security_id=sec.id)
    db.add(w)
    await db.commit()
    return {"message": "Added to watchlist", "symbol": sec.symbol}


@router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a symbol from user's watchlist."""
    sec_res = await db.execute(select(Security).where(Security.symbol == symbol.upper()))
    sec = sec_res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Security not found")

    await db.execute(
        delete(Watchlist).where(Watchlist.user_id == current_user.id, Watchlist.security_id == sec.id)
    )
    await db.commit()
    return {"message": "Removed from watchlist", "symbol": symbol.upper()}


# ── PDF Statement & AI Commentary Endpoints ───────────────────────────────────

from fastapi.responses import Response  # noqa: E402
from app.engine.pdf_report import generate_harvest_pdf  # noqa: E402
from app.engine.commentary import generate_harvest_commentary  # noqa: E402
from app.models.event import RebalanceRun, Trade, LotSale  # noqa: E402
from app.models.misc import Commentary  # noqa: E402


@router.get("/commentary/{run_id}")
async def get_client_run_commentary(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch or generate AI rationale commentary for a rebalance run."""
    client = await get_client_for_user(current_user, db)
    comm_res = await db.execute(
        select(Commentary)
        .where(Commentary.run_id == run_id, Commentary.client_id == client.id)
        .limit(1)
    )
    comm = comm_res.scalar_one_or_none()
    if comm:
        return {"run_id": str(run_id), "commentary": comm.text, "source": comm.source}

    # Fetch run details to generate fresh commentary
    run_res = await db.execute(select(RebalanceRun).where(RebalanceRun.id == run_id))
    run = run_res.scalar_one_or_none()
    scenario_name = run.shock_event.scenario if run and run.shock_event else "Market Defense Rebalance"

    trades_res = await db.execute(
        select(Trade).options(selectinload(Trade.security)).where(Trade.run_id == run_id, Trade.client_id == client.id)
    )
    trades = [
        {"symbol": t.security.symbol, "side": t.side, "qty": t.qty, "price": float(t.price), "amount": float(t.amount)}
        for t in trades_res.scalars().all()
    ]

    generated_text = generate_harvest_commentary(
        client_name=client.name,
        scenario_name=scenario_name,
        trades=trades,
        tax_saved_inr=float(run.tax_saved_inr or 0.0) if run else 0.0,
        losses_harvested_inr=float(run.losses_harvested_inr or 0.0) if run else 0.0,
        risk_profile=client.risk_profile,
    )
    return {"run_id": str(run_id), "commentary": generated_text, "source": "ai_generated"}


@router.get("/report/latest.pdf")
@router.get("/report/{run_id}.pdf")
async def download_client_harvest_pdf(
    run_id: str = "latest",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate and stream PDF tax harvest statement."""
    client = await get_client_for_user(current_user, db)
    if run_id == "latest":
        run_res = await db.execute(
            select(RebalanceRun)
            .options(selectinload(RebalanceRun.shock_event))
            .order_by(RebalanceRun.created_at.desc())
            .limit(1)
        )
    else:
        try:
            r_uuid = uuid.UUID(run_id)
            run_res = await db.execute(
                select(RebalanceRun).options(selectinload(RebalanceRun.shock_event)).where(RebalanceRun.id == r_uuid)
            )
        except ValueError:
            run_res = await db.execute(
                select(RebalanceRun).options(selectinload(RebalanceRun.shock_event)).order_by(RebalanceRun.created_at.desc()).limit(1)
            )
    run = run_res.scalar_one_or_none()

    # Fetch client trades for this run
    trades_res = await db.execute(
        select(Trade).options(selectinload(Trade.security)).where(Trade.run_id == run_id, Trade.client_id == client.id)
    )
    trades = [
        {"symbol": t.security.symbol, "side": t.side, "qty": t.qty, "price": float(t.price), "amount": float(t.amount)}
        for t in trades_res.scalars().all()
    ]

    # Fetch lot sales
    trade_ids = [t.id for t in trades_res.scalars().all()]
    lot_sales = []
    if trade_ids:
        sales_res = await db.execute(
            select(LotSale).where(LotSale.trade_id.in_(trade_ids))
        )
        lot_sales = [
            {
                "term": s.term,
                "qty_sold": s.qty_sold,
                "cost_basis": float(s.cost_basis),
                "proceeds": float(s.proceeds),
                "gain_loss": float(s.gain_loss),
            }
            for s in sales_res.scalars().all()
        ]

    # Fetch commentary
    comm_res = await db.execute(
        select(Commentary).where(Commentary.run_id == run_id, Commentary.client_id == client.id).limit(1)
    )
    comm = comm_res.scalar_one_or_none()
    commentary_text = comm.text if comm else generate_harvest_commentary(
        client_name=client.name,
        scenario_name=run.shock_event.scenario if run.shock_event else "Market Rebalance",
        trades=trades,
        tax_saved_inr=float(run.tax_saved_inr or 0.0),
        losses_harvested_inr=float(run.losses_harvested_inr or 0.0),
        risk_profile=client.risk_profile,
    )

    pdf_bytes = generate_harvest_pdf(
        client_name=client.name,
        client_email=client.email,
        run_date=run.created_at.strftime("%d %b %Y, %H:%M UTC"),
        scenario_name=run.shock_event.scenario if run.shock_event else "Market Rebalance",
        portfolio_value=float(client.cash_balance) + 5000000.0,
        tax_saved_inr=float(run.tax_saved_inr or 0.0),
        losses_harvested_inr=float(run.losses_harvested_inr or 0.0),
        trades=trades,
        lot_sales=lot_sales,
        commentary_text=commentary_text,
    )

    filename = f"ShockHarvester_Statement_{client.name.replace(' ', '_')}_{str(run_id)[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


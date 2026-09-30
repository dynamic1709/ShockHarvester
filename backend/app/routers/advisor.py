"""
Advisor Console Router.
Provides endpoints for Advisor Command Center, Client Directory (1,000 clients),
Rebalance Runs, Shock Triggers, Market Reset, and System Summary.
"""
from datetime import datetime, timezone
import logging
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import require_advisor
from app.database import get_db, AsyncSessionLocal
from app.engine.pipeline import execute_rebalance_pipeline
from app.models.event import RebalanceRun, ShockEvent, Trade, LotSale, GuardrailViolation
from app.models.misc import Commentary, Notification
from app.models.portfolio import Client, ModelPortfolio
from app.models.security import Security, Substitute
from app.models.tax import TaxLot, RealizedGain, CoolingOff
from app.models.user import User
from app.services.market_simulator import (
    trigger_live_shock,
    reset_live_market,
    get_all_live_prices,
    get_live_price,
    ACTIVE_SHOCK,
)
from app.tax_config import tax_rules

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class TriggerShockRequest(BaseModel):
    scenario_name: str = Field("covid_2020", description="Preset name (covid_2020, election_2024) or 'custom'")
    magnitude: float | None = Field(None, description="Custom shock magnitude e.g. -0.15")
    affected_sectors: list[str] | None = Field(None, description="Affected sector list")
    vol_multiplier: float | None = Field(None, description="Volatility multiplier e.g. 2.0")


class RunPipelineRequest(BaseModel):
    scenario_name: str = Field("custom", description="Scenario name")
    magnitude: float = Field(-0.08, description="Shock magnitude")


# ── Shock & Pipeline Endpoints ────────────────────────────────────────────────

@router.post("/shocks/trigger")
async def trigger_shock_endpoint(
    req: TriggerShockRequest,
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """
    Trigger simulated market shock, drop live market prices, and execute
    high-speed defensive rebalancing across all 1,000 client portfolios.
    """
    # 1. Trigger live price shock in simulator
    mag = req.magnitude if req.magnitude is not None else (-0.25 if req.scenario_name == "covid_2020" else -0.06)
    await trigger_live_shock(
        scenario_name=req.scenario_name,
        magnitude=mag,
        affected_sectors=req.affected_sectors,
    )

    # 2. Execute High-Performance Pipeline
    from app.routers.websocket import manager
    async def progress_cb(msg: dict):
        await manager.broadcast(msg)

    result = await execute_rebalance_pipeline(
        db=db,
        scenario_name=req.scenario_name,
        custom_magnitude=req.magnitude,
        custom_sectors=req.affected_sectors,
        custom_vol_mult=req.vol_multiplier,
        progress_callback=progress_cb,
    )

    return {
        "status": "success",
        "scenario": req.scenario_name,
        "run_id": str(result.rebalance_run_id),
        "clients_checked": result.total_clients_checked,
        "clients_rebalanced": result.clients_rebalanced,
        "trades_count": result.total_trades_generated,
        "tax_alpha_saved_inr": result.total_tax_harvested_alpha,
        "execution_time_sec": result.total_execution_time_sec,
        "stage_timings_ms": result.stage_timings,
    }


@router.post("/market/reset")
async def reset_market_endpoint(
    advisor: User = Depends(require_advisor),
):
    """Reset simulated market prices back to baseline."""
    await reset_live_market()
    return {"status": "success", "message": "Market simulation reset to baseline."}


@router.post("/pipeline/run")
async def run_pipeline_on_demand(
    req: RunPipelineRequest,
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """Run intraday portfolio optimization and tax-loss harvesting on demand."""
    from app.routers.websocket import manager
    async def progress_cb(msg: dict):
        await manager.broadcast(msg)

    result = await execute_rebalance_pipeline(
        db=db,
        scenario_name=req.scenario_name,
        custom_magnitude=req.magnitude,
        progress_callback=progress_cb,
    )

    return {
        "status": "success",
        "run_id": str(result.rebalance_run_id),
        "clients_checked": result.total_clients_checked,
        "clients_rebalanced": result.clients_rebalanced,
        "trades_count": result.total_trades_generated,
        "tax_alpha_saved_inr": result.total_tax_harvested_alpha,
        "execution_time_sec": result.total_execution_time_sec,
        "stage_timings_ms": result.stage_timings,
    }


# ── Advisor Summary & Dashboard ───────────────────────────────────────────────

@router.get("/summary")
async def advisor_summary(
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """Get aggregated metrics for the Advisor Command Center."""
    # Total clients
    total_clients = (await db.execute(select(func.count(Client.id)))).scalar_one()

    # Total runs and tax alpha saved
    runs_res = await db.execute(select(RebalanceRun))
    all_runs = runs_res.scalars().all()
    total_tax_saved = sum(float(r.tax_saved_inr or 0.0) for r in all_runs)
    total_harvested = sum(float(r.losses_harvested_inr or 0.0) for r in all_runs)

    # Compute AUM from active lots and cash
    lot_res = await db.execute(
        select(TaxLot.security_id, func.sum(TaxLot.remaining_qty))
        .where(TaxLot.is_active == True)
        .group_by(TaxLot.security_id)
    )
    sec_res = await db.execute(select(Security))
    sec_sym_map = {s.id: s.symbol for s in sec_res.scalars().all()}
    
    total_equity_val = 0.0
    for sec_id, qty in lot_res.all():
        sym = sec_sym_map.get(sec_id)
        if sym:
            p = get_live_price(sym)
            total_equity_val += float(qty or 0) * p

    cash_res = await db.execute(select(func.coalesce(func.sum(Client.cash_balance), 0)))
    total_cash = float(cash_res.scalar_one())
    total_aum = total_equity_val + total_cash

    # Model portfolio distribution
    models_res = await db.execute(select(ModelPortfolio))
    models = models_res.scalars().all()
    model_dist = []
    for m in models:
        c_count = (
            await db.execute(select(func.count(Client.id)).where(Client.model_id == m.id))
        ).scalar_one()
        model_dist.append({
            "id": str(m.id),
            "name": m.name,
            "description": m.description or "",
            "clients_count": c_count,
            "target_weights": m.target_weights,
        })

    # Guardrails count
    blocked_trades_count = (await db.execute(select(func.count(GuardrailViolation.id)))).scalar_one()

    return {
        "total_clients": total_clients,
        "total_aum_inr": round(total_aum, 2),
        "equity_aum_inr": round(total_equity_val, 2),
        "cash_aum_inr": round(total_cash, 2),
        "total_rebalance_runs": len(all_runs),
        "total_tax_alpha_saved_inr": round(total_tax_saved, 2),
        "total_losses_harvested_inr": round(total_harvested, 2),
        "total_guardrail_blocks": blocked_trades_count,
        "active_shock": ACTIVE_SHOCK,
        "model_distribution": model_dist,
    }


# ── Clients Directory (1,000 clients) ─────────────────────────────────────────

@router.get("/clients")
async def list_advisor_clients(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    risk_profile: str | None = Query(None),
    model_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """List 1,000 clients with search, filtering, portfolio valuations and drift metrics."""
    query = select(Client).options(selectinload(Client.model))

    if search:
        s = f"%{search.strip()}%"
        query = query.where((Client.name.ilike(s)) | (Client.email.ilike(s)))

    if risk_profile:
        query = query.where(Client.risk_profile == risk_profile)

    if model_id:
        try:
            m_uuid = uuid.UUID(model_id)
            query = query.where(Client.model_id == m_uuid)
        except ValueError:
            pass

    # Count total
    count_query = select(func.count(Client.id))
    if search:
        s = f"%{search.strip()}%"
        count_query = count_query.where((Client.name.ilike(s)) | (Client.email.ilike(s)))
    if risk_profile:
        count_query = count_query.where(Client.risk_profile == risk_profile)

    total_count = (await db.execute(count_query)).scalar_one()

    offset = (page - 1) * limit
    res = await db.execute(query.order_by(Client.name).offset(offset).limit(limit))
    clients = res.scalars().all()

    # Preload securities map
    sec_res = await db.execute(select(Security))
    sec_sym_map = {s.id: s.symbol for s in sec_res.scalars().all()}

    items = []
    for c in clients:
        # Calculate current valuation
        lot_res = await db.execute(
            select(TaxLot).where(TaxLot.client_id == c.id, TaxLot.is_active == True)
        )
        c_lots = lot_res.scalars().all()
        equity_val = sum(
            l.remaining_qty * get_live_price(sec_sym_map.get(l.security_id, ""))
            for l in c_lots
        )
        total_val = equity_val + float(c.cash_balance)

        # Realized gains
        rg_res = await db.execute(
            select(
                func.coalesce(func.sum(RealizedGain.stcg - RealizedGain.st_loss), 0),
                func.coalesce(func.sum(RealizedGain.ltcg - RealizedGain.lt_loss), 0),
            ).where(RealizedGain.client_id == c.id)
        )
        st_net, lt_net = rg_res.one()

        items.append({
            "id": str(c.id),
            "name": c.name,
            "email": c.email,
            "risk_profile": c.risk_profile,
            "model_name": c.model.name if c.model else "Standard",
            "portfolio_value_inr": round(total_val, 2),
            "cash_balance_inr": round(float(c.cash_balance), 2),
            "lots_count": len(c_lots),
            "net_stcg_inr": round(float(st_net), 2),
            "net_ltcg_inr": round(float(lt_net), 2),
            "is_active": True,
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit,
    }


@router.get("/clients/{client_id}")
async def get_advisor_client_detail(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """Detailed client profile for Advisor review drawer and preview."""
    res = await db.execute(
        select(Client)
        .options(selectinload(Client.model))
        .where(Client.id == client_id)
    )
    client = res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Fetch tax lots
    lot_res = await db.execute(
        select(TaxLot)
        .options(selectinload(TaxLot.security))
        .where(TaxLot.client_id == client.id)
        .order_by(TaxLot.buy_date)
    )
    lots = lot_res.scalars().all()

    # Preload substitutes
    sub_res = await db.execute(
        select(Substitute).options(selectinload(Substitute.substitute_security))
    )
    sub_map = {s.security_id: s.substitute_security.symbol for s in sub_res.scalars().all()}

    lot_items = []
    equity_val = 0.0
    for l in lots:
        sym = l.security.symbol
        p_curr = get_live_price(sym)
        val = l.remaining_qty * p_curr
        unrealized = (p_curr - float(l.buy_price)) * l.remaining_qty
        is_lt = (datetime.now(timezone.utc).date() - l.buy_date).days > 365

        if l.is_active and l.remaining_qty > 0:
            equity_val += val

        lot_items.append({
            "id": str(l.id),
            "symbol": sym,
            "name": l.security.name,
            "buy_date": l.buy_date.isoformat(),
            "buy_price": float(l.buy_price),
            "current_price": p_curr,
            "original_qty": l.original_qty,
            "remaining_qty": l.remaining_qty,
            "current_value": round(val, 2),
            "unrealized_gain_loss": round(unrealized, 2),
            "term": "LTCG" if is_lt else "STCG",
            "is_active": l.is_active,
            "substitute_symbol": sub_map.get(l.security_id, "NIFTYBEES"),
        })

    total_val = equity_val + float(client.cash_balance)

    # Fetch recent trades
    trades_res = await db.execute(
        select(Trade)
        .options(selectinload(Trade.security))
        .where(Trade.client_id == client.id)
        .order_by(Trade.executed_at.desc())
        .limit(20)
    )
    trades = [
        {
            "id": str(t.id),
            "symbol": t.security.symbol,
            "side": t.side.upper(),
            "qty": t.qty,
            "price": float(t.price),
            "amount": float(t.amount),
            "executed_at": t.executed_at.isoformat(),
        }
        for t in trades_res.scalars().all()
    ]

    return {
        "id": str(client.id),
        "name": client.name,
        "email": client.email,
        "risk_profile": client.risk_profile,
        "model_name": client.model.name if client.model else "Standard",
        "target_weights": client.model.target_weights if client.model else {},
        "portfolio_value_inr": round(total_val, 2),
        "equity_value_inr": round(equity_val, 2),
        "cash_balance_inr": round(float(client.cash_balance), 2),
        "max_volatility": float(client.max_volatility),
        "max_drawdown": float(client.max_drawdown),
        "tax_lots": lot_items,
        "recent_trades": trades,
    }


# ── Rebalance Runs History ───────────────────────────────────────────────────

@router.get("/runs")
async def list_advisor_runs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """List all rebalance runs with execution metrics."""
    res = await db.execute(
        select(RebalanceRun)
        .options(selectinload(RebalanceRun.shock_event))
        .order_by(RebalanceRun.created_at.desc())
        .limit(limit)
    )
    runs = res.scalars().all()

    return [
        {
            "id": str(r.id),
            "scenario_name": r.shock_event.scenario if r.shock_event else "Manual Rebalance",
            "magnitude": float(r.shock_event.magnitude) if r.shock_event else 0.0,
            "status": r.status,
            "portfolios_checked": r.portfolios_checked,
            "portfolios_rebalanced": r.portfolios_rebalanced,
            "blocked_trades": r.blocked_trades,
            "duration_ms": r.duration_ms,
            "tax_saved_inr": float(r.tax_saved_inr or 0.0),
            "losses_harvested_inr": float(r.losses_harvested_inr or 0.0),
            "stage_timings": r.stage_timings or {},
            "created_at": r.created_at.isoformat(),
        }
        for r in runs
    ]


@router.get("/runs/{run_id}")
async def get_advisor_run_detail(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """Detailed view of a rebalance run, including trades breakdown and stage timings."""
    res = await db.execute(
        select(RebalanceRun)
        .options(selectinload(RebalanceRun.shock_event))
        .where(RebalanceRun.id == run_id)
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    trades_res = await db.execute(
        select(Trade)
        .options(selectinload(Trade.security), selectinload(Trade.client))
        .where(Trade.run_id == run_id)
        .limit(100)
    )
    trades = [
        {
            "id": str(t.id),
            "client_name": t.client.name if t.client else "Client",
            "symbol": t.security.symbol,
            "side": t.side.upper(),
            "qty": t.qty,
            "price": float(t.price),
            "amount": float(t.amount),
        }
        for t in trades_res.scalars().all()
    ]

    violations_res = await db.execute(
        select(GuardrailViolation)
        .options(selectinload(GuardrailViolation.security), selectinload(GuardrailViolation.client))
        .where(GuardrailViolation.run_id == run_id)
        .limit(50)
    )
    violations = [
        {
            "id": str(v.id),
            "client_name": v.client.name if v.client else "Client",
            "symbol": v.security.symbol,
            "rule": v.rule,
            "detail": v.detail,
        }
        for v in violations_res.scalars().all()
    ]

    return {
        "id": str(run.id),
        "scenario_name": run.shock_event.scenario if run.shock_event else "Manual Rebalance",
        "magnitude": float(run.shock_event.magnitude) if run.shock_event else 0.0,
        "status": run.status,
        "portfolios_checked": run.portfolios_checked,
        "portfolios_rebalanced": run.portfolios_rebalanced,
        "blocked_trades": run.blocked_trades,
        "duration_ms": run.duration_ms,
        "tax_saved_inr": float(run.tax_saved_inr or 0.0),
        "losses_harvested_inr": float(run.losses_harvested_inr or 0.0),
        "stage_timings": run.stage_timings or {},
        "created_at": run.created_at.isoformat(),
        "sample_trades": trades,
        "guardrail_violations": violations,
    }


# ── Guardrails Log ────────────────────────────────────────────────────────────

@router.get("/guardrails")
async def list_advisor_guardrails(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """List recent safety guardrail violations and trade blocks."""
    res = await db.execute(
        select(GuardrailViolation)
        .options(selectinload(GuardrailViolation.security), selectinload(GuardrailViolation.client))
        .order_by(GuardrailViolation.created_at.desc())
        .limit(limit)
    )
    violations = res.scalars().all()

    return [
        {
            "id": str(v.id),
            "client_id": str(v.client_id),
            "client_name": v.client.name if v.client else "Client",
            "symbol": v.security.symbol if v.security else "UNKNOWN",
            "rule": v.rule,
            "detail": v.detail,
            "created_at": v.created_at.isoformat(),
        }
        for v in violations
    ]


# ── Tax Rules Config ──────────────────────────────────────────────────────────

@router.get("/tax-rules")
async def get_tax_rules(advisor: User = Depends(require_advisor)):
    """Return active Indian tax rules and regulatory parameters."""
    return {
        "financial_year": "FY 2024–25 (AY 2025–26)",
        "stcg_rate": tax_rules.stcg_rate,
        "ltcg_rate": tax_rules.ltcg_rate,
        "ltcg_annual_exemption_inr": tax_rules.ltcg_annual_exemption_inr,
        "st_holding_threshold_days": tax_rules.long_term_holding_days,
        "cooling_off_period_days": tax_rules.cooling_off_days,
        "stt_delivery_buy": tax_rules.stt_delivery_buy,
        "stt_delivery_sell": tax_rules.stt_delivery_sell,
        "brokerage_rate": tax_rules.brokerage_rate,
        "turnover_cap_per_asset": tax_rules.turnover_cap_per_asset,
        "lambda_tax": tax_rules.lambda_tax,
        "lambda_harvest": tax_rules.lambda_harvest,
        "lambda_transaction": tax_rules.lambda_transaction,
        "set_off_matrix": {
            "STCL": "Offsets both STCG and LTCG",
            "LTCL": "Offsets LTCG only",
            "Carry_Forward": "Up to 8 assessment years",
        },
    }


# ── Backtest Studio Endpoints ─────────────────────────────────────────────────

from app.engine.backtest import run_backtest_simulation, SCENARIO_CONFIGS  # noqa: E402


class RunBacktestRequest(BaseModel):
    scenario: str = Field("covid_2020", description="Scenario key: covid_2020, election_2024, full_history")
    initial_capital: float = Field(10_000_000.0, description="Initial portfolio capital in INR")
    equity_weight: float = Field(0.70, description="Model equity weight (e.g. 0.70 for Aggressive)")


@router.get("/backtest/scenarios")
async def get_backtest_scenarios(advisor: User = Depends(require_advisor)):
    """Return available historical backtest scenario metadata."""
    return [
        {"key": k, **v}
        for k, v in SCENARIO_CONFIGS.items()
    ]


@router.post("/backtest/run")
async def run_backtest(
    req: RunBacktestRequest,
    db: AsyncSession = Depends(get_db),
    advisor: User = Depends(require_advisor),
):
    """Execute historical multi-strategy backtest simulation."""
    res = await run_backtest_simulation(
        db=db,
        scenario=req.scenario,
        initial_capital=req.initial_capital,
        model_equity_weight=req.equity_weight,
    )
    return res


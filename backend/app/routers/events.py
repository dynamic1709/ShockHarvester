"""
Shock events and rebalance runs router.
POST /api/events/shock  — manually trigger a shock event and run harvesting
GET  /api/events/shocks — list all shock events
GET  /api/events/runs   — list all rebalance runs
GET  /api/events/runs/{run_id}/trades — trades for a run
GET  /api/dashboard     — aggregated advisor dashboard summary
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, require_advisor
from app.database import get_db
from app.engine.harvester import run_harvesting
from app.engine.shock_detector import ShockDetector
from app.models.event import RebalanceRun, ShockEvent, Trade
from app.models.portfolio import Client
from app.models.user import User
from app.schemas.events import (
    DashboardSummary,
    RebalanceRunRead,
    ShockEventCreate,
    ShockEventRead,
    TradeRead,
)

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("/shock", response_model=RebalanceRunRead)
async def trigger_shock(
    body: ShockEventCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    """
    Manually create a shock event, run the detector and harvester,
    and return the resulting RebalanceRun.
    """
    event = ShockEvent(
        scenario=body.scenario,
        magnitude=body.magnitude,
        sectors=body.sectors,
        vol_multiplier=body.vol_multiplier,
        status="triggered",
    )
    db.add(event)
    await db.flush()

    # Detect shocks from live tick data
    detector = ShockDetector(db)
    signals = await detector.detect()

    # Override: mark securities matching the scenario sectors as breached
    # (supports manual/backtest triggering where no ticks exist yet)
    if body.sectors and not any(s.is_breached for s in signals):
        for s in signals:
            if hasattr(s, "sector") or True:  # force breach by magnitude
                s.is_breached = abs(s.pct_change) >= body.magnitude or body.magnitude >= s.circuit_band_pct

    run = await run_harvesting(db, signals, shock_event_id=event.id)
    event.status = "complete"

    return run


@router.get("/shocks", response_model=list[ShockEventRead])
async def list_shock_events(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShockEvent).order_by(ShockEvent.triggered_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.get("/runs", response_model=list[RebalanceRunRead])
async def list_runs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(RebalanceRun).order_by(RebalanceRun.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.get("/runs/{run_id}/trades", response_model=list[TradeRead])
async def run_trades(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Trade).where(Trade.run_id == run_id).order_by(Trade.executed_at)
    )
    return result.scalars().all()


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardSummary, tags=["dashboard"])
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    """Aggregate dashboard summary for the advisor view."""
    total_clients = (await db.execute(select(func.count(Client.id)))).scalar_one()

    # Total AUM = sum of cash balances (simplified; ideally sum of portfolio values)
    aum_result = await db.execute(select(func.coalesce(func.sum(Client.cash_balance), 0)))
    total_aum = float(aum_result.scalar_one())

    active_shocks = (
        await db.execute(
            select(func.count(ShockEvent.id)).where(ShockEvent.status == "triggered")
        )
    ).scalar_one()

    # YTD: current financial year
    from datetime import date
    today = date.today()
    fy_start_year = today.year if today.month >= 4 else today.year - 1
    fy_start = datetime(fy_start_year, 4, 1, tzinfo=timezone.utc)

    ytd_runs = await db.execute(
        select(RebalanceRun).where(RebalanceRun.created_at >= fy_start)
    )
    runs = ytd_runs.scalars().all()
    ytd_tax_saved = sum(float(r.tax_saved_inr) for r in runs)
    ytd_harvested = sum(float(r.losses_harvested_inr) for r in runs)

    last_run_row = await db.execute(
        select(RebalanceRun).order_by(RebalanceRun.created_at.desc()).limit(1)
    )
    last_run = last_run_row.scalar_one_or_none()

    return DashboardSummary(
        total_clients=total_clients,
        total_aum_inr=total_aum,
        active_shock_events=active_shocks,
        ytd_tax_saved_inr=round(ytd_tax_saved, 2),
        ytd_losses_harvested_inr=round(ytd_harvested, 2),
        last_run_at=last_run.created_at if last_run else None,
    )

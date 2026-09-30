"""Pydantic schemas for shock events, rebalance runs, trades, and tax lots."""
import uuid
from datetime import date, datetime
from pydantic import BaseModel


# ── Shock Events ─────────────────────────────────────────────────────────────

class ShockEventCreate(BaseModel):
    scenario: str
    magnitude: float
    sectors: list[str] = []
    vol_multiplier: float = 1.0


class ShockEventRead(ShockEventCreate):
    id: uuid.UUID
    triggered_at: datetime
    status: str

    model_config = {"from_attributes": True}


# ── Rebalance Runs ────────────────────────────────────────────────────────────

class RebalanceRunRead(BaseModel):
    id: uuid.UUID
    shock_event_id: uuid.UUID | None = None
    portfolios_checked: int
    portfolios_breached: int
    portfolios_rebalanced: int
    blocked_trades: int
    duration_ms: int | None = None
    tax_saved_inr: float
    losses_harvested_inr: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Trades ────────────────────────────────────────────────────────────────────

class TradeRead(BaseModel):
    id: uuid.UUID
    run_id: uuid.UUID
    client_id: uuid.UUID
    security_id: uuid.UUID
    side: str
    qty: int
    price: float
    amount: float
    executed_at: datetime

    model_config = {"from_attributes": True}


# ── Tax lots ──────────────────────────────────────────────────────────────────

class TaxLotRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    security_id: uuid.UUID
    buy_date: date
    buy_price: float
    original_qty: int
    remaining_qty: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TaxLotCreate(BaseModel):
    client_id: uuid.UUID
    security_id: uuid.UUID
    buy_date: date
    buy_price: float
    qty: int


# ── Realized Gains ─────────────────────────────────────────────────────────────

class RealizedGainRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    fy: int
    stcg: float
    ltcg: float
    st_loss: float
    lt_loss: float

    model_config = {"from_attributes": True}


# ── Dashboard summary ─────────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    """Aggregate numbers shown on the advisor dashboard."""
    total_clients: int
    total_aum_inr: float
    active_shock_events: int
    ytd_tax_saved_inr: float
    ytd_losses_harvested_inr: float
    last_run_at: datetime | None = None

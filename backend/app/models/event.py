"""SQLAlchemy ORM models — ShockEvent, RebalanceRun, Trade, LotSale, GuardrailViolation."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text, ForeignKey, func
from sqlalchemy import Uuid as UUID, JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ShockEvent(Base):
    __tablename__ = "shock_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scenario: Mapped[str] = mapped_column(String(100), nullable=False)
    magnitude: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    sectors: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    vol_multiplier: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=1.0)
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="triggered")  # triggered, running, complete

    # Relationships
    rebalance_runs: Mapped[list["RebalanceRun"]] = relationship("RebalanceRun", back_populates="shock_event")


class RebalanceRun(Base):
    __tablename__ = "rebalance_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    shock_event_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shock_events.id"), nullable=True
    )
    portfolios_checked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    portfolios_breached: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    portfolios_rebalanced: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blocked_trades: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stage_timings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tax_saved_inr: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0.0)
    losses_harvested_inr: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="running")  # running, complete, failed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    shock_event: Mapped["ShockEvent | None"] = relationship("ShockEvent", back_populates="rebalance_runs")
    trades: Mapped[list["Trade"]] = relationship("Trade", back_populates="run")
    commentaries: Mapped[list["Commentary"]] = relationship("Commentary", back_populates="run")  # type: ignore[name-defined]


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rebalance_runs.id"), nullable=False, index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True
    )
    security_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False
    )
    side: Mapped[str] = mapped_column(String(10), nullable=False)  # buy | sell
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    run: Mapped[RebalanceRun] = relationship("RebalanceRun", back_populates="trades")
    client: Mapped["Client"] = relationship("Client", back_populates="trades")  # type: ignore[name-defined]
    security: Mapped["Security"] = relationship("Security")  # type: ignore[name-defined]
    lot_sales: Mapped[list["LotSale"]] = relationship("LotSale", back_populates="trade")


class LotSale(Base):
    __tablename__ = "lot_sales"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tax_lots.id"), nullable=False
    )
    trade_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trades.id"), nullable=False
    )
    qty_sold: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_basis: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    proceeds: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    gain_loss: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    term: Mapped[str] = mapped_column(String(10), nullable=False)  # STCG | LTCG

    # Relationships
    lot: Mapped["TaxLot"] = relationship("TaxLot", back_populates="lot_sales")  # type: ignore[name-defined]
    trade: Mapped[Trade] = relationship("Trade", back_populates="lot_sales")


class GuardrailViolation(Base):
    __tablename__ = "guardrail_violations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rebalance_runs.id"), nullable=False, index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True
    )
    security_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False
    )
    rule: Mapped[str] = mapped_column(String(50), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    run: Mapped[RebalanceRun] = relationship("RebalanceRun")
    client: Mapped["Client"] = relationship("Client")  # type: ignore[name-defined]
    security: Mapped["Security"] = relationship("Security")  # type: ignore[name-defined]

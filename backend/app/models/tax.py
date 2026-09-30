"""SQLAlchemy ORM models — TaxLot, RealizedGain, CoolingOff."""
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, Numeric, ForeignKey, func
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TaxLot(Base):
    __tablename__ = "tax_lots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True
    )
    security_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False, index=True
    )
    buy_date: Mapped[date] = mapped_column(Date, nullable=False)
    buy_price: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    original_qty: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_qty: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="tax_lots")  # type: ignore[name-defined]
    security: Mapped["Security"] = relationship("Security", back_populates="tax_lots")  # type: ignore[name-defined]
    lot_sales: Mapped[list["LotSale"]] = relationship("LotSale", back_populates="lot")  # type: ignore[name-defined]


class RealizedGain(Base):
    __tablename__ = "realized_gains"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True
    )
    fy: Mapped[int] = mapped_column(Integer, nullable=False)  # e.g. 2025 for FY2024-25
    stcg: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0.0)
    ltcg: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0.0)
    st_loss: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0.0)
    lt_loss: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0.0)

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="realized_gains")  # type: ignore[name-defined]


class CoolingOff(Base):
    __tablename__ = "cooling_off"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True
    )
    security_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False
    )
    unblock_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="cooling_off")  # type: ignore[name-defined]
    security: Mapped["Security"] = relationship("Security")

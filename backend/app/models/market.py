"""SQLAlchemy ORM models — DailyPrice and PriceTick."""
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Index, Numeric, ForeignKey, func
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DailyPrice(Base):
    __tablename__ = "daily_prices"
    __table_args__ = (
        Index("ix_daily_prices_security_date", "security_id", "price_date", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    security_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False
    )
    price_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    open: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    high: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    low: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    close: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    # Relationships
    security: Mapped["Security"] = relationship("Security", back_populates="daily_prices")  # type: ignore[name-defined]


class PriceTick(Base):
    __tablename__ = "price_ticks"
    __table_args__ = (
        Index("ix_price_ticks_security_ts", "security_id", "ts"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    security_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False
    )
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    # Relationships
    security: Mapped["Security"] = relationship("Security", back_populates="price_ticks")  # type: ignore[name-defined]

"""SQLAlchemy ORM models — Security and Substitute."""
import uuid

from sqlalchemy import Boolean, Integer, Numeric, String, ForeignKey
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Security(Base):
    __tablename__ = "securities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    symbol: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    asset_class: Mapped[str] = mapped_column(String(30), nullable=False)  # equity, equity_etf, gold, debt
    sector: Mapped[str | None] = mapped_column(String(50), nullable=True)
    circuit_band_pct: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False, default=0.20)
    lot_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_halted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_index: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    substitutes_as_primary: Mapped[list["Substitute"]] = relationship(
        "Substitute", foreign_keys="Substitute.security_id", back_populates="security"
    )
    substitutes_as_sub: Mapped[list["Substitute"]] = relationship(
        "Substitute", foreign_keys="Substitute.substitute_id", back_populates="substitute_security"
    )
    tax_lots: Mapped[list["TaxLot"]] = relationship("TaxLot", back_populates="security")  # type: ignore[name-defined]
    daily_prices: Mapped[list["DailyPrice"]] = relationship("DailyPrice", back_populates="security")  # type: ignore[name-defined]
    price_ticks: Mapped[list["PriceTick"]] = relationship("PriceTick", back_populates="security")  # type: ignore[name-defined]
    watchlists: Mapped[list["Watchlist"]] = relationship("Watchlist", back_populates="security")  # type: ignore[name-defined]


class Substitute(Base):
    __tablename__ = "substitutes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    security_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False
    )
    substitute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("securities.id"), nullable=False
    )

    # Relationships
    security: Mapped[Security] = relationship(
        "Security", foreign_keys=[security_id], back_populates="substitutes_as_primary"
    )
    substitute_security: Mapped[Security] = relationship(
        "Security", foreign_keys=[substitute_id], back_populates="substitutes_as_sub"
    )

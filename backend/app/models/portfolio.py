"""SQLAlchemy ORM models — ModelPortfolio and Client."""
import uuid

from sqlalchemy import Numeric, String, ForeignKey, Text
from sqlalchemy import Uuid as UUID, JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ModelPortfolio(Base):
    __tablename__ = "model_portfolios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_weights: Mapped[dict] = mapped_column(JSONB, nullable=False)  # {symbol: weight}

    # Relationships
    clients: Mapped[list["Client"]] = relationship("Client", back_populates="model")


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("model_portfolios.id"), nullable=False
    )
    risk_profile: Mapped[str] = mapped_column(String(30), nullable=False)  # aggressive, balanced, conservative
    max_volatility: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False, default=0.25)
    max_drawdown: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False, default=0.20)
    cash_balance: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0.0)

    # Relationships
    model: Mapped[ModelPortfolio] = relationship("ModelPortfolio", back_populates="clients")
    user: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys="User.client_id", back_populates="client"
    )
    tax_lots: Mapped[list["TaxLot"]] = relationship("TaxLot", back_populates="client")  # type: ignore[name-defined]
    realized_gains: Mapped[list["RealizedGain"]] = relationship("RealizedGain", back_populates="client")  # type: ignore[name-defined]
    cooling_off: Mapped[list["CoolingOff"]] = relationship("CoolingOff", back_populates="client")  # type: ignore[name-defined]
    trades: Mapped[list["Trade"]] = relationship("Trade", back_populates="client")  # type: ignore[name-defined]
    commentaries: Mapped[list["Commentary"]] = relationship("Commentary", back_populates="client")  # type: ignore[name-defined]

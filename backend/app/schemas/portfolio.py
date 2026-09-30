"""Pydantic schemas for Client and ModelPortfolio endpoints."""
import uuid
from pydantic import BaseModel, EmailStr


class ModelPortfolioCreate(BaseModel):
    name: str
    description: str | None = None
    target_weights: dict[str, float]  # {symbol: weight}


class ModelPortfolioRead(ModelPortfolioCreate):
    id: uuid.UUID

    model_config = {"from_attributes": True}


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    model_id: uuid.UUID
    risk_profile: str = "balanced"
    max_volatility: float = 0.25
    max_drawdown: float = 0.20
    cash_balance: float = 0.0


class ClientRead(ClientCreate):
    id: uuid.UUID

    model_config = {"from_attributes": True}


class ClientSummary(BaseModel):
    """Lightweight client view for listing."""
    id: uuid.UUID
    name: str
    email: str
    risk_profile: str
    cash_balance: float

    model_config = {"from_attributes": True}

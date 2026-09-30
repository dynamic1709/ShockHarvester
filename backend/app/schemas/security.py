"""Pydantic schemas for Security and Substitute endpoints."""
import uuid
from pydantic import BaseModel


class SecurityBase(BaseModel):
    symbol: str
    name: str
    asset_class: str
    sector: str | None = None
    circuit_band_pct: float = 0.20
    lot_size: int = 1
    is_halted: bool = False
    is_index: bool = False


class SecurityCreate(SecurityBase):
    pass


class SecurityRead(SecurityBase):
    id: uuid.UUID

    model_config = {"from_attributes": True}


class SubstituteRead(BaseModel):
    id: uuid.UUID
    security_id: uuid.UUID
    substitute_id: uuid.UUID

    model_config = {"from_attributes": True}

"""Pydantic schemas for market data endpoints."""
import uuid
from datetime import date, datetime
from pydantic import BaseModel


class DailyPriceRead(BaseModel):
    id: uuid.UUID
    security_id: uuid.UUID
    price_date: date
    open: float
    high: float
    low: float
    close: float
    volume: int

    model_config = {"from_attributes": True}


class PriceTickRead(BaseModel):
    id: uuid.UUID
    security_id: uuid.UUID
    ts: datetime
    price: float
    volume: int | None = None

    model_config = {"from_attributes": True}


class IngestPriceRequest(BaseModel):
    """Request body for manually ingesting a price tick or daily price."""
    symbol: str
    price: float
    volume: int | None = None
    ts: datetime | None = None

"""Market data router — price ingestion and historical queries."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, require_advisor
from app.database import get_db
from app.models.market import DailyPrice, PriceTick
from app.models.security import Security
from app.models.user import User
from app.schemas.market import DailyPriceRead, IngestPriceRequest, PriceTickRead

router = APIRouter(prefix="/api/market", tags=["market"])


@router.post("/tick", status_code=201)
async def ingest_tick(
    body: IngestPriceRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    """Ingest a real-time price tick for a security (by symbol)."""
    result = await db.execute(select(Security).where(Security.symbol == body.symbol))
    sec = result.scalar_one_or_none()
    if not sec:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Security '{body.symbol}' not found")

    tick = PriceTick(
        security_id=sec.id,
        ts=body.ts or datetime.now(timezone.utc),
        price=body.price,
        volume=body.volume,
    )
    db.add(tick)
    await db.flush()
    return {"id": str(tick.id), "symbol": body.symbol, "price": body.price}


@router.get("/ticks/{symbol}", response_model=list[PriceTickRead])
async def get_ticks(
    symbol: str,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get recent price ticks for a symbol."""
    result = await db.execute(select(Security).where(Security.symbol == symbol))
    sec = result.scalar_one_or_none()
    if not sec:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Security not found")

    ticks = await db.execute(
        select(PriceTick)
        .where(PriceTick.security_id == sec.id)
        .order_by(PriceTick.ts.desc())
        .limit(limit)
    )
    return ticks.scalars().all()


@router.get("/daily/{symbol}", response_model=list[DailyPriceRead])
async def get_daily_prices(
    symbol: str,
    limit: int = Query(252, ge=1, le=1260),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get historical daily OHLCV for a symbol (default: 1 year)."""
    result = await db.execute(select(Security).where(Security.symbol == symbol))
    sec = result.scalar_one_or_none()
    if not sec:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Security not found")

    prices = await db.execute(
        select(DailyPrice)
        .where(DailyPrice.security_id == sec.id)
        .order_by(DailyPrice.price_date.desc())
        .limit(limit)
    )
    return prices.scalars().all()

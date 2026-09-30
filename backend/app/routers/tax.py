"""Tax lots and realized gains router."""
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, require_advisor
from app.database import get_db
from app.models.tax import CoolingOff, RealizedGain, TaxLot
from app.models.user import User
from app.schemas.events import RealizedGainRead, TaxLotCreate, TaxLotRead

router = APIRouter(prefix="/api/tax", tags=["tax"])


@router.get("/lots", response_model=list[TaxLotRead])
async def list_tax_lots(
    client_id: uuid.UUID | None = Query(None),
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List tax lots, optionally filtered by client and active status."""
    q = select(TaxLot)
    if client_id:
        q = q.where(TaxLot.client_id == client_id)
    if active_only:
        q = q.where(TaxLot.is_active == True)  # noqa: E712
    result = await db.execute(q.order_by(TaxLot.buy_date))
    return result.scalars().all()


@router.post("/lots", response_model=TaxLotRead, status_code=status.HTTP_201_CREATED)
async def create_tax_lot(
    body: TaxLotCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    lot = TaxLot(
        client_id=body.client_id,
        security_id=body.security_id,
        buy_date=body.buy_date,
        buy_price=body.buy_price,
        original_qty=body.qty,
        remaining_qty=body.qty,
    )
    db.add(lot)
    await db.flush()
    await db.refresh(lot)
    return lot


@router.get("/gains", response_model=list[RealizedGainRead])
async def list_realized_gains(
    client_id: uuid.UUID | None = Query(None),
    fy: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(RealizedGain)
    if client_id:
        q = q.where(RealizedGain.client_id == client_id)
    if fy:
        q = q.where(RealizedGain.fy == fy)
    result = await db.execute(q.order_by(RealizedGain.fy.desc()))
    return result.scalars().all()


@router.get("/cooling-off")
async def list_cooling_off(
    client_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return securities currently in the cooling-off period."""
    today = date.today()
    q = select(CoolingOff).where(CoolingOff.unblock_date >= today)
    if client_id:
        q = q.where(CoolingOff.client_id == client_id)
    result = await db.execute(q)
    items = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "client_id": str(c.client_id),
            "security_id": str(c.security_id),
            "unblock_date": c.unblock_date.isoformat(),
        }
        for c in items
    ]

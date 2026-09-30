"""Securities and substitutes router."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, require_advisor
from app.database import get_db
from app.models.security import Security, Substitute
from app.models.user import User
from app.schemas.security import SecurityCreate, SecurityRead, SubstituteRead

router = APIRouter(prefix="/api/securities", tags=["securities"])


@router.get("", response_model=list[SecurityRead])
async def list_securities(
    asset_class: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List all securities, optionally filtered by asset class."""
    q = select(Security)
    if asset_class:
        q = q.where(Security.asset_class == asset_class)
    result = await db.execute(q.order_by(Security.symbol))
    return result.scalars().all()


@router.get("/{security_id}", response_model=SecurityRead)
async def get_security(
    security_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Security).where(Security.id == security_id))
    sec = result.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Security not found")
    return sec


@router.post("", response_model=SecurityRead, status_code=status.HTTP_201_CREATED)
async def create_security(
    body: SecurityCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    """Create a new security (advisor only)."""
    sec = Security(**body.model_dump())
    db.add(sec)
    await db.flush()
    await db.refresh(sec)
    return sec


@router.put("/{security_id}/halt", response_model=SecurityRead)
async def toggle_halt(
    security_id: uuid.UUID,
    halted: bool,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    """Toggle circuit-halt status for a security."""
    result = await db.execute(select(Security).where(Security.id == security_id))
    sec = result.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Security not found")
    sec.is_halted = halted
    return sec


@router.get("/{security_id}/substitutes", response_model=list[SubstituteRead])
async def list_substitutes(
    security_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Substitute).where(Substitute.security_id == security_id)
    )
    return result.scalars().all()


@router.post("/{security_id}/substitutes", response_model=SubstituteRead, status_code=201)
async def add_substitute(
    security_id: uuid.UUID,
    substitute_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    sub = Substitute(security_id=security_id, substitute_id=substitute_id)
    db.add(sub)
    await db.flush()
    await db.refresh(sub)
    return sub

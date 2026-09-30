"""Portfolio (clients and model portfolios) router."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, require_advisor
from app.database import get_db
from app.models.portfolio import Client, ModelPortfolio
from app.models.user import User
from app.schemas.portfolio import (
    ClientCreate, ClientRead, ClientSummary,
    ModelPortfolioCreate, ModelPortfolioRead,
)

router = APIRouter(prefix="/api", tags=["portfolio"])


# ── Model Portfolios ──────────────────────────────────────────────────────────

@router.get("/models", response_model=list[ModelPortfolioRead])
async def list_models(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    result = await db.execute(select(ModelPortfolio).order_by(ModelPortfolio.name))
    return result.scalars().all()


@router.post("/models", response_model=ModelPortfolioRead, status_code=status.HTTP_201_CREATED)
async def create_model(
    body: ModelPortfolioCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    model = ModelPortfolio(**body.model_dump())
    db.add(model)
    await db.flush()
    await db.refresh(model)
    return model


@router.get("/models/{model_id}", response_model=ModelPortfolioRead)
async def get_model(
    model_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    result = await db.execute(select(ModelPortfolio).where(ModelPortfolio.id == model_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    return m


@router.put("/models/{model_id}", response_model=ModelPortfolioRead)
async def update_model(
    model_id: uuid.UUID,
    body: ModelPortfolioCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    result = await db.execute(select(ModelPortfolio).where(ModelPortfolio.id == model_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    for k, v in body.model_dump().items():
        setattr(m, k, v)
    return m


# ── Clients ───────────────────────────────────────────────────────────────────

@router.get("/clients", response_model=list[ClientSummary])
async def list_clients(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    result = await db.execute(select(Client).order_by(Client.name))
    return result.scalars().all()


@router.post("/clients", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    client = Client(**body.model_dump())
    db.add(client)
    await db.flush()
    await db.refresh(client)
    return client


@router.get("/clients/{client_id}", response_model=ClientRead)
async def get_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return c


@router.put("/clients/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: uuid.UUID,
    body: ClientCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_advisor),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    for k, v in body.model_dump().items():
        setattr(c, k, v)
    return c

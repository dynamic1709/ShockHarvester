"""
Main FastAPI application entry point.
Handles startup (migrations, seeding), CORS, routers, and health endpoint.
"""
import logging
import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal, check_db_connection
from app.seed_demo import ensure_demo_users

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run migrations/create tables and seed demo users on startup."""
    logger.info("🚀 ShockHarvester API starting up...")

    # Create tables if not existing
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables verified")
    except Exception as e:
        logger.warning(f"⚠️ Table verification note: {e}")

    # Seed demo accounts
    try:
        async with AsyncSessionLocal() as session:
            await ensure_demo_users(session)
        logger.info("✅ Demo users ready")
    except Exception as e:
        logger.warning(f"⚠️ Demo users seeding note: {e}")

    # Verify DB connection
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("✅ Database connection verified")
    else:
        logger.error("❌ Database connection FAILED")

    # Start live market simulation background task
    import asyncio
    from app.services.market_simulator import market_simulation_loop
    sim_task = asyncio.create_task(market_simulation_loop())
    logger.info("✅ Market simulator background loop started")

    yield

    sim_task.cancel()
    logger.info("ShockHarvester API shutting down")


app = FastAPI(
    title="ShockHarvester API",
    description="Intraday shock protection & tax-loss harvesting platform",
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS — allow Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from app.routers import (  # noqa: E402
    auth_router,
    events_router,
    market_router,
    portfolio_router,
    securities_router,
    tax_router,
    me_router,
    advisor_router,
    ws_router,
)

app.include_router(auth_router)
app.include_router(securities_router)
app.include_router(portfolio_router)
app.include_router(tax_router)
app.include_router(market_router)
app.include_router(events_router)
app.include_router(me_router)
app.include_router(advisor_router)
app.include_router(ws_router)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["system"])
async def health():
    """Health check endpoint. Returns DB status."""
    db_ok = await check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "db": "connected" if db_ok else "unreachable",
        "version": settings.app_version,
        "environment": settings.environment,
    }


@app.get("/", tags=["system"])
async def root():
    return {"message": "ShockHarvester API", "docs": "/docs"}

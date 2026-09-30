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
from app.database import check_db_connection

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run Alembic migrations and seed on startup."""
    logger.info("🚀 ShockHarvester API starting up...")

    # Run alembic migrations
    try:
        result = subprocess.run(
            ["python", "-m", "alembic", "upgrade", "head"],
            capture_output=True, text=True, cwd="."
        )
        if result.returncode == 0:
            logger.info("✅ Database migrations applied")
        else:
            logger.warning(f"⚠️  Migration output: {result.stderr}")
    except Exception as e:
        logger.warning(f"⚠️  Could not run migrations: {e}")

    # Verify DB connection
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("✅ Database connection verified")
    else:
        logger.error("❌ Database connection FAILED")

    yield

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
)

app.include_router(auth_router)
app.include_router(securities_router)
app.include_router(portfolio_router)
app.include_router(tax_router)
app.include_router(market_router)
app.include_router(events_router)


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

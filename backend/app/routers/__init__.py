"""Routers package — import all routers for registration in main.py."""
from app.routers.auth import router as auth_router
from app.routers.securities import router as securities_router
from app.routers.portfolio import router as portfolio_router
from app.routers.tax import router as tax_router
from app.routers.market import router as market_router
from app.routers.events import router as events_router

__all__ = [
    "auth_router",
    "securities_router",
    "portfolio_router",
    "tax_router",
    "market_router",
    "events_router",
]

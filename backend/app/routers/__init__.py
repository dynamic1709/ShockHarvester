"""Routers package — import all routers for registration in main.py."""
from app.routers.auth import router as auth_router
from app.routers.securities import router as securities_router
from app.routers.portfolio import router as portfolio_router
from app.routers.tax import router as tax_router
from app.routers.market import router as market_router
from app.routers.events import router as events_router
from app.routers.me import router as me_router
from app.routers.advisor import router as advisor_router
from app.routers.websocket import router as ws_router

__all__ = [
    "auth_router",
    "securities_router",
    "portfolio_router",
    "tax_router",
    "market_router",
    "events_router",
    "me_router",
    "advisor_router",
    "ws_router",
]

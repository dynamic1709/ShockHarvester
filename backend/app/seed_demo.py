"""
Minimal / startup seed module.
Ensures default model portfolios, the advisor and 5 investor demo accounts exist.
"""
import logging
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import get_password_hash
from app.models.portfolio import Client, ModelPortfolio
from app.models.user import User

logger = logging.getLogger(__name__)

DEMO_USERS = [
    {
        "email": "advisor@shockharvester.com",
        "password": "password123",
        "role": "advisor",
        "client_name": None,
    },
    {
        "email": "investor1@shockharvester.com",
        "password": "password123",
        "role": "client",
        "client_name": "Aarav Sharma (Aggressive 70/30)",
        "risk_profile": "aggressive",
    },
    {
        "email": "investor2@shockharvester.com",
        "password": "password123",
        "role": "client",
        "client_name": "Priya Patel (Conservative 40/60)",
        "risk_profile": "conservative",
    },
    {
        "email": "investor3@shockharvester.com",
        "password": "password123",
        "role": "client",
        "client_name": "Rohan Verma (Tax-Loss Showcase)",
        "risk_profile": "moderate",
    },
    {
        "email": "investor4@shockharvester.com",
        "password": "password123",
        "role": "client",
        "client_name": "Ananya Iyer (Circuit-Prone Holding)",
        "risk_profile": "aggressive",
    },
    {
        "email": "investor5@shockharvester.com",
        "password": "password123",
        "role": "client",
        "client_name": "Vikram Malhotra (Balanced 60/40)",
        "risk_profile": "balanced",
    },
]


async def ensure_demo_users(db: AsyncSession) -> None:
    """Check and seed model portfolios and demo users if missing."""
    # 1. Ensure at least one ModelPortfolio exists
    model_res = await db.execute(select(ModelPortfolio))
    model = model_res.scalars().first()
    if not model:
        model = ModelPortfolio(
            id=uuid.uuid4(),
            name="Balanced 60/40",
            description="60% Equity / 40% Debt & Gold",
            target_weights={"NIFTYBEES": 0.60, "LIQUIDBEES": 0.30, "GOLDBEES": 0.10},
        )
        db.add(model)
        await db.flush()

    # 2. Ensure demo users
    for user_info in DEMO_USERS:
        existing = await db.execute(select(User).where(User.email == user_info["email"]))
        user = existing.scalar_one_or_none()
        if not user:
            client_id = None
            if user_info["role"] == "client":
                c_res = await db.execute(select(Client).where(Client.email == user_info["email"]))
                client = c_res.scalar_one_or_none()
                if not client:
                    client = Client(
                        id=uuid.uuid4(),
                        name=user_info.get("client_name", "Investor"),
                        email=user_info["email"],
                        model_id=model.id,
                        risk_profile=user_info.get("risk_profile", "moderate"),
                        max_volatility=0.25,
                        max_drawdown=0.20,
                        cash_balance=500000.0,
                    )
                    db.add(client)
                    await db.flush()
                client_id = client.id

            new_user = User(
                id=uuid.uuid4(),
                email=user_info["email"],
                password_hash=get_password_hash(user_info["password"]),
                role=user_info["role"],
                client_id=client_id,
            )
            db.add(new_user)
            await db.flush()
            logger.info(f"Seeded demo user {user_info['email']} ({user_info['role']})")

    await db.commit()

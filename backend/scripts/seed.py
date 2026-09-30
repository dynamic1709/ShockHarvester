"""
Seed script — populates the database with demo data:
  - 1 advisor user (admin@shockharvester.com / password: demo1234)
  - 10 Indian equity securities + substitutes
  - 2 model portfolios
  - 3 demo clients
  - Historical daily prices (30d) for all securities
  - Some open tax lots
"""
import asyncio
import sys
import os
from datetime import date, timedelta
from pathlib import Path

# Allow running as a standalone script
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
from passlib.context import CryptContext
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.market import DailyPrice
from app.models.portfolio import Client, ModelPortfolio
from app.models.security import Security, Substitute
from app.models.tax import TaxLot
from app.models.user import User

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECURITIES = [
    # (symbol, name, asset_class, sector, circuit_band_pct, lot_size, is_index)
    ("RELIANCE", "Reliance Industries Ltd", "equity", "Energy", 0.20, 1, False),
    ("TCS", "Tata Consultancy Services", "equity", "IT", 0.20, 1, False),
    ("HDFC", "HDFC Bank Ltd", "equity", "Financials", 0.20, 1, False),
    ("INFY", "Infosys Ltd", "equity", "IT", 0.20, 1, False),
    ("ICICIBANK", "ICICI Bank Ltd", "equity", "Financials", 0.20, 1, False),
    ("WIPRO", "Wipro Ltd", "equity", "IT", 0.20, 1, False),
    ("AXISBANK", "Axis Bank Ltd", "equity", "Financials", 0.20, 1, False),
    ("NIFTYBEES", "Nippon India ETF Nifty BeES", "equity_etf", "Index", 0.10, 1, True),
    ("GOLDBEES", "Nippon India ETF Gold BeES", "gold", "Commodities", 0.05, 1, False),
    ("LIQUIDBEES", "Nippon India ETF Liquid BeES", "debt", "Liquid", 0.02, 1, False),
]

SUBSTITUTES = [
    ("TCS", "INFY"),
    ("TCS", "WIPRO"),
    ("INFY", "WIPRO"),
    ("INFY", "TCS"),
    ("HDFC", "ICICIBANK"),
    ("HDFC", "AXISBANK"),
    ("ICICIBANK", "AXISBANK"),
]

MODELS = [
    {
        "name": "Aggressive Growth",
        "description": "High equity concentration with IT/Financials tilt",
        "target_weights": {
            "RELIANCE": 0.20, "TCS": 0.25, "HDFC": 0.20,
            "INFY": 0.15, "ICICIBANK": 0.10, "NIFTYBEES": 0.10
        },
    },
    {
        "name": "Balanced Conservative",
        "description": "Balanced with gold and liquid allocation",
        "target_weights": {
            "RELIANCE": 0.15, "TCS": 0.15, "HDFC": 0.15,
            "NIFTYBEES": 0.25, "GOLDBEES": 0.15, "LIQUIDBEES": 0.15
        },
    },
]

CLIENTS = [
    {"name": "Arjun Sharma", "email": "arjun@example.com", "risk_profile": "aggressive", "cash_balance": 500000},
    {"name": "Priya Mehta", "email": "priya@example.com", "risk_profile": "balanced", "cash_balance": 750000},
    {"name": "Vikram Nair", "email": "vikram@example.com", "risk_profile": "conservative", "cash_balance": 300000},
]

BASE_PRICES = {
    "RELIANCE": 2900.0, "TCS": 4200.0, "HDFC": 1700.0,
    "INFY": 1850.0, "ICICIBANK": 1200.0, "WIPRO": 560.0,
    "AXISBANK": 1150.0, "NIFTYBEES": 280.0, "GOLDBEES": 60.0, "LIQUIDBEES": 1000.0,
}


def generate_prices(base: float, days: int = 60) -> list[float]:
    """Generate synthetic daily close prices using geometric Brownian motion."""
    rng = np.random.default_rng(42)
    returns = rng.normal(0.0005, 0.015, days)
    prices = base * np.cumprod(1 + returns)
    return prices.tolist()


async def seed():
    async with AsyncSessionLocal() as db:
        # ── 1. Advisor user ────────────────────────────────────────────────────
        existing = await db.execute(select(User).where(User.email == "admin@shockharvester.com"))
        if not existing.scalar_one_or_none():
            advisor = User(
                email="admin@shockharvester.com",
                password_hash=pwd_ctx.hash("demo1234"),
                role="advisor",
            )
            db.add(advisor)
            print("✅ Created advisor user: admin@shockharvester.com / demo1234")
        else:
            print("ℹ️  Advisor user already exists")

        # ── 2. Securities ──────────────────────────────────────────────────────
        sym_to_sec: dict[str, Security] = {}
        for sym, name, asset_class, sector, cb, lot, is_idx in SECURITIES:
            existing = await db.execute(select(Security).where(Security.symbol == sym))
            sec = existing.scalar_one_or_none()
            if not sec:
                sec = Security(
                    symbol=sym, name=name, asset_class=asset_class,
                    sector=sector, circuit_band_pct=cb, lot_size=lot, is_index=is_idx,
                )
                db.add(sec)
                await db.flush()
                print(f"  + Security: {sym}")
            sym_to_sec[sym] = sec

        # ── 3. Substitutes ────────────────────────────────────────────────────
        for primary_sym, sub_sym in SUBSTITUTES:
            primary = sym_to_sec.get(primary_sym)
            substitute = sym_to_sec.get(sub_sym)
            if primary and substitute:
                existing = await db.execute(
                    select(Substitute).where(
                        Substitute.security_id == primary.id,
                        Substitute.substitute_id == substitute.id,
                    )
                )
                if not existing.scalar_one_or_none():
                    db.add(Substitute(security_id=primary.id, substitute_id=substitute.id))

        # ── 4. Daily prices ───────────────────────────────────────────────────
        today = date.today()
        for sym, sec in sym_to_sec.items():
            base = BASE_PRICES[sym]
            prices = generate_prices(base, 60)
            for i, close in enumerate(prices):
                price_date = today - timedelta(days=60 - i)
                existing = await db.execute(
                    select(DailyPrice).where(
                        DailyPrice.security_id == sec.id,
                        DailyPrice.price_date == price_date,
                    )
                )
                if not existing.scalar_one_or_none():
                    dp = DailyPrice(
                        security_id=sec.id,
                        price_date=price_date,
                        open=round(close * 0.998, 4),
                        high=round(close * 1.012, 4),
                        low=round(close * 0.985, 4),
                        close=round(close, 4),
                        volume=int(np.random.default_rng(i).integers(500_000, 5_000_000)),
                    )
                    db.add(dp)
        print("✅ Daily prices seeded (60 days)")

        # ── 5. Model portfolios ───────────────────────────────────────────────
        model_objs: list[ModelPortfolio] = []
        for m in MODELS:
            existing = await db.execute(select(ModelPortfolio).where(ModelPortfolio.name == m["name"]))
            mp = existing.scalar_one_or_none()
            if not mp:
                mp = ModelPortfolio(**m)
                db.add(mp)
                await db.flush()
                print(f"  + Model: {m['name']}")
            model_objs.append(mp)

        # ── 6. Clients ─────────────────────────────────────────────────────────
        client_objs: list[Client] = []
        for i, c in enumerate(CLIENTS):
            existing = await db.execute(select(Client).where(Client.email == c["email"]))
            cl = existing.scalar_one_or_none()
            if not cl:
                model = model_objs[i % len(model_objs)]
                cl = Client(
                    name=c["name"],
                    email=c["email"],
                    model_id=model.id,
                    risk_profile=c["risk_profile"],
                    max_volatility=0.30 if c["risk_profile"] == "aggressive" else 0.20,
                    max_drawdown=0.25 if c["risk_profile"] == "aggressive" else 0.15,
                    cash_balance=c["cash_balance"],
                )
                db.add(cl)
                await db.flush()
                print(f"  + Client: {c['name']}")
            client_objs.append(cl)

        # ── 7. Tax lots (simulate holdings bought 400+ days ago at high prices) ──
        lot_securities = ["RELIANCE", "TCS", "HDFC", "INFY", "ICICIBANK"]
        for cl in client_objs:
            for sym in lot_securities:
                sec = sym_to_sec.get(sym)
                if not sec:
                    continue
                existing = await db.execute(
                    select(TaxLot).where(
                        TaxLot.client_id == cl.id,
                        TaxLot.security_id == sec.id,
                    )
                )
                if not existing.scalar_one_or_none():
                    base = BASE_PRICES[sym]
                    # Simulate a purchase price 15% above current (unrealized loss)
                    buy_price = round(base * 1.15, 4)
                    buy_date = today - timedelta(days=420)  # LTCG eligible
                    lot = TaxLot(
                        client_id=cl.id,
                        security_id=sec.id,
                        buy_date=buy_date,
                        buy_price=buy_price,
                        original_qty=100,
                        remaining_qty=100,
                    )
                    db.add(lot)
        print("✅ Tax lots seeded")

        await db.commit()
        print("\n🎉 Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())

"""
Full Seed Script for ShockHarvester.
Populates:
  - 25 Securities & Substitute Pairs
  - 3 Model Portfolios (60/40, 70/30, 40/60)
  - 1,000 Clients with Risk Profiles, Cash, and Limits
  - 5 Showcase Demo Accounts (investor1 to investor5) + Advisor
  - 3-8 Tax Lots per holding across 3 years (STCG / LTCG / Gains / Losses)
  - Current FY Realized Capital Gains
  - Default Watchlists
Uses deterministic RNG (fixed seed) and bulk inserts for speed (< 30s).
"""
import asyncio
import sys
import time
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# Ensure backend root on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import get_password_hash
from app.database import AsyncSessionLocal, engine, Base
from app.models.market import DailyPrice
from app.models.misc import Watchlist
from app.models.portfolio import Client, ModelPortfolio
from app.models.security import Security, Substitute
from app.models.tax import RealizedGain, TaxLot
from app.models.user import User

SUBSTITUTE_PAIRS = [
    ("TCS", "INFY", 0.92),
    ("INFY", "TCS", 0.92),
    ("HDFCBANK", "ICICIBANK", 0.91),
    ("ICICIBANK", "HDFCBANK", 0.91),
    ("ICICIBANK", "AXISBANK", 0.89),
    ("AXISBANK", "ICICIBANK", 0.89),
    ("KOTAKBANK", "HDFCBANK", 0.87),
    ("HDFCBANK", "KOTAKBANK", 0.87),
    ("ITC", "HINDUNILVR", 0.85),
    ("HINDUNILVR", "ITC", 0.85),
    ("SUNPHARMA", "CIPLA", 0.88),
    ("CIPLA", "SUNPHARMA", 0.88),
    ("TATASTEEL", "JSWSTEEL", 0.93),
    ("JSWSTEEL", "TATASTEEL", 0.93),
    ("TATAMOTORS", "MARUTI", 0.84),
    ("MARUTI", "TATAMOTORS", 0.84),
    ("NIFTYBEES", "BANKBEES", 0.86),
    ("BANKBEES", "NIFTYBEES", 0.86),
]

MODEL_DEFINITIONS = [
    {
        "name": "Balanced 60/40",
        "description": "60% Equity ETF / 30% Liquid Debt / 10% Gold ETF",
        "target_weights": {
            "NIFTYBEES": 0.50,
            "BANKBEES": 0.10,
            "LIQUIDBEES": 0.30,
            "GOLDBEES": 0.10,
        },
    },
    {
        "name": "Aggressive Growth 70/30",
        "description": "70% Concentrated Large-Cap Equity / 20% Liquid / 10% Gold",
        "target_weights": {
            "RELIANCE": 0.15,
            "TCS": 0.15,
            "HDFCBANK": 0.15,
            "INFY": 0.10,
            "ICICIBANK": 0.10,
            "TATAMOTORS": 0.05,
            "LIQUIDBEES": 0.20,
            "GOLDBEES": 0.10,
        },
    },
    {
        "name": "Conservative Wealth 40/60",
        "description": "40% Defensive Equity & FMCG / 50% Liquid Debt / 10% Gold",
        "target_weights": {
            "NIFTYBEES": 0.25,
            "ITC": 0.15,
            "LIQUIDBEES": 0.50,
            "GOLDBEES": 0.10,
        },
    },
]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Ayaan", "Krishna",
    "Ishaan", "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Aaryan", "Dhruv", "Kabir", "Ritvik",
    "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Chiara", "Myra", "Anvi", "Prisha", "Riya",
    "Pooja", "Neha", "Sneha", "Kavya", "Tanvi", "Shruti", "Meera", "Swati", "Nisha", "Aditi"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Mehta", "Iyer", "Nair", "Malhotra", "Kapoor", "Gupta", "Singh",
    "Chopra", "Reddy", "Bhatt", "Deshmukh", "Joshi", "Kulkarni", "Banerjee", "Chatterjee", "Sen", "Das",
    "Saxena", "Trivedi", "Menon", "Pillai", "Rao", "Hegde", "Choudhury", "Bose", "Dutta", "Pandey"
]


async def run_seed(wipe_all: bool = False):
    start_time = time.time()
    print("[INFO] Starting ShockHarvester Full Database Seed...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        if wipe_all:
            print("[INFO] Wiping existing client/lot/user records...")
            await db.execute(delete(Watchlist))
            await db.execute(delete(RealizedGain))
            await db.execute(delete(TaxLot))
            await db.execute(delete(User))
            await db.execute(delete(Client))
            await db.commit()

        # 1. Fetch Securities
        sec_res = await db.execute(select(Security))
        securities = sec_res.scalars().all()
        if not securities:
            from scripts.download_data import populate_market_data
            await populate_market_data()
            sec_res = await db.execute(select(Security))
            securities = sec_res.scalars().all()

        sec_map = {s.symbol: s for s in securities}
        print(f"[OK] {len(securities)} securities active.")

        # 2. Populate Substitute Pairs
        print("[INFO] Populating substitute pairs...")
        for prim, sub, corr in SUBSTITUTE_PAIRS:
            if prim in sec_map and sub in sec_map:
                existing = await db.execute(
                    select(Substitute).where(
                        Substitute.security_id == sec_map[prim].id,
                        Substitute.substitute_id == sec_map[sub].id,
                    )
                )
                if not existing.scalar_one_or_none():
                    db.add(Substitute(
                        security_id=sec_map[prim].id,
                        substitute_id=sec_map[sub].id,
                    ))
        await db.commit()

        # 3. Model Portfolios
        print("[INFO] Seeding 3 Model Portfolios...")
        models = {}
        for m_def in MODEL_DEFINITIONS:
            res = await db.execute(select(ModelPortfolio).where(ModelPortfolio.name == m_def["name"]))
            model = res.scalar_one_or_none()
            if not model:
                model = ModelPortfolio(
                    name=m_def["name"],
                    description=m_def["description"],
                    target_weights=m_def["target_weights"],
                )
                db.add(model)
                await db.flush()
            models[m_def["name"]] = model
        await db.commit()

        # 4. Fetch latest closing prices for lot generation
        prices_res = await db.execute(
            select(DailyPrice).order_by(DailyPrice.price_date.desc())
        )
        latest_prices = {}
        for p in prices_res.scalars().all():
            if p.security_id not in latest_prices:
                latest_prices[p.security_id] = float(p.close)

        # 5. Generate 1,000 Clients (with 5 fixed showcase clients)
        print("[INFO] Generating 1,000 client portfolios with tax lots...")
        rng = np.random.default_rng(42)  # Fixed reproducible seed

        model_list = list(models.values())
        today = date(2024, 10, 1)

        # 5 Showcase Demo Specifications
        showcase_specs = [
            {
                "email": "investor1@shockharvester.com",
                "name": "Aarav Sharma",
                "risk": "aggressive",
                "model": models["Aggressive Growth 70/30"],
                "vol": 0.25,
                "dd": 0.20,
                "cash": 350000.0,
                "gain_bias": 1.45, # Big long-term capital gains
                "has_suzlon": False,
            },
            {
                "email": "investor2@shockharvester.com",
                "name": "Priya Patel",
                "risk": "conservative",
                "model": models["Conservative Wealth 40/60"],
                "vol": 0.14,
                "dd": 0.12,
                "cash": 800000.0,
                "gain_bias": 1.10, # Modest steady gains
                "has_suzlon": False,
            },
            {
                "email": "investor3@shockharvester.com",
                "name": "Rohan Verma",
                "risk": "balanced",
                "model": models["Balanced 60/40"],
                "vol": 0.20,
                "dd": 0.18,
                "cash": 450000.0,
                "gain_bias": 0.70, # Deep unrealized losses (prime tax-loss harvest candidate)
                "has_suzlon": False,
            },
            {
                "email": "investor4@shockharvester.com",
                "name": "Ananya Iyer",
                "risk": "aggressive",
                "model": models["Aggressive Growth 70/30"],
                "vol": 0.28,
                "dd": 0.22,
                "cash": 250000.0,
                "gain_bias": 0.95,
                "has_suzlon": True, # Holds circuit-prone SUZLON
            },
            {
                "email": "investor5@shockharvester.com",
                "name": "Vikram Malhotra",
                "risk": "balanced",
                "model": models["Balanced 60/40"],
                "vol": 0.18,
                "dd": 0.16,
                "cash": 600000.0,
                "gain_bias": 1.15,
                "has_suzlon": False,
            },
        ]

        # Check existing clients
        c_count = (await db.execute(select(Client))).scalars().all()
        if len(c_count) >= 1000:
            print(f"[OK] Database already contains {len(c_count)} clients.")
            return

        all_clients = []
        all_lots = []
        all_realized = []
        all_users = []
        all_watchlists = []

        # Advisor User
        adv_res = await db.execute(select(User).where(User.email == "advisor@shockharvester.com"))
        if not adv_res.scalar_one_or_none():
            all_users.append(User(
                id=uuid.uuid4(),
                email="advisor@shockharvester.com",
                password_hash=get_password_hash("password123"),
                role="advisor",
                client_id=None,
            ))

        # Create Showcase Clients (1 to 5)
        showcase_client_ids = []
        for spec in showcase_specs:
            cid = uuid.uuid4()
            showcase_client_ids.append(cid)
            client = Client(
                id=cid,
                name=spec["name"],
                email=spec["email"],
                model_id=spec["model"].id,
                risk_profile=spec["risk"],
                max_volatility=spec["vol"],
                max_drawdown=spec["dd"],
                cash_balance=spec["cash"],
            )
            all_clients.append(client)

            # Link showcase user
            all_users.append(User(
                id=uuid.uuid4(),
                email=spec["email"],
                password_hash=get_password_hash("password123"),
                role="client",
                client_id=cid,
            ))

            # Default Watchlist for showcase user
            for sym in ["RELIANCE", "TCS", "HDFCBANK", "INFY", "NIFTYBEES", "GOLDBEES", "SUZLON"]:
                if sym in sec_map:
                    all_watchlists.append(Watchlist(
                        user_id=all_users[-1].id,
                        security_id=sec_map[sym].id,
                    ))

            # Generate Tax Lots for Showcase Client
            target_weights = spec["model"].target_weights
            portfolio_equity_val = rng.uniform(2000000, 5000000)

            holdings = list(target_weights.keys())
            if spec["has_suzlon"] and "SUZLON" not in holdings:
                holdings.append("SUZLON")

            for sym in holdings:
                sec = sec_map.get(sym)
                if not sec:
                    continue
                curr_p = latest_prices.get(sec.id, 1000.0)
                alloc_val = portfolio_equity_val * target_weights.get(sym, 0.08)
                target_shares = int(alloc_val / curr_p)
                if target_shares <= 0:
                    target_shares = 10

                # Split into 3-8 discrete tax lots bought over 3 years
                num_lots = int(rng.integers(3, 8))
                shares_per_lot = int(max(1, target_shares // num_lots))

                for _ in range(num_lots):
                    days_ago = int(rng.integers(20, 1050))
                    buy_d = today - timedelta(days=days_ago)
                    # Price variation relative to current price based on gain_bias
                    cost_multiplier = float((1.0 / spec["gain_bias"]) * rng.uniform(0.75, 1.25))
                    buy_p = float(round(curr_p * cost_multiplier, 2))

                    all_lots.append(TaxLot(
                        client_id=cid,
                        security_id=sec.id,
                        buy_date=buy_d,
                        buy_price=buy_p,
                        original_qty=int(shares_per_lot),
                        remaining_qty=int(shares_per_lot),
                        is_active=True,
                    ))

            # Add sample realized gains in current FY (FY2024-25 -> 2025)
            all_realized.append(RealizedGain(
                client_id=cid,
                fy=2025,
                stcg=float(round(float(rng.uniform(15000, 75000)), 2)),
                ltcg=float(round(float(rng.uniform(50000, 250000)), 2)),
                st_loss=float(round(float(rng.uniform(5000, 30000)), 2)),
                lt_loss=float(round(float(rng.uniform(0, 40000)), 2)),
            ))

        # Generate Remaining 995 Clients
        for i in range(6, 1001):
            cid = uuid.uuid4()
            fname = str(rng.choice(FIRST_NAMES))
            lname = str(rng.choice(LAST_NAMES))
            email = f"client{i}@{fname.lower()}{lname.lower()}.in"
            model = rng.choice(model_list)
            risk = "aggressive" if "70/30" in model.name else ("conservative" if "40/60" in model.name else "balanced")

            client = Client(
                id=cid,
                name=f"{fname} {lname}",
                email=email,
                model_id=model.id,
                risk_profile=risk,
                max_volatility=float(round(float(rng.uniform(0.12, 0.30)), 4)),
                max_drawdown=float(round(float(rng.uniform(0.12, 0.25)), 4)),
                cash_balance=float(round(float(rng.uniform(100000, 1500000)), 2)),
            )
            all_clients.append(client)

            # Generate Lots for this client
            port_val = float(rng.uniform(1000000, 6000000))
            for sym, weight in model.target_weights.items():
                sec = sec_map.get(sym)
                if not sec:
                    continue
                curr_p = latest_prices.get(sec.id, 1000.0)
                tot_qty = max(2, int((port_val * weight) / curr_p))
                num_lots = int(rng.integers(2, 6))
                q_lot = int(max(1, tot_qty // num_lots))

                for _ in range(num_lots):
                    days_ago = int(rng.integers(15, 1000))
                    buy_d = today - timedelta(days=days_ago)
                    price_factor = float(rng.uniform(0.65, 1.40))
                    buy_p = float(round(curr_p * price_factor, 2))

                    all_lots.append(TaxLot(
                        client_id=cid,
                        security_id=sec.id,
                        buy_date=buy_d,
                        buy_price=buy_p,
                        original_qty=int(q_lot),
                        remaining_qty=int(q_lot),
                        is_active=True,
                    ))

        # Bulk insert records in batches
        print(f"[INFO] Inserting {len(all_clients)} clients...")
        db.add_all(all_clients)
        await db.flush()

        print(f"[INFO] Inserting {len(all_users)} user logins...")
        db.add_all(all_users)
        await db.flush()

        print(f"[INFO] Inserting {len(all_watchlists)} watchlist entries...")
        db.add_all(all_watchlists)
        await db.flush()

        print(f"[INFO] Inserting {len(all_lots)} tax lots in batches...")
        batch_size = 5000
        for b_idx in range(0, len(all_lots), batch_size):
            db.add_all(all_lots[b_idx:b_idx + batch_size])
            await db.flush()

        print(f"[INFO] Inserting {len(all_realized)} realized gains...")
        db.add_all(all_realized)
        await db.commit()

        elapsed = round(time.time() - start_time, 2)
        print(f"[OK] Full Database Seed completed in {elapsed} s!")
        print(f"     • Securities: {len(securities)}")
        print(f"     • Model Portfolios: {len(models)}")
        print(f"     • Clients: {len(all_clients)}")
        print(f"     • Tax Lots: {len(all_lots)}")
        print(f"     • Users: {len(all_users)}")


if __name__ == "__main__":
    asyncio.run(run_seed(wipe_all=True))

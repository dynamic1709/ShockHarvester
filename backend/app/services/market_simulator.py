"""
Live Market Price Simulator Service.
Generates realistic simulated price ticks, tracks live price cache, and broadcasts to WebSockets.
"""
import asyncio
from datetime import datetime, timezone
import logging
import random
from typing import Any

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.market import DailyPrice
from app.models.security import Security
from app.routers.websocket import manager

logger = logging.getLogger(__name__)

# Global in-memory cache of latest live prices: symbol -> price dict
LIVE_MARKET_STATE: dict[str, dict[str, Any]] = {}
BASE_PRICES: dict[str, float] = {}
SIMULATOR_TASK: asyncio.Task | None = None
IS_SIMULATION_PAUSED: bool = False
ACTIVE_SHOCK: dict[str, Any] | None = None


async def initialize_market_prices():
    """Load latest closing prices from daily_prices into memory as starting base prices."""
    global LIVE_MARKET_STATE, BASE_PRICES
    try:
        async with AsyncSessionLocal() as session:
            sec_res = await session.execute(select(Security))
            securities = sec_res.scalars().all()
            for s in securities:
                p_res = await session.execute(
                    select(DailyPrice)
                    .where(DailyPrice.security_id == s.id)
                    .order_by(DailyPrice.price_date.desc())
                    .limit(1)
                )
                p = p_res.scalar_one_or_none()
                close_px = float(p.close) if p else 1000.0
                BASE_PRICES[s.symbol] = close_px
                LIVE_MARKET_STATE[s.symbol] = {
                    "id": str(s.id),
                    "symbol": s.symbol,
                    "name": s.name,
                    "price": close_px,
                    "change": 0.0,
                    "change_pct": 0.0,
                    "high": round(close_px * 1.015, 2),
                    "low": round(close_px * 0.985, 2),
                    "volume": int(p.volume) if p else 500000,
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                    "is_halted": s.is_halted,
                    "circuit_band_pct": float(s.circuit_band_pct),
                }
        logger.info(f"✅ Market simulator initialized with {len(LIVE_MARKET_STATE)} securities.")
    except Exception as e:
        logger.error(f"Error initializing market simulator prices: {e}")


def get_live_price(symbol: str) -> float:
    """Return latest simulated price or fallback to 1000.0."""
    if symbol in LIVE_MARKET_STATE:
        return float(LIVE_MARKET_STATE[symbol]["price"])
    return BASE_PRICES.get(symbol, 1000.0)


def get_all_live_prices() -> dict[str, dict[str, Any]]:
    return LIVE_MARKET_STATE


async def trigger_live_shock(scenario_name: str, magnitude: float, affected_sectors: list[str] = None):
    """Drop prices according to the shock scenario and broadcast alert."""
    global ACTIVE_SHOCK
    ACTIVE_SHOCK = {
        "scenario": scenario_name,
        "magnitude": magnitude,
        "sectors": affected_sectors or ["ALL"],
        "triggered_at": datetime.now(timezone.utc).isoformat(),
    }
    
    ticks_to_broadcast = []
    for sym, item in LIVE_MARKET_STATE.items():
        base = BASE_PRICES.get(sym, item["price"])
        # Apply magnitude with slight random noise
        drop = magnitude * (1.0 + random.uniform(-0.05, 0.05))
        new_price = round(max(1.0, base * (1.0 + drop)), 2)
        chg = round(new_price - base, 2)
        chg_pct = round((chg / base) * 100.0, 2)
        
        item["price"] = new_price
        item["change"] = chg
        item["change_pct"] = chg_pct
        item["last_updated"] = datetime.now(timezone.utc).isoformat()
        ticks_to_broadcast.append(item)

    # Broadcast shock event and updated price ticks
    await manager.broadcast({
        "type": "shock_triggered",
        "shock": ACTIVE_SHOCK,
    })
    await manager.broadcast({
        "type": "market_ticks",
        "ticks": ticks_to_broadcast,
    })


async def reset_live_market():
    """Reset market prices back to base unshocked levels."""
    global ACTIVE_SHOCK
    ACTIVE_SHOCK = None
    ticks_to_broadcast = []
    for sym, item in LIVE_MARKET_STATE.items():
        base = BASE_PRICES.get(sym, item["price"])
        item["price"] = base
        item["change"] = 0.0
        item["change_pct"] = 0.0
        item["last_updated"] = datetime.now(timezone.utc).isoformat()
        ticks_to_broadcast.append(item)

    await manager.broadcast({
        "type": "market_reset",
        "message": "Market simulation reset to baseline.",
    })
    await manager.broadcast({
        "type": "market_ticks",
        "ticks": ticks_to_broadcast,
    })


async def market_simulation_loop():
    """Background asyncio task generating periodic micro-ticks."""
    await asyncio.sleep(2.0)
    await initialize_market_prices()

    while True:
        try:
            await asyncio.sleep(1.5)
            if IS_SIMULATION_PAUSED or not LIVE_MARKET_STATE:
                continue

            # Pick 4 to 8 random securities to tick
            symbols_to_tick = random.sample(list(LIVE_MARKET_STATE.keys()), min(8, len(LIVE_MARKET_STATE)))
            updated_ticks = []

            for sym in symbols_to_tick:
                item = LIVE_MARKET_STATE[sym]
                if item.get("is_halted"):
                    continue
                
                # Normal random walk (+/- 0.08%)
                pct_delta = random.gauss(0.0001, 0.0008)
                curr_p = item["price"]
                new_p = round(max(1.0, curr_p * (1.0 + pct_delta)), 2)
                base = BASE_PRICES.get(sym, new_p)
                chg = round(new_p - base, 2)
                chg_pct = round((chg / base) * 100.0, 2)
                
                item["price"] = new_p
                item["change"] = chg
                item["change_pct"] = chg_pct
                item["high"] = max(item["high"], new_p)
                item["low"] = min(item["low"], new_p)
                item["volume"] += random.randint(100, 2500)
                item["last_updated"] = datetime.now(timezone.utc).isoformat()
                
                updated_ticks.append({
                    "symbol": sym,
                    "price": new_p,
                    "change": chg,
                    "change_pct": chg_pct,
                    "high": item["high"],
                    "low": item["low"],
                    "volume": item["volume"],
                })

            if updated_ticks:
                await manager.broadcast({
                    "type": "market_ticks",
                    "ticks": updated_ticks,
                })

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Market simulation tick error: {e}")
            await asyncio.sleep(2.0)

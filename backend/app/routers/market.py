"""Market data router — indices, securities, live quotes, and historical OHLCV."""
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_user, require_advisor
from app.database import get_db
from app.models.market import DailyPrice, PriceTick
from app.models.security import Security, Substitute
from app.models.user import User

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/indices")
async def get_indices(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return latest index quotes for NIFTY 50 and BANK NIFTY with % change."""
    index_symbols = ["^NSEI", "^NSEBANK"]
    res = await db.execute(
        select(Security).where(Security.symbol.in_(index_symbols))
    )
    indices = res.scalars().all()

    output = []
    for idx in indices:
        prices_res = await db.execute(
            select(DailyPrice)
            .where(DailyPrice.security_id == idx.id)
            .order_by(DailyPrice.price_date.desc())
            .limit(2)
        )
        p_list = prices_res.scalars().all()
        curr_p = float(p_list[0].close) if p_list else 24850.0
        prev_p = float(p_list[1].close) if len(p_list) > 1 else curr_p * 0.995
        chg = curr_p - prev_p
        pct_chg = (chg / prev_p) * 100 if prev_p else 0.0

        output.append({
            "symbol": idx.symbol,
            "name": idx.name,
            "current_price": round(curr_p, 2),
            "previous_close": round(prev_p, 2),
            "change": round(chg, 2),
            "change_pct": round(pct_chg, 2),
            "is_positive": chg >= 0,
        })

    return output


@router.get("/securities")
async def get_market_securities(
    asset_class: str | None = Query(None),
    sector: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List all tradable securities with current LTP, day change, circuit limits, and metadata."""
    q = select(Security).where(~Security.symbol.startswith("^"))
    if asset_class:
        q = q.where(Security.asset_class == asset_class)
    if sector:
        q = q.where(Security.sector == sector)

    res = await db.execute(q.order_by(Security.symbol))
    securities = res.scalars().all()

    output = []
    for sec in securities:
        prices_res = await db.execute(
            select(DailyPrice)
            .where(DailyPrice.security_id == sec.id)
            .order_by(DailyPrice.price_date.desc())
            .limit(2)
        )
        p_list = prices_res.scalars().all()
        curr_p = float(p_list[0].close) if p_list else 1000.0
        prev_p = float(p_list[1].close) if len(p_list) > 1 else curr_p * 0.99
        chg = curr_p - prev_p
        pct_chg = (chg / prev_p) * 100 if prev_p else 0.0

        band = float(sec.circuit_band_pct)
        lower_circuit = round(prev_p * (1.0 - band), 2)
        upper_circuit = round(prev_p * (1.0 + band), 2)

        output.append({
            "id": str(sec.id),
            "symbol": sec.symbol,
            "name": sec.name,
            "asset_class": sec.asset_class,
            "sector": sec.sector,
            "circuit_band_pct": band,
            "lot_size": sec.lot_size,
            "is_halted": sec.is_halted,
            "ltp": round(curr_p, 2),
            "previous_close": round(prev_p, 2),
            "change": round(chg, 2),
            "change_pct": round(pct_chg, 2),
            "lower_circuit": lower_circuit,
            "upper_circuit": upper_circuit,
            "is_circuit_locked": curr_p <= lower_circuit or curr_p >= upper_circuit,
        })

    return output


@router.get("/securities/{symbol}")
async def get_security_detail(
    symbol: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Detailed security profile, circuit limits, and substitute assets."""
    res = await db.execute(
        select(Security)
        .where(Security.symbol == symbol.upper())
        .options(
            selectinload(Security.substitutes_as_primary).selectinload(Substitute.substitute_security)
        )
    )
    sec = res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail=f"Security '{symbol}' not found")

    prices_res = await db.execute(
        select(DailyPrice)
        .where(DailyPrice.security_id == sec.id)
        .order_by(DailyPrice.price_date.desc())
        .limit(252)
    )
    p_list = prices_res.scalars().all()
    curr_p = float(p_list[0].close) if p_list else 1000.0
    prev_p = float(p_list[1].close) if len(p_list) > 1 else curr_p
    chg = curr_p - prev_p
    pct_chg = (chg / prev_p) * 100 if prev_p else 0.0

    high_52w = max([float(p.high) for p in p_list]) if p_list else curr_p * 1.2
    low_52w = min([float(p.low) for p in p_list]) if p_list else curr_p * 0.8

    band = float(sec.circuit_band_pct)
    lower_circuit = round(prev_p * (1.0 - band), 2)
    upper_circuit = round(prev_p * (1.0 + band), 2)

    substitutes = []
    for sub in sec.substitutes_as_primary:
        sub_sec = sub.substitute_security
        substitutes.append({
            "id": str(sub_sec.id),
            "symbol": sub_sec.symbol,
            "name": sub_sec.name,
            "sector": sub_sec.sector,
        })

    return {
        "id": str(sec.id),
        "symbol": sec.symbol,
        "name": sec.name,
        "asset_class": sec.asset_class,
        "sector": sec.sector,
        "circuit_band_pct": band,
        "lot_size": sec.lot_size,
        "is_halted": sec.is_halted,
        "ltp": round(curr_p, 2),
        "previous_close": round(prev_p, 2),
        "change": round(chg, 2),
        "change_pct": round(pct_chg, 2),
        "high_52w": round(high_52w, 2),
        "low_52w": round(low_52w, 2),
        "lower_circuit": lower_circuit,
        "upper_circuit": upper_circuit,
        "is_circuit_locked": curr_p <= lower_circuit or curr_p >= upper_circuit,
        "substitutes": substitutes,
    }


@router.get("/securities/{symbol}/history")
async def get_security_history(
    symbol: str,
    range: str = Query("1Y", pattern="^(1D|1W|1M|1Y|3Y)$"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Historical OHLCV series for charting (1D, 1W, 1M, 1Y, 3Y)."""
    res = await db.execute(select(Security).where(Security.symbol == symbol.upper()))
    sec = res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail=f"Security '{symbol}' not found")

    limit_map = {
        "1D": 1,
        "1W": 5,
        "1M": 22,
        "1Y": 252,
        "3Y": 756,
    }
    limit = limit_map.get(range, 252)

    prices_res = await db.execute(
        select(DailyPrice)
        .where(DailyPrice.security_id == sec.id)
        .order_by(DailyPrice.price_date.asc())
    )
    all_prices = prices_res.scalars().all()
    selected_prices = all_prices[-limit:] if len(all_prices) > limit else all_prices

    candles = [
        {
            "time": str(p.price_date),
            "open": float(p.open),
            "high": float(p.high),
            "low": float(p.low),
            "close": float(p.close),
            "volume": int(p.volume),
        }
        for p in selected_prices
    ]

    return {
        "symbol": sec.symbol,
        "range": range,
        "count": len(candles),
        "candles": candles,
    }

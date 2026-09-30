"""
Shock Detector — identifies market shock events from intraday price ticks.

Logic:
  1. Compare the latest tick price to the previous day's close.
  2. If the drop exceeds the security's circuit_band_pct, mark it as shocked.
  3. If index-level drops hit NSE/BSE circuit levels, trigger a market-wide halt signal.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.market import DailyPrice, PriceTick
from app.models.security import Security
from app.tax_config import tax_rules

logger = logging.getLogger(__name__)


@dataclass
class ShockSignal:
    security_id: str
    symbol: str
    pct_change: float          # negative = drop
    circuit_band_pct: float
    is_breached: bool
    is_index: bool
    latest_price: float
    prev_close: float


class ShockDetector:
    """Detects intraday shocks across all monitored securities."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def detect(self, as_of: date | None = None) -> list[ShockSignal]:
        """
        Run shock detection for all non-halted securities.
        Returns a list of ShockSignal — breached ones will trigger harvesting.
        """
        today = as_of or date.today()
        signals: list[ShockSignal] = []

        # Load all active securities
        result = await self.session.execute(
            select(Security).where(Security.is_halted == False)  # noqa: E712
        )
        securities = result.scalars().all()

        for sec in securities:
            signal = await self._check_security(sec, today)
            if signal:
                signals.append(signal)

        breached = [s for s in signals if s.is_breached]
        logger.info(
            f"ShockDetector: {len(securities)} securities checked, "
            f"{len(breached)} breached circuit bands"
        )
        return signals

    async def _check_security(self, sec: Security, today: date) -> ShockSignal | None:
        """Check a single security for shock conditions."""
        # Get previous day's close price
        prev_close_row = await self.session.execute(
            select(DailyPrice)
            .where(DailyPrice.security_id == sec.id)
            .where(DailyPrice.price_date < today)
            .order_by(DailyPrice.price_date.desc())
            .limit(1)
        )
        prev_day = prev_close_row.scalar_one_or_none()
        if not prev_day:
            return None  # No historical data — skip

        # Get latest price tick today
        latest_tick_row = await self.session.execute(
            select(PriceTick)
            .where(PriceTick.security_id == sec.id)
            .order_by(PriceTick.ts.desc())
            .limit(1)
        )
        latest_tick = latest_tick_row.scalar_one_or_none()
        if not latest_tick:
            return None  # No intraday tick yet

        pct_change = (latest_tick.price - prev_day.close) / prev_day.close
        is_breached = pct_change <= -abs(float(sec.circuit_band_pct))

        return ShockSignal(
            security_id=str(sec.id),
            symbol=sec.symbol,
            pct_change=round(pct_change, 6),
            circuit_band_pct=float(sec.circuit_band_pct),
            is_breached=is_breached,
            is_index=sec.is_index,
            latest_price=float(latest_tick.price),
            prev_close=float(prev_day.close),
        )

    @staticmethod
    def classify_market_halt(index_drop: float) -> str | None:
        """Return halt type based on NSE/BSE index circuit levels."""
        levels = sorted(tax_rules.index_circuit_levels)
        if index_drop <= -levels[2]:
            return "rest_of_day"
        if index_drop <= -levels[1]:
            return "105_min"
        if index_drop <= -levels[0]:
            return "45_min"
        return None

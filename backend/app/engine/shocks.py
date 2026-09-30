"""
Engine Module: Volatility Shock Simulation & Circuit Detection.
Models historical crash events (COVID-19 2020, Election Day 2024) and synthetic market shocks.
"""
from dataclasses import dataclass
from typing import Any
import numpy as np


@dataclass
class ShockScenario:
    name: str
    description: str
    magnitude: float  # fraction e.g. -0.25 (-25%)
    affected_sectors: list[str]  # e.g. ["Financials", "Energy", "All"]
    vol_multiplier: float  # e.g. 2.5x
    is_historical_replay: bool = True


SHOCK_PRESETS: dict[str, ShockScenario] = {
    "covid_2020": ShockScenario(
        name="COVID-19 Crash Replay (March 2020)",
        description="Broad-market liquidity squeeze with severe equity drawdowns (-25%) and VIX surge.",
        magnitude=-0.25,
        affected_sectors=["ALL", "Financials", "Energy", "Auto", "Metals"],
        vol_multiplier=2.5,
        is_historical_replay=True,
    ),
    "election_2024": ShockScenario(
        name="Election Day Flash Dip (June 4, 2024)",
        description="Intraday political volatility shock (-6%) heavily affecting PSUs, Power, and Industrials.",
        magnitude=-0.06,
        affected_sectors=["Industrials", "Power", "Metals", "Financials"],
        vol_multiplier=1.8,
        is_historical_replay=True,
    ),
    "rate_spike": ShockScenario(
        name="Global Rate Hike & Currency Shock",
        description="100 bps surprise yield surge impacting high-multiple IT and Growth equities (-12%).",
        magnitude=-0.12,
        affected_sectors=["IT", "Financials"],
        vol_multiplier=1.6,
        is_historical_replay=False,
    ),
    "flash_circuit": ShockScenario(
        name="Mid-Cap Circuit Breaker Spike",
        description="Sharp localized liquidation triggering 5% and 10% lower circuit locks.",
        magnitude=-0.15,
        affected_sectors=["Power", "Metals", "Auto"],
        vol_multiplier=2.2,
        is_historical_replay=False,
    ),
}


@dataclass
class ShockImpact:
    security_id: Any
    symbol: str
    pre_shock_price: float
    shocked_price: float
    pct_change: float
    circuit_band_pct: float
    is_circuit_locked: bool
    is_halted: bool


def apply_shock_to_prices(
    current_prices: dict[str, float],
    securities_info: dict[str, dict[str, Any]],
    scenario: ShockScenario,
    noise_std: float = 0.015,
) -> dict[str, ShockImpact]:
    """
    Apply scenario magnitude and sector sensitivities to prices.
    Returns simulated price shocks and circuit lock statuses for all securities.
    """
    rng = np.random.default_rng(123)
    results: dict[str, ShockImpact] = {}

    affects_all = "ALL" in [s.upper() for s in scenario.affected_sectors]

    for symbol, base_p in current_prices.items():
        sec = securities_info.get(symbol, {})
        sec_id = sec.get("id", symbol)
        sector = sec.get("sector", "Other")
        band = float(sec.get("circuit_band_pct", 0.20))
        is_halted = bool(sec.get("is_halted", False))

        is_affected = affects_all or (sector in scenario.affected_sectors)

        # Base magnitude with sector amplification
        if is_affected:
            drop = scenario.magnitude + rng.normal(0, noise_std)
        else:
            # Unaffected sectors suffer mild beta spillover (30% of shock)
            drop = (scenario.magnitude * 0.3) + rng.normal(0, noise_std / 2.0)

        # Commodities / Gold hedge behavior
        if "gold" in sec.get("asset_class", "").lower() or symbol == "GOLDBEES":
            drop = abs(scenario.magnitude) * 0.15 + rng.normal(0, noise_std / 2.0)  # Gold appreciates
        elif "debt" in sec.get("asset_class", "").lower() or symbol == "LIQUIDBEES":
            drop = 0.0  # Liquid cash stable

        new_price = round(max(0.1, base_p * (1.0 + drop)), 2)
        pct_change = (new_price - base_p) / base_p

        # Check circuit limit
        lower_circuit = base_p * (1.0 - band)
        is_locked = (new_price <= lower_circuit) or is_halted

        # Cap at circuit limit
        if new_price < lower_circuit:
            new_price = round(lower_circuit, 2)
            pct_change = -band
            is_locked = True

        results[symbol] = ShockImpact(
            security_id=sec_id,
            symbol=symbol,
            pre_shock_price=base_p,
            shocked_price=new_price,
            pct_change=round(pct_change, 4),
            circuit_band_pct=band,
            is_circuit_locked=is_locked,
            is_halted=is_halted,
        )

    return results

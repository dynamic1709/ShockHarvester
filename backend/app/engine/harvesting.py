"""
Engine Module: Tax-Loss Harvesting & Substitute Selection.
Identifies harvestable loss lots, ensures tax benefit exceeds total round-trip transaction costs,
and pairs primary assets with correlated substitutes.
"""
from dataclasses import dataclass
from datetime import date
from typing import Any
import uuid

from app.engine.tax_lots import LotState
from app.tax_config import tax_rules


@dataclass
class HarvestOpportunity:
    lot_id: uuid.UUID | str
    security_id: uuid.UUID | str
    symbol: str
    quantity: int
    buy_price: float
    current_price: float
    unrealized_loss: float
    is_long_term: bool
    applicable_tax_rate: float
    gross_tax_savings: float
    estimated_transaction_cost: float
    net_tax_benefit: float
    is_economically_viable: bool
    recommended_substitute_id: uuid.UUID | str | None = None
    recommended_substitute_symbol: str | None = None


def evaluate_lot_for_harvest(
    lot: LotState,
    symbol: str,
    current_price: float,
    as_of_date: date,
    substitute_id: uuid.UUID | str | None = None,
    substitute_symbol: str | None = None,
) -> HarvestOpportunity | None:
    """
    Evaluate whether an individual tax lot should be harvested.
    Calculates gross tax alpha vs roundtrip transaction costs (STT + Brokerage).
    Returns HarvestOpportunity if lot is in loss and economically viable.
    """
    if lot.remaining_qty <= 0 or not lot.is_active:
        return None

    unrealized_pnl_per_share = current_price - lot.buy_price
    if unrealized_pnl_per_share >= 0:
        return None  # Gain lot — not harvestable

    loss = abs(unrealized_pnl_per_share) * lot.remaining_qty
    is_lt = lot.is_long_term(as_of_date)
    rate = tax_rules.ltcg_rate if is_lt else tax_rules.stcg_rate
    gross_tax_savings = loss * rate

    # Roundtrip transaction costs:
    # Sell primary (STT 0.1% + Brokerage 0.03%) + Buy substitute (STT 0.1% + Brokerage 0.03%)
    sell_val = current_price * lot.remaining_qty
    sell_cost = sell_val * (tax_rules.stt_delivery_sell + tax_rules.brokerage_rate)
    buy_cost = sell_val * (tax_rules.stt_delivery_buy + tax_rules.brokerage_rate)
    total_cost = sell_cost + buy_cost

    net_benefit = gross_tax_savings - total_cost
    is_viable = net_benefit > 0.0

    return HarvestOpportunity(
        lot_id=lot.id,
        security_id=lot.security_id,
        symbol=symbol,
        quantity=lot.remaining_qty,
        buy_price=lot.buy_price,
        current_price=current_price,
        unrealized_loss=round(loss, 2),
        is_long_term=is_lt,
        applicable_tax_rate=rate,
        gross_tax_savings=round(gross_tax_savings, 2),
        estimated_transaction_cost=round(total_cost, 2),
        net_tax_benefit=round(net_benefit, 2),
        is_economically_viable=is_viable,
        recommended_substitute_id=substitute_id,
        recommended_substitute_symbol=substitute_symbol,
    )


def identify_portfolio_harvest_candidates(
    lots: list[LotState],
    prices: dict[uuid.UUID | str, float],
    symbol_map: dict[uuid.UUID | str, str],
    substitutes_map: dict[uuid.UUID | str, tuple[uuid.UUID | str, str]],
    as_of_date: date,
    active_cooling_off: set[uuid.UUID | str] | None = None,
) -> list[HarvestOpportunity]:
    """
    Scan all portfolio tax lots and collect economically viable tax-loss harvesting candidates,
    filtering out any securities currently in the 30-day cooling-off period.
    """
    cooling_set = active_cooling_off or set()
    opportunities: list[HarvestOpportunity] = []

    for lot in lots:
        if lot.security_id in cooling_set:
            continue
        curr_p = prices.get(lot.security_id)
        if curr_p is None:
            continue

        sym = symbol_map.get(lot.security_id, "SEC")
        sub_info = substitutes_map.get(lot.security_id)
        sub_id = sub_info[0] if sub_info else None
        sub_sym = sub_info[1] if sub_info else None

        opp = evaluate_lot_for_harvest(
            lot=lot,
            symbol=sym,
            current_price=curr_p,
            as_of_date=as_of_date,
            substitute_id=sub_id,
            substitute_symbol=sub_sym,
        )

        if opp and opp.is_economically_viable:
            opportunities.append(opp)

    # Sort opportunities by highest net tax benefit
    opportunities.sort(key=lambda o: o.net_tax_benefit, reverse=True)
    return opportunities

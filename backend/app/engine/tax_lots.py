"""
Engine Module: Tax Lots Matching & Capital Gains Accounting.
Implements strict First-In-First-Out (FIFO) tax lot matching, partial lot tracking,
STCG / LTCG classification (365 days boundary), and Indian set-off rules.
"""
from dataclasses import dataclass, field
from datetime import date
from typing import Any
import uuid

from app.tax_config import tax_rules


@dataclass
class LotState:
    id: uuid.UUID | str
    security_id: uuid.UUID | str
    buy_date: date
    buy_price: float
    original_qty: int
    remaining_qty: int
    is_active: bool = True

    def is_long_term(self, as_of_date: date) -> bool:
        """Check if held > long_term_holding_days (365 days)."""
        days_held = (as_of_date - self.buy_date).days
        return days_held > tax_rules.long_term_holding_days


@dataclass
class LotSaleMatch:
    lot_id: uuid.UUID | str
    quantity: int
    buy_price: float
    sell_price: float
    realized_gain: float
    is_long_term: bool
    remaining_in_lot: int


@dataclass
class TaxLiabilitySummary:
    realized_stcg: float
    realized_ltcg: float
    realized_st_loss: float
    realized_lt_loss: float
    net_stcg_after_setoff: float
    net_ltcg_after_setoff: float
    exemption_utilized: float
    exemption_remaining: float
    taxable_stcg: float
    taxable_ltcg: float
    estimated_tax: float


def match_fifo_lots(
    lots: list[LotState],
    qty_to_sell: int,
    sell_price: float,
    sell_date: date,
) -> tuple[list[LotSaleMatch], int]:
    """
    Match sales against open tax lots in strict FIFO order (by buy_date ascending).
    Returns list of matched lot sale details and remaining unmatched quantity (if any).
    """
    sorted_lots = sorted(
        [lot for lot in lots if lot.remaining_qty > 0 and lot.is_active],
        key=lambda l: l.buy_date,
    )

    matches: list[LotSaleMatch] = []
    qty_needed = qty_to_sell

    for lot in sorted_lots:
        if qty_needed <= 0:
            break

        qty_from_lot = min(lot.remaining_qty, qty_needed)
        lot.remaining_qty -= qty_from_lot
        if lot.remaining_qty == 0:
            lot.is_active = False

        qty_needed -= qty_from_lot
        is_lt = lot.is_long_term(sell_date)
        realized_gain = round((sell_price - lot.buy_price) * qty_from_lot, 4)

        matches.append(
            LotSaleMatch(
                lot_id=lot.id,
                quantity=qty_from_lot,
                buy_price=lot.buy_price,
                sell_price=sell_price,
                realized_gain=realized_gain,
                is_long_term=is_lt,
                remaining_in_lot=lot.remaining_qty,
            )
        )

    return matches, qty_needed


def compute_capital_gains_tax(
    stcg: float,
    ltcg: float,
    st_loss: float,
    lt_loss: float,
    prior_exemption_utilized: float = 0.0,
) -> TaxLiabilitySummary:
    """
    Apply Indian Capital Gains Set-off and Exemption Rules (FY 2024-25):
    1. Short-term loss offsets STCG first, then offsets LTCG.
    2. Long-term loss can only offset LTCG.
    3. Annual LTCG exemption (₹1.25L) applies to net LTCG.
    4. Tax rate: STCG @ 20%, LTCG @ 12.5%.
    """
    # 1. Offset LT Loss against LTCG
    lt_loss_remaining = lt_loss
    net_ltcg = max(0.0, ltcg - lt_loss_remaining)
    lt_loss_remaining = max(0.0, lt_loss_remaining - ltcg)

    # 2. Offset ST Loss against STCG
    st_loss_remaining = st_loss
    net_stcg = max(0.0, stcg - st_loss_remaining)
    st_loss_remaining = max(0.0, st_loss_remaining - stcg)

    # 3. Remaining ST Loss can offset net LTCG
    if st_loss_remaining > 0 and net_ltcg > 0:
        offset_val = min(st_loss_remaining, net_ltcg)
        net_ltcg -= offset_val
        st_loss_remaining -= offset_val

    # 4. Apply Annual LTCG Exemption (₹1,25,000 cap per FY)
    total_exemption_cap = tax_rules.ltcg_annual_exemption_inr
    available_exemption = max(0.0, total_exemption_cap - prior_exemption_utilized)

    exemption_used = min(net_ltcg, available_exemption)
    taxable_ltcg = max(0.0, net_ltcg - exemption_used)
    taxable_stcg = net_stcg

    # 5. Compute Taxes
    tax_stcg = round(taxable_stcg * tax_rules.stcg_rate, 2)
    tax_ltcg = round(taxable_ltcg * tax_rules.ltcg_rate, 2)
    total_tax = round(tax_stcg + tax_ltcg, 2)

    return TaxLiabilitySummary(
        realized_stcg=stcg,
        realized_ltcg=ltcg,
        realized_st_loss=st_loss,
        realized_lt_loss=lt_loss,
        net_stcg_after_setoff=round(net_stcg, 2),
        net_ltcg_after_setoff=round(net_ltcg, 2),
        exemption_utilized=round(exemption_used, 2),
        exemption_remaining=round(available_exemption - exemption_used, 2),
        taxable_stcg=round(taxable_stcg, 2),
        taxable_ltcg=round(taxable_ltcg, 2),
        estimated_tax=total_tax,
    )

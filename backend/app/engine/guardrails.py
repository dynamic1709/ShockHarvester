"""
Engine Module: Regulatory & Execution Guardrails.
Enforces SEBI circuit limits, stock halts, 30-day cooling-off prudential periods,
and cash balance solvency before order execution.
"""
from dataclasses import dataclass
from datetime import date
from typing import Any
import uuid

from app.tax_config import tax_rules


@dataclass
class ProposedTrade:
    client_id: uuid.UUID | str
    security_id: uuid.UUID | str
    symbol: str
    side: str  # "BUY" | "SELL"
    quantity: int
    price: float


@dataclass
class GuardrailCheckResult:
    is_allowed: bool
    blocked_reason: str | None = None
    rule_violated: str | None = None


def validate_trade_guardrails(
    trade: ProposedTrade,
    is_halted: bool,
    is_circuit_locked: bool,
    active_cooling_off_symbols: set[str],
    client_available_cash: float,
) -> GuardrailCheckResult:
    """
    Validate individual trade against regulatory & risk guardrails:
    1. Halted security check
    2. Circuit lock check
    3. Cooling-off repurchase restriction (BUY only)
    4. Solvency / cash balance check (BUY only)
    """
    # 1. Trading Halt check
    if is_halted:
        return GuardrailCheckResult(
            is_allowed=False,
            blocked_reason=f"Security {trade.symbol} is halted by exchange",
            rule_violated="EXCHANGE_HALT",
        )

    # 2. Circuit Band Lock check
    if is_circuit_locked:
        return GuardrailCheckResult(
            is_allowed=False,
            blocked_reason=f"Security {trade.symbol} is locked in circuit band",
            rule_violated="CIRCUIT_LOCKED",
        )

    # 3. Cooling-off Period check (Blocks repurchases within 30 days of harvest sell)
    if trade.side.upper() == "BUY" and trade.symbol in active_cooling_off_symbols:
        return GuardrailCheckResult(
            is_allowed=False,
            blocked_reason=f"Repurchase of {trade.symbol} restricted during 30-day cooling-off buffer",
            rule_violated="COOLING_OFF_RESTRICTION",
        )

    # 4. Solvency check for BUY orders
    if trade.side.upper() == "BUY":
        required_funds = trade.price * trade.quantity * (1.0 + tax_rules.total_transaction_cost)
        if required_funds > client_available_cash + 1e-3:
            return GuardrailCheckResult(
                is_allowed=False,
                blocked_reason=f"Insufficient client cash balance ({client_available_cash:.2f} < {required_funds:.2f})",
                rule_violated="INSUFFICIENT_CASH",
            )

    return GuardrailCheckResult(is_allowed=True)

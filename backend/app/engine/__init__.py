"""
ShockHarvester Quantitative & Tax Alpha Engine Package.
"""
from app.engine.tax_lots import LotState, match_fifo_lots, compute_capital_gains_tax
from app.engine.harvesting import (
    HarvestOpportunity,
    evaluate_lot_for_harvest,
    identify_portfolio_harvest_candidates,
)
from app.engine.risk import (
    compute_covariance_matrix,
    calculate_portfolio_volatility,
    calculate_drawdown,
    evaluate_portfolio_risk,
)
from app.engine.shocks import (
    ShockScenario,
    SHOCK_PRESETS,
    apply_shock_to_prices,
)
from app.engine.optimizer import solve_portfolio_rebalance, OptimizerResult
from app.engine.guardrails import validate_trade_guardrails, ProposedTrade

__all__ = [
    "LotState",
    "match_fifo_lots",
    "compute_capital_gains_tax",
    "HarvestOpportunity",
    "evaluate_lot_for_harvest",
    "identify_portfolio_harvest_candidates",
    "compute_covariance_matrix",
    "calculate_portfolio_volatility",
    "calculate_drawdown",
    "evaluate_portfolio_risk",
    "ShockScenario",
    "SHOCK_PRESETS",
    "apply_shock_to_prices",
    "solve_portfolio_rebalance",
    "OptimizerResult",
    "validate_trade_guardrails",
    "ProposedTrade",
]

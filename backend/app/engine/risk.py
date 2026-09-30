"""
Engine Module: Portfolio Risk & Drift Analytics.
Calculates annualized portfolio volatility, covariance matrices, drawdowns, and model drift.
"""
from dataclasses import dataclass
import numpy as np


@dataclass
class RiskMetrics:
    annualized_volatility: float
    current_drawdown: float
    max_drawdown_observed: float
    is_volatility_breached: bool
    is_drawdown_breached: bool
    tracking_error: float
    model_drift_pct: float


def compute_covariance_matrix(returns_matrix: np.ndarray, annualize_factor: int = 252) -> np.ndarray:
    """Compute annualized covariance matrix from TxN daily asset returns array."""
    if returns_matrix.ndim != 2 or returns_matrix.shape[0] < 2:
        n_assets = returns_matrix.shape[1] if returns_matrix.ndim == 2 else 1
        return np.eye(n_assets) * 0.04
    cov = np.cov(returns_matrix, rowvar=False) * annualize_factor
    # Ensure 2D
    if cov.ndim == 0:
        cov = np.array([[float(cov)]])
    return cov


def calculate_portfolio_volatility(weights: np.ndarray, cov_matrix: np.ndarray) -> float:
    """Calculate annualized portfolio standard deviation: sqrt(w^T * Cov * w)."""
    w = np.asarray(weights, dtype=float)
    var = float(np.dot(w.T, np.dot(cov_matrix, w)))
    return float(np.sqrt(max(0.0, var)))


def calculate_drawdown(nav_series: np.ndarray) -> tuple[float, float]:
    """
    Calculate current drawdown and maximum peak-to-trough drawdown from price/NAV series.
    Returns (current_drawdown, max_drawdown).
    """
    if len(nav_series) < 2:
        return 0.0, 0.0

    peaks = np.maximum.accumulate(nav_series)
    drawdowns = (nav_series - peaks) / peaks
    current_dd = float(abs(drawdowns[-1]))
    max_dd = float(abs(np.min(drawdowns)))
    return current_dd, max_dd


def evaluate_portfolio_risk(
    weights: np.ndarray,
    target_weights: np.ndarray,
    cov_matrix: np.ndarray,
    nav_series: np.ndarray,
    max_volatility: float,
    max_drawdown_limit: float,
) -> RiskMetrics:
    """Comprehensive risk evaluation for client portfolio."""
    port_vol = calculate_portfolio_volatility(weights, cov_matrix)
    curr_dd, max_dd = calculate_drawdown(nav_series)

    # Drift: half the sum of absolute weight differences (L1 norm / 2)
    drift = float(np.sum(np.abs(weights - target_weights)) / 2.0)

    # Tracking error
    active_weights = weights - target_weights
    te = float(np.sqrt(max(0.0, np.dot(active_weights.T, np.dot(cov_matrix, active_weights)))))

    vol_breached = port_vol > max_volatility
    dd_breached = curr_dd > max_drawdown_limit

    return RiskMetrics(
        annualized_volatility=round(port_vol, 4),
        current_drawdown=round(curr_dd, 4),
        max_drawdown_observed=round(max_dd, 4),
        is_volatility_breached=vol_breached,
        is_drawdown_breached=dd_breached,
        tracking_error=round(te, 4),
        model_drift_pct=round(drift * 100.0, 2),
    )

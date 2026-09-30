"""
Phase 5 Engine Test Suite:
- FIFO matching and partial lot sales
- STCG / LTCG boundary at 365 vs 366 days
- LTCG annual exemption (₹1.25L)
- Indian Capital Gains set-off rules
- Cooling-off non-violation
- Economic viability check (benefit > cost)
- Guardrails (halted and circuit-locked stocks)
- Quadratic optimizer (sum=1, w>=0, vol<=max_vol)
- Performance benchmark (1 client and 1,000 clients solve speed)
"""
import time
import uuid
from datetime import date, timedelta
import numpy as np
import pytest

from app.engine.tax_lots import LotState, match_fifo_lots, compute_capital_gains_tax
from app.engine.harvesting import evaluate_lot_for_harvest
from app.engine.guardrails import validate_trade_guardrails, ProposedTrade
from app.engine.optimizer import solve_portfolio_rebalance
from app.engine.risk import compute_covariance_matrix, calculate_portfolio_volatility


def test_fifo_order_and_partial_lot_sales():
    today = date(2024, 10, 1)
    lot1 = LotState(
        id="lot-1",
        security_id="sec-1",
        buy_date=date(2022, 1, 15), # Older lot
        buy_price=1000.0,
        original_qty=50,
        remaining_qty=50,
    )
    lot2 = LotState(
        id="lot-2",
        security_id="sec-1",
        buy_date=date(2023, 6, 20), # Newer lot
        buy_price=1200.0,
        original_qty=100,
        remaining_qty=100,
    )

    # Sell 70 shares at 1100 -> should exhaust lot1 (50 shares) and take 20 shares from lot2
    matches, remaining = match_fifo_lots([lot2, lot1], qty_to_sell=70, sell_price=1100.0, sell_date=today)
    assert remaining == 0
    assert len(matches) == 2

    # Match 1: from lot 1 (oldest)
    assert matches[0].lot_id == "lot-1"
    assert matches[0].quantity == 50
    assert matches[0].realized_gain == (1100.0 - 1000.0) * 50  # +5000
    assert matches[0].is_long_term is True
    assert lot1.remaining_qty == 0
    assert lot1.is_active is False

    # Match 2: from lot 2 (partial)
    assert matches[1].lot_id == "lot-2"
    assert matches[1].quantity == 20
    assert matches[1].realized_gain == (1100.0 - 1200.0) * 20  # -2000
    assert lot2.remaining_qty == 80
    assert lot2.is_active is True


def test_stcg_ltcg_boundary():
    buy_date = date(2023, 10, 1)

    # 365 days -> STCG (≤ 365 days)
    d_365 = buy_date + timedelta(days=365)
    lot = LotState("id1", "sec1", buy_date, 1000.0, 10, 10)
    assert lot.is_long_term(d_365) is False

    # 366 days -> LTCG (> 365 days)
    d_366 = buy_date + timedelta(days=366)
    assert lot.is_long_term(d_366) is True


def test_ltcg_exemption_and_setoff_rules():
    # Case A: STCG = 50k, LTCG = 200k, STCL = 20k, LTCL = 50k
    # 1. LT loss (50k) offsets LTCG (200k) -> net LTCG = 150k
    # 2. ST loss (20k) offsets STCG (50k) -> net STCG = 30k
    # 3. LTCG exemption (125k) applies to net LTCG (150k) -> taxable LTCG = 25k
    # 4. Tax: 30k * 20% (6,000) + 25k * 12.5% (3,125) = 9,125
    summary = compute_capital_gains_tax(stcg=50000, ltcg=200000, st_loss=20000, lt_loss=50000)
    assert summary.net_stcg_after_setoff == 30000
    assert summary.net_ltcg_after_setoff == 150000
    assert summary.exemption_utilized == 125000
    assert summary.taxable_ltcg == 25000
    assert summary.taxable_stcg == 30000
    assert summary.estimated_tax == 9125.0

    # Case B: Large ST Loss offsetting both STCG and LTCG
    # STCG = 30k, LTCG = 200k, ST Loss = 80k, LT Loss = 0
    # ST loss offsets 30k STCG -> remaining 50k ST loss offsets LTCG (200k) -> net LTCG = 150k
    # LTCG exemption (125k) -> taxable LTCG = 25k
    summary_b = compute_capital_gains_tax(stcg=30000, ltcg=200000, st_loss=80000, lt_loss=0)
    assert summary_b.net_stcg_after_setoff == 0
    assert summary_b.net_ltcg_after_setoff == 150000
    assert summary_b.taxable_ltcg == 25000
    assert summary_b.estimated_tax == 3125.0


def test_harvesting_economic_viability():
    as_of = date(2024, 10, 1)

    # 1. Very small loss where transaction cost > tax benefit -> Should NOT harvest
    # Buy 1 share at ₹1000, current price ₹998 (Loss = ₹2).
    # Tax savings = 2 * 0.20 = ₹0.40.
    # Roundtrip friction = 998 * (0.0013 + 0.0013) = ₹2.59 > ₹0.40.
    lot_small_loss = LotState("lot-tiny", "sec-1", date(2024, 8, 1), 1000.0, 1, 1)
    opp_small = evaluate_lot_for_harvest(lot_small_loss, "TCS", 998.0, as_of)
    assert opp_small is not None
    assert opp_small.is_economically_viable is False
    assert opp_small.net_tax_benefit < 0

    # 2. Meaningful loss -> Should harvest
    # Buy 100 shares at ₹1000, current price ₹800 (Loss = ₹20,000).
    # Tax savings = 20,000 * 0.20 = ₹4,000.
    # Friction = ~₹200. Net benefit = ~₹3,800.
    lot_big_loss = LotState("lot-big", "sec-1", date(2024, 8, 1), 1000.0, 100, 100)
    opp_big = evaluate_lot_for_harvest(lot_big_loss, "TCS", 800.0, as_of)
    assert opp_big is not None
    assert opp_big.is_economically_viable is True
    assert opp_big.net_tax_benefit > 3000.0


def test_guardrails_blocks_halted_and_circuit_locked():
    trade = ProposedTrade("c-1", "s-1", "SUZLON", "BUY", 100, 50.0)

    # 1. Halted
    res_halted = validate_trade_guardrails(trade, is_halted=True, is_circuit_locked=False, active_cooling_off_symbols=set(), client_available_cash=100000)
    assert res_halted.is_allowed is False
    assert res_halted.rule_violated == "EXCHANGE_HALT"

    # 2. Circuit locked
    res_locked = validate_trade_guardrails(trade, is_halted=False, is_circuit_locked=True, active_cooling_off_symbols=set(), client_available_cash=100000)
    assert res_locked.is_allowed is False
    assert res_locked.rule_violated == "CIRCUIT_LOCKED"

    # 3. Cooling-off active
    res_cooling = validate_trade_guardrails(trade, is_halted=False, is_circuit_locked=False, active_cooling_off_symbols={"SUZLON"}, client_available_cash=100000)
    assert res_cooling.is_allowed is False
    assert res_cooling.rule_violated == "COOLING_OFF_RESTRICTION"

    # 4. Normal valid trade
    res_valid = validate_trade_guardrails(trade, is_halted=False, is_circuit_locked=False, active_cooling_off_symbols=set(), client_available_cash=100000)
    assert res_valid.is_allowed is True


def test_quadratic_optimizer_constraints():
    # 5-asset test fixture
    w0 = np.array([0.40, 0.20, 0.15, 0.15, 0.10])
    w_target = np.array([0.20, 0.20, 0.20, 0.20, 0.20])

    # Sample covariance matrix (annualized)
    rng = np.random.default_rng(42)
    A = rng.normal(0, 0.15, (5, 5))
    cov = np.dot(A.T, A) + np.eye(5) * 0.01

    max_vol = 0.25
    result = solve_portfolio_rebalance(
        current_weights=w0,
        target_weights=w_target,
        cov_matrix=cov,
        max_volatility=max_vol,
    )

    assert result.success is True
    # 1. Weights sum to 1.0
    assert abs(np.sum(result.optimal_weights) - 1.0) < 1e-4
    # 2. Non-negative weights
    assert np.all(result.optimal_weights >= -1e-6)
    # 3. Volatility within max limit
    assert result.expected_volatility <= max_vol + 1e-4


def test_optimizer_speed_benchmark_1000_clients():
    """Verify high-performance speed on 1,000 portfolios (< 5 seconds total)."""
    n_assets = 5
    w0 = np.array([0.35, 0.25, 0.20, 0.10, 0.10])
    w_target = np.array([0.20, 0.20, 0.20, 0.20, 0.20])

    cov = np.eye(n_assets) * 0.04
    for i in range(n_assets):
        for j in range(n_assets):
            if i != j:
                cov[i, j] = 0.015

    # 1. Solve 1 client
    t0 = time.time()
    res1 = solve_portfolio_rebalance(w0, w_target, cov, max_volatility=0.25)
    t_single = (time.time() - t0) * 1000.0  # ms
    assert res1.success is True

    # 2. Solve 1,000 clients batch
    t_batch_0 = time.time()
    for _ in range(1000):
        solve_portfolio_rebalance(w0, w_target, cov, max_volatility=0.25)
    t_1000 = time.time() - t_batch_0

    print(f"\n[BENCHMARK] Single client solve: {t_single:.2f} ms")
    print(f"[BENCHMARK] 1,000 clients solve: {t_1000:.3f} s")
    assert t_1000 < 5.0, f"1,000 clients solve took {t_1000:.2f} s (> 5.0 s limit)"

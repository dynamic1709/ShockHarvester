# ShockHarvester — System Specification

## 1. Overview & Vision
ShockHarvester is an automated tax-loss harvesting and volatility-shock protection platform for Indian equity markets. It enables wealth advisors and individual investors to protect portfolios during market downturns, harvest capital losses under Indian IT Act rules (FY 2024-25 STCG 20%, LTCG 12.5%, ₹1.25L exemption), maintain target asset allocations via quadratic programming optimization, and simulate rapid rebalancing across 1,000+ client accounts in under 5 seconds.

## 2. Technology Stack
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL (or SQLite for development fallback), Pydantic v2, PyYAML, SciPy / NumPy / CVXPY for quadratic portfolio optimization, python-jose (JWT), passlib/bcrypt, WeasyPrint / ReportLab / Jinja2 for PDF generation.
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS / Vanilla CSS tokens, Lucide Icons, Recharts, Lightweight Charts (TradingView), TanStack React Query, Axios.
- **Real-Time Engine**: WebSockets (`/ws/live?token=`), asyncio background market simulator streaming ticks and shock broadcasts.
- **Containerization**: Docker Compose (`backend`, `frontend`, `db`).

## 3. User Roles & Authentication
1. **Advisor (`role: advisor`)**:
   - Access to `/advisor` Command Center, Client Directory, Rebalance Runs, Backtest Studio, Guardrails Violations, Tax Rules, Settings.
   - Capability to trigger market shock events (e.g. COVID Crash replay, Election Day 2024 replay, custom synthetic shocks) and reset market state.
2. **Client / Investor (`role: client`)**:
   - Access to `/app` Client Dashboard: Home (Hero, Drift Donut, Protection Status), Watchlist, Portfolio (Holdings & Allocation), Tax Center (FY Summary, Lots, Cooling-Off), Activity, Profile.
   - Dedicated scoped access (`/api/me/*`), 403 forbidden access to other clients' data.
   - Demo Accounts: `advisor@shockharvester.com`, `investor1@shockharvester.com` through `investor5@shockharvester.com`.

## 4. Database Schema
- `users`: `id, email, password_hash, role, client_id, created_at, updated_at`
- `securities`: `id, symbol, name, asset_class, sector, circuit_band_pct, lot_size, is_halted, created_at, updated_at`
- `substitutes`: `id, security_id, substitute_id, correlation`
- `model_portfolios`: `id, name, risk_category, equity_weight, debt_weight, target_weights_json`
- `clients`: `id, name, email, risk_profile, model_portfolio_id, max_volatility, max_drawdown, cash, is_active`
- `tax_lots`: `id, client_id, security_id, buy_date, buy_price, quantity, remaining_qty`
- `realized_gains`: `id, client_id, security_id, sell_date, quantity, buy_price, sell_price, gain_loss, is_long_term, fy`
- `cooling_off`: `id, client_id, security_id, sold_at, expires_at`
- `daily_prices`: `id, security_id, date, open, high, low, close, volume`
- `price_ticks`: `id, security_id, timestamp, price, volume`
- `shock_events`: `id, trigger_type, name, magnitude, affected_sectors, vol_multiplier, created_at`
- `rebalance_runs`: `id, shock_event_id, started_at, completed_at, status, duration_sec, metrics_json, stage_timings_json`
- `trades`: `id, rebalance_run_id, client_id, security_id, side, quantity, price, execution_status, blocked_reason`
- `lot_sales`: `id, trade_id, tax_lot_id, quantity, buy_price, sell_price, realized_gain, is_long_term`
- `guardrail_violations`: `id, rebalance_run_id, client_id, security_id, rule_name, details`
- `watchlists`: `id, user_id, security_id`
- `notifications`: `id, user_id, title, message, type, is_read, created_at`
- `commentaries`: `id, client_id, rebalance_run_id, text, source, created_at`
- `backtest_results`: `id, scenario_name, strategy, metrics_json, series_json, created_at`

## 5. Tax & Regulatory Rules (India FY 2024-25)
- **STCG**: 20% on equity held ≤ 365 days.
- **LTCG**: 12.5% on equity held > 365 days, with first ₹1,25,000 exempt per financial year.
- **Set-off Rules**:
  - Short-term capital loss (STCL) can offset both STCG and LTCG.
  - Long-term capital loss (LTCL) can only offset LTCG.
- **Cooling-Off Period**: 30 days prudential buffer before repurchasing a harvested security (substitutes used in interim).
- **Transaction Costs**: STT (0.1% buy/sell delivery), Brokerage (0.03%), GST/Stamp Duty accounted for. Net harvest benefit must exceed costs.
- **Circuit Breakers & Guardrails**:
  - Individual stock circuit limits (2%, 5%, 10%, 20%). Orders hitting circuit locks or halted status are blocked.
  - Max turnover per rebalance capped (default 30% per asset).

## 6. Engine Architecture
1. **Tax Lot Matching**: Strict FIFO order, partial lot tracking, gain/loss calculation per lot.
2. **Harvesting Engine**: Evaluates unrealized loss lots, calculates net tax alpha after STT and slippage, switches into correlated substitutes.
3. **Risk & Shocks**: Computes portfolio volatility, drawdown, model drift, triggers defensive rebalancing on circuit/volatility breaches.
4. **Optimizer**: Mean-variance / quadratic programming with turnover constraints, tax penalty `lambda_tax`, and substitute replacement.
5. **Guardrails**: Pre-trade and post-trade validation ensuring compliance with circuit locks, cooling-off periods, and liquidity limits.
6. **Execution Pipeline**: In-memory batch processing solving 1,000 portfolios in < 5 seconds, persisted in single transactional batches.
7. **Backtest Engine**: Compares ShockHarvester vs Calendar Rebalancing vs Buy & Hold across historical events (COVID-19 2020, Election 2024).
8. **AI Commentary & Reports**: Generates clear natural-language rationales and downloadable PDF client reports.

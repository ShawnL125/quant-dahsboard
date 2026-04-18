# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Features

- **Testing infrastructure**: Vitest unit tests (482 tests, 25 files) + Playwright E2E tests (48 tests) with Page Object Model (7 page objects, 7 flow specs). Coverage targets: utils 100%, api/client 90%, core stores 85%+, overall 80%.
- **Vue component tests (P1)**: 7 component test files with 80 test cases — KillSwitchBar, StatCards, SystemStatusBar, HealthStatus, OrderForm, StrategyList, SideMenu. Uses @vue/test-utils with Ant Design stubs.
- **E2E real backend run (P3)**: All 48 Playwright tests passing against live paper-trading backend. Navigation (14 routes), login, backtest run/history, order placement/tab navigation, strategy drawer/params/audit, account sync/reconcile.
- **TradingMode safety guard**: E2E global-setup checks `/health` `trading_mode` field and aborts if backend is in `live` mode. Unverified backends log warnings; destructive tests blocked when safety cannot be confirmed.
- **E2E destructive test opt-in**: Kill-switch E2E spec gated behind `E2E_ALLOW_DESTRUCTIVE=true`. Default `test:e2e` skips it; `test:e2e:destructive` script enables it.
- **SystemView connector filter**: Connected exchanges now filtered by `ws_connected`/`ready` status instead of showing all configured connectors.

### Features

- **Risk store robustness fix**: Separate drawdown sampling from status refreshes with 15s dedup window; event_id-based idempotent merge for WS and REST risk events; RiskEventsTable keyed by event_id instead of timestamp.
- **WebSocket channel handlers**: Wire 6 subscribed channels to stores — account (snapshot updates), margin (real-time margin), reconcile (alert refresh), funding (rate updates), params (strategy param sync), notifications.
- **Analytics enhancements**: Round-trip trade detail modal on click; strategy stats history table (click any strategy card); analytics config store support.
- **Backtest import + compare**: Import JSON backtest results via modal; multi-run compare with checkbox selection and side-by-side metrics table.
- **Walk-forward compare**: Multi-run comparison with checkbox selection and compare modal.
- **Account sync (Phase 35)**: Exchange account snapshots, margin status monitoring with liquidation risk, manual sync/reconcile, reconciliation history table.
- **Auto-Tune (Phase 34)**: Trigger optimization runs, confirm/rollback applied params, scheduled auto-tune with cron expressions.
- **Funding rate (Phase 29)**: Current funding rates display, historical rates per symbol, per-strategy funding cost summary, backfill trigger.
- **Algo orders (Phase 38)**: TWAP/VWAP/Iceberg algorithmic order submission, status tracking, pause/resume/cancel controls.
- **OMS state (Phase 31-32)**: Tracked orders view, SL/TP bindings, trailing stop monitoring, order amend support, strategy-scoped order queries.
- **Strategy parameter hot-reload (Phase 33)**: View/update strategy parameters at runtime, parameter change audit log.
- **Auth & user management (Phase 36)**: JWT login page with token management, auth store with login/logout/refresh, API key and user management stores, JWT Bearer auth in API client with X-API-Key fallback, user info and logout button in header.
- **Funding rate view (Phase 29)**: Dedicated Funding page with current rates grid, historical rates table with symbol selector, per-strategy funding cost summary, backfill trigger form.
- **OMS order management (Phase 31-32)**: Orders page extended with Tracked Orders, SL/TP Bindings, and Trailing Stops tabs; deactivate trailing stop action.
- **Algo order management (Phase 38)**: Orders page Algo Orders tab with TWAP/VWAP/Iceberg submit modal, progress bars, pause/resume/cancel controls.
- **Strategy parameter hot-reload UI (Phase 33)**: Strategy detail drawer with editable parameter panel, save/cancel actions, parameter change audit log table.
- **WebSocket enhancement (Phase 37)**: 6 new channels — account, margin, reconcile, funding, params, notifications.
- **Analytics module**: Strategy performance cards (P&L, win rate, Sharpe, profit factor, max drawdown), consecutive losses and signal quality indicators, round-trip trades table with color-coded P&L.
- **Ledger module**: Account balances grid with per-asset breakdowns, double-entry ledger table with debit/credit color coding and running balances, daily summary with date picker, cash flow recording (deposit/withdrawal).
- **Reconciliation**: API client + store for run/reports/alerts, alerts table in System page.
- **Data API client**: Client for symbols and candles endpoints ready for future charting.
- **Admin reload-config**: Reload Config button in System page triggers backend config reload.
- **Real-time sparklines**: Dashboard stat cards now display live data-driven sparkline charts tracking equity, balance, total P&L, and unrealized P&L over time, replacing the previous static generated curves.
- **Session-based trend indicators**: Trend arrows and percentage changes compare current values against session-start baselines instead of showing hardcoded values.
- **WebSocket multi-channel subscription**: Client now subscribes to `orders`, `positions`, `pnl`, `system`, and `trades` channels on connection.

### Bug Fixes

- **Order avg_price mapping**: WebSocket `avg_price` field is now correctly mapped to `avg_fill_price` for order history display.
- **Terminal order handling**: Orders that reach terminal states (FILLED, CANCELED, REJECTED, FAILED) are now moved to order history instead of being silently dropped.
- **New order ingestion**: Incoming WebSocket orders that don't exist locally are now added to the open orders list.
- **Position envelope unwrapping**: WebSocket position events with envelope format (`{action, data}`) are now correctly parsed; supports DELETE action to remove closed positions.

### Configuration

- Updated dev proxy target from port `8000` to `18000`.

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Features

- **Testing infrastructure**: Vitest unit tests (1349 tests, 70 files) + Playwright E2E tests (129 tests, 17 spec files) with Page Object Model (15 page objects, 17 flow specs). Coverage: 91% statements, 86% branches, 89% functions, 91% lines.
- **E2E full coverage expansion**: 77 new E2E tests across 10 spec files and 8 new page objects — Dashboard (10), Analytics (9), Positions (7), Ledger (9), Funding (9), Auto-Tune (8), Walk-Forward (8), Risk read-only (6), System (9), Signals (6). All 15 views now have E2E test coverage.
- **Strategy Lifecycle Management API**: Frontend integration for `/strategy-mgmt` endpoints — list registered strategies with metadata, load from plugin files, start/stop/reload/unload strategies. Pinia store with optimistic status updates.
- **Fee Tracking API**: Frontend integration for `/fees` endpoints — daily fee summaries, maker/taker breakdown, VIP tier progress, fee deviation analysis, per-strategy fee reports. Pinia store with parallel data fetching.
- **Performance Attribution API**: Frontend integration for `/attribution` endpoints — compute/save/list/delete reports, per-trade contribution analysis, equity rollforward decomposition, regime classification, buy-and-hold benchmark comparison.
- **Smart Alerts API**: Frontend integration for `/alerts` endpoints — rules CRUD, alert firings with status filters, active alerts, manual rule evaluation. Pinia store with WebSocket real-time update handler.
- **API module tests**: 133 tests covering all 19 API clients — HTTP method, URL path, and parameter structure verification.
- **Pinia store tests**: 245 tests covering all 19 stores — state mutations, async actions, WebSocket handlers, deduplication, pagination.
- **Vue component tests (P1 + P2)**: 30 component test files with 281 test cases covering all UI components — props rendering, event emission, conditional rendering, CSS class binding.
- **View page tests**: 15 view test files with 664 tests covering all pages — user interactions, computed properties, lifecycle hooks, timer-based polling (RiskView/SystemView), form validation, modal workflows, table rendering, pagination.
- **Utils tests**: formatMoney, formatPct, formatQty, formatTime, formatUptime edge cases; chart theme and constants coverage.
- **WebSocket composable tests**: connect/disconnect, subscribe, reconnect, message parsing.
- **E2E real backend run (P3)**: All 48 Playwright tests passing against live paper-trading backend. Navigation (14 routes), login, backtest run/history, order placement/tab navigation, strategy drawer/params/audit, account sync/reconcile. Expanded to 129 tests with full view coverage.
- **TradingMode safety guard**: E2E global-setup checks `/health` `trading_mode` field and aborts if backend is in `live` mode. Unverified backends log warnings; destructive tests blocked when safety cannot be confirmed.
- **E2E destructive test opt-in**: Kill-switch E2E spec gated behind `E2E_ALLOW_DESTRUCTIVE=true`. Default `test:e2e` skips it; `test:e2e:destructive` script enables it.
- **SystemView connector filter**: Connected exchanges now filtered by `ws_connected`/`ready` status instead of showing all configured connectors.
- **Adversarial review fixes**: Cancel order button upgraded to proper Ant Design component; `playwright-report/` added to `.gitignore`.
- **Portfolio Rebalance API**: Frontend integration for `/portfolio/rebalance` endpoints — trigger rebalance with target weights, monitor status, view history, check drift, update targets. Pinia store with 5 actions.
- **Journal API**: Frontend integration for `/journal` endpoints — entry listing with filters, entry update/review/dismiss, report generation, pending count tracking. Pinia store with review and dismiss workflow.
- **Replay API**: Frontend integration for `/replay` endpoints — async replay run with task tracking, scenario CRUD, step-by-step playback, summary, multi-run compare, trade context lookup. Pinia store with 10 API methods.
- **Data Governance API**: Frontend integration for `/governance` endpoints — quality scores/symbols, quality evaluation, archive status/run/runs, lifecycle dry-run/execute, governance status. Pinia store with 9 actions.
- **Walkforward Extensions**: 4 new methods added to existing walkforward API — batch optimization, sensitivity analysis, overfitting detection, cross-validation with fold results.
- **Exchange Health API**: Frontend integration for `/exchange-health` endpoints — per-exchange health status, failover history, health check history, manual check trigger. Pinia store with auto-refresh on trigger.
- **Feature Store API**: Frontend integration for `/features` endpoints — definition CRUD, value query/get, precompute trigger, status. Pinia store with register/delete lifecycle.
- **Security Audit API**: Frontend integration for `/security/audit` endpoints — audit entries with category/severity filters, summary with breakdown. Pinia store with fetch actions.
- **API module tests expansion**: 45 new API tests covering all 8 new modules — rebalance (5), journal (7), replay (10), governance (9), exchange-health (4), features (8), security (2), walkforward extensions. Total: 1555 tests in 78 files.
- **Pinia store tests expansion**: 135 new store tests covering all 7 new stores + walkforward extensions — rebalance (18), journal (17), replay (20), governance (23), exchange-health (11), features (20), security (12), walkforward (14 existing pass).
- **Admin API**: Frontend integration for `/admin` endpoints — masked config read, event subscriber stats, config reload with auto-refresh. Pinia store with 3 actions.
- **Warmup API**: Frontend integration for `/warmup` endpoints — warmup status, per-symbol/timeframe results with error tracking. Pinia store with 2 actions.
- **Multi-Account API**: Frontend integration for `/accounts` endpoints — account listing, detail, kill/unkill switches. Pinia store with optimistic updates.
- **Backtest Archive API**: Frontend integration for `/archive` endpoints — archive run with metadata, version listing, version comparison with diff, entry browsing with pagination, tag management. Pinia store with 5 actions.
- **Final API test expansion**: 15 new API tests — admin (3), warmup (2), accounts (4), archive (6). Total: 1610 tests in 82 files. All 31 backend API modules now fully integrated.

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

- **Dashboard infinite polling**: Fixed `startPolling` firing immediately on mount when WS is disconnected, causing duplicate fetch on every mount.
- **Dashboard sparkline stale data**: `totalPnlHistory` now watches both `realizedPnl` and `unrealizedPnl` reactively instead of only `realizedPnl`, fixing stale sparklines when unrealized P&L changes.
- **Backtest UNKNOWN status handling**: Backtest store now terminates polling on `UNKNOWN` task status instead of looping indefinitely.
- **Order avg_price mapping**: WebSocket `avg_price` field is now correctly mapped to `avg_fill_price` for order history display.
- **Terminal order handling**: Orders that reach terminal states (FILLED, CANCELED, REJECTED, FAILED) are now moved to order history instead of being silently dropped.
- **New order ingestion**: Incoming WebSocket orders that don't exist locally are now added to the open orders list.
- **Position envelope unwrapping**: WebSocket position events with envelope format (`{action, data}`) are now correctly parsed; supports DELETE action to remove closed positions.

### Configuration

- Updated dev proxy target from port `8000` to `18000`.

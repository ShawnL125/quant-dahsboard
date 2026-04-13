# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Features

- **Analytics module**: Strategy performance cards (P&L, win rate, Sharpe, profit factor, max drawdown), consecutive losses and signal quality indicators, round-trip trades table with color-coded P&L.
- **Ledger module**: Account balances grid with per-asset breakdowns, double-entry ledger table with debit/credit color coding and running balances.
- **Reconciliation API client**: Frontend client for run/reports/alerts endpoints (backend partially stubbed).
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

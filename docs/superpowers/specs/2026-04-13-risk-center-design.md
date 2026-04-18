# Risk Center — Design Spec

**Date:** 2026-04-13
**Priority:** P0 (live trading prerequisite)
**Backend:** Phase 25 — 5 REST endpoints + 1 WS channel

## Overview

New `/risk` page providing real-time risk monitoring, KillSwitch control, drawdown visualization, exposure breakdown, risk configuration, and event audit trail. Follows existing dashboard patterns: Pinia store → Vue view → child components, WebSocket-first with HTTP polling fallback.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/views/RiskView.vue` | Page component, 2x2 card grid layout |
| `src/components/risk/KillSwitchBar.vue` | KillSwitch status bar with activate/deactivate |
| `src/components/risk/DrawdownChart.vue` | ECharts area chart for drawdown curve |
| `src/components/risk/ExposureTable.vue` | Exposure table with progress bars |
| `src/components/risk/RiskConfigCards.vue` | Read-only risk config summary |
| `src/components/risk/RiskEventsTable.vue` | Paginated risk event audit log |
| `src/stores/risk.ts` | Pinia store for risk state |
| `src/api/risk.ts` | API client for risk endpoints |

### Modified Files

| File | Change |
|------|--------|
| `src/router/index.ts` | Add `/risk` route |
| `src/components/layout/SideMenu.vue` | Add Risk menu item |
| `src/components/layout/AppLayout.vue` | Add Risk page title |
| `src/App.vue` | Add `risk` WS channel subscription + handler |
| `src/types/index.ts` | Add risk-related TypeScript types |

### Data Flow

```
WebSocket (risk channel) ──→ riskStore.updateFromWS()
REST API (/risk/*)        ──→ riskStore actions (polling fallback @ 5s)
RiskView ──→ riskStore ──→ child components (props)
```

## API Integration

### REST Endpoints

| Endpoint | Method | Store Action |
|----------|--------|-------------|
| `/risk/status` | GET | `fetchStatus()` |
| `/risk/exposure` | GET | `fetchExposure()` |
| `/risk/events?limit&offset` | GET | `fetchEvents(limit, offset)` |
| `/risk/config` | GET | `fetchConfig()` |
| `/risk/kill-switch` | POST | `postKillSwitch({ level, target, reason, activate, expected_state, idempotency_key })` |

### WebSocket Channel

**Channel:** `risk`

**Message format:**
```json
{
  "channel": "risk",
  "timestamp": "2026-04-13T...",
  "data": {
    "event_id": "uuid",
    "level": "GLOBAL | SYMBOL | STRATEGY",
    "action": "BLOCKED | HALT",
    "reason": "reason text"
  }
}
```

**Handler:** On message, normalize the payload into a `RiskEvent`, derive a stable `event_id` from `event_id | id | metadata.event_id | metadata.id` (or fall back to `time:event_type:level:target:reason`), upsert by `event_id`, keep page 1 unique, increment totals only for new ids, then refresh `riskStore.fetchStatus()` and `riskStore.fetchExposure()`.

## Component Designs

### KillSwitchBar

**Position:** Fixed top of RiskView, full width.

**States:**
- **Inactive:** Dark background (`var(--q-bg-secondary)`), "Activate Global" button with red border.
- **Active:** Red background (`var(--q-error)` with alpha), pulsing animation, shows reason and timestamp.
- **Symbol/Strategy kills:** Displayed as sub-rows below the global bar.

**Interaction:**
- Activate: Popconfirm — "Confirm global KillSwitch? All trading will halt."
- Deactivate: Popconfirm — "Confirm deactivation? Trading will resume."
- Calls `POST /risk/kill-switch` with `{ level, target, reason, activate, expected_state, idempotency_key }`.
- `reason` is required and must be non-empty for both activation and deactivation.
- `expected_state.active` carries the client-observed pre-toggle state; include `expected_state.version` when the backend exposes a kill-switch revision token so stale writes can be rejected server-side.
- `idempotency_key` must be unique per operator action so retries become no-ops.

**Data source:** `riskStore.status.kill_switch`

### DrawdownChart

**Chart type:** ECharts area chart. Y-axis: negative percentage (0% to -20%). X-axis: time.

**Visual elements:**
- Red filled area (`rgba(error, 0.3)`) with red border line.
- Dashed threshold lines: `max_threshold` (red, "HALT"), `reduce_threshold` (orange, "REDUCE").
- Current drawdown value annotated with a dot on the curve.
- Header shows current drawdown percentage with trend arrow and peak equity value.

**Data accumulation:**
- The `risk` WS channel pushes event alerts (BLOCKED/HALT), not continuous drawdown values.
- Drawdown data comes from `GET /risk/status` only.
- Poll `fetchStatus()` every 5s while page is active, append `drawdown.current_pct` to local `drawdownHistory` array on each poll.
- Store maintains `drawdownHistory: Array<{ time: number; value: number }>` in `riskStore`.
- Time range selector: Session (default) / 1H / 24H / All.

**Props:** `drawdown` (from status), `history` (drawdownHistory array)

### ExposureTable

**Layout:** Top summary bar (total exposure / max) + progress bar + symbol-level table rows.

**Total exposure bar:** Progress bar represents `total_pct / max_total_pct`. Color-coded relative to max: green (<50%), orange (50-75%), red (>75%).

**Per-row data:** symbol, exchange, side, value, pct_of_equity, mini progress bar (share of total exposure).

**Interactions:**
- Sortable by value or pct_of_equity.
- Rows exceeding `max_single_asset_pct` highlighted with warning color.
- Bottom summary: position count, total value, total percentage.

**Data source:** `riskStore.exposure`

**Props:** `exposure` (ExposureData)

### RiskConfigCards

**Layout:** Key-value card grid showing all config fields.

**Fields displayed:** sizing_model, max_position_size_pct, max_risk_per_trade_pct, max_open_positions, max_total_exposure_pct, max_single_asset_pct, position_reduce_at_pct, max_drawdown_pct, allow_pyramiding, kill_switch_enabled, max_correlated_exposure_pct.

**Styling:** Critical thresholds (max_drawdown, reduce_at) highlighted in warning colors. Read-only.

**Data source:** `riskStore.config`

### RiskEventsTable

**Layout:** Table with columns: Time, Type, Level, Target, Reason. Expandable rows for metadata.

**Pagination:** Server-side via `limit` and `offset` query params. Default 20 per page.

**Color coding:** `HALT`/`BLOCKED` events red background, `WARNING` orange, others default.

**Real-time:** WS `risk` channel messages prepended to top of list with highlight animation.

**Data source:** `riskStore.events` (with `total` count for pagination)

## Page Layout

```
┌──────────────────────────────────────────────────┐
│  KillSwitchBar (full width)                       │
├───────────────────────┬──────────────────────────┤
│  DrawdownChart        │  ExposureTable            │
│  (ECharts area)       │  (table + progress bars)  │
├───────────────────────┼──────────────────────────┤
│  RiskConfigCards      │  RiskEventsTable           │
│  (summary grid)       │  (paginated audit log)    │
└───────────────────────┴──────────────────────────┘
```

CSS Grid: `grid-template-columns: 1fr 1fr`, `grid-template-rows: auto 1fr 1fr`. Responsive: stacks vertically on narrow screens.

## Store Design — `src/stores/risk.ts`

**State:**
- `status`: Risk status object (kill_switch, drawdown, exposure summary, positions, config) | null
- `exposure`: Exposure breakdown (total, by_symbol) | null
- `events`: Risk event array
- `eventsTotal`: number
- `config`: Risk config object | null
- `drawdownHistory`: Array<{ time: number; value: number }>
- `loading`: boolean
- `error`: string | null

**Actions:**
- `fetchAll()` — fetch status, exposure, events, config in parallel
- `fetchStatus()` — GET /risk/status
- `fetchExposure()` — GET /risk/exposure
- `fetchEvents(limit, offset)` — GET /risk/events
- `fetchConfig()` — GET /risk/config
- `postKillSwitch(payload)` — POST /risk/kill-switch with optimistic concurrency (`expected_state`) and replay protection (`idempotency_key`), then refresh status and exposure
- `updateFromWS(data)` — normalize and upsert the event by `event_id`, refresh status/exposure, append to page 1 without duplicates

## TypeScript Types

```typescript
interface KillSwitchState {
  global: { active: boolean; reason: string }
  symbols: Record<string, string>
  strategies: Record<string, string>
}

interface DrawdownData {
  current_pct: number
  peak_equity: number
  max_threshold: number
  reduce_threshold: number
  size_scale: number
}

interface ExposureData {
  total_exposure: number
  total_pct: number
  max_total_pct: number
  by_symbol: Record<string, SymbolExposure>
}

interface SymbolExposure {
  symbol: string
  exchange: string
  side: string
  quantity: number
  value: number
  pct_of_equity: number
}

interface RiskEvent {
  event_id: string
  time: string
  event_type: string
  level: string
  target: string
  reason: string
  metadata: Record<string, unknown>
}

interface RiskConfig {
  sizing_model: string
  max_position_size_pct: number
  max_risk_per_trade_pct: number
  max_open_positions: number
  max_total_exposure_pct: number
  max_single_asset_pct: number
  position_reduce_at_pct: number
  max_drawdown_pct: number
  allow_pyramiding: boolean
  kill_switch_enabled: boolean
  max_correlated_exposure_pct: number
}

interface KillSwitchPayload {
  level: 'GLOBAL' | 'SYMBOL' | 'STRATEGY'
  target?: string
  reason: string
  activate: boolean
  expected_state: {
    active: boolean
    version?: string | number
  }
  idempotency_key: string
}
```

`RiskEvent.event_id` is the stable audit identity used to merge REST pages and websocket pushes idempotently. If the backend omits it, the dashboard falls back to `time:event_type:level:target:reason`, so repeated deliveries of the same event still collapse into one row.

## Integration Points

1. **Router:** Add `{ path: '/risk', name: 'Risk', component: () => import('@/views/RiskView.vue') }` before `/positions`.
2. **SideMenu:** Add Risk menu item with `SafetyOutlined` icon, between Dashboard and Positions.
3. **AppLayout:** Add `Risk: 'Risk Center'` to `pageTitle` map.
4. **App.vue:** Add `risk` to WS subscribe channels, add `case 'risk':` in message handler.
5. **WSChannel type:** Add `'risk'` to union type.

## Out of Scope

- KillSwitch per-symbol/per-strategy UI controls (only display, no direct activate per symbol from v1)
- Risk config editing (read-only)
- Historical drawdown data from server (accumulated client-side only)
- Alert notifications (toast/push) for risk events

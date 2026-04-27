# Risk Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/risk` page with real-time risk monitoring, KillSwitch control, drawdown chart, exposure table, risk config, and event audit trail.

**Architecture:** New Pinia store + API module for risk data, 5 child components under `src/components/risk/`, one page view, wired into existing router/sidebar/WS infrastructure. WebSocket-first with 5s HTTP polling fallback for drawdown accumulation.

**Tech Stack:** Vue 3 Composition API, Pinia, Ant Design Vue, ECharts (vue-echarts), TypeScript, existing CSS variable theme system.

**Spec:** `docs/superpowers/specs/2026-04-13-risk-center-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/api/risk.ts` | HTTP client for 5 risk endpoints |
| Create | `src/stores/risk.ts` | Pinia store: status, exposure, events, config, drawdown history |
| Create | `src/views/RiskView.vue` | Page shell: 2x2 grid, polling, loading state |
| Create | `src/components/risk/KillSwitchBar.vue` | KillSwitch status display + activate/deactivate buttons |
| Create | `src/components/risk/DrawdownChart.vue` | ECharts area chart for drawdown over time |
| Create | `src/components/risk/ExposureTable.vue` | Symbol-level exposure with progress bars |
| Create | `src/components/risk/RiskConfigCards.vue` | Read-only config key-value grid |
| Create | `src/components/risk/RiskEventsTable.vue` | Paginated audit log with color-coded rows |
| Modify | `src/types/index.ts` | Add risk types + update WSChannel union |
| Modify | `src/router/index.ts` | Add `/risk` route |
| Modify | `src/components/layout/SideMenu.vue` | Add Risk menu item |
| Modify | `src/components/layout/AppLayout.vue` | Add Risk page subtitle |
| Modify | `src/App.vue` | Subscribe to `risk` WS channel + handler |

---

### Task 1: TypeScript types + WSChannel update

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add risk types to `src/types/index.ts`**

Append after the `// ── Paper Trading` section at the end of the file:

```typescript
// ── Risk ───────────────────────────────────────────────────────────
export interface KillSwitchState {
  global: { active: boolean; reason: string };
  symbols: Record<string, string>;
  strategies: Record<string, string>;
}

export interface DrawdownData {
  current_pct: number;
  peak_equity: number;
  max_threshold: number;
  reduce_threshold: number;
  size_scale: number;
}

export interface ExposureData {
  total_exposure: number;
  total_pct: number;
  max_total_pct: number;
  by_symbol: Record<string, SymbolExposure>;
}

export interface SymbolExposure {
  symbol: string;
  exchange: string;
  side: string;
  quantity: number;
  value: number;
  pct_of_equity: number;
}

export interface RiskStatus {
  kill_switch: KillSwitchState;
  drawdown: DrawdownData;
  exposure: { total_pct: number; max_total_pct: number };
  positions: Array<{
    symbol: string;
    exchange: string;
    side: string;
    quantity: string;
    entry_price: string;
    value: string;
  }>;
  config: {
    sizing_model: string;
    max_open_positions: number;
    allow_pyramiding: boolean;
    kill_switch_enabled: boolean;
  };
}

export interface RiskEvent {
  event_id: string;
  time: string;
  event_type: string;
  level: string;
  target: string;
  reason: string;
  metadata: Record<string, unknown>;
}

export interface RiskEventsResponse {
  events: RiskEvent[];
  total: number;
}

export interface RiskConfig {
  sizing_model: string;
  max_position_size_pct: number;
  max_risk_per_trade_pct: number;
  max_open_positions: number;
  max_total_exposure_pct: number;
  max_single_asset_pct: number;
  position_reduce_at_pct: number;
  max_drawdown_pct: number;
  allow_pyramiding: boolean;
  kill_switch_enabled: boolean;
  max_correlated_exposure_pct: number;
}

export interface KillSwitchPayload {
  level: 'GLOBAL' | 'SYMBOL' | 'STRATEGY';
  target?: string;
  reason?: string;
  activate: boolean;
}

export interface DrawdownPoint {
  time: number;
  value: number;
}
```

- [ ] **Step 2: Update WSChannel union to include `risk`**

Change the `WSChannel` type from:
```typescript
export type WSChannel = 'trades' | 'positions' | 'orders' | 'pnl' | 'system';
```
to:
```typescript
export type WSChannel = 'trades' | 'positions' | 'orders' | 'pnl' | 'system' | 'risk';
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No errors related to the new types (other pre-existing errors are fine).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add risk-related TypeScript types and WS channel"
```

---

### Task 2: API client module

**Files:**
- Create: `src/api/risk.ts`

- [ ] **Step 1: Create `src/api/risk.ts`**

```typescript
import apiClient from './client';
import type { RiskStatus, ExposureData, RiskEventsResponse, RiskConfig, KillSwitchPayload } from '@/types';

export const riskApi = {
  getStatus: () =>
    apiClient.get<RiskStatus>('/risk/status').then((r) => r.data),

  getExposure: () =>
    apiClient.get<ExposureData>('/risk/exposure').then((r) => r.data),

  getEvents: (limit = 20, offset = 0) =>
    apiClient.get<RiskEventsResponse>('/risk/events', { params: { limit, offset } }).then((r) => r.data),

  getConfig: () =>
    apiClient.get<RiskConfig>('/risk/config').then((r) => r.data),

  postKillSwitch: (payload: KillSwitchPayload) =>
    apiClient.post('/risk/kill-switch', payload).then((r) => r.data),
};
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/risk.ts
git commit -m "feat: add risk API client module"
```

---

### Task 3: Pinia store

**Files:**
- Create: `src/stores/risk.ts`

- [ ] **Step 1: Create `src/stores/risk.ts`**

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { riskApi } from '@/api/risk';
import type { RiskStatus, ExposureData, RiskEvent, RiskConfig, DrawdownPoint } from '@/types';

export const useRiskStore = defineStore('risk', () => {
  const status = ref<RiskStatus | null>(null);
  const exposure = ref<ExposureData | null>(null);
  const events = ref<RiskEvent[]>([]);
  const eventsTotal = ref(0);
  const config = ref<RiskConfig | null>(null);
  const drawdownHistory = ref<DrawdownPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let refreshInFlight: Promise<void> | null = null;
  let refreshQueued = false;

  function eventTime(payload: Record<string, unknown>): string {
    if (typeof payload.time === 'string' && payload.time.length > 0) return payload.time;
    if (typeof payload.timestamp === 'string' && payload.timestamp.length > 0) return payload.timestamp;
    return '';
  }

  function stableStringify(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    if (!value || typeof value !== 'object') return JSON.stringify(value);
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }

  function buildEventId(payload: Record<string, unknown>) {
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata as Record<string, unknown> : null;
    const rawEventId = payload.event_id ?? payload.id ?? metadata?.event_id ?? metadata?.id;
    if (rawEventId !== undefined && String(rawEventId).length > 0) return String(rawEventId);

    const time = eventTime(payload);
    if (time.length > 0) {
      return [
        time,
        String(payload.event_type ?? payload.action ?? ''),
        String(payload.level ?? ''),
        String(payload.target ?? ''),
        String(payload.reason ?? ''),
      ].join(':');
    }

    return [
      String(payload.event_type ?? payload.action ?? ''),
      String(payload.level ?? ''),
      String(payload.target ?? ''),
      String(payload.reason ?? ''),
      stableStringify(metadata ?? payload),
    ].join(':');
  }

  async function fetchStatus() {
    try {
      const data = await riskApi.getStatus();
      status.value = data;
      return data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      return null;
    }
  }

  async function fetchExposure() {
    try {
      exposure.value = await riskApi.getExposure();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchEvents(limit = 20, offset = 0) {
    try {
      const data = await riskApi.getEvents(limit, offset);
      events.value = data.events;
      eventsTotal.value = data.total;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchConfig() {
    try {
      config.value = await riskApi.getConfig();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchAll() {
    loading.value = true;
    await Promise.all([fetchStatus(), fetchExposure(), fetchEvents(), fetchConfig()]);
    loading.value = false;
  }

  async function postKillSwitch(payload: { level: 'GLOBAL' | 'SYMBOL' | 'STRATEGY'; target?: string; reason?: string; activate: boolean }) {
    try {
      await riskApi.postKillSwitch(payload);
      await fetchStatus();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  function refreshRealtimeState() {
    if (refreshInFlight) {
      refreshQueued = true;
      return;
    }

    refreshInFlight = (async () => {
      do {
        refreshQueued = false;
        await Promise.all([fetchStatus(), fetchExposure()]);
      } while (refreshQueued);
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  function updateFromWS(data: Record<string, unknown>, serverTimestamp?: string) {
    const existed = events.value.some((event) => event.event_id === buildEventId(data));
    const wsEvent: RiskEvent = {
      event_id: buildEventId(data),
      time: eventTime(data),
      received_at: serverTimestamp,
      event_type: String(data.event_type || data.action || ''),
      level: String(data.level || ''),
      target: String(data.target || ''),
      reason: String(data.reason || ''),
      metadata: data,
    };
    events.value = [wsEvent, ...events.value.filter((event) => event.event_id !== wsEvent.event_id)];
    if (!existed) {
      eventsTotal.value += 1;
    }
    refreshRealtimeState();
  }

  async function sampleDrawdown() {
    const latestStatus = await fetchStatus();
    const previous = drawdownHistory.value.at(-1);
    const nextValue = latestStatus?.drawdown.current_pct;

    if (nextValue === undefined) return;
    if (previous && previous.value === nextValue && Date.now() - previous.time < 15000) return;

    drawdownHistory.value = [
      ...drawdownHistory.value,
      { time: Date.now(), value: nextValue },
    ].slice(-600);
  }

  return {
    status,
    exposure,
    events,
    eventsTotal,
    config,
    drawdownHistory,
    loading,
    error,
    fetchStatus,
    fetchExposure,
    fetchEvents,
    fetchConfig,
    fetchAll,
    postKillSwitch,
    sampleDrawdown,
    updateFromWS,
  };
});
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/stores/risk.ts
git commit -m "feat: add risk Pinia store with WS handler and drawdown accumulation"
```

---

### Task 4: Router + Sidebar + AppLayout integration

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/components/layout/SideMenu.vue`
- Modify: `src/components/layout/AppLayout.vue`

- [ ] **Step 1: Add `/risk` route in `src/router/index.ts`**

Insert a new route after the Dashboard route (line 6), before `/positions`:

```typescript
{ path: '/risk', name: 'Risk', component: () => import('@/views/RiskView.vue') },
```

The routes array should look like:
```typescript
routes: [
  { path: '/', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/risk', name: 'Risk', component: () => import('@/views/RiskView.vue') },
  { path: '/positions', name: 'Positions', component: () => import('@/views/PositionsView.vue') },
  { path: '/orders', name: 'Orders', component: () => import('@/views/OrdersView.vue') },
  { path: '/strategies', name: 'Strategies', component: () => import('@/views/StrategiesView.vue') },
  { path: '/backtest', name: 'Backtest', component: () => import('@/views/BacktestView.vue') },
  { path: '/system', name: 'System', component: () => import('@/views/SystemView.vue') },
],
```

- [ ] **Step 2: Add Risk menu item in `src/components/layout/SideMenu.vue`**

Add the `SafetyOutlined` icon import. Change the imports from:
```typescript
import {
  DashboardOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  SettingOutlined,
  PieChartOutlined,
} from '@ant-design/icons-vue';
```
to:
```typescript
import {
  DashboardOutlined,
  SafetyOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  SettingOutlined,
  PieChartOutlined,
} from '@ant-design/icons-vue';
```

Insert the Risk menu item after Dashboard in the `menuItems` array:
```typescript
const menuItems = [
  { path: '/', label: 'Dashboard', icon: DashboardOutlined },
  { path: '/risk', label: 'Risk', icon: SafetyOutlined },
  { path: '/positions', label: 'Positions', icon: PieChartOutlined },
  { path: '/orders', label: 'Orders', icon: SwapOutlined },
  { path: '/strategies', label: 'Strategies', icon: ThunderboltOutlined },
  { path: '/backtest', label: 'Backtest', icon: LineChartOutlined },
  { path: '/system', label: 'System', icon: SettingOutlined },
];
```

- [ ] **Step 3: Add Risk page title in `src/components/layout/AppLayout.vue`**

Add `Risk: 'Real-time risk monitoring and control'` to the `pageTitle` object:
```typescript
const pageTitle: Record<string, string> = {
  Dashboard: 'Overview of key metrics',
  Risk: 'Real-time risk monitoring and control',
  Positions: 'Open positions and P&L',
  Orders: 'Place and manage orders',
  Strategies: 'Manage trading strategies',
  Backtest: 'Run and review backtests',
  System: 'System health and configuration',
};
```

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors (RiskView doesn't exist yet, so there may be a lazy-load warning but no type error).

- [ ] **Step 5: Commit**

```bash
git add src/router/index.ts src/components/layout/SideMenu.vue src/components/layout/AppLayout.vue
git commit -m "feat: add Risk route, sidebar menu item, and page title"
```

---

### Task 5: App.vue WebSocket integration

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Add risk store import and WS handler**

Add the risk store import after the existing store imports (line 11):

```typescript
import { useRiskStore } from '@/stores/risk';
```

Inside the `onMounted` callback, add the risk store initialization after `ordersStore` (line 28):

```typescript
const riskStore = useRiskStore();
```

Add a `case 'risk':` in the `ws.onMessage` switch (before the closing brace of the switch):

```typescript
      case 'risk':
        riskStore.updateFromWS(msg.data as Record<string, unknown>, msg.timestamp);
        break;
```

Add `'risk'` to the `ws.subscribe` array:

```typescript
ws.subscribe(['orders', 'positions', 'pnl', 'system', 'trades', 'risk']);
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat: subscribe to risk WS channel and wire handler"
```

---

### Task 6: KillSwitchBar component

**Files:**
- Create: `src/components/risk/KillSwitchBar.vue`

- [ ] **Step 1: Create `src/components/risk/KillSwitchBar.vue`**

```vue
<template>
  <div class="killswitch-bar" :class="{ active: isActive }">
    <div class="ks-main">
      <div class="ks-left">
        <span class="ks-indicator" :class="{ on: isActive }"></span>
        <span class="ks-label">
          {{ isActive ? 'GLOBAL KILL SWITCH ACTIVE' : 'Kill Switch Inactive' }}
        </span>
        <span v-if="isActive && reason" class="ks-reason">{{ reason }}</span>
      </div>
      <div class="ks-right">
        <a-popconfirm
          v-if="isActive"
          title="Confirm deactivation? Trading will resume."
          ok-text="Deactivate"
          cancel-text="Cancel"
          @confirm="onToggle(false)"
        >
          <a-button danger>DEACTIVATE</a-button>
        </a-popconfirm>
        <a-popconfirm
          v-else
          title="Confirm global KillSwitch? All trading will halt."
          ok-text="Activate"
          cancel-text="Cancel"
          @confirm="onToggle(true)"
        >
          <a-button class="btn-activate">ACTIVATE GLOBAL</a-button>
        </a-popconfirm>
      </div>
    </div>
    <div v-if="symbolKills.length || strategyKills.length" class="ks-details">
      <div v-for="(reason, symbol) in killSwitch.symbols" :key="'s-' + symbol" class="ks-detail-row">
        <a-tag color="orange">Symbol: {{ symbol }}</a-tag>
        <span class="ks-detail-reason">{{ reason }}</span>
      </div>
      <div v-for="(reason, strategy) in killSwitch.strategies" :key="'st-' + strategy" class="ks-detail-row">
        <a-tag color="orange">Strategy: {{ strategy }}</a-tag>
        <span class="ks-detail-reason">{{ reason }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { KillSwitchState } from '@/types';

const props = defineProps<{
  killSwitch: KillSwitchState;
}>();

const emit = defineEmits<{
  toggle: [activate: boolean];
}>();

const isActive = computed(() => props.killSwitch?.global?.active ?? false);
const reason = computed(() => props.killSwitch?.global?.reason ?? '');
const symbolKills = computed(() => Object.entries(props.killSwitch?.symbols ?? {}));
const strategyKills = computed(() => Object.entries(props.killSwitch?.strategies ?? {}));

function onToggle(activate: boolean) {
  emit('toggle', activate);
}
</script>

<style scoped>
.killswitch-bar {
  background: var(--q-bg-secondary, #f8fafc);
  border: 1px solid var(--q-border);
  border-radius: var(--q-card-radius);
  padding: 14px 20px;
  margin-bottom: var(--q-card-gap);
}

.killswitch-bar.active {
  background: rgba(239, 68, 68, 0.08);
  border-color: var(--q-error);
  animation: pulse-bg 2s ease-in-out infinite;
}

@keyframes pulse-bg {
  0%, 100% { background: rgba(239, 68, 68, 0.08); }
  50% { background: rgba(239, 68, 68, 0.16); }
}

.ks-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ks-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ks-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--q-text-muted);
  flex-shrink: 0;
}

.ks-indicator.on {
  background: var(--q-error);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.ks-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.killswitch-bar.active .ks-label {
  color: var(--q-error);
}

.ks-reason {
  font-size: 12px;
  color: var(--q-text-secondary);
}

.btn-activate {
  border-color: var(--q-error) !important;
  color: var(--q-error) !important;
}

.btn-activate:hover {
  background: var(--q-error) !important;
  color: #fff !important;
}

.ks-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ks-detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ks-detail-reason {
  font-size: 12px;
  color: var(--q-text-secondary);
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/risk/KillSwitchBar.vue
git commit -m "feat: add KillSwitchBar component with activate/deactivate"
```

---

### Task 7: DrawdownChart component

**Files:**
- Create: `src/components/risk/DrawdownChart.vue`

- [ ] **Step 1: Create `src/components/risk/DrawdownChart.vue`**

```vue
<template>
  <div class="chart-card">
    <div class="chart-card-header">
      <div class="chart-header-left">
        <span class="chart-title">Drawdown</span>
        <span class="chart-value" :class="drawdownValue > 5 ? 'value-warn' : 'value-ok'">
          {{ drawdownValue.toFixed(1) }}%
          <span class="trend-arrow">{{ drawdownValue > 0 ? '↓' : '—' }}</span>
        </span>
      </div>
      <div class="chart-header-right">
        <span class="chart-meta">Peak: ${{ formatNum(drawdown?.peak_equity) }}</span>
      </div>
    </div>
    <v-chart
      v-if="history.length > 1"
      :option="chartOption"
      style="height: 220px; width: 100%"
      autoresize
    />
    <div v-else class="chart-empty">Collecting drawdown data...</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';
import { CHART_GRID, CHART_TOOLTIP } from '@/utils/chart-theme';
import type { DrawdownData, DrawdownPoint } from '@/types';

use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

const props = defineProps<{
  drawdown: DrawdownData | null | undefined;
  history: DrawdownPoint[];
}>();

const drawdownValue = computed(() => props.drawdown?.current_pct ?? 0);

function formatNum(v: number | undefined | null): string {
  if (v == null) return '—';
  return Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const chartOption = computed(() => {
  const times = props.history.map((p) => {
    const d = new Date(p.time);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const values = props.history.map((p) => -p.value);

  const markLines: Array<{ yAxis: number; lineStyle: Record<string, unknown>; label: Record<string, unknown> }> = [];
  if (props.drawdown?.max_threshold) {
    markLines.push({
      yAxis: -props.drawdown.max_threshold,
      lineStyle: { color: '#ef4444', type: 'dashed' as const, width: 1.5 },
      label: { formatter: 'HALT', color: '#ef4444', fontSize: 10, position: 'insideEndTop' as const },
    });
  }
  if (props.drawdown?.reduce_threshold) {
    markLines.push({
      yAxis: -props.drawdown.reduce_threshold,
      lineStyle: { color: '#f59e0b', type: 'dashed' as const, width: 1.5 },
      label: { formatter: 'REDUCE', color: '#f59e0b', fontSize: 10, position: 'insideEndTop' as const },
    });
  }

  return {
    tooltip: { ...CHART_TOOLTIP, valueFormatter: (v: number) => `${v.toFixed(2)}%` },
    grid: CHART_GRID,
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: times,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
    },
    series: [{
      name: 'Drawdown',
      type: 'line' as const,
      smooth: true,
      symbol: 'none' as const,
      data: values,
      lineStyle: { color: '#ef4444', width: 2 },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(239, 68, 68, 0.25)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: 'none' as const,
        data: markLines,
      },
    }],
  };
});
</script>

<style scoped>
.chart-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.chart-value {
  font-size: 18px;
  font-weight: 700;
}

.value-ok {
  color: var(--q-success);
}

.value-warn {
  color: var(--q-error);
}

.trend-arrow {
  font-size: 14px;
}

.chart-header-right {
  display: flex;
  gap: 12px;
}

.chart-meta {
  font-size: 11px;
  color: var(--q-text-muted);
}

.chart-empty {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/risk/DrawdownChart.vue
git commit -m "feat: add DrawdownChart component with ECharts area chart"
```

---

### Task 8: ExposureTable component

**Files:**
- Create: `src/components/risk/ExposureTable.vue`

- [ ] **Step 1: Create `src/components/risk/ExposureTable.vue`**

```vue
<template>
  <div class="exposure-card">
    <div class="exposure-header">
      <div class="exposure-header-left">
        <span class="exposure-title">Exposure</span>
        <span class="exposure-summary">
          {{ exposurePct.toFixed(1) }}% / {{ maxPct.toFixed(0) }}% max
        </span>
      </div>
    </div>
    <div class="exposure-bar-wrap">
      <div class="exposure-bar-bg">
        <div
          class="exposure-bar-fill"
          :style="{ width: barPct + '%', background: barColor }"
        ></div>
      </div>
    </div>

    <a-table
      v-if="rows.length > 0"
      :columns="columns"
      :data-source="rows"
      :pagination="false"
      size="small"
      row-key="key"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'value'">
          ${{ record.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
        </template>
        <template v-if="column.key === 'pct'">
          <div class="pct-cell">
            <span :class="{ 'pct-warn': record.overLimit }">{{ record.pctOfEquity.toFixed(1) }}%</span>
            <div class="mini-bar-bg">
              <div class="mini-bar-fill" :style="{ width: record.sharePct + '%' }"></div>
            </div>
          </div>
        </template>
      </template>
    </a-table>

    <div v-if="rows.length > 0" class="exposure-footer">
      {{ rows.length }} position{{ rows.length !== 1 ? 's' : '' }}
      &middot; Total: ${{ exposure.total_exposure?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0' }}
      &middot; {{ exposurePct.toFixed(1) }}%
    </div>
    <div v-else class="exposure-empty">No open positions</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ExposureData, RiskConfig } from '@/types';

const props = defineProps<{
  exposure: ExposureData;
  config: RiskConfig | null;
}>();

const maxPct = computed(() => props.exposure?.max_total_pct ?? 100);
const exposurePct = computed(() => props.exposure?.total_pct ?? 0);
const barPct = computed(() => {
  if (!maxPct.value) return 0;
  return Math.min((exposurePct.value / maxPct.value) * 100, 100);
});
const barColor = computed(() => {
  const ratio = barPct.value;
  if (ratio > 75) return 'var(--q-error)';
  if (ratio > 50) return 'var(--q-warning)';
  return 'var(--q-success)';
});

const columns = [
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
  { title: 'Side', dataIndex: 'side', key: 'side' },
  { title: 'Value', key: 'value' },
  { title: '% Equity', key: 'pct' },
];

const rows = computed(() => {
  if (!props.exposure?.by_symbol) return [];
  const totalValue = props.exposure.total_exposure || 1;
  const singleLimit = props.config?.max_single_asset_pct ?? Infinity;
  return Object.entries(props.exposure.by_symbol).map(([key, s]) => ({
    key,
    symbol: s.symbol + ' / ' + s.exchange,
    side: s.side,
    value: s.value,
    pctOfEquity: s.pct_of_equity,
    sharePct: totalValue > 0 ? (s.value / totalValue) * 100 : 0,
    overLimit: s.pct_of_equity > singleLimit,
  }));
});
</script>

<style scoped>
.exposure-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.exposure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.exposure-header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.exposure-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.exposure-summary {
  font-size: 12px;
  color: var(--q-text-secondary);
}

.exposure-bar-wrap {
  margin-bottom: 16px;
}

.exposure-bar-bg {
  height: 6px;
  background: var(--q-bg);
  border-radius: 3px;
  overflow: hidden;
}

.exposure-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.pct-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pct-warn {
  color: var(--q-error);
  font-weight: 600;
}

.mini-bar-bg {
  width: 60px;
  height: 4px;
  background: var(--q-bg);
  border-radius: 2px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  background: var(--q-primary);
  border-radius: 2px;
  opacity: 0.5;
}

.exposure-footer {
  margin-top: 8px;
  font-size: 11px;
  color: var(--q-text-muted);
  text-align: center;
}

.exposure-empty {
  padding: 20px;
  text-align: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/risk/ExposureTable.vue
git commit -m "feat: add ExposureTable component with progress bars"
```

---

### Task 9: RiskConfigCards component

**Files:**
- Create: `src/components/risk/RiskConfigCards.vue`

- [ ] **Step 1: Create `src/components/risk/RiskConfigCards.vue`**

```vue
<template>
  <div class="config-card">
    <div class="config-title">Risk Configuration</div>
    <div class="config-grid">
      <div
        v-for="item in configItems"
        :key="item.label"
        class="config-item"
        :class="{ 'config-warn': item.warn }"
      >
        <span class="config-label">{{ item.label }}</span>
        <span class="config-value">{{ item.display }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RiskConfig } from '@/types';

const props = defineProps<{
  config: RiskConfig | null;
}>();

const configItems = computed(() => {
  const c = props.config;
  if (!c) return [];
  return [
    { label: 'Sizing Model', display: c.sizing_model, warn: false },
    { label: 'Max Positions', display: String(c.max_open_positions), warn: false },
    { label: 'Max Exposure', display: c.max_total_exposure_pct + '%', warn: false },
    { label: 'Per-Trade Risk', display: c.max_risk_per_trade_pct + '%', warn: false },
    { label: 'Max Drawdown', display: c.max_drawdown_pct + '%', warn: true },
    { label: 'Reduce at', display: c.position_reduce_at_pct + '%', warn: true },
    { label: 'Single Asset', display: c.max_single_asset_pct + '%', warn: false },
    { label: 'Correlated', display: c.max_correlated_exposure_pct + '%', warn: false },
    { label: 'Pyramiding', display: c.allow_pyramiding ? 'Enabled' : 'Disabled', warn: false },
    { label: 'Kill Switch', display: c.kill_switch_enabled ? 'Enabled' : 'Disabled', warn: false },
  ];
});
</script>

<style scoped>
.config-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.config-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 16px;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--q-bg);
  border-radius: 6px;
  border-left: 3px solid transparent;
}

.config-item.config-warn {
  border-left-color: var(--q-warning);
}

.config-label {
  font-size: 11px;
  color: var(--q-text-muted);
  font-weight: 500;
}

.config-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.config-warn .config-value {
  color: var(--q-warning);
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/risk/RiskConfigCards.vue
git commit -m "feat: add RiskConfigCards component"
```

---

### Task 10: RiskEventsTable component

**Files:**
- Create: `src/components/risk/RiskEventsTable.vue`

- [ ] **Step 1: Create `src/components/risk/RiskEventsTable.vue`**

```vue
<template>
  <div class="events-card">
    <div class="events-header">
      <span class="events-title">Risk Events</span>
      <a-button size="small" @click="$emit('refresh')">Refresh</a-button>
    </div>

    <a-table
      v-if="events.length > 0"
      :columns="columns"
      :data-source="events"
      :pagination="pagination"
      size="small"
      row-key="event_id"
      :row-class-name="rowClass"
      @expand="onExpand"
    >
      <template #expandedRowRender="{ record }">
        <pre class="event-meta">{{ formatMeta(record.metadata) }}</pre>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'time'">
          {{ formatTime(record.time) }}
        </template>
        <template v-if="column.key === 'event_type'">
          <a-tag :color="typeColor(record.event_type)">{{ record.event_type }}</a-tag>
        </template>
        <template v-if="column.key === 'level'">
          {{ record.level }}{{ record.target && record.target !== record.level ? ': ' + record.target : '' }}
        </template>
      </template>
    </a-table>

    <div v-else class="events-empty">No risk events</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RiskEvent } from '@/types';

const props = defineProps<{
  events: RiskEvent[];
  total: number;
  pageSize?: number;
}>();

const emit = defineEmits<{
  refresh: [];
  'page-change': [page: number];
}>();

const currentPage = computed(() => props.pageSize ?? 20);

const pagination = computed(() => ({
  pageSize: currentPage.value,
  total: props.total,
  simple: true,
  onChange: (page: number) => emit('page-change', page),
}));

const columns = [
  { title: 'Time', key: 'time', width: 80 },
  { title: 'Type', key: 'event_type', width: 140 },
  { title: 'Level', key: 'level', width: 120 },
  { title: 'Reason', dataIndex: 'reason', key: 'reason' },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function typeColor(type: string): string {
  if (type.includes('HALT') || type.includes('BLOCKED')) return 'red';
  if (type.includes('WARNING') || type.includes('WARN')) return 'orange';
  return 'blue';
}

function rowClass(record: RiskEvent): string {
  if (record.event_type.includes('HALT') || record.event_type.includes('BLOCKED')) return 'row-critical';
  if (record.event_type.includes('WARNING') || record.event_type.includes('WARN')) return 'row-warning';
  return '';
}

function formatMeta(meta: Record<string, unknown>): string {
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return '{}';
  }
}

function onExpand() {
  /* Ant Design expand callback */
}
</script>

<style scoped>
.events-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.events-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.events-empty {
  padding: 20px;
  text-align: center;
  color: var(--q-text-muted);
  font-size: 13px;
}

.event-meta {
  font-size: 11px;
  color: var(--q-text-secondary);
  background: var(--q-bg);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0;
  max-height: 120px;
  overflow-y: auto;
}
</style>

<style>
/* Unscoped for Ant Design row class overrides */
.row-critical td {
  background: rgba(239, 68, 68, 0.06) !important;
}

.row-warning td {
  background: rgba(245, 158, 11, 0.06) !important;
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/risk/RiskEventsTable.vue
git commit -m "feat: add RiskEventsTable component with pagination and color coding"
```

---

### Task 11: RiskView page component

**Files:**
- Create: `src/views/RiskView.vue`

- [ ] **Step 1: Create `src/views/RiskView.vue`**

```vue
<template>
  <div class="risk-page">
    <a-spin :spinning="riskStore.loading">
      <KillSwitchBar
        v-if="riskStore.status?.kill_switch"
        :kill-switch="riskStore.status.kill_switch"
        @toggle="onKillSwitchToggle"
      />
      <div v-else class="ks-placeholder">Loading risk status...</div>
    </a-spin>

    <div class="risk-grid">
      <DrawdownChart
        :drawdown="riskStore.status?.drawdown"
        :history="riskStore.drawdownHistory"
        class="risk-cell"
      />
      <ExposureTable
        :exposure="riskStore.exposure"
        :config="riskStore.config"
        class="risk-cell"
      />
      <RiskConfigCards
        :config="riskStore.config"
        class="risk-cell"
      />
      <RiskEventsTable
        :events="riskStore.events"
        :total="riskStore.eventsTotal"
        @refresh="onRefreshEvents"
        @page-change="onPageChange"
        class="risk-cell"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { useRiskStore } from '@/stores/risk';
import KillSwitchBar from '@/components/risk/KillSwitchBar.vue';
import DrawdownChart from '@/components/risk/DrawdownChart.vue';
import ExposureTable from '@/components/risk/ExposureTable.vue';
import RiskConfigCards from '@/components/risk/RiskConfigCards.vue';
import RiskEventsTable from '@/components/risk/RiskEventsTable.vue';

const riskStore = useRiskStore();
const wsConnected = inject<Ref<boolean>>('wsConnected', ref(false));

let pollTimer: ReturnType<typeof setInterval> | null = null;

function startPolling() {
  if (pollTimer) return;
  riskStore.sampleDrawdown();
  pollTimer = setInterval(() => riskStore.sampleDrawdown(), 5000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function onKillSwitchToggle(activate: boolean) {
  await riskStore.postKillSwitch({
    level: 'GLOBAL',
    activate,
    reason: activate ? 'Manual activation via dashboard' : 'Manual deactivation via dashboard',
  });
}

async function onRefreshEvents() {
  await riskStore.fetchEvents();
}

async function onPageChange(page: number) {
  const offset = (page - 1) * 20;
  await riskStore.fetchEvents(20, offset);
}

// Poll drawdown data continuously (drawdown not pushed via WS)
watch(wsConnected, () => {
  // Always poll drawdown regardless of WS state
});

onMounted(async () => {
  await riskStore.fetchAll();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.risk-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.ks-placeholder {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: 14px 20px;
  color: var(--q-text-muted);
  font-size: 13px;
  margin-bottom: var(--q-card-gap);
}

.risk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: var(--q-card-gap);
}

.risk-cell {
  min-width: 0;
}

@media (max-width: 900px) {
  .risk-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Run dev server and manually verify**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npm run dev`
Expected: Dev server starts on port 3001. Navigate to `http://localhost:3001/risk`. The page should render (with empty/loading states if backend is not running).

- [ ] **Step 4: Commit**

```bash
git add src/views/RiskView.vue
git commit -m "feat: add RiskView page with 2x2 grid layout and polling"
```

---

### Task 12: Final build verification

- [ ] **Step 1: Run full TypeScript check**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npx vue-tsc --noEmit 2>&1`
Expected: No errors.

- [ ] **Step 2: Run production build**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npm run build 2>&1 | tail -20`
Expected: Build succeeds. Check for chunk size warnings (existing) but no errors.

- [ ] **Step 3: Final commit with all changes (if any unstaged)**

```bash
git status
```
If any unstaged files remain, review and commit them.

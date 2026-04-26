# Phase 2: Dashboard Page Redesign

> **WARNING: This plan must preserve all existing functionality including real data-driven sparklines (not fabricated), session-based trend indicators, websocket-aware polling (only as fallback when WS disconnected), and all current dashboard components. Redesign should only change presentation, not remove capabilities or regress polling behavior.**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Dashboard page with Figma-style stat cards, restyled equity curve, new positions donut chart, pill-style status bar, and clean trades table.

**Architecture:** Create shared ECharts theme config, build new StatCard component with sparkline, add PositionsDonut as a new chart component, and restructure DashboardView layout to 2/3 + 1/3 grid.

**Tech Stack:** ECharts (with custom theme), Ant Design Vue tags/badges, CSS variables from theme.css

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/chart-theme.ts` | Create | Shared ECharts theme config (blue palette) |
| `src/components/dashboard/StatCards.vue` | Modify | Figma-style stat cards with sparkline + trend |
| `src/components/dashboard/EquityChart.vue` | Modify | Restyle with blue palette, no gridlines |
| `src/components/dashboard/PositionsDonut.vue` | Create | Donut chart for position distribution |
| `src/components/dashboard/SystemStatusBar.vue` | Modify | Pill-style status tags |
| `src/components/dashboard/RecentTrades.vue` | Modify | Styled trade table with side pills |
| `src/views/DashboardView.vue` | Modify | New grid layout with donut chart |

---

### Task 1: Create Shared ECharts Theme

**Files:**
- Create: `src/utils/chart-theme.ts`

- [ ] **Step 1: Create chart-theme.ts**

```ts
export const CHART_COLORS = {
  primary: '#3b82f6',
  primaryDark: '#1e3a8a',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  muted: '#94a3b8',
  grid: '#f0f2f5',
  gradientStart: 'rgba(59, 130, 246, 0.15)',
  gradientEnd: 'rgba(59, 130, 246, 0.01)',
};

export const LINE_SERIES_DEFAULTS = {
  smooth: true,
  symbol: 'none' as const,
  lineStyle: { color: CHART_COLORS.primary, width: 2.5 },
  areaStyle: {
    color: {
      type: 'linear' as const,
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: CHART_COLORS.gradientStart },
        { offset: 1, color: CHART_COLORS.gradientEnd },
      ],
    },
  },
};

export const CHART_GRID = {
  left: '3%',
  right: '4%',
  top: '8%',
  bottom: '3%',
  containLabel: true,
};

export const CHART_TOOLTIP = {
  trigger: 'axis' as const,
  backgroundColor: '#fff',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#1e293b', fontSize: 12 },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/chart-theme.ts
git commit -m "feat: add shared ECharts theme constants"
```

---

### Task 2: Rewrite StatCards with Figma Style

**Files:**
- Modify: `src/components/dashboard/StatCards.vue`

- [ ] **Step 1: Replace StatCards.vue**

```vue
<template>
  <div class="stat-cards">
    <div
      v-for="card in cards"
      :key="card.label"
      class="stat-card"
    >
      <div class="stat-card-header">
        <span class="stat-label">{{ card.label }}</span>
        <span class="stat-pill" :class="card.pillClass">{{ card.pillText }}</span>
      </div>
      <div class="stat-value" :style="{ color: card.valueColor }">
        {{ card.prefix }}{{ card.displayValue }}
      </div>
      <div class="stat-trend" :class="card.trendClass">
        {{ card.trendIcon }} {{ card.trendText }}
      </div>
      <svg class="stat-sparkline" :viewBox="`0 0 ${sparklineWidth} 40`" preserveAspectRatio="none">
        <polyline
          :points="card.sparklinePoints"
          :stroke="card.sparklineColor"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  totalEquity: string;
  availableBalance: string;
  realizedPnl: string;
  unrealizedPnl: string;
}>();

const sparklineWidth = 120;
const maxPoints = 50;

// ── Sparkline history buffers ────────────────────────────────────
const equityHistory = ref<number[]>([]);
const balanceHistory = ref<number[]>([]);
const pnlHistory = ref<number[]>([]);
const unrealizedHistory = ref<number[]>([]);

function pushHistory(buffer: typeof equityHistory, value: number) {
  const next = [...buffer.value, value].slice(-maxPoints);
  buffer.value = next;
}

function buildSparklinePoints(values: number[]): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const height = 30; // 40 viewBox height minus padding
  const step = sparklineWidth / (maxPoints - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = 5 + height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

// ── Push current values into history on every change ─────────────
watch(() => props.totalEquity, (v) => {
  if (v) pushHistory(equityHistory, parseFloat(v));
});
watch(() => props.availableBalance, (v) => {
  if (v) pushHistory(balanceHistory, parseFloat(v));
});
watch([() => props.realizedPnl, () => props.unrealizedPnl], ([realizedPnl, unrealizedPnl]) => {
  const total = parseFloat(realizedPnl || '0') + parseFloat(unrealizedPnl || '0');
  pushHistory(pnlHistory, total);
});
watch(() => props.unrealizedPnl, (v) => {
  if (v) pushHistory(unrealizedHistory, parseFloat(v));
});

// ── Track initial values for trend percentage ────────────────────
const initialEquity = ref<number | null>(null);
const initialBalance = ref<number | null>(null);

watch(() => props.totalEquity, (v) => {
  if (initialEquity.value === null && v) initialEquity.value = parseFloat(v);
});
watch(() => props.availableBalance, (v) => {
  if (initialBalance.value === null && v) initialBalance.value = parseFloat(v);
});

function changePercent(current: number, initial: number | null): string {
  if (initial === null || initial === 0) return '0.0%';
  const pct = ((current - initial) / Math.abs(initial)) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}

function trendDir(current: number, initial: number | null): 'up' | 'down' | 'flat' {
  if (initial === null) return 'flat';
  return current >= initial ? 'up' : 'down';
}

const totalPnl = computed(
  () => parseFloat(props.realizedPnl || '0') + parseFloat(props.unrealizedPnl || '0'),
);

const unrealized = computed(() => parseFloat(props.unrealizedPnl || '0'));

const cards = computed(() => [
  {
    label: 'Net Equity',
    displayValue: formatMoney(props.totalEquity),
    prefix: '$',
    valueColor: 'var(--q-primary-dark)',
    pillText: 'Session',
    pillClass: 'pill-blue',
    trendIcon: trendDir(parseFloat(props.totalEquity || '0'), initialEquity.value) === 'down' ? '↓' : '↑',
    trendText: changePercent(parseFloat(props.totalEquity || '0'), initialEquity.value),
    trendClass: trendDir(parseFloat(props.totalEquity || '0'), initialEquity.value) === 'down' ? 'trend-down' : 'trend-up',
    sparklinePoints: buildSparklinePoints(equityHistory.value),
    sparklineColor: 'var(--q-primary)',
  },
  {
    label: 'Available Balance',
    displayValue: formatMoney(props.availableBalance),
    prefix: '$',
    valueColor: 'var(--q-primary-dark)',
    pillText: 'Session',
    pillClass: 'pill-blue',
    trendIcon: trendDir(parseFloat(props.availableBalance || '0'), initialBalance.value) === 'down' ? '↓' : '↑',
    trendText: changePercent(parseFloat(props.availableBalance || '0'), initialBalance.value),
    trendClass: trendDir(parseFloat(props.availableBalance || '0'), initialBalance.value) === 'down' ? 'trend-down' : 'trend-up',
    sparklinePoints: buildSparklinePoints(balanceHistory.value),
    sparklineColor: 'var(--q-primary)',
  },
  {
    label: 'Total P&L',
    displayValue: formatMoney(String(totalPnl.value)),
    prefix: totalPnl.value >= 0 ? '+$' : '-$',
    valueColor: totalPnl.value >= 0 ? 'var(--q-success)' : 'var(--q-error)',
    pillText: '30d',
    pillClass: totalPnl.value >= 0 ? 'pill-blue' : 'pill-red',
    trendIcon: totalPnl.value >= 0 ? '↑' : '↓',
    trendText: totalPnl.value >= 0 ? 'Profit' : 'Loss',
    trendClass: totalPnl.value >= 0 ? 'trend-up' : 'trend-down',
    sparklinePoints: buildSparklinePoints(pnlHistory.value),
    sparklineColor: totalPnl.value >= 0 ? 'var(--q-success)' : 'var(--q-error)',
  },
  {
    label: 'Unrealized P&L',
    displayValue: formatMoney(props.unrealizedPnl),
    prefix: unrealized.value >= 0 ? '+$' : '-$',
    valueColor: unrealized.value >= 0 ? 'var(--q-success)' : 'var(--q-error)',
    pillText: 'Open',
    pillClass: unrealized.value >= 0 ? 'pill-blue' : 'pill-red',
    trendIcon: unrealized.value >= 0 ? '↑' : '↓',
    trendText: unrealized.value >= 0 ? 'Profit' : 'Loss',
    trendClass: unrealized.value >= 0 ? 'trend-up' : 'trend-down',
    sparklinePoints: buildSparklinePoints(unrealizedHistory.value),
    sparklineColor: unrealized.value >= 0 ? 'var(--q-success)' : 'var(--q-error)',
  },
]);

function formatMoney(value: string): string {
  const num = Math.abs(parseFloat(value || '0'));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--q-card-gap);
}

.stat-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 12px;
  color: var(--q-text-muted);
}

.stat-pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-weight: 500;
}

.pill-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
}

.pill-red {
  background: var(--q-error-light);
  color: var(--q-error);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 11px;
  margin-bottom: 12px;
}

.trend-up {
  color: var(--q-success);
}

.trend-down {
  color: var(--q-error);
}

.stat-sparkline {
  width: 100%;
  height: 40px;
}
</style>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/StatCards.vue
git commit -m "feat: Figma-style stat cards with sparkline and trend indicators"
```

---

### Task 3: Restyle EquityChart

**Files:**
- Modify: `src/components/dashboard/EquityChart.vue`

- [ ] **Step 1: Replace EquityChart.vue**

```vue
<template>
  <div class="chart-card">
    <div class="chart-card-header">
      <span class="chart-title">Equity Curve</span>
      <span class="chart-range">Last 30 days</span>
    </div>
    <v-chart
      v-if="values.length > 0"
      :option="chartOption"
      style="height: 280px; width: 100%"
      autoresize
    />
    <div v-else class="chart-empty">No equity data yet</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';
import { CHART_COLORS, LINE_SERIES_DEFAULTS, CHART_GRID, CHART_TOOLTIP } from '@/utils/chart-theme';

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  timestamps: string[];
  values: number[];
}>();

const chartOption = computed(() => ({
  tooltip: CHART_TOOLTIP,
  grid: CHART_GRID,
  xAxis: {
    type: 'category' as const,
    boundaryGap: false,
    data: props.timestamps,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value' as const,
    show: false,
  },
  series: [
    {
      name: 'Equity',
      type: 'line' as const,
      ...LINE_SERIES_DEFAULTS,
      data: props.values,
    },
  ],
}));
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
  margin-bottom: 16px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.chart-range {
  font-size: 11px;
  color: var(--q-text-muted);
}

.chart-empty {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/EquityChart.vue
git commit -m "feat: restyle equity chart with blue theme and no gridlines"
```

---

### Task 4: Create PositionsDonut Component

**Files:**
- Create: `src/components/dashboard/PositionsDonut.vue`

- [ ] **Step 1: Create PositionsDonut.vue**

```vue
<template>
  <div class="donut-card">
    <div class="donut-title">Positions</div>
    <div v-if="positions.length > 0" class="donut-body">
      <v-chart :option="chartOption" style="height: 160px; width: 160px" autoresize />
      <div class="donut-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--q-success)"></span>
          <span class="legend-label">Profit</span>
          <span class="legend-count">{{ profitCount }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--q-primary)"></span>
          <span class="legend-label">Open</span>
          <span class="legend-count">{{ neutralCount }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--q-error)"></span>
          <span class="legend-label">Loss</span>
          <span class="legend-count">{{ lossCount }}</span>
        </div>
      </div>
    </div>
    <div v-else class="donut-empty">No open positions</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';
import type { Position } from '@/types';

use([PieChart, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  positions: Position[];
}>();

const profitCount = computed(() =>
  props.positions.filter((p) => parseFloat(p.unrealized_pnl) > 0).length,
);
const lossCount = computed(() =>
  props.positions.filter((p) => parseFloat(p.unrealized_pnl) < 0).length,
);
const neutralCount = computed(() =>
  props.positions.filter((p) => parseFloat(p.unrealized_pnl) === 0).length,
);

const chartOption = computed(() => {
  const data = [];
  if (profitCount.value > 0) data.push({ value: profitCount.value, name: 'Profit', itemStyle: { color: '#10b981' } });
  if (neutralCount.value > 0) data.push({ value: neutralCount.value, name: 'Open', itemStyle: { color: '#3b82f6' } });
  if (lossCount.value > 0) data.push({ value: lossCount.value, name: 'Loss', itemStyle: { color: '#ef4444' } });
  if (data.length === 0) data.push({ value: 1, name: 'None', itemStyle: { color: '#e2e8f0' } });

  return {
    tooltip: { show: false },
    series: [{
      type: 'pie' as const,
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      data,
      label: {
        show: true,
        position: 'center',
        formatter: () => String(props.positions.length),
        fontSize: 20,
        fontWeight: 700,
        color: '#1e3a8a',
      },
      emphasis: { disabled: true },
      animation: false,
    }],
  };
});
</script>

<style scoped>
.donut-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.donut-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 16px;
}

.donut-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  color: var(--q-text-secondary);
}

.legend-count {
  font-weight: 600;
  color: var(--q-text);
}

.donut-empty {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/PositionsDonut.vue
git commit -m "feat: add positions donut chart component"
```

---

### Task 5: Restyle SystemStatusBar + RecentTrades

**Files:**
- Modify: `src/components/dashboard/SystemStatusBar.vue`
- Modify: `src/components/dashboard/RecentTrades.vue`

- [ ] **Step 1: Replace SystemStatusBar.vue**

```vue
<template>
  <div class="status-bar">
    <div class="status-pill pill-blue">
      <span class="pill-icon">📊</span>
      <span>{{ exchanges.length }} Exchanges</span>
    </div>
    <div class="status-pill pill-green">
      <span class="pill-icon">⚡</span>
      <span>{{ runningStrategies }} / {{ totalStrategies }} Strategies</span>
    </div>
    <div class="status-pill pill-gray">
      <span class="pill-icon">🕐</span>
      <span>{{ formatUptime(uptime) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  exchanges: string[];
  runningStrategies: number;
  totalStrategies: number;
  uptime: number;
}>();

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
</script>

<style scoped>
.status-bar {
  display: flex;
  gap: 12px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.pill-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
}

.pill-green {
  background: var(--q-success-light);
  color: var(--q-success);
}

.pill-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
}

.pill-icon {
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: Replace RecentTrades.vue**

```vue
<template>
  <div class="trades-card">
    <div class="trades-header">
      <span class="trades-title">Recent Trades</span>
      <span class="trades-link">View All →</span>
    </div>
    <table v-if="trades.length > 0" class="trades-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Side</th>
          <th>Price</th>
          <th>Qty</th>
          <th>P&L</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trade in trades.slice(0, 5)" :key="trade.order_id">
          <td class="symbol">{{ trade.symbol }}</td>
          <td>
            <span class="side-pill" :class="trade.side === 'BUY' ? 'side-buy' : 'side-sell'">
              {{ trade.side }}
            </span>
          </td>
          <td>{{ trade.avg_fill_price || trade.price || '-' }}</td>
          <td>{{ trade.filled_quantity || trade.quantity }}</td>
          <td class="pnl" :class="pnlClass(trade)">-</td>
          <td class="time">{{ formatTime(trade.created_at) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="trades-empty">No recent trades</div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types';

defineProps<{
  trades: Order[];
}>();

function pnlClass(_trade: Order): string {
  return '';
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleTimeString();
  } catch {
    return dateStr;
  }
}
</script>

<style scoped>
.trades-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.trades-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.trades-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.trades-link {
  font-size: 12px;
  color: var(--q-primary);
  cursor: pointer;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.trades-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
  border-bottom: none;
}

.trades-table td {
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.trades-table tbody tr:last-child td {
  border-bottom: none;
}

.trades-table tbody tr:hover td {
  background: var(--q-hover);
}

.symbol {
  font-weight: 600;
  color: var(--q-text);
}

.side-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
}

.side-buy {
  background: var(--q-success-light);
  color: var(--q-success);
}

.side-sell {
  background: var(--q-error-light);
  color: var(--q-error);
}

.pnl {
  font-weight: 600;
}

.time {
  color: var(--q-text-muted);
}

.trades-empty {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/SystemStatusBar.vue src/components/dashboard/RecentTrades.vue
git commit -m "feat: restyle status bar with pills and trades table with side tags"
```

---

### Task 6: Restructure DashboardView Layout

**Files:**
- Modify: `src/views/DashboardView.vue`

- [ ] **Step 1: Replace DashboardView.vue**

```vue
<template>
  <div class="dashboard">
    <a-spin :spinning="tradingStore.loading">
      <StatCards
        :total-equity="tradingStore.portfolio?.total_equity || '0'"
        :available-balance="tradingStore.portfolio?.available_balance || '0'"
        :realized-pnl="tradingStore.portfolio?.realized_pnl || '0'"
        :unrealized-pnl="tradingStore.portfolio?.unrealized_pnl || '0'"
      />
    </a-spin>

    <SystemStatusBar
      :exchanges="systemStore.status?.connected_exchanges || []"
      :running-strategies="runningStrategies"
      :total-strategies="0"
      :uptime="systemStore.liveness?.uptime_seconds || 0"
      class="dashboard-row"
    />

    <div class="dashboard-row dashboard-charts">
      <EquityChart
        :timestamps="equityTimestamps"
        :values="equityValues"
        class="chart-equity"
      />
      <PositionsDonut
        :positions="tradingStore.positions"
        class="chart-positions"
      />
    </div>

    <RecentTrades
      :trades="recentTrades"
      class="dashboard-row"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { useTradingStore } from '@/stores/trading';
import { useOrdersStore } from '@/stores/orders';
import { useSystemStore } from '@/stores/system';
import StatCards from '@/components/dashboard/StatCards.vue';
import EquityChart from '@/components/dashboard/EquityChart.vue';
import PositionsDonut from '@/components/dashboard/PositionsDonut.vue';
import RecentTrades from '@/components/dashboard/RecentTrades.vue';
import SystemStatusBar from '@/components/dashboard/SystemStatusBar.vue';

const tradingStore = useTradingStore();
const ordersStore = useOrdersStore();
const systemStore = useSystemStore();
const wsConnected = inject<Ref<boolean>>('wsConnected', ref(false));

const equityTimestamps = ref<string[]>([]);
const equityValues = ref<number[]>([]);

const runningStrategies = computed(() => 0);

const recentTrades = computed(() =>
  ordersStore.orderHistory
    .filter((o) => ['FILLED', 'PARTIALLY_FILLED'].includes(o.status))
    .slice(0, 20),
);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function updateEquitySnapshot() {
  if (tradingStore.portfolio?.total_equity) {
    const now = new Date().toLocaleTimeString();
    const value = parseFloat(tradingStore.portfolio.total_equity);
    equityTimestamps.value = [...equityTimestamps.value, now].slice(-50);
    equityValues.value = [...equityValues.value, value].slice(-50);
  }
}

async function pollData() {
  await Promise.all([
    tradingStore.fetchAll(),
    ordersStore.fetchOrders(),
  ]);
  updateEquitySnapshot();
}

function startPolling(immediate = true) {
  if (pollTimer) return;
  if (immediate) {
    pollData();
  }
  pollTimer = setInterval(pollData, 5000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// WS connection state drives polling: stop when WS reconnects, start when disconnected
watch(wsConnected, (connected) => {
  if (connected) {
    stopPolling();
  } else {
    startPolling();
  }
});

onMounted(async () => {
  // Initial load: HTTP fetch all data once
  await Promise.all([
    tradingStore.fetchAll(),
    ordersStore.fetchOrders(),
    systemStore.fetchAll(),
  ]);
  updateEquitySnapshot();

  // Only start polling if WS is not connected (fallback mode)
  if (!wsConnected.value) {
    startPolling(false);
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.dashboard-row {
  margin-top: 0;
}

.dashboard-charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--q-card-gap);
}

.chart-equity {
  min-width: 0;
}

.chart-positions {
  min-width: 0;
}
</style>
```

Note: Removed `PositionTable` import and `onClosePosition` handler since positions are now shown in the donut chart. The `message` import from ant-design-vue is also removed since close position is no longer available from the dashboard view. The polling is WS-aware: it only runs as a fallback when `wsConnected` is false, and stops automatically when the websocket reconnects.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Verify all dashboard components render**

Run: `npm run dev`
Open http://localhost:3001 and verify:
- 4 stat cards with sparklines and trend arrows
- Pill-style status bar below cards
- Equity curve chart (2/3 width) + Positions donut (1/3 width) side by side
- Recent trades table at bottom with BUY/SELL pills

- [ ] **Step 4: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: restructure dashboard with new grid layout and donut chart"
```

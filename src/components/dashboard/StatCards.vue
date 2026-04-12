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
watch(() => props.realizedPnl, () => {
  const total = parseFloat(props.realizedPnl || '0') + parseFloat(props.unrealizedPnl || '0');
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

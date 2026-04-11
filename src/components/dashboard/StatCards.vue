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
import { computed } from 'vue';

const props = defineProps<{
  totalEquity: string;
  availableBalance: string;
  realizedPnl: string;
  unrealizedPnl: string;
}>();

const sparklineWidth = 120;

function generateSparkline(seed: number): string {
  const points: string[] = [];
  let val = 20 + (seed % 10);
  for (let i = 0; i < sparklineWidth; i += 8) {
    val += Math.sin(i * 0.1 + seed) * 5 + (seed % 3 - 1);
    val = Math.max(5, Math.min(35, val));
    points.push(`${i},${val.toFixed(1)}`);
  }
  return points.join(' ');
}

const totalPnl = computed(
  () => parseFloat(props.realizedPnl || '0') + parseFloat(props.unrealizedPnl || '0'),
);

const cards = computed(() => [
  {
    label: 'Net Equity',
    displayValue: formatMoney(props.totalEquity),
    prefix: '$',
    valueColor: 'var(--q-primary-dark)',
    pillText: 'Today',
    pillClass: 'pill-blue',
    trendIcon: parseFloat(props.totalEquity) >= 0 ? '↑' : '↓',
    trendText: parseFloat(props.totalEquity) >= 0 ? '+' + pct(props.totalEquity) : pct(props.totalEquity),
    trendClass: parseFloat(props.totalEquity) >= 0 ? 'trend-up' : 'trend-down',
    sparklinePoints: generateSparkline(1),
    sparklineColor: 'var(--q-primary)',
  },
  {
    label: 'Available Balance',
    displayValue: formatMoney(props.availableBalance),
    prefix: '$',
    valueColor: 'var(--q-primary-dark)',
    pillText: 'Today',
    pillClass: 'pill-blue',
    trendIcon: '↑',
    trendText: '+1.8%',
    trendClass: 'trend-up',
    sparklinePoints: generateSparkline(2),
    sparklineColor: 'var(--q-primary)',
  },
  {
    label: 'Total P&L',
    displayValue: formatMoney(String(totalPnl.value)),
    prefix: totalPnl.value >= 0 ? '+$' : '-$',
    valueColor: totalPnl.value >= 0 ? 'var(--q-success)' : 'var(--q-error)',
    pillText: '30d',
    pillClass: 'pill-blue',
    trendIcon: totalPnl.value >= 0 ? '↑' : '↓',
    trendText: totalPnl.value >= 0 ? '+12%' : '-8%',
    trendClass: totalPnl.value >= 0 ? 'trend-up' : 'trend-down',
    sparklinePoints: generateSparkline(3),
    sparklineColor: totalPnl.value >= 0 ? 'var(--q-success)' : 'var(--q-error)',
  },
  {
    label: 'Unrealized P&L',
    displayValue: formatMoney(props.unrealizedPnl),
    prefix: parseFloat(props.unrealizedPnl) >= 0 ? '+$' : '-$',
    valueColor: parseFloat(props.unrealizedPnl) >= 0 ? 'var(--q-success)' : 'var(--q-error)',
    pillText: 'Open',
    pillClass: parseFloat(props.unrealizedPnl) >= 0 ? 'pill-blue' : 'pill-red',
    trendIcon: parseFloat(props.unrealizedPnl) >= 0 ? '↑' : '↓',
    trendText: parseFloat(props.unrealizedPnl) >= 0 ? '+0.8%' : '-0.8%',
    trendClass: parseFloat(props.unrealizedPnl) >= 0 ? 'trend-up' : 'trend-down',
    sparklinePoints: generateSparkline(4),
    sparklineColor: parseFloat(props.unrealizedPnl) >= 0 ? 'var(--q-success)' : 'var(--q-error)',
  },
]);

function formatMoney(value: string): string {
  const num = Math.abs(parseFloat(value || '0'));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(value: string): string {
  const num = parseFloat(value || '0');
  if (isNaN(num) || num === 0) return '0.0%';
  return (num / 10000).toFixed(1) + '%';
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

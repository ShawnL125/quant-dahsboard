<template>
  <div class="metrics-grid">
    <div v-for="m in metrics" :key="m.label" class="metric-card">
      <span class="metric-label">{{ m.label }}</span>
      <span class="metric-value" :style="{ color: m.color }">{{ m.displayValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BacktestResult } from '@/types';

const props = defineProps<{
  result: BacktestResult;
}>();

const metrics = computed(() => [
  {
    label: 'Total Return',
    displayValue: parseFloat(props.result.total_return_pct).toFixed(2) + '%',
    color: parseFloat(props.result.total_return_pct) >= 0 ? 'var(--q-success)' : 'var(--q-error)',
  },
  {
    label: 'Max Drawdown',
    displayValue: parseFloat(props.result.max_drawdown_pct).toFixed(2) + '%',
    color: 'var(--q-error)',
  },
  {
    label: 'Sharpe Ratio',
    displayValue: parseFloat(props.result.sharpe_ratio).toFixed(2),
    color: 'var(--q-text)',
  },
  {
    label: 'Win Rate',
    displayValue: parseFloat(props.result.win_rate).toFixed(1) + '%',
    color: 'var(--q-text)',
  },
  {
    label: 'Total Trades',
    displayValue: String(props.result.total_trades),
    color: 'var(--q-text)',
  },
  {
    label: 'Calmar Ratio',
    displayValue: parseFloat(props.result.calmar_ratio).toFixed(2),
    color: 'var(--q-text)',
  },
]);
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--q-card-gap);
}

.metric-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: 16px;
  box-shadow: var(--q-card-shadow);
}

.metric-label {
  display: block;
  font-size: 12px;
  color: var(--q-text-muted);
  margin-bottom: 6px;
}

.metric-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
}
</style>

<template>
  <div class="summary-card">
    <div class="card-title">Replay Summary</div>
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">Total Steps</span>
        <span class="summary-value">{{ summary.total_steps }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total PNL</span>
        <span class="summary-value" :class="pnlClass(summary.total_pnl)">{{ parseFloat(summary.total_pnl).toFixed(2) }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Max Drawdown</span>
        <span class="summary-value val-negative">{{ parseFloat(summary.max_drawdown_pct).toFixed(2) }}%</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Sharpe Ratio</span>
        <span class="summary-value">{{ summary.sharpe_ratio ? parseFloat(summary.sharpe_ratio).toFixed(2) : '-' }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Win Rate</span>
        <span class="summary-value">{{ parseFloat(summary.win_rate).toFixed(1) }}%</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Trade Count</span>
        <span class="summary-value">{{ summary.trade_count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReplaySummary } from '@/types';

defineProps<{
  summary: ReplaySummary;
}>();

function pnlClass(pnl: string): string {
  const val = parseFloat(pnl);
  if (val > 0) return 'val-positive';
  if (val < 0) return 'val-negative';
  return '';
}
</script>

<style scoped>
.summary-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.summary-item {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 10px;
}

.summary-label {
  display: block;
  font-size: 11px;
  color: var(--q-text-muted);
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--q-text);
}

.val-positive { color: var(--q-success); font-weight: 600; }
.val-negative { color: var(--q-error); font-weight: 600; }
</style>

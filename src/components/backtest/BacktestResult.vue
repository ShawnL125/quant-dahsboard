<template>
  <div v-if="result">
    <MetricsCards :result="result" />
    <div class="detail-card">
      <div class="card-title">Detailed Metrics</div>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">Group ID</span>
          <span class="detail-value mono">{{ result.group_id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Return</span>
          <span class="detail-value" :class="parseFloat(result.total_return_pct) >= 0 ? 'text-success' : 'text-error'">
            {{ parseFloat(result.total_return_pct).toFixed(2) }}%
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Sharpe Ratio</span>
          <span class="detail-value">{{ parseFloat(result.sharpe_ratio).toFixed(2) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Calmar Ratio</span>
          <span class="detail-value">{{ parseFloat(result.calmar_ratio).toFixed(2) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Max Drawdown</span>
          <span class="detail-value text-error">{{ parseFloat(result.max_drawdown_pct).toFixed(2) }}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Win Rate</span>
          <span class="detail-value">{{ parseFloat(result.win_rate).toFixed(1) }}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Trades</span>
          <span class="detail-value">{{ result.total_trades }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">No result to display</div>
</template>

<script setup lang="ts">
import MetricsCards from './MetricsCards.vue';
import type { BacktestResult } from '@/types';

defineProps<{
  result: BacktestResult | null;
}>();
</script>

<style scoped>
.detail-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
  margin-top: var(--q-card-gap);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  background: var(--q-bg);
  border-radius: 8px;
  overflow: hidden;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--q-border);
}

.detail-row:nth-child(odd) { border-right: 1px solid var(--q-border); }
.detail-row:nth-last-child(-n+2) { border-bottom: none; }

.detail-label { color: var(--q-text-muted); }
.detail-value { font-weight: 600; color: var(--q-text); }
.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
.text-success { color: var(--q-success); }
.text-error { color: var(--q-error); }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 40px 0;
  font-size: 13px;
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  box-shadow: var(--q-card-shadow);
}
</style>

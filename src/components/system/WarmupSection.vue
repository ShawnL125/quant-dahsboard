<template>
  <div class="warmup-section">
    <a-spin :spinning="store.loading">
      <div class="section-header">
        <span class="section-title">Warmup Status</span>
        <a-button size="small" :loading="store.loading" @click="onRefresh">Refresh</a-button>
      </div>

      <div v-if="store.status" class="status-card warmup-block">
        <div class="card-title">Status Overview</div>
        <div class="status-grid">
          <div v-for="(value, key) in store.status" :key="String(key)" class="stat-row">
            <span class="stat-label text-mono">{{ key }}</span>
            <span class="stat-value text-bold">{{ formatValue(value) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="status-card warmup-block">
        <div class="card-title">Status Overview</div>
        <div class="empty-state">No warmup status available</div>
      </div>

      <div class="results-card warmup-block">
        <div class="card-title">Warmup Results</div>
        <table v-if="store.results.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Timeframe</th>
              <th>State</th>
              <th>Loaded / Requested</th>
              <th>Duration</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in store.results" :key="`${r.symbol}-${r.timeframe}`">
              <td class="text-bold">{{ r.symbol }}</td>
              <td class="text-mono">{{ r.timeframe }}</td>
              <td>
                <span class="state-pill" :class="stateClass(r.state)">{{ r.state }}</span>
              </td>
              <td class="text-mono">{{ r.loaded_count }} / {{ r.requested_count }}</td>
              <td class="text-mono">{{ r.duration_seconds.toFixed(2) }}s</td>
              <td>
                <span v-if="r.error" class="error-text">{{ r.error }}</span>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No warmup results</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useWarmupStore } from '@/stores/warmup';
import type { WarmupResult } from '@/types';

const store = useWarmupStore();

function onRefresh() {
  store.fetchStatus();
  store.fetchResults();
}

function stateClass(state: WarmupResult['state']): string {
  const s = state.toLowerCase();
  if (s === 'completed' || s === 'ready' || s === 'done') return 'state-ok';
  if (s === 'failed' || s === 'error') return 'state-error';
  if (s === 'running' || s === 'warming' || s === 'loading') return 'state-active';
  return 'state-pending';
}

function formatValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

onMounted(() => {
  store.fetchStatus();
  store.fetchResults();
});
</script>

<style scoped>
.warmup-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.warmup-block {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
}

.status-grid {
  display: flex;
  flex-direction: column;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--q-border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: var(--q-text);
}

.stat-value {
  color: var(--q-text);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
}

.data-table td {
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background: var(--q-hover);
}

.text-mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.text-bold {
  font-weight: 600;
}

.text-muted {
  color: var(--q-text-muted);
  font-size: 11px;
}

.state-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.state-ok {
  border: 1px solid var(--q-success);
  color: var(--q-success);
  background: transparent;
}

.state-error {
  border: 1px solid var(--q-error);
  color: var(--q-error);
  background: transparent;
}

.state-active {
  border: 1px solid var(--q-primary);
  color: var(--q-primary);
  background: transparent;
}

.state-pending {
  border: 1px solid var(--q-text-muted);
  color: var(--q-text-muted);
  background: transparent;
}

.error-text {
  color: var(--q-error);
  font-size: 11px;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

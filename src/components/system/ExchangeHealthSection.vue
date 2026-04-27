<template>
  <div class="exchange-health-section">
    <a-spin :spinning="store.loading">
      <div class="section-header">
        <span class="section-title">Exchange Health</span>
        <a-button size="small" :loading="store.loading" @click="onRefresh">Refresh</a-button>
      </div>

      <div v-if="exchangeList.length > 0" class="status-grid health-block">
        <div v-for="ex in exchangeList" :key="ex.exchange" class="exchange-card">
          <div class="exchange-header">
            <span class="exchange-name text-bold">{{ ex.exchange }}</span>
            <span class="health-pill" :class="ex.is_healthy ? 'health-ok' : 'health-error'">
              {{ ex.is_healthy ? 'Healthy' : 'Unhealthy' }}
            </span>
          </div>
          <div class="exchange-metrics">
            <div class="metric">
              <span class="metric-label">Latency</span>
              <span class="metric-value text-mono">{{ ex.latency_ms }}ms</span>
            </div>
            <div class="metric">
              <span class="metric-label">Error Rate</span>
              <span class="metric-value text-mono" :class="ex.error_rate_pct > 5 ? 'text-error' : ''">{{ ex.error_rate_pct }}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Failures</span>
              <span class="metric-value text-mono">{{ ex.consecutive_failures }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Last Check</span>
              <span class="metric-value text-muted">{{ ex.last_check_at ? formatTime(ex.last_check_at) : '-' }}</span>
            </div>
          </div>
          <a-button
            size="small"
            class="check-btn"
            :loading="store.loading"
            @click="onCheckNow(ex.exchange)"
          >
            Check Now
          </a-button>
        </div>
      </div>
      <div v-else class="health-block">
        <div class="empty-state">No exchange health data available</div>
      </div>

      <div class="failover-card health-block">
        <div class="card-title">Failover History</div>
        <table v-if="store.failovers.length > 0" class="data-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th>Triggered</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in store.failovers" :key="f.action_id">
              <td class="text-mono">{{ f.from_exchange }}</td>
              <td class="text-mono">{{ f.to_exchange }}</td>
              <td>{{ f.reason }}</td>
              <td class="text-muted">{{ f.triggered_at ? formatTime(f.triggered_at) : '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No failover history</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useExchangeHealthStore } from '@/stores/exchange_health';
import type { ExchangeHealthStatus } from '@/types';

const store = useExchangeHealthStore();

const exchangeList = computed<ExchangeHealthStatus[]>(() =>
  Object.values(store.statuses)
);

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function onRefresh() {
  store.fetchStatus();
  store.fetchFailovers();
}

function onCheckNow(exchange: string) {
  store.triggerCheck(exchange);
}

onMounted(() => {
  store.fetchStatus();
  store.fetchFailovers();
});
</script>

<style scoped>
.exchange-health-section {
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

.health-block {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.exchange-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--q-border);
  border-radius: 8px;
  background: var(--q-bg);
}

.exchange-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exchange-name {
  font-size: 13px;
  color: var(--q-primary-dark);
}

.health-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.health-ok {
  border: 1px solid var(--q-success);
  color: var(--q-success);
  background: transparent;
}

.health-error {
  border: 1px solid var(--q-error);
  color: var(--q-error);
  background: transparent;
}

.exchange-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.metric-value {
  font-size: 12px;
  color: var(--q-text);
}

.check-btn {
  align-self: flex-end;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
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

.text-error {
  color: var(--q-error);
  font-weight: 600;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

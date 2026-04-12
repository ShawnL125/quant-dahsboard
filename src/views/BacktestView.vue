<template>
  <div class="backtest-page">
    <div class="run-card">
      <div class="card-title">Run Backtest</div>
      <div class="run-actions">
        <a-button type="primary" :loading="store.loading" @click="store.runBacktest()">
          Run
        </a-button>
        <span v-if="store.taskStatus" class="status-pill" :class="statusClass">
          {{ store.taskStatus }}
        </span>
      </div>
      <a-alert v-if="store.error" :message="store.error" type="error" show-icon style="margin-top: 12px" />
    </div>

    <BacktestResult v-if="store.currentResult" :result="store.currentResult" class="page-section" />

    <div class="history-card page-section">
      <div class="card-header">
        <span class="card-title">Backtest History</span>
        <span v-if="store.history.length > 0" class="card-badge">{{ store.history.length }}</span>
      </div>
      <table v-if="store.history.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Task ID</th>
            <th>Return</th>
            <th>Sharpe</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in store.history" :key="item.task_id">
            <td class="text-muted">{{ formatTime(item.created_at) }}</td>
            <td class="text-mono">{{ item.task_id?.slice(0, 8) }}</td>
            <td :class="item.total_return_pct ? (parseFloat(item.total_return_pct) >= 0 ? 'text-success' : 'text-error') : 'text-muted'">
              {{ item.total_return_pct ? parseFloat(item.total_return_pct).toFixed(2) + '%' : '-' }}
            </td>
            <td>{{ item.sharpe_ratio ? parseFloat(item.sharpe_ratio).toFixed(2) : '-' }}</td>
            <td>
              <span class="status-pill" :class="getStatusClass(item.status)">{{ item.status }}</span>
            </td>
            <td>
              <span
                class="view-link"
                :class="{ disabled: !canView(item.status) }"
                @click="canView(item.status) && store.fetchResult(item.task_id)"
              >View</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">No backtest history</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useBacktestStore } from '@/stores/backtest';
import BacktestResult from '@/components/backtest/BacktestResult.vue';

const store = useBacktestStore();

const statusClass = computed(() => {
  switch (store.taskStatus) {
    case 'COMPLETED': case 'DONE': return 'status-completed';
    case 'FAILED': return 'status-failed';
    case 'PENDING': case 'RUNNING': return 'status-running';
    default: return 'status-default';
  }
});

function getStatusClass(status: string): string {
  switch (status) {
    case 'COMPLETED': case 'DONE': return 'status-completed';
    case 'FAILED': return 'status-failed';
    case 'PENDING': case 'RUNNING': return 'status-running';
    default: return 'status-default';
  }
}

function canView(status: string): boolean {
  return status === 'COMPLETED' || status === 'DONE';
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}

onMounted(() => {
  store.fetchHistory();
});
</script>

<style scoped>
.backtest-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: 0; }

.run-card {
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

.run-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.status-completed { background: var(--q-success-light); color: var(--q-success); }
.status-failed { background: var(--q-error-light); color: var(--q-error); }
.status-running { background: var(--q-primary-light); color: var(--q-primary); }
.status-default { background: var(--q-hover); color: var(--q-text-muted); }

.history-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-badge {
  background: var(--q-primary-light);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
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

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-muted { color: var(--q-text-muted); }
.text-success { color: var(--q-success); font-weight: 600; }
.text-error { color: var(--q-error); font-weight: 600; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.view-link {
  font-size: 12px;
  color: var(--q-primary);
  cursor: pointer;
  font-weight: 500;
}

.view-link:hover { text-decoration: underline; }
.view-link.disabled { color: var(--q-text-muted); cursor: not-allowed; }
.view-link.disabled:hover { text-decoration: none; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

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

    <BacktestResult
      v-if="store.currentResult"
      :result="store.currentResult"
      :equity="store.currentEquity"
      :trades="store.currentTrades"
      class="page-section"
    />

    <a-tabs v-model:activeKey="activeTab" class="page-section">
      <a-tab-pane key="runs" tab="Run History">
        <div class="history-card">
          <div class="card-header">
            <span class="card-title">DB Runs</span>
            <span v-if="store.runs.length > 0" class="card-badge">{{ store.runs.length }}</span>
          </div>
          <table v-if="store.runs.length > 0" class="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Strategy</th>
                <th>Return</th>
                <th>Sharpe</th>
                <th>Drawdown</th>
                <th>Trades</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="run in store.runs" :key="run.run_id">
                <td class="text-bold">{{ run.symbol }}</td>
                <td class="text-muted">{{ (run.strategy_ids || []).join(', ') || '-' }}</td>
                <td :class="parseFloat(run.total_return_pct) >= 0 ? 'text-success' : 'text-error'">
                  {{ parseFloat(run.total_return_pct).toFixed(2) }}%
                </td>
                <td>{{ parseFloat(run.sharpe_ratio).toFixed(2) }}</td>
                <td class="text-error">{{ parseFloat(run.max_drawdown_pct).toFixed(2) }}%</td>
                <td>{{ run.total_trades }}</td>
                <td>
                  <span class="status-pill" :class="getStatusClass(run.status)">{{ run.status }}</span>
                </td>
                <td>
                  <span
                    class="view-link"
                    :class="{ disabled: run.status !== 'COMPLETED' }"
                    @click="run.status === 'COMPLETED' && viewRunDetails(run.run_id)"
                  >View</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">No runs in database</div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="tasks" tab="Task History">
        <div class="history-card">
          <div class="card-header">
            <span class="card-title">Task History</span>
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
          <div v-else class="empty-state">No task history</div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBacktestStore } from '@/stores/backtest';
import BacktestResult from '@/components/backtest/BacktestResult.vue';

const store = useBacktestStore();
const activeTab = ref('runs');

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

async function viewRunDetails(runId: string) {
  await store.fetchRunDetails(runId);
  // Build a BacktestResult from the run record for the BacktestResult component
  const run = store.currentRun;
  if (run) {
    store.currentResult = {
      group_id: run.group_id,
      total_return_pct: run.total_return_pct,
      sharpe_ratio: run.sharpe_ratio,
      calmar_ratio: run.calmar_ratio,
      max_drawdown_pct: run.max_drawdown_pct,
      win_rate: run.win_rate,
      total_trades: run.total_trades,
    };
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}

onMounted(() => {
  store.fetchRuns();
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
.text-bold { font-weight: 600; }
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

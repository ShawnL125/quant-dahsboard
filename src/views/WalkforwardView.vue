<template>
  <div class="walkforward-page">
    <a-spin :spinning="store.loading">
      <div class="run-card">
        <div class="card-title">Walk-Forward Optimization</div>
        <div class="run-actions">
          <a-button type="primary" @click="store.submitRun({})">Run Optimization</a-button>
          <a-button :disabled="selectedRuns.length < 2" @click="onCompare">Compare ({{ selectedRuns.length }})</a-button>
        </div>
        <a-alert v-if="store.error" :message="store.error" type="error" show-icon style="margin-top: 12px" />
      </div>

      <div class="runs-card page-section">
        <div class="card-header">
          <span class="card-title">Optimization Runs</span>
          <span v-if="store.runs.length > 0" class="card-badge">{{ store.runs.length }}</span>
        </div>
        <table v-if="store.runs.length > 0" class="data-table">
          <thead>
            <tr>
              <th style="width: 30px"></th>
              <th style="width: 30px"></th>
              <th>Strategy</th>
              <th>Algorithm</th>
              <th>Objective</th>
              <th>Windows</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="run in store.runs" :key="run.run_id">
              <tr class="wf-row" @click="toggleExpand(run.run_id)">
                <td class="expand-cell">
                  <span class="expand-icon" :class="{ expanded: expandedId === run.run_id }">▶</span>
                </td>
                <td @click.stop><input type="checkbox" :checked="selectedRuns.includes(run.run_id)" @change="toggleRun(run.run_id)" /></td>
                <td class="text-bold">{{ run.strategy_id }}</td>
                <td>{{ run.algorithm }}</td>
                <td>{{ run.objective }}</td>
                <td>{{ run.window_mode }} ({{ run.train_days }}d/{{ run.test_days }}d)</td>
                <td>
                  <span class="status-pill" :class="statusClass(run.status)">{{ run.status }}</span>
                </td>
                <td class="text-muted">{{ formatTime(run.time) }}</td>
              </tr>
              <tr v-if="expandedId === run.run_id" class="expand-row">
                <td colspan="7">
                  <WindowsTable
                    v-if="store.currentWindows.length > 0"
                    :windows="store.currentWindows"
                    :best-params="store.currentBestParams"
                  />
                  <div v-else class="empty-inline">No window data available</div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-else class="empty-state">No optimization runs</div>
      </div>

      <!-- Compare Modal -->
      <a-modal v-model:open="compareModalOpen" title="Compare Walk-Forward Runs" :footer="null" width="720px">
        <table v-if="compareData.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Run</th>
              <th v-for="(run, idx) in compareData" :key="idx">{{ String(run.run_id).slice(0, 8) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="text-bold">Strategy</td><td v-for="(run, idx) in compareData" :key="idx + 'strat'">{{ run.strategy_id }}</td></tr>
            <tr><td class="text-bold">Algorithm</td><td v-for="(run, idx) in compareData" :key="idx + 'algo'">{{ run.algorithm }}</td></tr>
            <tr><td class="text-bold">Objective</td><td v-for="(run, idx) in compareData" :key="idx + 'obj'">{{ run.objective }}</td></tr>
            <tr><td class="text-bold">Status</td><td v-for="(run, idx) in compareData" :key="idx + 'status'">{{ run.status }}</td></tr>
            <tr><td class="text-bold">Windows</td><td v-for="(run, idx) in compareData" :key="idx + 'win'">{{ run.window_mode }}</td></tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No comparison data</div>
      </a-modal>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWalkforwardStore } from '@/stores/walkforward';
import { walkforwardApi } from '@/api/walkforward';
import WindowsTable from '@/components/walkforward/WindowsTable.vue';
import { message } from 'ant-design-vue';

const store = useWalkforwardStore();
const expandedId = ref<string | null>(null);
const selectedRuns = ref<string[]>([]);
const compareModalOpen = ref(false);
const compareData = ref<Record<string, unknown>[]>([]);

async function toggleExpand(runId: string) {
  if (expandedId.value === runId) {
    expandedId.value = null;
    return;
  }
  expandedId.value = runId;
  await store.fetchWindows(runId);
}

function statusClass(status: string): string {
  switch (status) {
    case 'COMPLETED': case 'DONE': return 'status-completed';
    case 'FAILED': return 'status-failed';
    case 'PENDING': case 'RUNNING': return 'status-running';
    default: return 'status-default';
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}

function toggleRun(runId: string) {
  if (selectedRuns.value.includes(runId)) {
    selectedRuns.value = selectedRuns.value.filter((id) => id !== runId);
  } else {
    selectedRuns.value = [...selectedRuns.value, runId];
  }
}

async function onCompare() {
  try {
    compareData.value = await walkforwardApi.compare(selectedRuns.value);
    compareModalOpen.value = true;
  } catch {
    message.error('Failed to compare runs');
  }
}

onMounted(() => {
  store.fetchRuns();
});
</script>

<style scoped>
.walkforward-page {
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

.runs-card {
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

.wf-row { cursor: pointer; }
.wf-row:hover td { background: var(--q-hover); }

.expand-cell { width: 30px; text-align: center; }

.expand-icon {
  font-size: 9px;
  color: var(--q-text-muted);
  transition: transform 0.15s ease;
  display: inline-block;
}
.expand-icon.expanded { transform: rotate(90deg); }

.expand-row td {
  padding: 12px 12px 12px 40px;
  background: var(--q-bg);
  border-bottom: 1px solid var(--q-border);
}

.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}
.status-completed { border: 1px solid var(--q-success); color: var(--q-success); background: transparent; }
.status-failed { border: 1px solid var(--q-error); color: var(--q-error); background: transparent; }
.status-running { border: 1px solid var(--q-primary); color: var(--q-primary); background: transparent; }
.status-default { border: 1px solid var(--q-text-muted); color: var(--q-text-muted); background: transparent; }

.text-muted { color: var(--q-text-muted); }
.text-bold { font-weight: 600; }

.empty-inline {
  padding: 12px;
  color: var(--q-text-muted);
  font-size: 12px;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

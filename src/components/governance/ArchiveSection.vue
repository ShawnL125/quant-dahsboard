<template>
  <div class="archive-section">
    <a-spin :spinning="store.loading">
      <!-- Archive Status -->
      <div class="archive-card">
        <div class="section-header">
          <span class="section-title">Archive Status</span>
          <div class="header-actions">
            <a-button size="small" @click="onRefresh">Refresh</a-button>
            <a-button size="small" type="primary" @click="archiveModalOpen = true">Run Archive</a-button>
          </div>
        </div>
        <div v-if="store.archiveStatus" class="status-block">
          <table class="kv-table">
            <tbody>
              <tr v-for="(value, key) in store.archiveStatus" :key="String(key)">
                <td class="kv-key text-mono">{{ key }}</td>
                <td class="kv-value">{{ formatValue(value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No archive status available</div>
      </div>

      <!-- Archive History -->
      <div class="archive-card page-section">
        <div class="section-header">
          <span class="section-title">Archive History</span>
          <a-button size="small" @click="store.fetchArchiveRuns()">Refresh</a-button>
        </div>
        <table v-if="store.archiveRuns.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Symbols</th>
              <th>Status</th>
              <th>Records</th>
              <th>Start Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in store.archiveRuns" :key="run.run_id">
              <td class="text-mono">{{ run.run_id.slice(0, 8) }}</td>
              <td>{{ run.symbols.join(', ') }}</td>
              <td>
                <span class="status-pill" :class="getStatusClass(run.status)">{{ run.status }}</span>
              </td>
              <td class="text-bold">{{ run.records_archived }}</td>
              <td class="text-muted">{{ formatTime(run.start_time) }}</td>
              <td class="text-muted">{{ formatTime(run.end_time) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No archive runs</div>
      </div>
    </a-spin>

    <!-- Run Archive Modal -->
    <a-modal
      v-model:open="archiveModalOpen"
      title="Run Archive"
      @ok="onRunArchive"
      :confirm-loading="archiving"
    >
      <a-form layout="vertical">
        <a-form-item label="Symbols (comma-separated)" required>
          <a-input v-model:value="archiveForm.symbolsInput" placeholder="e.g. BTC/USDT, ETH/USDT" />
        </a-form-item>
        <a-form-item label="Start Time" required>
          <a-input v-model:value="archiveForm.start_time" placeholder="e.g. 2025-01-01T00:00:00Z" />
        </a-form-item>
        <a-form-item label="End Time" required>
          <a-input v-model:value="archiveForm.end_time" placeholder="e.g. 2025-12-31T23:59:59Z" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useGovernanceStore } from '@/stores/governance';
import { message } from 'ant-design-vue';

const store = useGovernanceStore();

const archiveModalOpen = ref(false);
const archiving = ref(false);
const archiveForm = reactive({
  symbolsInput: '',
  start_time: '',
  end_time: '',
});

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); }
    catch { return String(value); }
  }
  return String(value);
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'COMPLETED': case 'DONE': return 'status-completed';
    case 'FAILED': return 'status-failed';
    case 'RUNNING': case 'PENDING': return 'status-running';
    default: return 'status-default';
  }
}

function onRefresh() {
  store.fetchArchiveStatus();
  store.fetchArchiveRuns();
}

async function onRunArchive() {
  if (!archiveForm.symbolsInput || !archiveForm.start_time || !archiveForm.end_time) {
    message.warning('All fields are required');
    return;
  }
  const symbols = archiveForm.symbolsInput
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (symbols.length === 0) {
    message.warning('At least one symbol is required');
    return;
  }

  archiving.value = true;
  try {
    await store.runArchive({
      symbols,
      start_time: archiveForm.start_time,
      end_time: archiveForm.end_time,
    });
    message.success('Archive run started');
    archiveModalOpen.value = false;
    archiveForm.symbolsInput = '';
    archiveForm.start_time = '';
    archiveForm.end_time = '';
    store.fetchArchiveRuns();
  } catch {
    message.error('Failed to start archive run');
  } finally {
    archiving.value = false;
  }
}

onMounted(() => {
  store.fetchArchiveStatus();
  store.fetchArchiveRuns();
});
</script>

<style scoped>
.archive-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-section {
  margin-top: var(--q-card-gap);
}

.archive-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status-block {
  margin-top: 8px;
}

.kv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.kv-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--q-border);
}

.kv-table tr:last-child td { border-bottom: none; }

.kv-key {
  color: var(--q-text-muted);
  font-size: 11px;
  width: 200px;
}

.kv-value {
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

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); }

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

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

<template>
  <div class="archive-section">
    <a-spin :spinning="store.loading">
      <!-- Archived Runs -->
      <div class="archive-block">
        <div class="section-header">
          <span class="section-title">Archived Runs</span>
          <div class="header-actions">
            <a-button size="small" @click="store.fetchEntries()">Refresh</a-button>
            <a-button size="small" type="primary" @click="archiveModalOpen = true">Archive Run</a-button>
          </div>
        </div>
        <table v-if="store.entries.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Strategy</th>
              <th>Version</th>
              <th>Tag</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in store.entries" :key="entry.run_id">
              <td class="text-mono">{{ entry.run_id.slice(0, 8) }}</td>
              <td>{{ entry.strategy_id }}</td>
              <td class="text-mono">{{ entry.strategy_version }}</td>
              <td>
                <span
                  v-if="editingTag !== entry.run_id"
                  class="tag-display"
                  @click="startEditTag(entry)"
                >{{ entry.tag || '-' }}</span>
                <a-input
                  v-else
                  v-model:value="editTagValue"
                  size="small"
                  style="width: 120px"
                  @pressEnter="saveTag(entry.run_id)"
                  @blur="saveTag(entry.run_id)"
                />
              </td>
              <td class="text-muted">{{ formatTime(entry.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No archived runs</div>
      </div>

      <!-- Version Summary -->
      <div class="archive-block">
        <div class="section-header">
          <span class="section-title">Version Summary</span>
          <a-select
            v-model:value="selectedStrategy"
            size="small"
            style="width: 200px"
            placeholder="Select strategy"
            allow-clear
            @change="onStrategyChange"
          >
            <a-select-option v-for="s in strategyIds" :key="s" :value="s">{{ s }}</a-select-option>
          </a-select>
        </div>
        <table v-if="store.versions.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Runs</th>
              <th>Avg Sharpe</th>
              <th>Avg Return</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in store.versions" :key="v.version">
              <td class="text-mono">{{ v.version }}</td>
              <td>{{ v.run_count }}</td>
              <td>{{ parseFloat(v.avg_sharpe).toFixed(2) }}</td>
              <td :class="parseFloat(v.avg_return) >= 0 ? 'val-positive' : 'val-negative'">
                {{ parseFloat(v.avg_return).toFixed(2) }}%
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No version data</div>
      </div>

      <!-- Compare -->
      <div class="archive-block">
        <div class="section-header">
          <span class="section-title">Compare Versions</span>
          <div class="header-actions">
            <a-select
              v-model:value="compareA"
              size="small"
              style="width: 160px"
              placeholder="Version A"
            >
              <a-select-option v-for="v in versionOptions" :key="v" :value="v">{{ v }}</a-select-option>
            </a-select>
            <span class="compare-vs">vs</span>
            <a-select
              v-model:value="compareB"
              size="small"
              style="width: 160px"
              placeholder="Version B"
            >
              <a-select-option v-for="v in versionOptions" :key="v" :value="v">{{ v }}</a-select-option>
            </a-select>
            <a-button size="small" :disabled="!compareA || !compareB" @click="onCompare">Compare</a-button>
          </div>
        </div>
        <template v-if="store.comparison">
          <div class="compare-grid">
            <div class="compare-col">
              <div class="compare-label">Params Diff</div>
              <pre class="compare-code">{{ formatJson(store.comparison.params_diff) }}</pre>
            </div>
            <div class="compare-col">
              <div class="compare-label">Metrics Diff</div>
              <pre class="compare-code">{{ formatJson(store.comparison.metrics_diff) }}</pre>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">Select two versions to compare</div>
      </div>
    </a-spin>

    <!-- Archive Run Modal -->
    <a-modal
      v-model:open="archiveModalOpen"
      title="Archive Run"
      @ok="onArchiveRun"
      :confirm-loading="archiving"
    >
      <a-form layout="vertical">
        <a-form-item label="Run ID" required>
          <a-input v-model:value="archiveForm.run_id" placeholder="Enter run ID" />
        </a-form-item>
        <a-form-item label="Strategy ID">
          <a-input v-model:value="archiveForm.strategy_id" />
        </a-form-item>
        <a-form-item label="Tag">
          <a-input v-model:value="archiveForm.tag" />
        </a-form-item>
        <a-form-item label="Label">
          <a-input v-model:value="archiveForm.label" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useArchiveStore } from '@/stores/archive';
import { message } from 'ant-design-vue';

const store = useArchiveStore();

// Tag editing
const editingTag = ref<string | null>(null);
const editTagValue = ref('');

// Version filter
const selectedStrategy = ref<string | undefined>(undefined);

// Compare
const compareA = ref<string | undefined>(undefined);
const compareB = ref<string | undefined>(undefined);

// Archive modal
const archiveModalOpen = ref(false);
const archiving = ref(false);
const archiveForm = reactive({
  run_id: '',
  strategy_id: '',
  tag: '',
  label: '',
});

const strategyIds = computed(() => {
  const ids = new Set(store.entries.map((e) => e.strategy_id));
  return [...ids];
});

const versionOptions = computed(() =>
  store.versions.map((v) => v.version)
);

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}

function formatJson(obj: Record<string, unknown>): string {
  try { return JSON.stringify(obj, null, 2); }
  catch { return '{}'; }
}

function startEditTag(entry: { run_id: string; tag: string }) {
  editingTag.value = entry.run_id;
  editTagValue.value = entry.tag;
}

async function saveTag(runId: string) {
  if (editingTag.value !== runId) return;
  editingTag.value = null;
  try {
    await store.updateTag(runId, editTagValue.value);
    message.success('Tag updated');
    store.fetchEntries();
  } catch {
    message.error('Failed to update tag');
  }
}

async function onStrategyChange(value: string | undefined) {
  if (value) {
    await store.fetchVersions(value);
  } else {
    store.versions = [];
  }
  store.comparison = null;
  compareA.value = undefined;
  compareB.value = undefined;
}

async function onCompare() {
  if (!selectedStrategy.value || !compareA.value || !compareB.value) return;
  try {
    await store.compareVersions(selectedStrategy.value, compareA.value, compareB.value);
  } catch {
    message.error('Failed to compare versions');
  }
}

async function onArchiveRun() {
  if (!archiveForm.run_id) {
    message.warning('Run ID is required');
    return;
  }
  archiving.value = true;
  try {
    await store.archiveRun(archiveForm.run_id, {
      strategy_id: archiveForm.strategy_id,
      tag: archiveForm.tag || undefined,
      label: archiveForm.label || undefined,
    });
    message.success('Run archived');
    archiveModalOpen.value = false;
    archiveForm.run_id = '';
    archiveForm.strategy_id = '';
    archiveForm.tag = '';
    archiveForm.label = '';
    store.fetchEntries();
  } catch {
    message.error('Failed to archive run');
  } finally {
    archiving.value = false;
  }
}

onMounted(() => {
  store.fetchEntries();
});
</script>

<style scoped>
.archive-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.archive-block {
  background: var(--q-card);
  border: 1px solid var(--q-border);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
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

.text-mono { font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
.text-muted { color: var(--q-text-muted); }

.val-positive { color: var(--q-success); font-weight: 600; }
.val-negative { color: var(--q-error); font-weight: 600; }

.tag-display {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-display:hover {
  background: var(--q-hover);
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}

.compare-vs {
  color: var(--q-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.compare-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}

.compare-code {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  padding: 16px;
  border-radius: var(--q-card-radius);
  font-size: 12px;
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  color: var(--q-text-secondary);
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
}
</style>

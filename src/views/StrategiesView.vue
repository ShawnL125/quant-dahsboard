<template>
  <div class="strategies-page">
    <div class="action-bar">
      <div class="action-left">
        <span class="active-count">{{ activeCount }} Active</span>
        <span class="total-count">/ {{ store.strategies.length }} Total</span>
      </div>
      <a-button type="primary" :loading="store.loading" @click="onReload">
        Reload
      </a-button>
    </div>

    <a-alert
      v-if="store.error"
      :message="store.error"
      type="error"
      show-icon
      class="page-section"
    />

    <StrategyList
      :strategies="store.strategies"
      @toggle="onToggle"
      @view="onView"
      class="page-section"
    />

    <!-- Strategy Detail Drawer -->
    <a-drawer
      :open="detailOpen"
      :width="640"
      :title="store.selectedStrategy?.strategy_id || 'Strategy'"
      @close="detailOpen = false"
    >
      <template v-if="store.selectedStrategy">
        <div class="detail-section">
          <div class="detail-row"><span class="detail-label">Symbols</span><span>{{ store.selectedStrategy.symbols.join(', ') }}</span></div>
          <div class="detail-row"><span class="detail-label">Exchanges</span><span>{{ store.selectedStrategy.exchanges.join(', ') }}</span></div>
          <div class="detail-row"><span class="detail-label">Timeframes</span><span>{{ store.selectedStrategy.timeframes.join(', ') }}</span></div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-pill" :class="store.selectedStrategy.is_running ? 'status-ok' : 'status-error'">
              {{ store.selectedStrategy.is_running ? 'Running' : 'Stopped' }}
            </span>
          </div>
        </div>

        <!-- Parameters Panel -->
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">Parameters</span>
            <span class="params-source">Source: {{ store.paramsSource }}</span>
          </div>
          <div v-if="Object.keys(store.params).length > 0" class="params-grid">
            <div v-for="(value, key) in store.params" :key="String(key)" class="param-row">
              <span class="param-key">{{ key }}</span>
              <a-input
                v-if="editingParams"
                :value="String(value)"
                size="small"
                class="param-input"
                @change="onParamChange(String(key), $event)"
              />
              <span v-else class="param-value">{{ value }}</span>
            </div>
          </div>
          <div v-else class="empty-sm">No parameters</div>
          <div class="params-actions">
            <a-button v-if="!editingParams" size="small" @click="startEditParams">Edit Parameters</a-button>
            <template v-else>
              <a-button size="small" type="primary" :loading="savingParams" @click="onSaveParams">Save</a-button>
              <a-button size="small" @click="cancelEditParams">Cancel</a-button>
            </template>
          </div>
        </div>

        <!-- Audit Log -->
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">Parameter Audit Log</span>
          </div>
          <table v-if="store.paramsAudit.length > 0" class="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Param</th>
                <th>Old</th>
                <th>New</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in store.paramsAudit" :key="entry.time + entry.param_name">
                <td class="text-muted">{{ formatTime(entry.time) }}</td>
                <td class="text-bold">{{ entry.param_name }}</td>
                <td class="text-mono">{{ entry.old_value }}</td>
                <td class="text-mono text-bold">{{ entry.new_value }}</td>
                <td>{{ entry.source }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-sm">No audit entries</div>
        </div>

        <!-- Rebalance Section -->
        <div class="detail-section">
          <RebalanceSection :strategy-id="store.selectedStrategy.strategy_id" />
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStrategiesStore } from '@/stores/strategies';
import StrategyList from '@/components/strategies/StrategyList.vue';
import RebalanceSection from '@/components/strategies/RebalanceSection.vue';
import { message } from 'ant-design-vue';

const store = useStrategiesStore();
const detailOpen = ref(false);
const editingParams = ref(false);
const savingParams = ref(false);
const editedParams = ref<Record<string, string>>({});

const activeCount = computed(() => store.strategies.filter((s) => s.is_running).length);

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

async function onToggle(id: string, enabled: boolean) {
  await store.toggleStrategy(id, enabled);
  message.success(`Strategy ${enabled ? 'enabled' : 'disabled'}`);
}

async function onView(id: string) {
  await store.selectStrategy(id);
  await store.fetchParams(id);
  await store.fetchParamsAudit(id, 20);
  detailOpen.value = true;
  editingParams.value = false;
}

async function onReload() {
  await store.reloadStrategies();
  message.success('Strategies reloaded');
}

function startEditParams() {
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(store.params)) {
    p[k] = String(v);
  }
  editedParams.value = p;
  editingParams.value = true;
}

function cancelEditParams() {
  editingParams.value = false;
}

function onParamChange(key: string, event: { target: { value: string } }) {
  editedParams.value = { ...editedParams.value, [key]: event.target.value };
}

async function onSaveParams() {
  if (!store.selectedStrategy) return;
  savingParams.value = true;
  try {
    await store.updateParams(store.selectedStrategy.strategy_id, { ...editedParams.value });
    message.success('Parameters updated');
    editingParams.value = false;
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : 'Failed to update parameters');
  } finally {
    savingParams.value = false;
  }
}

onMounted(() => {
  store.fetchStrategies();
});
</script>

<style scoped>
.strategies-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.active-count {
  font-size: 16px;
  font-weight: 700;
  color: var(--q-text);
}

.total-count {
  font-size: 13px;
  color: var(--q-text-muted);
}

.page-section { margin-top: 0; }

.detail-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--q-border);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.detail-label {
  color: var(--q-text-muted);
  font-size: 12px;
}

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--q-primary-dark); }
.params-source { font-size: 11px; color: var(--q-text-muted); }

.params-grid { display: flex; flex-direction: column; gap: 4px; }
.param-row { display: flex; align-items: center; gap: 12px; }
.param-key { font-size: 12px; font-weight: 600; color: var(--q-text); min-width: 140px; }
.param-value { font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--q-text-secondary); }
.param-input { flex: 1; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; }

.params-actions { margin-top: 10px; display: flex; gap: 8px; }

.status-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.status-ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.status-error { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { text-align: left; color: var(--q-text-muted); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; padding: 6px 0; }
.data-table td { padding: 8px 0; color: var(--q-text); border-bottom: 1px solid var(--q-border); }
.data-table tbody tr:last-child td { border-bottom: none; }

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.empty-sm { text-align: center; color: var(--q-text-muted); padding: 12px 0; font-size: 12px; }
</style>

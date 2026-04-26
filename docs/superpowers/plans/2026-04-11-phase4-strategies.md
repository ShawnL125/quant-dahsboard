# Phase 4: Strategies Page Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan.

> **IMPORTANT: This plan must preserve the existing parameter hot-reload workflow (fetch/edit/save parameters, parameter audit log). Redesign should only change presentation, not remove capabilities.**
>
> The current `StrategyDetail.vue` drawer must continue to support:
> - Editable parameter inputs (not just static display of `strategy.parameters`)
> - Save / Cancel controls that call `fetchParams()`, `updateParams()`, and `fetchParamsAudit()` from the strategies store
> - Parameter Audit Log table showing historical parameter changes
> - Live parameter updates via `updateParamsFromWS()`

**Goal:** Redesign Strategies page with Figma-style card grid layout instead of table, and restyled detail drawer.

**Architecture:** Replace Ant Design table with 2-column card grid. Each card shows strategy name, switch toggle, key metrics. Detail drawer keeps Ant Design drawer but with restyled content.

**Tech Stack:** CSS Grid, CSS variables from theme.css, Ant Design Switch + Drawer

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/components/strategies/StrategyList.vue` | Modify | Card grid instead of table |
| `src/components/strategies/StrategyDetail.vue` | Modify | Restyled drawer content |
| `src/views/StrategiesView.vue` | Modify | Action bar with reload button |

---

### Task 1: Rewrite StrategyList as Card Grid

**Files:**
- Modify: `src/components/strategies/StrategyList.vue`

Replace entire file:

```vue
<template>
  <div class="strategy-grid">
    <div v-for="s in strategies" :key="s.strategy_id" class="strategy-card">
      <div class="card-header">
        <span class="strategy-name">{{ s.strategy_id }}</span>
        <a-switch
          :checked="s.is_running"
          @change="(checked: boolean) => emit('toggle', s.strategy_id, checked)"
        />
      </div>
      <div class="card-body">
        <div class="metrics-row">
          <div class="metric">
            <span class="metric-label">Symbol</span>
            <span class="metric-value">
              <span v-for="sym in s.symbols" :key="sym" class="tag-blue">{{ sym }}</span>
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Exchange</span>
            <span class="metric-value">
              <span v-for="ex in s.exchanges" :key="ex" class="tag-gray">{{ ex }}</span>
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Timeframe</span>
            <span class="metric-value">{{ s.timeframes.join(', ') }}</span>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <span class="view-link" @click="emit('view', s.strategy_id)">View Details →</span>
        <span class="status-dot" :class="s.is_running ? 'running' : 'stopped'"></span>
      </div>
    </div>
    <div v-if="strategies.length === 0" class="empty-state">No strategies found</div>
  </div>
</template>

<script setup lang="ts">
import type { Strategy } from '@/types';

defineProps<{
  strategies: Strategy[];
}>();

const emit = defineEmits<{
  toggle: [id: string, enabled: boolean];
  view: [id: string];
}>();
</script>

<style scoped>
.strategy-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--q-card-gap);
}

.strategy-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.strategy-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--q-text);
}

.card-body {
  flex: 1;
}

.metrics-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.metric-label {
  color: var(--q-text-muted);
}

.metric-value {
  font-weight: 500;
  color: var(--q-text);
  display: flex;
  gap: 4px;
}

.tag-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
}

.tag-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--q-border);
}

.view-link {
  font-size: 12px;
  color: var(--q-primary);
  cursor: pointer;
  font-weight: 500;
}

.view-link:hover {
  text-decoration: underline;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.running {
  background: var(--q-success);
}

.status-dot.stopped {
  background: var(--q-text-muted);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--q-text-muted);
  padding: 40px 0;
  font-size: 13px;
}
</style>
```

Commit: `git add src/components/strategies/StrategyList.vue && git commit -m "feat: strategy card grid layout with toggle switches"`

---

### Task 2: Restyle StrategyDetail Drawer

**Files:**
- Modify: `src/components/strategies/StrategyDetail.vue`

Replace entire file:

```vue
<template>
  <a-drawer
    :open="open"
    :width="480"
    @close="emit('close')"
  >
    <template #title>
      <div class="drawer-title">
        <span>{{ strategy?.strategy_id || 'Strategy Details' }}</span>
        <span v-if="strategy" class="status-pill" :class="strategy.is_running ? 'status-running' : 'status-stopped'">
          {{ strategy.is_running ? 'Running' : 'Stopped' }}
        </span>
      </div>
    </template>
    <template v-if="strategy">
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Symbols</span>
          <span class="metric-value">
            <span v-for="sym in strategy.symbols" :key="sym" class="tag-blue">{{ sym }}</span>
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Exchanges</span>
          <span class="metric-value">
            <span v-for="ex in strategy.exchanges" :key="ex" class="tag-gray">{{ ex }}</span>
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Timeframes</span>
          <span class="metric-value">{{ strategy.timeframes.join(', ') }}</span>
        </div>
      </div>

      <!-- Parameter Hot-Reload Section (PRESERVED from existing code) -->
      <div class="params-section">
        <div class="section-title">Parameters</div>
        <a-spin :spinning="paramsLoading">
          <div v-if="Object.keys(editedParams).length > 0" class="params-grid">
            <div v-for="(value, key) in editedParams" :key="String(key)" class="param-row">
              <span class="param-key">{{ String(key) }}</span>
              <input
                class="param-input"
                :value="JSON.stringify(value)"
                @change="(e: Event) => onParamChange(String(key), (e.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div v-else class="empty-params">No parameters</div>
        </a-spin>
        <div v-if="hasParamChanges" class="params-actions">
          <a-button type="primary" size="small" :loading="paramsSaving" @click="onSaveParams">Save</a-button>
          <a-button size="small" @click="onCancelParams">Cancel</a-button>
        </div>
      </div>

      <!-- Parameter Audit Log (PRESERVED from existing code) -->
      <div v-if="paramAuditLog.length > 0" class="audit-section">
        <div class="section-title">Parameter Audit Log</div>
        <table class="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in paramAuditLog" :key="entry.timestamp">
              <td class="text-mono">{{ entry.timestamp }}</td>
              <td class="text-mono">{{ JSON.stringify(entry.changes) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <div v-else class="empty-state">No strategy selected</div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStrategiesStore } from '@/stores/strategies';
import type { Strategy, ParamAuditEntry } from '@/types';

const props = defineProps<{
  strategy: Strategy | null;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const store = useStrategiesStore();

// Parameter hot-reload state (PRESERVED from existing code)
const editedParams = ref<Record<string, unknown>>({});
const originalParams = ref<Record<string, unknown>>({});
const paramsLoading = ref(false);
const paramsSaving = ref(false);
const paramAuditLog = ref<ParamAuditEntry[]>([]);

const hasParamChanges = computed(() =>
  JSON.stringify(editedParams.value) !== JSON.stringify(originalParams.value)
);

function onParamChange(key: string, rawValue: string) {
  try {
    editedParams.value = { ...editedParams.value, [key]: JSON.parse(rawValue) };
  } catch {
    editedParams.value = { ...editedParams.value, [key]: rawValue };
  }
}

async function onSaveParams() {
  if (!props.strategy) return;
  paramsSaving.value = true;
  await store.updateParams(props.strategy.strategy_id, editedParams.value);
  originalParams.value = { ...editedParams.value };
  await store.fetchParamsAudit(props.strategy.strategy_id);
  paramAuditLog.value = store.paramAuditLog;
  paramsSaving.value = false;
}

function onCancelParams() {
  editedParams.value = { ...originalParams.value };
}

// Fetch params + audit log when strategy changes
watch(() => [props.strategy?.strategy_id, props.open], async ([id, isOpen]) => {
  if (id && isOpen) {
    paramsLoading.value = true;
    await store.fetchParams(String(id));
    editedParams.value = { ...store.currentParams };
    originalParams.value = { ...store.currentParams };
    await store.fetchParamsAudit(String(id));
    paramAuditLog.value = store.paramAuditLog;
    paramsLoading.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.status-pill {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.status-running {
  background: var(--q-success-light);
  color: var(--q-success);
}

.status-stopped {
  background: var(--q-hover);
  color: var(--q-text-muted);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  background: var(--q-bg);
  border-radius: 8px;
  padding: 12px;
}

.metric-label {
  display: block;
  font-size: 11px;
  color: var(--q-text-muted);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--q-text);
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
}

.tag-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
}

.params-section {
  margin-top: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
}

.params-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--q-bg);
  border-radius: 8px;
  overflow: hidden;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--q-border);
}

.param-row:last-child {
  border-bottom: none;
}

.param-key {
  color: var(--q-text-secondary);
  font-weight: 500;
}

.param-value {
  color: var(--q-text);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.param-input {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 4px;
  color: var(--q-text);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  padding: 2px 6px;
  width: 60%;
}

.params-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.audit-section {
  margin-top: 24px;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background: var(--q-bg);
  border-radius: 8px;
  overflow: hidden;
}

.audit-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  padding: 6px 12px;
  border-bottom: 1px solid var(--q-border);
}

.audit-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--q-border);
  color: var(--q-text);
}

.audit-table tbody tr:last-child td { border-bottom: none; }

.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.empty-params {
  text-align: center;
  color: var(--q-text-muted);
  padding: 16px 0;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 40px 0;
  font-size: 13px;
}
</style>
```

Commit: `git add src/components/strategies/StrategyDetail.vue && git commit -m "feat: restyle strategy detail drawer with metrics grid"`

---

### Task 3: Restyle StrategiesView

**Files:**
- Modify: `src/views/StrategiesView.vue`

Replace entire file:

```vue
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

    <StrategyDetail
      :strategy="store.selectedStrategy"
      :open="detailOpen"
      @close="detailOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStrategiesStore } from '@/stores/strategies';
import StrategyList from '@/components/strategies/StrategyList.vue';
import StrategyDetail from '@/components/strategies/StrategyDetail.vue';
import { message } from 'ant-design-vue';

const store = useStrategiesStore();
const detailOpen = ref(false);

const activeCount = computed(() => store.strategies.filter((s) => s.is_running).length);

async function onToggle(id: string, enabled: boolean) {
  await store.toggleStrategy(id, enabled);
  message.success(`Strategy ${enabled ? 'enabled' : 'disabled'}`);
}

async function onView(id: string) {
  await store.selectStrategy(id);
  detailOpen.value = true;
}

async function onReload() {
  await store.reloadStrategies();
  message.success('Strategies reloaded');
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

.page-section {
  margin-top: 0;
}
</style>
```

Commit: `git add src/views/StrategiesView.vue && git commit -m "feat: restyle strategies page with action bar and counts"`

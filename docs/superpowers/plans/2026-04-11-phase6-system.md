# Phase 6: System Page Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

> **IMPORTANT: This plan must preserve all existing monitoring surfaces (connector health cards, quality alerts feed, reconciliation alerts, config reload, periodic quality refresh). Redesign should only change presentation, not remove capabilities.**
>
> The current `SystemView.vue` includes these features that MUST be retained:
> - **ConnectorHealthCards** component showing per-connector health status
> - **QualityAlertsFeed** component showing data quality alerts stream
> - **Reconciliation Alerts** table with level/type/message columns and refresh button
> - **Reload Config** button inside the configuration collapse panel
> - **15-second periodic quality refresh** loop (`setInterval` in `onMounted`, cleared in `onUnmounted`)
> - **Quality Store** (`useQualityStore`) and **Reconciliation Store** (`useReconciliationStore`) imports and data fetching

**Goal:** Redesign System page with Figma-style health cards, horizontal component status, styled config viewer, and clean event stats table.

**Architecture:** Replace Ant Design cards/tables/descriptions with custom styled containers using CSS variables. Health cards use colored status indicators. Component status uses horizontal flex layout. Config uses styled code block.

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/components/system/HealthStatus.vue` | Modify | 3 health cards with colored status dots |
| `src/components/system/ComponentStatus.vue` | Modify | Horizontal flex with status dots |
| `src/views/SystemView.vue` | Modify | Styled config viewer + event table |

---

### Task 1: Restyle HealthStatus

Replace `src/components/system/HealthStatus.vue`:

```vue
<template>
  <div class="health-grid">
    <div class="health-card">
      <span class="health-label">Liveness</span>
      <div class="health-status">
        <span class="status-dot" :class="isLive ? 'dot-ok' : 'dot-error'"></span>
        <span class="status-text">{{ liveness?.status || 'Unknown' }}</span>
      </div>
    </div>
    <div class="health-card">
      <span class="health-label">Readiness</span>
      <div class="health-status">
        <span class="status-dot" :class="isReady ? 'dot-ok' : 'dot-error'"></span>
        <span class="status-text">{{ readiness?.status || 'Unknown' }}</span>
      </div>
    </div>
    <div class="health-card">
      <span class="health-label">Uptime</span>
      <span class="uptime-value">{{ formatUptime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HealthStatus } from '@/types';

const props = defineProps<{
  liveness: HealthStatus | null;
  readiness: HealthStatus | null;
}>();

const isLive = computed(() =>
  props.liveness?.status === 'ok' || props.liveness?.status === 'healthy',
);

const isReady = computed(() =>
  props.readiness?.status === 'ok' || props.readiness?.status === 'ready',
);

const formatUptime = computed(() => {
  const seconds = props.liveness?.uptime_seconds ?? 0;
  if (!seconds || seconds <= 0) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
});
</script>

<style scoped>
.health-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--q-card-gap);
}

.health-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.health-label {
  font-size: 12px;
  color: var(--q-text-muted);
  display: block;
  margin-bottom: 10px;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-ok { background: var(--q-success); }
.dot-error { background: var(--q-error); }

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-text);
}

.uptime-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--q-primary-dark);
}
</style>
```

Commit: `git add src/components/system/HealthStatus.vue && git commit -m "feat: restyle health status cards with colored dots"`

---

### Task 2: Restyle ComponentStatus

Replace `src/components/system/ComponentStatus.vue`:

```vue
<template>
  <div class="component-card">
    <div class="card-title">Components</div>
    <div class="component-list">
      <div class="component-item">
        <div class="comp-info">
          <span class="comp-name">Exchanges</span>
          <span class="comp-desc">Connected trading venues</span>
        </div>
        <div class="comp-tags">
          <span v-for="ex in exchanges" :key="ex" class="tag-blue">{{ ex }}</span>
          <span v-if="exchanges.length === 0" class="text-muted">None</span>
        </div>
      </div>
      <div class="component-divider"></div>
      <div class="component-item">
        <div class="comp-info">
          <span class="comp-name">Subscriptions</span>
          <span class="comp-desc">Market data feeds</span>
        </div>
        <div class="comp-tags">
          <template v-if="Object.keys(subscriptions).length > 0">
            <div v-for="(symbols, exchange) in subscriptions" :key="String(exchange)" class="sub-row">
              <span class="sub-exchange">{{ exchange }}:</span>
              <span v-for="sym in symbols" :key="sym" class="tag-gray">{{ sym }}</span>
            </div>
          </template>
          <span v-else class="text-muted">None</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  exchanges: string[];
  subscriptions: Record<string, string[]>;
}>();
</script>

<style scoped>
.component-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 16px;
}

.component-list {
  display: flex;
  gap: 0;
}

.component-item {
  flex: 1;
  padding: 0 20px;
}

.component-item:first-child {
  padding-left: 0;
}

.component-item:last-child {
  padding-right: 0;
}

.component-divider {
  width: 1px;
  background: var(--q-border);
  flex-shrink: 0;
}

.comp-info {
  margin-bottom: 8px;
}

.comp-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.comp-desc {
  font-size: 11px;
  color: var(--q-text-muted);
}

.comp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-direction: column;
}

.tag-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  display: inline-block;
}

.tag-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  display: inline-block;
}

.sub-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.sub-exchange {
  font-size: 11px;
  font-weight: 600;
  color: var(--q-text);
}

.text-muted {
  color: var(--q-text-muted);
  font-size: 12px;
}
</style>
```

Commit: `git add src/components/system/ComponentStatus.vue && git commit -m "feat: restyle component status with horizontal layout"`

---

### Task 3: Restyle SystemView

Replace `src/views/SystemView.vue`:

```vue
<template>
  <div class="system-page">
    <a-spin :spinning="store.loading">
      <HealthStatus
        :liveness="store.liveness"
        :readiness="store.readiness"
      />

      <ComponentStatus
        :exchanges="store.status?.connected_exchanges || []"
        :subscriptions="store.status?.subscribed_symbols || {}"
        class="page-section"
      />

      <!-- Data Quality Monitoring section (PRESERVED from existing code) -->
      <div class="quality-section page-section">
        <div class="section-header">
          <span class="section-title">Data Quality Monitoring</span>
          <a-button size="small" @click="refreshQuality">Refresh</a-button>
        </div>

        <ConnectorHealthCards
          :connectors="qualityStore.healthReady?.connectors || qualityStore.systemStatus?.connectors || null"
          class="quality-block"
        />

        <div class="quality-alerts-card quality-block">
          <QualityAlertsFeed :alerts="qualityStore.alerts" />
        </div>
      </div>

      <div class="config-card page-section">
        <a-collapse>
          <a-collapse-panel key="config" header="Configuration">
            <div class="config-actions">
              <a-button size="small" @click="onReloadConfig" :loading="reloading">Reload Config</a-button>
            </div>
            <pre class="config-code">{{ formatJson(store.config) }}</pre>
          </a-collapse-panel>
        </a-collapse>
      </div>

      <div class="events-card page-section">
        <div class="card-header">
          <span class="card-title">Event Statistics</span>
        </div>
        <table v-if="store.eventStats && eventRows.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Event Type</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in eventRows" :key="row.type">
              <td class="text-mono">{{ row.type }}</td>
              <td class="text-bold">{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No event statistics available</div>
      </div>

      <!-- Reconciliation Alerts section (PRESERVED from existing code) -->
      <div class="recon-card page-section">
        <div class="card-header">
          <span class="card-title">Reconciliation Alerts</span>
          <a-button size="small" @click="reconStore.fetchAll()">Refresh</a-button>
        </div>
        <table v-if="reconStore.alerts.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Type</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in reconStore.alerts" :key="alert.alert_id">
              <td>
                <span class="level-pill" :class="alert.level === 'critical' ? 'level-critical' : alert.level === 'warning' ? 'level-warning' : 'level-info'">{{ alert.level }}</span>
              </td>
              <td class="text-mono">{{ alert.alert_type }}</td>
              <td>{{ alert.message }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No reconciliation alerts</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useSystemStore } from '@/stores/system';
import { useQualityStore } from '@/stores/quality';
import { useReconciliationStore } from '@/stores/reconciliation';
import HealthStatus from '@/components/system/HealthStatus.vue';
import ComponentStatus from '@/components/system/ComponentStatus.vue';
import ConnectorHealthCards from '@/components/quality/ConnectorHealthCards.vue';
import QualityAlertsFeed from '@/components/quality/QualityAlertsFeed.vue';
import type { EventStats } from '@/types';

const store = useSystemStore();
const qualityStore = useQualityStore();
const reconStore = useReconciliationStore();

const eventRows = computed(() => {
  if (!store.eventStats) return [];
  return Object.entries(store.eventStats as EventStats).map(([type, count]) => ({
    type,
    count,
  }));
});

let qualityTimer: ReturnType<typeof setInterval> | null = null;
const reloading = ref(false);

function onReloadConfig() {
  reloading.value = true;
  store.reloadConfig().finally(() => { reloading.value = false; });
}

function refreshQuality() {
  qualityStore.fetchAll();
}

function formatJson(data: unknown): string {
  if (!data) return 'No configuration loaded';
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

onMounted(() => {
  store.fetchAll();
  qualityStore.fetchAll();
  reconStore.fetchAll();
  qualityTimer = setInterval(() => qualityStore.fetchAll(), 15000);
});

onUnmounted(() => {
  if (qualityTimer) clearInterval(qualityTimer);
});
</script>

<style scoped>
.system-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: var(--q-card-gap); }
.page-section:first-child { margin-top: 0; }

.quality-section {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
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

.quality-block {
  padding-top: 8px;
  border-top: 1px solid var(--q-border);
}

.quality-block:first-of-type {
  border-top: none;
  padding-top: 0;
}

.quality-alerts-card {
  background: transparent;
}

.config-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  box-shadow: var(--q-card-shadow);
  overflow: hidden;
}

.config-actions {
  margin-bottom: 12px;
}

.config-code {
  max-height: 400px;
  overflow: auto;
  background: var(--q-bg);
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--q-text);
  margin: 0;
  line-height: 1.6;
}

.events-card,
.recon-card {
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

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
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

.level-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.level-critical { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.level-warning { background: rgba(234, 179, 8, 0.12); color: #eab308; }
.level-info { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>
```

Verify build: `npm run build`
Commit: `git add src/views/SystemView.vue && git commit -m "feat: restyle system page with config viewer and event table"`

<template>
  <div class="system-page">
    <a-tabs v-model:activeKey="activeTab" class="system-tabs">
      <!-- Health Tab -->
      <a-tab-pane key="health" tab="Health">
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
        </a-spin>
      </a-tab-pane>

      <!-- Quality Tab -->
      <a-tab-pane key="quality" tab="Quality">
        <div class="quality-section">
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
      </a-tab-pane>

      <!-- Config Tab -->
      <a-tab-pane key="config" tab="Config">
        <div class="config-card">
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
      </a-tab-pane>

      <!-- Reconciliation Tab -->
      <a-tab-pane key="reconciliation" tab="Reconciliation">
        <div class="recon-card">
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
      </a-tab-pane>

      <!-- Admin Tab -->
      <a-tab-pane key="admin" tab="Admin">
        <AdminSection />
      </a-tab-pane>

      <!-- Warmup Tab -->
      <a-tab-pane key="warmup" tab="Warmup">
        <WarmupSection />
      </a-tab-pane>

      <!-- Exchange Health Tab -->
      <a-tab-pane key="exchange-health" tab="Exchange Health">
        <ExchangeHealthSection />
      </a-tab-pane>

      <!-- Security Tab -->
      <a-tab-pane key="security" tab="Security">
        <SecuritySection />
      </a-tab-pane>
    </a-tabs>

    <a-alert
      v-if="store.error"
      :message="store.error"
      type="error"
      show-icon
      class="page-section"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useSystemStore } from '@/stores/system';
import { useQualityStore } from '@/stores/quality';
import { useReconciliationStore } from '@/stores/reconciliation';
import HealthStatus from '@/components/system/HealthStatus.vue';
import ComponentStatus from '@/components/system/ComponentStatus.vue';
import ConnectorHealthCards from '@/components/quality/ConnectorHealthCards.vue';
import QualityAlertsFeed from '@/components/quality/QualityAlertsFeed.vue';
import AdminSection from '@/components/system/AdminSection.vue';
import WarmupSection from '@/components/system/WarmupSection.vue';
import ExchangeHealthSection from '@/components/system/ExchangeHealthSection.vue';
import SecuritySection from '@/components/system/SecuritySection.vue';
import type { EventStats } from '@/types';

const store = useSystemStore();
const qualityStore = useQualityStore();
const reconStore = useReconciliationStore();

const activeTab = ref('health');
const loadedTabs = new Set<string>(['health', 'quality']);
const reloading = ref(false);

let qualityTimer: ReturnType<typeof setInterval> | null = null;

const eventRows = computed(() => {
  if (!store.eventStats) return [];
  return Object.entries(store.eventStats as EventStats).map(([type, count]) => ({
    type,
    count,
  }));
});

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

// Lazy-load tab data on first visit
watch(activeTab, (tab) => {
  if (loadedTabs.has(tab)) return;
  loadedTabs.add(tab);

  if (tab === 'reconciliation') {
    reconStore.fetchAll();
  }
  // Admin, Warmup, Exchange Health, Security tabs self-load via their
  // own onMounted hooks when the component is first rendered.
});

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

.system-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
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

.level-critical { border: 1px solid var(--q-error); color: var(--q-error); background: transparent; }
.level-warning { border: 1px solid var(--q-warning); color: var(--q-warning); background: transparent; }
.level-info { border: 1px solid var(--q-primary); color: var(--q-primary); background: transparent; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

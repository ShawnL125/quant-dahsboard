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
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useSystemStore } from '@/stores/system';
import { useQualityStore } from '@/stores/quality';
import HealthStatus from '@/components/system/HealthStatus.vue';
import ComponentStatus from '@/components/system/ComponentStatus.vue';
import ConnectorHealthCards from '@/components/quality/ConnectorHealthCards.vue';
import QualityAlertsFeed from '@/components/quality/QualityAlertsFeed.vue';
import type { EventStats } from '@/types';

const store = useSystemStore();
const qualityStore = useQualityStore();

const eventRows = computed(() => {
  if (!store.eventStats) return [];
  return Object.entries(store.eventStats as EventStats).map(([type, count]) => ({
    type,
    count,
  }));
});

let qualityTimer: ReturnType<typeof setInterval> | null = null;

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

.events-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-header { margin-bottom: 12px; }

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

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

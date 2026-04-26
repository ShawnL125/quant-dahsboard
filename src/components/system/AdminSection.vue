<template>
  <div class="admin-section">
    <a-spin :spinning="store.loading">
      <div class="section-header">
        <span class="section-title">Configuration</span>
        <a-button size="small" :loading="store.loading" @click="onReload">Reload Config</a-button>
      </div>

      <a-collapse class="admin-block">
        <a-collapse-panel key="config" header="Config JSON">
          <pre class="config-code">{{ formatJson(store.config) }}</pre>
        </a-collapse-panel>
      </a-collapse>

      <div class="events-card admin-block">
        <div class="card-title">Event Statistics</div>
        <div v-if="store.eventsStats" class="events-stats">
          <div class="stat-row">
            <span class="stat-label text-mono">Subscribers</span>
            <span class="stat-value text-bold">{{ store.eventsStats.subscribers }}</span>
          </div>
        </div>
        <div v-else class="empty-state">No event statistics available</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAdminStore } from '@/stores/admin';

const store = useAdminStore();

function formatJson(data: unknown): string {
  if (!data) return 'No configuration loaded';
  try { return JSON.stringify(data, null, 2); } catch { return String(data); }
}

function onReload() {
  store.reloadConfig();
}

onMounted(() => {
  store.fetchConfig();
  store.fetchEventsStats();
});
</script>

<style scoped>
.admin-section {
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

.admin-block {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.events-card {
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

.events-stats {
  display: flex;
  flex-direction: column;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--q-border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: var(--q-text);
}

.stat-value {
  color: var(--q-text);
}

.text-mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.text-bold {
  font-weight: 600;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

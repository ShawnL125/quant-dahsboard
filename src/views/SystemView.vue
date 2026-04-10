<template>
  <div>
    <a-spin :spinning="store.loading">
      <HealthStatus
        :liveness="store.liveness"
        :readiness="store.readiness"
      />

      <ComponentStatus
        :exchanges="store.status?.connected_exchanges || []"
        :subscriptions="store.status?.subscribed_symbols || {}"
        style="margin-top: 16px"
      />

      <a-collapse style="margin-top: 16px">
        <a-collapse-panel key="config" header="Configuration">
          <pre style="max-height: 400px; overflow: auto; background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px;">{{ formatJson(store.config) }}</pre>
        </a-collapse-panel>
      </a-collapse>

      <a-card title="Event Statistics" style="margin-top: 16px">
        <a-table
          v-if="store.eventStats"
          :columns="eventColumns"
          :data-source="eventRows"
          :pagination="false"
          size="small"
          row-key="type"
        />
        <a-empty v-else description="No event statistics available" />
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSystemStore } from '@/stores/system';
import HealthStatus from '@/components/system/HealthStatus.vue';
import ComponentStatus from '@/components/system/ComponentStatus.vue';
import type { EventStats } from '@/types';

const store = useSystemStore();

const eventColumns = [
  { title: 'Event Type', dataIndex: 'type', key: 'type' },
  { title: 'Count', dataIndex: 'count', key: 'count' },
];

const eventRows = computed(() => {
  if (!store.eventStats) return [];
  return Object.entries(store.eventStats as EventStats).map(([type, count]) => ({
    type,
    count,
  }));
});

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
});
</script>

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { systemApi } from '@/api/system';
import type { SystemStatus, HealthStatus, ConfigView, EventStats } from '@/types';

export const useSystemStore = defineStore('system', () => {
  const status = ref<SystemStatus | null>(null);
  const liveness = ref<HealthStatus | null>(null);
  const readiness = ref<HealthStatus | null>(null);
  const config = ref<ConfigView | null>(null);
  const eventStats = ref<EventStats | null>(null);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    await Promise.allSettled([
      fetchStatus(),
      fetchHealth(),
      fetchConfig(),
      fetchEventStats(),
    ]);
    loading.value = false;
  }

  async function fetchStatus() {
    try {
      status.value = await systemApi.getStatus();
    } catch {
      /* ignore */
    }
  }

  async function fetchHealth() {
    try {
      liveness.value = await systemApi.getLiveness();
      readiness.value = await systemApi.getReadiness();
    } catch {
      /* ignore */
    }
  }

  async function fetchConfig() {
    try {
      config.value = await systemApi.getConfig();
    } catch {
      /* ignore */
    }
  }

  async function fetchEventStats() {
    try {
      eventStats.value = await systemApi.getEventStats();
    } catch {
      /* ignore */
    }
  }

  return {
    status,
    liveness,
    readiness,
    config,
    eventStats,
    loading,
    fetchAll,
  };
});

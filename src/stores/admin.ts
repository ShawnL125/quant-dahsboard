import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi } from '@/api/admin';
import type { AdminConfig, AdminEventsStats } from '@/types';

export const useAdminStore = defineStore('admin', () => {
  const config = ref<AdminConfig | null>(null);
  const eventsStats = ref<AdminEventsStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchConfig() {
    try {
      config.value = await adminApi.getConfig();
    } catch { config.value = null; }
  }

  async function fetchEventsStats() {
    try {
      eventsStats.value = await adminApi.getEventsStats();
    } catch { eventsStats.value = null; }
  }

  async function reloadConfig() {
    try {
      loading.value = true;
      const result = await adminApi.reloadConfig();
      if (result.status === 'reloaded') {
        await fetchConfig();
      }
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { config, eventsStats, loading, error, fetchConfig, fetchEventsStats, reloadConfig };
});

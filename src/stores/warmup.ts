import { defineStore } from 'pinia';
import { ref } from 'vue';
import { warmupApi } from '@/api/warmup';
import type { WarmupStatus, WarmupResult } from '@/types';

export const useWarmupStore = defineStore('warmup', () => {
  const status = ref<WarmupStatus | null>(null);
  const results = ref<WarmupResult[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchStatus() {
    try {
      const data = await warmupApi.getStatus();
      status.value = data.data;
    } catch { status.value = null; }
  }

  async function fetchResults(params?: { symbol?: string; timeframe?: string }) {
    try {
      const data = await warmupApi.getResults(params);
      results.value = data.data;
    } catch { results.value = []; }
  }

  return { status, results, loading, error, fetchStatus, fetchResults };
});

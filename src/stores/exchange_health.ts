import { defineStore } from 'pinia';
import { ref } from 'vue';
import { exchangeHealthApi } from '@/api/exchange_health';
import type { ExchangeHealthStatus, HealthCheckResult, FailoverAction } from '@/types';

export const useExchangeHealthStore = defineStore('exchangeHealth', () => {
  const statuses = ref<Record<string, ExchangeHealthStatus>>({});
  const failovers = ref<FailoverAction[]>([]);
  const history = ref<HealthCheckResult[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchStatus() {
    try {
      const data = await exchangeHealthApi.getStatus();
      statuses.value = data.data;
    } catch { statuses.value = {}; }
  }

  async function fetchFailovers(limit = 50) {
    try {
      const data = await exchangeHealthApi.getFailovers(limit);
      failovers.value = data.data;
    } catch { failovers.value = []; }
  }

  async function fetchHistory(exchange: string, limit = 50) {
    try {
      const data = await exchangeHealthApi.getHistory(exchange, limit);
      history.value = data.data;
    } catch { history.value = []; }
  }

  async function triggerCheck(exchange: string) {
    try {
      loading.value = true;
      const result = await exchangeHealthApi.triggerCheck(exchange);
      await fetchStatus();
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    statuses, failovers, history, loading, error,
    fetchStatus, fetchFailovers, fetchHistory, triggerCheck,
  };
});

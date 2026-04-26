import { defineStore } from 'pinia';
import { ref } from 'vue';
import { rebalanceApi } from '@/api/rebalance';
import type { RebalanceResult, RebalanceStatus, RebalanceDrift } from '@/types';

export const useRebalanceStore = defineStore('rebalance', () => {
  const history = ref<RebalanceResult[]>([]);
  const status = ref<RebalanceStatus | null>(null);
  const drift = ref<RebalanceDrift | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchStatus(strategyId: string) {
    try {
      const data = await rebalanceApi.getStatus(strategyId);
      status.value = data.data;
    } catch { status.value = null; }
  }

  async function fetchHistory(params: { strategy_id: string; limit?: number; offset?: number }) {
    try {
      const data = await rebalanceApi.getHistory(params);
      history.value = data.data;
    } catch { history.value = []; }
  }

  async function fetchDrift(strategyId: string) {
    try {
      const data = await rebalanceApi.getDrift(strategyId);
      drift.value = data.data;
    } catch { drift.value = null; }
  }

  async function triggerRebalance(data: { strategy_id: string; target_weights: Record<string, number>; rebalance_mode?: string }) {
    try {
      loading.value = true;
      const result = await rebalanceApi.triggerRebalance(data);
      await fetchHistory({ strategy_id: data.strategy_id });
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateTargets(data: { strategy_id: string; target_weights: Record<string, number> }) {
    try {
      const result = await rebalanceApi.updateTargets(data);
      status.value = result.data;
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  return {
    history, status, drift, loading, error,
    fetchStatus, fetchHistory, fetchDrift, triggerRebalance, updateTargets,
  };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { strategiesApi } from '@/api/strategies';
import type { Strategy, ParamAuditEntry } from '@/types';

export const useStrategiesStore = defineStore('strategies', () => {
  const strategies = ref<Strategy[]>([]);
  const selectedStrategy = ref<Strategy | null>(null);
  const params = ref<Record<string, unknown>>({});
  const paramsSource = ref('');
  const paramsAudit = ref<ParamAuditEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchStrategies() {
    try {
      loading.value = true;
      strategies.value = await strategiesApi.getStrategies();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function toggleStrategy(id: string, enabled: boolean) {
    try {
      await strategiesApi.toggleStrategy(id, enabled);
      const idx = strategies.value.findIndex((s) => s.strategy_id === id);
      if (idx >= 0) {
        strategies.value[idx] = { ...strategies.value[idx], is_running: enabled };
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function reloadStrategies() {
    try {
      await strategiesApi.reloadStrategies();
      await fetchStrategies();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function selectStrategy(id: string) {
    try {
      selectedStrategy.value = await strategiesApi.getStrategy(id);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchParams(strategyId: string) {
    try {
      const data = await strategiesApi.getParams(strategyId);
      params.value = data.params;
      paramsSource.value = data.source;
    } catch {
      params.value = {};
      paramsSource.value = '';
    }
  }

  async function updateParams(strategyId: string, newParams: Record<string, unknown>) {
    const result = await strategiesApi.updateParams(strategyId, newParams);
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.join(', '));
    }
    params.value = { ...params.value, ...newParams };
    await fetchParamsAudit(strategyId);
  }

  async function fetchParamsAudit(strategyId: string, limit?: number) {
    try {
      const data = await strategiesApi.getParamsAudit(strategyId, limit);
      paramsAudit.value = data.audit;
    } catch {
      paramsAudit.value = [];
    }
  }

  function updateParamsFromWS(data: Record<string, unknown>) {
    if (!data?.strategy_id) return;
    if (selectedStrategy.value?.strategy_id === data.strategy_id) {
      params.value = { ...params.value, ...(data.params as Record<string, unknown>) };
      paramsSource.value = (data.source as string) || paramsSource.value;
    }
  }

  return {
    strategies,
    selectedStrategy,
    params,
    paramsSource,
    paramsAudit,
    loading,
    error,
    fetchStrategies,
    toggleStrategy,
    reloadStrategies,
    selectStrategy,
    fetchParams,
    updateParams,
    fetchParamsAudit,
    updateParamsFromWS,
  };
});

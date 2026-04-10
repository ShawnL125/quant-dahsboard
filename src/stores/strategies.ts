import { defineStore } from 'pinia';
import { ref } from 'vue';
import { strategiesApi } from '@/api/strategies';
import type { Strategy } from '@/types';

export const useStrategiesStore = defineStore('strategies', () => {
  const strategies = ref<Strategy[]>([]);
  const selectedStrategy = ref<Strategy | null>(null);
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

  return {
    strategies,
    selectedStrategy,
    loading,
    error,
    fetchStrategies,
    toggleStrategy,
    reloadStrategies,
    selectStrategy,
  };
});

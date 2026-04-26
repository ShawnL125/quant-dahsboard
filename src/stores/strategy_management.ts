import { defineStore } from 'pinia';
import { ref } from 'vue';
import { strategyMgmtApi } from '@/api/strategy_management';
import type { StrategyMgmtRecord } from '@/types';

export const useStrategyMgmtStore = defineStore('strategyManagement', () => {
  const strategies = ref<StrategyMgmtRecord[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchStrategies() {
    try {
      loading.value = true;
      const data = await strategyMgmtApi.listStrategies();
      strategies.value = data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function loadStrategy(path: string) {
    try {
      const record = await strategyMgmtApi.loadStrategy(path);
      strategies.value = [...strategies.value, record];
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function startStrategy(strategyId: string) {
    try {
      await strategyMgmtApi.startStrategy(strategyId);
      const idx = strategies.value.findIndex((s) => s.strategy_id === strategyId);
      if (idx >= 0) {
        strategies.value[idx] = { ...strategies.value[idx], status: 'STARTED' };
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function stopStrategy(strategyId: string) {
    try {
      await strategyMgmtApi.stopStrategy(strategyId);
      const idx = strategies.value.findIndex((s) => s.strategy_id === strategyId);
      if (idx >= 0) {
        strategies.value[idx] = { ...strategies.value[idx], status: 'STOPPED' };
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function reloadStrategy(strategyId: string) {
    try {
      const result = await strategyMgmtApi.reloadStrategy(strategyId);
      const idx = strategies.value.findIndex((s) => s.strategy_id === strategyId);
      if (idx >= 0) {
        strategies.value[idx] = { ...strategies.value[idx], status: result.status as StrategyMgmtRecord['status'] };
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function unloadStrategy(strategyId: string) {
    try {
      await strategyMgmtApi.unloadStrategy(strategyId);
      strategies.value = strategies.value.filter((s) => s.strategy_id !== strategyId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  return {
    strategies, loading, error,
    fetchStrategies, loadStrategy, startStrategy, stopStrategy, reloadStrategy, unloadStrategy,
  };
});

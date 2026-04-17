import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fundingApi } from '@/api/funding';
import type { FundingRate, FundingCostSummary } from '@/types';

export const useFundingStore = defineStore('funding', () => {
  const currentRates = ref<Record<string, FundingRate>>({});
  const historyRates = ref<FundingRate[]>([]);
  const costSummary = ref<FundingCostSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCurrent() {
    try {
      const data = await fundingApi.getCurrent();
      currentRates.value = data.rates;
    } catch { currentRates.value = {}; }
  }

  async function fetchHistory(symbol: string, params?: { limit?: number; offset?: number }) {
    try {
      const data = await fundingApi.getHistory(symbol, params);
      historyRates.value = data.rates;
    } catch { historyRates.value = []; }
  }

  async function fetchCost(strategyId: string, params?: { start?: string; end?: string }) {
    try {
      const data = await fundingApi.getCost(strategyId, params);
      costSummary.value = data.summary;
    } catch { costSummary.value = null; }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await fetchCurrent();
    } finally {
      loading.value = false;
    }
  }

  function updateRatesFromWS(data: Record<string, unknown>) {
    if (!data?.symbol || !data?.funding_rate) return;
    const rate = data as unknown as FundingRate;
    currentRates.value = { ...currentRates.value, [rate.symbol]: rate };
  }

  return {
    currentRates, historyRates, costSummary, loading, error,
    fetchCurrent, fetchHistory, fetchCost, fetchAll, updateRatesFromWS,
  };
});

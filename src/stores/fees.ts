import { defineStore } from 'pinia';
import { ref } from 'vue';
import { feesApi } from '@/api/fees';
import type { FeeSummary, FeeBreakdown, VipProgress, FeeDeviation, StrategyFeeReport } from '@/types';

export const useFeesStore = defineStore('fees', () => {
  const summary = ref<FeeSummary[]>([]);
  const breakdown = ref<FeeBreakdown | null>(null);
  const vipProgress = ref<VipProgress | null>(null);
  const deviation = ref<FeeDeviation | null>(null);
  const strategyReport = ref<StrategyFeeReport | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSummary(params?: { exchange?: string; account_id?: string; start?: string; end?: string }) {
    try {
      const data = await feesApi.getSummary(params);
      summary.value = data.data;
    } catch { summary.value = []; }
  }

  async function fetchBreakdown(params?: { exchange?: string; account_id?: string; start?: string; end?: string }) {
    try {
      const data = await feesApi.getBreakdown(params);
      breakdown.value = data.data;
    } catch { breakdown.value = null; }
  }

  async function fetchVipProgress(params?: { exchange?: string; account_id?: string }) {
    try {
      const data = await feesApi.getVipProgress(params);
      vipProgress.value = data.data;
    } catch { vipProgress.value = null; }
  }

  async function fetchDeviation(params?: { exchange?: string; account_id?: string; start?: string; end?: string }) {
    try {
      const data = await feesApi.getDeviation(params);
      deviation.value = data.data;
    } catch { deviation.value = null; }
  }

  async function fetchStrategyReport(params?: { strategy_id?: string; start?: string; end?: string }) {
    try {
      const data = await feesApi.getStrategyReport(params);
      strategyReport.value = data.data;
    } catch { strategyReport.value = null; }
  }

  async function fetchAll(params?: { exchange?: string; account_id?: string; start?: string; end?: string }) {
    loading.value = true;
    try {
      await Promise.all([
        fetchSummary(params),
        fetchBreakdown(params),
        fetchVipProgress({ exchange: params?.exchange, account_id: params?.account_id }),
        fetchDeviation(params),
      ]);
    } finally {
      loading.value = false;
    }
  }

  return {
    summary, breakdown, vipProgress, deviation, strategyReport, loading, error,
    fetchSummary, fetchBreakdown, fetchVipProgress, fetchDeviation, fetchStrategyReport, fetchAll,
  };
});

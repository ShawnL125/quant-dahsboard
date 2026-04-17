import { defineStore } from 'pinia';
import { ref } from 'vue';
import { analyticsApi } from '@/api/analytics';
import type {
  AnalyticsSignal,
  RoundTrip,
  StrategyStatsSnapshot,
  ConsecutiveLossesResponse,
  SignalQualityResponse,
  AnalyticsConfigResponse,
} from '@/types';

export const useAnalyticsStore = defineStore('analytics', () => {
  const signals = ref<AnalyticsSignal[]>([]);
  const signalsTotal = ref(0);
  const roundTrips = ref<RoundTrip[]>([]);
  const roundTripsTotal = ref(0);
  const strategyStats = ref<StrategyStatsSnapshot[]>([]);
  const consecutiveLosses = ref<ConsecutiveLossesResponse | null>(null);
  const signalQuality = ref<SignalQualityResponse | null>(null);
  const selectedRoundTrip = ref<RoundTrip | null>(null);
  const statsHistory = ref<StrategyStatsSnapshot[]>([]);
  const config = ref<AnalyticsConfigResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSignals(params?: Record<string, unknown>) {
    try {
      loading.value = true;
      const data = await analyticsApi.getSignals(params);
      signals.value = data.signals;
      signalsTotal.value = data.total;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoundTrips(params?: Record<string, unknown>) {
    try {
      loading.value = true;
      const data = await analyticsApi.getRoundTrips(params);
      roundTrips.value = data.round_trips;
      roundTripsTotal.value = data.total;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchStrategyStats(strategyId?: string) {
    try {
      const data = await analyticsApi.getStrategyStats(strategyId);
      strategyStats.value = data.snapshots;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchConsecutiveLosses(strategyId?: string) {
    try {
      consecutiveLosses.value = await analyticsApi.getConsecutiveLosses(strategyId);
    } catch { /* optional endpoint */ }
  }

  async function fetchSignalQuality(params?: Record<string, unknown>) {
    try {
      signalQuality.value = await analyticsApi.getSignalQuality(params);
    } catch { /* optional endpoint */ }
  }

  async function fetchRoundTrip(tradeId: string) {
    try {
      selectedRoundTrip.value = await analyticsApi.getRoundTrip(tradeId);
    } catch { selectedRoundTrip.value = null; }
  }

  async function fetchStatsHistory(strategyId: string) {
    try {
      const data = await analyticsApi.getStrategyStatsHistory(strategyId);
      statsHistory.value = data.history;
    } catch { statsHistory.value = []; }
  }

  async function fetchConfig() {
    try {
      config.value = await analyticsApi.getConfig();
    } catch { config.value = null; }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([
        fetchStrategyStats(),
        fetchConsecutiveLosses(),
        fetchSignalQuality(),
      ]);
    } finally {
      loading.value = false;
    }
  }

  return {
    signals, signalsTotal,
    roundTrips, roundTripsTotal,
    strategyStats,
    consecutiveLosses,
    signalQuality,
    selectedRoundTrip, statsHistory, config,
    loading, error,
    fetchSignals, fetchRoundTrips, fetchStrategyStats,
    fetchConsecutiveLosses, fetchSignalQuality, fetchAll,
    fetchRoundTrip, fetchStatsHistory, fetchConfig,
  };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { attributionApi } from '@/api/attribution';
import type { AttributionReport, TradeContribution, RollforwardBucket, RegimeAttribution, BenchmarkComparison } from '@/types';

export const useAttributionStore = defineStore('attribution', () => {
  const reports = ref<AttributionReport[]>([]);
  const selectedReport = ref<AttributionReport | null>(null);
  const contributions = ref<TradeContribution[]>([]);
  const rollforward = ref<RollforwardBucket[]>([]);
  const regime = ref<RegimeAttribution[]>([]);
  const benchmark = ref<BenchmarkComparison | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function computeReport(data: { strategy_id: string; start: string; end: string; persist?: boolean }) {
    try {
      loading.value = true;
      const resp = await attributionApi.computeReport(data);
      selectedReport.value = resp.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchReports(params?: { strategy_id?: string; limit?: number; offset?: number }) {
    try {
      const data = await attributionApi.listReports(params);
      reports.value = data.data;
    } catch { reports.value = []; }
  }

  async function fetchReport(reportId: string) {
    try {
      const data = await attributionApi.getReport(reportId);
      selectedReport.value = data.data;
    } catch { selectedReport.value = null; }
  }

  async function deleteReport(reportId: string) {
    try {
      await attributionApi.deleteReport(reportId);
      reports.value = reports.value.filter((r) => r.report_id !== reportId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchContributions(params: { strategy_id: string; start: string; end: string; top_n?: number }) {
    try {
      const data = await attributionApi.getContributions(params);
      contributions.value = data.data;
    } catch { contributions.value = []; }
  }

  async function fetchRollforward(params: { strategy_id: string; start: string; end: string; bucket_hours?: number }) {
    try {
      const data = await attributionApi.getRollforward(params);
      rollforward.value = data.data;
    } catch { rollforward.value = []; }
  }

  async function fetchRegime(params: { strategy_id: string; start: string; end: string }) {
    try {
      const data = await attributionApi.getRegime(params);
      regime.value = data.data;
    } catch { regime.value = []; }
  }

  async function fetchBenchmark(params: { strategy_id: string; start: string; end: string }) {
    try {
      const data = await attributionApi.compareBenchmark(params);
      benchmark.value = data.data;
    } catch { benchmark.value = null; }
  }

  return {
    reports, selectedReport, contributions, rollforward, regime, benchmark, loading, error,
    computeReport, fetchReports, fetchReport, deleteReport,
    fetchContributions, fetchRollforward, fetchRegime, fetchBenchmark,
  };
});

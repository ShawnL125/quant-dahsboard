import { defineStore } from 'pinia';
import { ref } from 'vue';
import { walkforwardApi } from '@/api/walkforward';
import type { WalkForwardRun, WalkForwardWindow, WalkForwardBestParams, SensitivityPoint, OverfittingResult, CrossValidateResult } from '@/types';

export const useWalkforwardStore = defineStore('walkforward', () => {
  const runs = ref<WalkForwardRun[]>([]);
  const currentWindows = ref<WalkForwardWindow[]>([]);
  const currentBestParams = ref<WalkForwardBestParams[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const sensitivity = ref<SensitivityPoint[]>([]);
  const overfitting = ref<OverfittingResult | null>(null);
  const cvResult = ref<CrossValidateResult | null>(null);

  async function fetchRuns() {
    try {
      loading.value = true;
      runs.value = await walkforwardApi.getRuns();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchWindows(runId: string) {
    try {
      loading.value = true;
      const [windows, bestParams] = await Promise.all([
        walkforwardApi.getWindows(runId),
        walkforwardApi.getBestParams(runId),
      ]);
      currentWindows.value = windows;
      currentBestParams.value = bestParams;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function submitRun(params: Record<string, unknown>) {
    try {
      loading.value = true;
      error.value = null;
      await walkforwardApi.run(params);
      await fetchRuns();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchSensitivity(runId: string) {
    try {
      const data = await walkforwardApi.getSensitivity(runId);
      sensitivity.value = data.data;
    } catch { sensitivity.value = []; }
  }

  async function fetchOverfitting(runId: string) {
    try {
      const data = await walkforwardApi.getOverfitting(runId);
      overfitting.value = data.data;
    } catch { overfitting.value = null; }
  }

  async function submitBatch(data: { strategy_id: string; symbols: string[]; config_overrides?: Record<string, unknown> }) {
    try {
      loading.value = true;
      const result = await walkforwardApi.batch(data);
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function crossValidate(data: { run_ids: string[]; folds?: number }) {
    try {
      loading.value = true;
      const result = await walkforwardApi.crossValidate(data);
      cvResult.value = result.data;
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    runs,
    currentWindows,
    currentBestParams,
    sensitivity,
    overfitting,
    cvResult,
    loading,
    error,
    fetchRuns,
    fetchWindows,
    submitRun,
    fetchSensitivity,
    fetchOverfitting,
    submitBatch,
    crossValidate,
  };
});

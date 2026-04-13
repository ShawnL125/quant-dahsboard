import { defineStore } from 'pinia';
import { ref } from 'vue';
import { walkforwardApi } from '@/api/walkforward';
import type { WalkForwardRun, WalkForwardWindow, WalkForwardBestParams } from '@/types';

export const useWalkforwardStore = defineStore('walkforward', () => {
  const runs = ref<WalkForwardRun[]>([]);
  const currentWindows = ref<WalkForwardWindow[]>([]);
  const currentBestParams = ref<WalkForwardBestParams[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

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

  return {
    runs,
    currentWindows,
    currentBestParams,
    loading,
    error,
    fetchRuns,
    fetchWindows,
    submitRun,
  };
});

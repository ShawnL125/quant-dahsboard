import { defineStore } from 'pinia';
import { ref } from 'vue';
import { replayApi } from '@/api/replay';
import type { ReplayTask, ReplayScenario, ReplayStep, ReplaySummary, ReplayTradeContext } from '@/types';

export const useReplayStore = defineStore('replay', () => {
  const currentTask = ref<ReplayTask | null>(null);
  const scenarios = ref<ReplayScenario[]>([]);
  const currentSteps = ref<ReplayStep[]>([]);
  const summary = ref<ReplaySummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function run(data: { scenario_id?: string; strategy_id: string; symbol: string; start_time?: string; end_time?: string; config?: Record<string, unknown> }) {
    try {
      loading.value = true;
      const result = await replayApi.run(data);
      currentTask.value = result.data;
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTask(taskId: string) {
    try {
      const data = await replayApi.getTask(taskId);
      currentTask.value = data.data;
    } catch { currentTask.value = null; }
  }

  async function fetchScenarios(params?: { limit?: number; offset?: number }) {
    try {
      const data = await replayApi.getScenarios(params);
      scenarios.value = data.data;
    } catch { scenarios.value = []; }
  }

  async function deleteScenario(scenarioId: string) {
    try {
      await replayApi.deleteScenario(scenarioId);
      scenarios.value = scenarios.value.filter((s) => s.scenario_id !== scenarioId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function fetchSteps(scenarioId: string) {
    try {
      const data = await replayApi.getSteps(scenarioId);
      currentSteps.value = data.data;
    } catch { currentSteps.value = []; }
  }

  async function fetchSummary(taskId: string) {
    try {
      const data = await replayApi.getSummary(taskId);
      summary.value = data.data;
    } catch { summary.value = null; }
  }

  return {
    currentTask, scenarios, currentSteps, summary, loading, error,
    run, fetchTask, fetchScenarios, deleteScenario, fetchSteps, fetchSummary,
  };
});

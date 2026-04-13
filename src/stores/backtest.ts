import { defineStore } from 'pinia';
import { ref } from 'vue';
import { backtestApi } from '@/api/backtest';
import type { BacktestHistoryItem, BacktestResult, BacktestRunRecord, BacktestEquityPoint, BacktestTrade } from '@/types';

export const useBacktestStore = defineStore('backtest', () => {
  const history = ref<BacktestHistoryItem[]>([]);
  const runs = ref<BacktestRunRecord[]>([]);
  const currentResult = ref<BacktestResult | null>(null);
  const currentRun = ref<BacktestRunRecord | null>(null);
  const currentEquity = ref<BacktestEquityPoint[]>([]);
  const currentTrades = ref<BacktestTrade[]>([]);
  const currentTaskId = ref<string | null>(null);
  const taskStatus = ref<string>('');
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchHistory() {
    try {
      loading.value = true;
      history.value = await backtestApi.getHistory();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchRuns() {
    try {
      runs.value = await backtestApi.getRuns();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchRunDetails(runId: string) {
    try {
      loading.value = true;
      const [run, equity, trades] = await Promise.all([
        backtestApi.getRun(runId),
        backtestApi.getEquity(runId),
        backtestApi.getTrades(runId),
      ]);
      currentRun.value = run;
      currentEquity.value = equity;
      currentTrades.value = trades;
      currentTaskId.value = runId;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function runBacktest(params?: Record<string, unknown>) {
    try {
      loading.value = true;
      error.value = null;
      const result = await backtestApi.runBacktest(params);
      currentTaskId.value = result.task_id;
      taskStatus.value = 'PENDING';
      pollStatus(result.task_id);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      loading.value = false;
    }
  }

  async function pollStatus(taskId: string) {
    const poll = async () => {
      try {
        const status = await backtestApi.getStatus(taskId);
        taskStatus.value = status.status || status.state || 'UNKNOWN';
        if (taskStatus.value === 'COMPLETED' || taskStatus.value === 'DONE') {
          currentResult.value = await backtestApi.getResult(taskId);
          loading.value = false;
          await fetchHistory();
        } else if (taskStatus.value === 'FAILED') {
          error.value = 'Backtest failed';
          loading.value = false;
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        loading.value = false;
      }
    };
    poll();
  }

  async function fetchResult(taskId: string) {
    try {
      currentResult.value = await backtestApi.getResult(taskId);
      currentTaskId.value = taskId;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    history,
    runs,
    currentResult,
    currentRun,
    currentEquity,
    currentTrades,
    currentTaskId,
    taskStatus,
    loading,
    error,
    fetchHistory,
    fetchRuns,
    fetchRunDetails,
    runBacktest,
    fetchResult,
  };
});

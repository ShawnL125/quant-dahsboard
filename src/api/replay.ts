import apiClient from './client';
import type { ReplayTask, ReplayScenario, ReplayStep, ReplaySummary, ReplayTradeContext } from '@/types';

export const replayApi = {
  run: (data: { scenario_id?: string; strategy_id: string; symbol: string; start_time?: string; end_time?: string; config?: Record<string, unknown> }) =>
    apiClient.post<{ data: ReplayTask }>('/replay/run', data).then((r) => r.data),

  getTask: (taskId: string) =>
    apiClient.get<{ data: ReplayTask }>(`/replay/tasks/${taskId}`).then((r) => r.data),

  getScenarios: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<{ data: ReplayScenario[] }>('/replay/scenarios', { params }).then((r) => r.data),

  getScenario: (scenarioId: string) =>
    apiClient.get<{ data: ReplayScenario }>(`/replay/scenarios/${scenarioId}`).then((r) => r.data),

  deleteScenario: (scenarioId: string) =>
    apiClient.delete<{ data: { deleted: boolean } }>(`/replay/scenarios/${scenarioId}`).then((r) => r.data),

  getSteps: (scenarioId: string) =>
    apiClient.get<{ data: ReplayStep[] }>(`/replay/scenarios/${scenarioId}/steps`).then((r) => r.data),

  getStep: (stepIndex: number) =>
    apiClient.get<{ data: ReplayStep }>(`/replay/steps/${stepIndex}`).then((r) => r.data),

  getSummary: (taskId: string) =>
    apiClient.get<{ data: ReplaySummary }>('/replay/summary', { params: { task_id: taskId } }).then((r) => r.data),

  compare: (taskIds: string[]) =>
    apiClient.post('/replay/compare', { task_ids: taskIds }).then((r) => r.data),

  getTradeContext: (tradeId: string) =>
    apiClient.get<{ data: ReplayTradeContext }>(`/replay/trade-context/${tradeId}`).then((r) => r.data),
};

import apiClient from './client';
import type { WalkForwardRun, WalkForwardWindow, WalkForwardBestParams } from '@/types';

export const walkforwardApi = {
  run: (params: Record<string, unknown>) =>
    apiClient.post('/walkforward/run', params).then((r) => r.data),
  getRuns: (limit = 50, offset = 0) =>
    apiClient.get<WalkForwardRun[]>('/walkforward/runs', { params: { limit, offset } }).then((r) => r.data),
  getRun: (runId: string) =>
    apiClient.get<WalkForwardRun>(`/walkforward/runs/${runId}`).then((r) => r.data),
  getWindows: (runId: string) =>
    apiClient.get<WalkForwardWindow[]>(`/walkforward/runs/${runId}/windows`).then((r) => r.data),
  getBestParams: (runId: string) =>
    apiClient.get<WalkForwardBestParams[]>(`/walkforward/runs/${runId}/best-params`).then((r) => r.data),
  compare: (runIds: string[]) =>
    apiClient.get('/walkforward/compare', { params: { runs: runIds.join(',') } }).then((r) => r.data),
};

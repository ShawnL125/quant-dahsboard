import apiClient from './client';
import type { ReconciliationRunRequest, ReconciliationRunResponse, ReconAlert } from '@/types';

export const reconciliationApi = {
  run: (data: ReconciliationRunRequest) =>
    apiClient.post<ReconciliationRunResponse>('/reconciliation/run', data).then((r) => r.data),
  getReports: () =>
    apiClient.get<unknown[]>('/reconciliation/reports').then((r) => r.data),
  getReport: (reportId: string) =>
    apiClient.get(`/reconciliation/reports/${reportId}`).then((r) => r.data),
  getAlerts: () =>
    apiClient.get<ReconAlert[]>('/reconciliation/alerts').then((r) => r.data),
};

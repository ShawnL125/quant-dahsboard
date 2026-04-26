import apiClient from './client';
import type { AttributionReport, TradeContribution, RollforwardBucket, RegimeAttribution, BenchmarkComparison } from '@/types';

export const attributionApi = {
  computeReport: (data: { strategy_id: string; start: string; end: string; persist?: boolean }) =>
    apiClient.post<{ data: AttributionReport }>('/attribution/report', data).then((r) => r.data),

  listReports: (params?: { strategy_id?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ data: AttributionReport[]; total: number }>('/attribution/reports', { params }).then((r) => r.data),

  getReport: (reportId: string) =>
    apiClient.get<{ data: AttributionReport }>(`/attribution/reports/${reportId}`).then((r) => r.data),

  deleteReport: (reportId: string) =>
    apiClient.delete<{ data: { report_id: string; deleted: boolean } }>(`/attribution/reports/${reportId}`).then((r) => r.data),

  getContributions: (params: { strategy_id: string; start: string; end: string; top_n?: number }) =>
    apiClient.get<{ data: TradeContribution[] }>('/attribution/contributions', { params }).then((r) => r.data),

  getRollforward: (params: { strategy_id: string; start: string; end: string; bucket_hours?: number }) =>
    apiClient.get<{ data: RollforwardBucket[] }>('/attribution/rollforward', { params }).then((r) => r.data),

  getRegime: (params: { strategy_id: string; start: string; end: string }) =>
    apiClient.get<{ data: RegimeAttribution[] }>('/attribution/regime', { params }).then((r) => r.data),

  compareBenchmark: (params: { strategy_id: string; start: string; end: string }) =>
    apiClient.get<{ data: BenchmarkComparison }>('/attribution/compare-benchmark', { params }).then((r) => r.data),
};

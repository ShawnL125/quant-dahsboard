import apiClient from './client';
import type { QualityScore, ArchiveRun, LifecycleResult } from '@/types';

export const governanceApi = {
  getQualityScores: (params?: { symbol?: string }) =>
    apiClient.get<{ data: QualityScore[] }>('/governance/quality/scores', { params }).then((r) => r.data),

  getQualitySymbols: () =>
    apiClient.get<{ data: string[] }>('/governance/quality/symbols').then((r) => r.data),

  evaluateQuality: (data: { symbol: string; timeframe: string }) =>
    apiClient.post<{ data: QualityScore }>('/governance/quality/evaluate', data).then((r) => r.data),

  getArchiveStatus: () =>
    apiClient.get<{ data: Record<string, unknown> }>('/governance/archive/status').then((r) => r.data),

  runArchive: (data: { symbols: string[]; start_time: string; end_time: string }) =>
    apiClient.post<{ data: ArchiveRun }>('/governance/archive/run', data).then((r) => r.data),

  getArchiveRuns: (params?: { limit?: number }) =>
    apiClient.get<{ data: ArchiveRun[] }>('/governance/archive/runs', { params }).then((r) => r.data),

  lifecycleDryRun: (data: { symbol: string; timeframe: string; action: string }) =>
    apiClient.post<{ data: LifecycleResult }>('/governance/lifecycle/dry-run', data).then((r) => r.data),

  lifecycleExecute: (data: { symbol: string; timeframe: string; action: string; confirmed: boolean }) =>
    apiClient.post<{ data: LifecycleResult }>('/governance/lifecycle/execute', data).then((r) => r.data),

  getStatus: () =>
    apiClient.get<{ data: Record<string, unknown> }>('/governance/status').then((r) => r.data),
};

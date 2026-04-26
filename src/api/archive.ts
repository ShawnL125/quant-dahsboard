import apiClient from './client';
import type { ArchivedRun, ArchiveVersionSummary, ArchiveComparison } from '@/types';

export const archiveApi = {
  archiveRun: (runId: string, data: { strategy_id: string; strategy_version?: string; source_hash?: string; params?: Record<string, unknown>; tag?: string; label?: string }) =>
    apiClient.post<{ data: ArchivedRun }>(`/archive/runs/${runId}`, data).then((r) => r.data),

  getVersions: (strategyId: string) =>
    apiClient.get<{ data: ArchiveVersionSummary[] }>('/archive/versions', { params: { strategy_id: strategyId } }).then((r) => r.data),

  compareVersions: (strategyId: string, versionA: string, versionB: string) =>
    apiClient.get<{ data: ArchiveComparison }>(`/archive/versions/${strategyId}/compare`, { params: { version_a: versionA, version_b: versionB } }).then((r) => r.data),

  getEntries: (params?: { strategy_id?: string; version?: string; tag?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ data: ArchivedRun[]; total: number }>('/archive/entries', { params }).then((r) => r.data),

  getEntry: (runId: string) =>
    apiClient.get<{ data: ArchivedRun }>(`/archive/entries/${runId}`).then((r) => r.data),

  updateTag: (runId: string, tag: string) =>
    apiClient.patch<{ data: { run_id: string; tag: string } }>(`/archive/entries/${runId}/tag`, { tag }).then((r) => r.data),
};

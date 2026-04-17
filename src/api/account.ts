import apiClient from './client';
import type { AccountSnapshot, AccountReconciliation, MarginStatus } from '@/types';

export const accountApi = {
  getSnapshots: () =>
    apiClient.get<{ snapshots: AccountSnapshot[] }>('/account/snapshots').then((r) => r.data),
  getSnapshotByExchange: (exchange: string, limit?: number) =>
    apiClient.get<{ snapshots: AccountSnapshot[] }>(`/account/snapshots/${exchange}`, { params: { limit } }).then((r) => r.data),
  sync: () =>
    apiClient.post<{ synced_exchanges: string[]; snapshot_ids: string[] }>('/account/sync').then((r) => r.data),
  reconcile: (exchange?: string) =>
    apiClient.post<{ results: AccountReconciliation[] }>('/account/reconcile', null, { params: { exchange } }).then((r) => r.data),
  getReconciliations: (params?: { exchange?: string; limit?: number }) =>
    apiClient.get<{ reconciliations: AccountReconciliation[] }>('/account/reconciliations', { params }).then((r) => r.data),
  getMargin: () =>
    apiClient.get<{ margins: MarginStatus[] }>('/account/margin').then((r) => r.data),
};

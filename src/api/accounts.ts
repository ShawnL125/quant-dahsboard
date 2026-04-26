import apiClient from './client';
import type { ExchangeAccount, AccountKillResult } from '@/types';

export const accountsApi = {
  list: () =>
    apiClient.get<ExchangeAccount[]>('/accounts').then((r) => r.data),

  get: (accountId: string) =>
    apiClient.get<ExchangeAccount>(`/accounts/${accountId}`).then((r) => r.data),

  kill: (accountId: string) =>
    apiClient.post<AccountKillResult>(`/accounts/${accountId}/kill`).then((r) => r.data),

  unkill: (accountId: string) =>
    apiClient.delete<AccountKillResult>(`/accounts/${accountId}/kill`).then((r) => r.data),
};

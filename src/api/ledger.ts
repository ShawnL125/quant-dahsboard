import apiClient from './client';
import type {
  LedgerEntriesResponse,
  LedgerEntry,
  DailySummary,
  CashFlowRequest,
  CashFlowResponse,
  LedgerConfigResponse,
} from '@/types';

export const ledgerApi = {
  getBalances: () =>
    apiClient.get<Record<string, Record<string, string>>>('/ledger/balances').then((r) => r.data),
  getBalance: (account: string) =>
    apiClient.get<Record<string, string>>(`/ledger/balances/${encodeURIComponent(account)}`).then((r) => r.data),
  getEntries: (params?: { account?: string; asset?: string; reference_type?: string; strategy_id?: string; symbol?: string; start?: string; end?: string; limit?: number; offset?: number }) =>
    apiClient.get<LedgerEntriesResponse>('/ledger/entries', { params }).then((r) => r.data),
  getEntriesByReference: (referenceId: string) =>
    apiClient.get<LedgerEntry[]>(`/ledger/entries/${encodeURIComponent(referenceId)}`).then((r) => r.data),
  getDailySummary: (date: string, account?: string, asset?: string) =>
    apiClient.get<DailySummary[]>('/ledger/daily-summary', { params: { date, account, asset } }).then((r) => r.data),
  postCashFlow: (data: CashFlowRequest) =>
    apiClient.post<CashFlowResponse>('/ledger/cash-flow', data).then((r) => r.data),
  getConfig: () =>
    apiClient.get<LedgerConfigResponse>('/ledger/config').then((r) => r.data),
};

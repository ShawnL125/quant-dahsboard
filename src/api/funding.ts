import apiClient from './client';
import type { FundingRate, FundingCostSummary } from '@/types';

export const fundingApi = {
  getCurrent: () =>
    apiClient.get<{ rates: Record<string, FundingRate> }>('/funding/current').then((r) => r.data),
  getHistory: (symbol: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get<{ rates: FundingRate[] }>(`/funding/history/${symbol}`, { params }).then((r) => r.data),
  getCost: (strategyId: string, params?: { start?: string; end?: string }) =>
    apiClient.get<{ summary: FundingCostSummary }>(`/funding/cost/${strategyId}`, { params }).then((r) => r.data),
  backfill: (data: { symbol: string; exchange: string; start?: string; end?: string }) =>
    apiClient.post<{ status: string; records_fetched: number }>('/funding/backfill', data).then((r) => r.data),
};

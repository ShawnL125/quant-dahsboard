import apiClient from './client';
import type { FeeSummary, FeeBreakdown, VipProgress, FeeDeviation, StrategyFeeReport } from '@/types';

export const feesApi = {
  getSummary: (params?: { exchange?: string; account_id?: string; start?: string; end?: string }) =>
    apiClient.get<{ data: FeeSummary[]; total: number }>('/fees/summary', { params }).then((r) => r.data),

  getBreakdown: (params?: { exchange?: string; account_id?: string; start?: string; end?: string }) =>
    apiClient.get<{ data: FeeBreakdown }>('/fees/breakdown', { params }).then((r) => r.data),

  getVipProgress: (params?: { exchange?: string; account_id?: string }) =>
    apiClient.get<{ data: VipProgress }>('/fees/vip-progress', { params }).then((r) => r.data),

  getDeviation: (params?: { exchange?: string; account_id?: string; start?: string; end?: string }) =>
    apiClient.get<{ data: FeeDeviation }>('/fees/deviation', { params }).then((r) => r.data),

  getStrategyReport: (params?: { strategy_id?: string; start?: string; end?: string }) =>
    apiClient.get<{ data: StrategyFeeReport }>('/fees/strategy', { params }).then((r) => r.data),
};

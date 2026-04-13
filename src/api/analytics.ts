import apiClient from './client';
import type {
  AnalyticsSignalsResponse,
  RoundTripsResponse,
  RoundTrip,
  StrategyStatsResponse,
  StrategyStatsHistoryResponse,
  ConsecutiveLossesResponse,
  SignalQualityResponse,
  AnalyticsConfigResponse,
} from '@/types';

export const analyticsApi = {
  getSignals: (params?: { strategy_id?: string; symbol?: string; direction?: string; start?: string; end?: string; limit?: number; offset?: number }) =>
    apiClient.get<AnalyticsSignalsResponse>('/analytics/signals', { params }).then((r) => r.data),
  getRoundTrips: (params?: { strategy_id?: string; symbol?: string; side?: string; start?: string; end?: string; limit?: number; offset?: number }) =>
    apiClient.get<RoundTripsResponse>('/analytics/round-trips', { params }).then((r) => r.data),
  getRoundTrip: (tradeId: string) =>
    apiClient.get<RoundTrip>(`/analytics/round-trips/${tradeId}`).then((r) => r.data),
  getStrategyStats: (strategyId?: string) =>
    apiClient.get<StrategyStatsResponse>('/analytics/strategy-stats', { params: strategyId ? { strategy_id: strategyId } : {} }).then((r) => r.data),
  getStrategyStatsHistory: (strategyId: string) =>
    apiClient.get<StrategyStatsHistoryResponse>(`/analytics/strategy-stats/${strategyId}/history`).then((r) => r.data),
  getConsecutiveLosses: (strategyId?: string) =>
    apiClient.get<ConsecutiveLossesResponse>('/analytics/consecutive-losses', { params: strategyId ? { strategy_id: strategyId } : {} }).then((r) => r.data),
  getSignalQuality: (params?: { strategy_id?: string; start?: string; end?: string }) =>
    apiClient.get<SignalQualityResponse>('/analytics/signal-quality', { params }).then((r) => r.data),
  getConfig: () =>
    apiClient.get<AnalyticsConfigResponse>('/analytics/config').then((r) => r.data),
};

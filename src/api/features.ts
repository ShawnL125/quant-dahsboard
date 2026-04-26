import apiClient from './client';
import type { FeatureDefinition, FeatureValue } from '@/types';

export const featuresApi = {
  registerDefinition: (data: { name: string; feature_type?: string; source?: string; min_periods?: number; output_keys?: string[]; params?: Record<string, unknown>; description?: string }) =>
    apiClient.post<{ data: FeatureDefinition }>('/features/definitions', data).then((r) => r.data),

  listDefinitions: (params?: { feature_type?: string }) =>
    apiClient.get<{ data: FeatureDefinition[] }>('/features/definitions', { params }).then((r) => r.data),

  getDefinition: (name: string) =>
    apiClient.get<{ data: FeatureDefinition }>(`/features/definitions/${name}`).then((r) => r.data),

  deleteDefinition: (name: string) =>
    apiClient.delete<{ data: { removed: boolean; name: string } }>(`/features/definitions/${name}`).then((r) => r.data),

  queryValues: (params?: { symbol?: string; timeframe?: string; feature_name?: string; limit?: number }) =>
    apiClient.get<{ data: FeatureValue[] }>('/features/values', { params }).then((r) => r.data),

  getValue: (symbol: string, timeframe: string, featureName: string) =>
    apiClient.get<{ data: FeatureValue }>(`/features/values/${symbol}/${timeframe}/${featureName}`).then((r) => r.data),

  precompute: (data: { symbol: string; timeframe: string }) =>
    apiClient.post<{ data: { computed_candles: number } }>('/features/precompute', data).then((r) => r.data),

  getStatus: () =>
    apiClient.get<{ data: Record<string, unknown> }>('/features/status').then((r) => r.data),
};

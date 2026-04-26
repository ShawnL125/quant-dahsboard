import apiClient from './client';
import type { WarmupStatus, WarmupResult } from '@/types';

export const warmupApi = {
  getStatus: () =>
    apiClient.get<{ data: WarmupStatus }>('/warmup/status').then((r) => r.data),

  getResults: (params?: { symbol?: string; timeframe?: string }) =>
    apiClient.get<{ data: WarmupResult[] }>('/warmup/results', { params }).then((r) => r.data),
};

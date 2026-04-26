import apiClient from './client';
import type { ExchangeHealthStatus, HealthCheckResult, FailoverAction } from '@/types';

export const exchangeHealthApi = {
  getStatus: () =>
    apiClient.get<{ data: Record<string, ExchangeHealthStatus> }>('/exchange-health/status').then((r) => r.data),

  getFailovers: (limit = 50) =>
    apiClient.get<{ data: FailoverAction[] }>('/exchange-health/failovers', { params: { limit } }).then((r) => r.data),

  getHistory: (exchange: string, limit = 50) =>
    apiClient.get<{ data: HealthCheckResult[] }>(`/exchange-health/${exchange}/history`, { params: { limit } }).then((r) => r.data),

  triggerCheck: (exchange: string) =>
    apiClient.post<{ data: HealthCheckResult }>(`/exchange-health/${exchange}/check`).then((r) => r.data),
};

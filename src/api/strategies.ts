import apiClient from './client';
import type { Strategy, ParamAuditEntry } from '@/types';

export const strategiesApi = {
  getStrategies: () => apiClient.get<Strategy[]>('/strategies').then((r) => r.data),
  getStrategy: (id: string) => apiClient.get<Strategy>(`/strategies/${id}`).then((r) => r.data),
  toggleStrategy: (id: string, enabled: boolean) =>
    apiClient.patch(`/strategies/${id}/toggle`, { enabled }).then((r) => r.data),
  reloadStrategies: () => apiClient.post('/strategies/reload').then((r) => r.data),

  // Parameter Hot-Reload (Phase 33)
  getParams: (strategyId: string) =>
    apiClient.get<{ strategy_id: string; params: Record<string, unknown>; source: string }>(`/strategies/${strategyId}/params`).then((r) => r.data),
  updateParams: (strategyId: string, params: Record<string, unknown>) =>
    apiClient.patch<{ strategy_id: string; applied: boolean; errors: string[] }>(`/strategies/${strategyId}/params`, { params }).then((r) => r.data),
  getParamsAudit: (strategyId: string, limit?: number) =>
    apiClient.get<{ strategy_id: string; audit: ParamAuditEntry[] }>(`/strategies/${strategyId}/params/audit`, { params: { limit } }).then((r) => r.data),
};

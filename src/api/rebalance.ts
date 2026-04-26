import apiClient from './client';
import type { RebalanceResult, RebalanceStatus, RebalanceDrift } from '@/types';

export const rebalanceApi = {
  triggerRebalance: (data: { strategy_id: string; target_weights: Record<string, number>; rebalance_mode?: string }) =>
    apiClient.post<{ data: RebalanceResult }>('/portfolio/rebalance', data).then((r) => r.data),

  getStatus: (strategyId: string) =>
    apiClient.get<{ data: RebalanceStatus }>('/portfolio/rebalance/status', { params: { strategy_id: strategyId } }).then((r) => r.data),

  getHistory: (params: { strategy_id: string; limit?: number; offset?: number }) =>
    apiClient.get<{ data: RebalanceResult[] }>('/portfolio/rebalance/history', { params }).then((r) => r.data),

  getDrift: (strategyId: string) =>
    apiClient.get<{ data: RebalanceDrift }>('/portfolio/rebalance/drift', { params: { strategy_id: strategyId } }).then((r) => r.data),

  updateTargets: (data: { strategy_id: string; target_weights: Record<string, number> }) =>
    apiClient.put<{ data: RebalanceStatus }>('/portfolio/rebalance/targets', data).then((r) => r.data),
};

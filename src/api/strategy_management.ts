import apiClient from './client';
import type { StrategyMgmtRecord } from '@/types';

export const strategyMgmtApi = {
  listStrategies: () =>
    apiClient.get<StrategyMgmtRecord[]>('/strategy-mgmt/strategies').then((r) => r.data),

  loadStrategy: (path: string) =>
    apiClient.post<StrategyMgmtRecord>('/strategy-mgmt/strategies/load', { path }).then((r) => r.data),

  startStrategy: (strategyId: string) =>
    apiClient.post<{ strategy_id: string; status: string }>(`/strategy-mgmt/strategies/${strategyId}/start`).then((r) => r.data),

  stopStrategy: (strategyId: string) =>
    apiClient.post<{ strategy_id: string; status: string }>(`/strategy-mgmt/strategies/${strategyId}/stop`).then((r) => r.data),

  reloadStrategy: (strategyId: string) =>
    apiClient.post<{ strategy_id: string; status: string; state_preserved: boolean }>(`/strategy-mgmt/strategies/${strategyId}/reload`).then((r) => r.data),

  unloadStrategy: (strategyId: string) =>
    apiClient.delete<{ strategy_id: string; status: string }>(`/strategy-mgmt/strategies/${strategyId}`).then((r) => r.data),
};

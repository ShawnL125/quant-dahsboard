import apiClient from './client';
import type { Strategy } from '@/types';

export const strategiesApi = {
  getStrategies: () => apiClient.get<Strategy[]>('/strategies').then((r) => r.data),
  getStrategy: (id: string) => apiClient.get<Strategy>(`/strategies/${id}`).then((r) => r.data),
  toggleStrategy: (id: string, enabled: boolean) =>
    apiClient.patch(`/strategies/${id}/toggle`, { enabled }).then((r) => r.data),
  reloadStrategies: () => apiClient.post('/strategies/reload').then((r) => r.data),
};

import apiClient from './client';
import type { HealthReadyResponse, SystemStatusResponse } from '@/types';

export const qualityApi = {
  getHealthReady: () =>
    apiClient.get<HealthReadyResponse>('/health/ready').then((r) => r.data),
  getSystemStatus: () =>
    apiClient.get<SystemStatusResponse>('/status').then((r) => r.data),
};

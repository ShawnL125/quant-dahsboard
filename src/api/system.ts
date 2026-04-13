import apiClient from './client';
import type { SystemStatus, ConfigView, EventStats, HealthStatus, PaperStatus } from '@/types';

const healthBase = '/health';

export const systemApi = {
  getLiveness: () => apiClient.get<HealthStatus>(healthBase + '/live').then((r) => r.data),
  getReadiness: () => apiClient.get<HealthStatus>(healthBase + '/ready').then((r) => r.data),
  getStatus: () => apiClient.get<SystemStatus>('/status').then((r) => r.data),
  getConfig: () => apiClient.get<ConfigView>('/admin/config').then((r) => r.data),
  getEventStats: () => apiClient.get<EventStats>('/admin/events/stats').then((r) => r.data),
  getPaperStatus: () => apiClient.get<PaperStatus>('/paper/status').then((r) => r.data),
  reloadConfig: () => apiClient.post<{ status: string; environment?: string; allowed_symbols?: string[] }>('/admin/reload-config').then((r) => r.data),
};

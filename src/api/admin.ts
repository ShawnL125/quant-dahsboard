import apiClient from './client';
import type { AdminConfig, AdminEventsStats, AdminReloadResult } from '@/types';

export const adminApi = {
  getConfig: () =>
    apiClient.get<AdminConfig>('/admin/config').then((r) => r.data),

  getEventsStats: () =>
    apiClient.get<AdminEventsStats>('/admin/events/stats').then((r) => r.data),

  reloadConfig: () =>
    apiClient.post<AdminReloadResult>('/admin/reload-config').then((r) => r.data),
};

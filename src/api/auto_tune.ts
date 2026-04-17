import apiClient from './client';
import type { AutoTuneRun, AutoTuneSchedule } from '@/types';

export const autoTuneApi = {
  triggerRun: (data: { strategy_id: string; apply_mode?: string; data_path?: string }) =>
    apiClient.post<{ task_id: string; status: string; strategy_id: string }>('/auto-tune/run', data).then((r) => r.data),
  confirmRun: (runId: string) =>
    apiClient.post<{ status: string }>(`/auto-tune/${runId}/confirm`).then((r) => r.data),
  rollbackRun: (runId: string) =>
    apiClient.post<{ status: string }>(`/auto-tune/${runId}/rollback`).then((r) => r.data),
  getRuns: (params?: { strategy_id?: string; limit?: number }) =>
    apiClient.get<{ runs: AutoTuneRun[] }>('/auto-tune/runs', { params }).then((r) => r.data),
  createSchedule: (data: { strategy_id: string; cron_expr: string; apply_mode: string; train_days: number; test_days: number }) =>
    apiClient.post<AutoTuneSchedule>('/auto-tune/schedules', data).then((r) => r.data),
  deleteSchedule: (scheduleId: string) =>
    apiClient.delete<{ deleted: boolean; schedule_id: string }>(`/auto-tune/schedules/${scheduleId}`).then((r) => r.data),
  getSchedules: () =>
    apiClient.get<{ schedules: AutoTuneSchedule[] }>('/auto-tune/schedules').then((r) => r.data),
};

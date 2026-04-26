import apiClient from './client';
import type { AlertRule, CreateAlertRule, UpdateAlertRule, AlertFiring } from '@/types';

export const alertsApi = {
  listRules: (params?: { alert_type?: string; enabled_only?: boolean }) =>
    apiClient.get<{ data: AlertRule[] }>('/alerts/rules', { params }).then((r) => r.data),

  createRule: (data: CreateAlertRule) =>
    apiClient.post<{ data: AlertRule }>('/alerts/rules', data).then((r) => r.data),

  updateRule: (ruleId: string, data: UpdateAlertRule) =>
    apiClient.patch<{ data: AlertRule }>(`/alerts/rules/${ruleId}`, data).then((r) => r.data),

  deleteRule: (ruleId: string) =>
    apiClient.delete<{ data: { rule_id: string; deleted: boolean } }>(`/alerts/rules/${ruleId}`).then((r) => r.data),

  listFirings: (params?: { rule_id?: string; status?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ data: AlertFiring[]; total: number }>('/alerts/firings', { params }).then((r) => r.data),

  getActiveAlerts: () =>
    apiClient.get<{ data: AlertFiring[] }>('/alerts/active').then((r) => r.data),

  manualEvaluate: (ruleId: string) =>
    apiClient.post<{ data: { fired: boolean; firing?: AlertFiring } }>(`/alerts/rules/${ruleId}/evaluate`).then((r) => r.data),
};

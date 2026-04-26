import apiClient from './client';
import type { SecurityAuditEntry, SecurityAuditSummary } from '@/types';

export const securityApi = {
  getAudit: (params?: { category?: string; severity?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ data: SecurityAuditEntry[] }>('/security/audit', { params }).then((r) => r.data),

  getSummary: () =>
    apiClient.get<{ data: SecurityAuditSummary }>('/security/audit/summary').then((r) => r.data),
};

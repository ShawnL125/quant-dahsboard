import { defineStore } from 'pinia';
import { ref } from 'vue';
import { securityApi } from '@/api/security';
import type { SecurityAuditEntry, SecurityAuditSummary } from '@/types';

export const useSecurityStore = defineStore('security', () => {
  const entries = ref<SecurityAuditEntry[]>([]);
  const summary = ref<SecurityAuditSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAudit(params?: { category?: string; severity?: string; limit?: number; offset?: number }) {
    try {
      const data = await securityApi.getAudit(params);
      entries.value = data.data;
    } catch { entries.value = []; }
  }

  async function fetchSummary() {
    try {
      const data = await securityApi.getSummary();
      summary.value = data.data;
    } catch { summary.value = null; }
  }

  return { entries, summary, loading, error, fetchAudit, fetchSummary };
});

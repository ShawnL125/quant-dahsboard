import { defineStore } from 'pinia';
import { ref } from 'vue';
import { reconciliationApi } from '@/api/reconciliation';
import type { ReconAlert } from '@/types';

export const useReconciliationStore = defineStore('reconciliation', () => {
  const alerts = ref<ReconAlert[]>([]);
  const reports = ref<unknown[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAlerts() {
    try {
      alerts.value = await reconciliationApi.getAlerts();
    } catch {
      alerts.value = [];
    }
  }

  async function fetchReports() {
    try {
      reports.value = await reconciliationApi.getReports();
    } catch {
      reports.value = [];
    }
  }

  async function runReconciliation(data: { backtest_run_id: string }) {
    loading.value = true;
    try {
      return await reconciliationApi.run(data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([fetchAlerts(), fetchReports()]);
    } finally {
      loading.value = false;
    }
  }

  return {
    alerts, reports, loading, error,
    fetchAlerts, fetchReports, runReconciliation, fetchAll,
  };
});

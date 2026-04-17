import { defineStore } from 'pinia';
import { ref } from 'vue';
import { accountApi } from '@/api/account';
import type { AccountSnapshot, AccountReconciliation, MarginStatus } from '@/types';

export const useAccountStore = defineStore('account', () => {
  const snapshots = ref<AccountSnapshot[]>([]);
  const reconciliations = ref<AccountReconciliation[]>([]);
  const margins = ref<MarginStatus[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSnapshots() {
    try {
      const data = await accountApi.getSnapshots();
      snapshots.value = data.snapshots;
    } catch { snapshots.value = []; }
  }

  async function fetchReconciliations(params?: { exchange?: string; limit?: number }) {
    try {
      const data = await accountApi.getReconciliations(params);
      reconciliations.value = data.reconciliations;
    } catch { reconciliations.value = []; }
  }

  async function fetchMargin() {
    try {
      const data = await accountApi.getMargin();
      margins.value = data.margins;
    } catch { margins.value = []; }
  }

  async function syncAll() {
    try { await accountApi.sync(); } catch { /* ignore */ }
  }

  async function reconcile(exchange?: string) {
    try { await accountApi.reconcile(exchange); } catch { /* ignore */ }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([fetchSnapshots(), fetchReconciliations(), fetchMargin()]);
    } finally {
      loading.value = false;
    }
  }

  return {
    snapshots, reconciliations, margins, loading, error,
    fetchSnapshots, fetchReconciliations, fetchMargin, syncAll, reconcile, fetchAll,
  };
});

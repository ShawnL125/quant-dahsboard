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

  function updateMarginFromWS(data: Record<string, unknown>) {
    if (!data?.exchange) return;
    const incoming = data as unknown as MarginStatus;
    const idx = margins.value.findIndex((m) => m.exchange === incoming.exchange);
    if (idx >= 0) {
      margins.value[idx] = incoming;
    } else {
      margins.value = [...margins.value, incoming];
    }
  }

  function updateSnapshotFromWS(data: Record<string, unknown>) {
    if (!data?.snapshot_id) return;
    const incoming = data as unknown as AccountSnapshot;
    const idx = snapshots.value.findIndex((s) => s.snapshot_id === incoming.snapshot_id);
    if (idx >= 0) {
      snapshots.value[idx] = incoming;
    } else {
      snapshots.value = [incoming, ...snapshots.value];
    }
  }

  return {
    snapshots, reconciliations, margins, loading, error,
    fetchSnapshots, fetchReconciliations, fetchMargin, syncAll, reconcile, fetchAll,
    updateMarginFromWS, updateSnapshotFromWS,
  };
});

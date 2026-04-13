import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ledgerApi } from '@/api/ledger';
import type { LedgerEntry, DailySummary, LedgerConfigResponse } from '@/types';

export const useLedgerStore = defineStore('ledger', () => {
  const balances = ref<Record<string, Record<string, string>>>({});
  const entries = ref<LedgerEntry[]>([]);
  const entriesTotal = ref(0);
  const dailySummary = ref<DailySummary[]>([]);
  const config = ref<LedgerConfigResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchBalances() {
    try {
      balances.value = await ledgerApi.getBalances();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchEntries(params?: Record<string, unknown>) {
    try {
      loading.value = true;
      const data = await ledgerApi.getEntries(params);
      entries.value = data.entries;
      entriesTotal.value = data.total;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchDailySummary(date: string, account?: string) {
    try {
      dailySummary.value = await ledgerApi.getDailySummary(date, account);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchConfig() {
    try {
      config.value = await ledgerApi.getConfig();
    } catch { /* optional */ }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([fetchBalances(), fetchEntries(), fetchConfig()]);
    } finally {
      loading.value = false;
    }
  }

  return {
    balances, entries, entriesTotal, dailySummary, config,
    loading, error,
    fetchBalances, fetchEntries, fetchDailySummary, fetchConfig, fetchAll,
  };
});

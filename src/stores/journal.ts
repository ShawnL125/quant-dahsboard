import { defineStore } from 'pinia';
import { ref } from 'vue';
import { journalApi } from '@/api/journal';
import type { JournalEntry, JournalReport } from '@/types';

export const useJournalStore = defineStore('journal', () => {
  const entries = ref<JournalEntry[]>([]);
  const report = ref<JournalReport | null>(null);
  const pendingCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchEntries(params?: { strategy_id?: string; symbol?: string; limit?: number; offset?: number }) {
    try {
      const data = await journalApi.getEntries(params);
      entries.value = data.data;
    } catch { entries.value = []; }
  }

  async function fetchReport(params?: { strategy_id?: string; days?: number }) {
    try {
      const data = await journalApi.getReport(params);
      report.value = data.data;
    } catch { report.value = null; }
  }

  async function fetchPendingCount() {
    try {
      const data = await journalApi.getPendingCount();
      pendingCount.value = data.data.count;
    } catch { pendingCount.value = 0; }
  }

  async function updateEntry(entryId: string, data: { notes?: string; tags?: string[]; rating?: number }) {
    try {
      const resp = await journalApi.updateEntry(entryId, data);
      const idx = entries.value.findIndex((e) => e.entry_id === entryId);
      if (idx >= 0) entries.value[idx] = resp.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function reviewEntry(entryId: string, data: { review_notes?: string; action_items?: string[] }) {
    try {
      const resp = await journalApi.reviewEntry(entryId, data);
      const idx = entries.value.findIndex((e) => e.entry_id === entryId);
      if (idx >= 0) entries.value[idx] = resp.data;
      pendingCount.value = Math.max(0, pendingCount.value - 1);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function dismissEntry(entryId: string) {
    try {
      await journalApi.dismissEntry(entryId);
      entries.value = entries.value.filter((e) => e.entry_id !== entryId);
      pendingCount.value = Math.max(0, pendingCount.value - 1);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  return {
    entries, report, pendingCount, loading, error,
    fetchEntries, fetchReport, fetchPendingCount, updateEntry, reviewEntry, dismissEntry,
  };
});

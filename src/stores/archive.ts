import { defineStore } from 'pinia';
import { ref } from 'vue';
import { archiveApi } from '@/api/archive';
import type { ArchivedRun, ArchiveVersionSummary, ArchiveComparison } from '@/types';

export const useArchiveStore = defineStore('archive', () => {
  const entries = ref<ArchivedRun[]>([]);
  const versions = ref<ArchiveVersionSummary[]>([]);
  const comparison = ref<ArchiveComparison | null>(null);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchEntries(params?: { strategy_id?: string; version?: string; tag?: string; limit?: number; offset?: number }) {
    try {
      const data = await archiveApi.getEntries(params);
      entries.value = data.data;
      total.value = data.total;
    } catch { entries.value = []; total.value = 0; }
  }

  async function fetchVersions(strategyId: string) {
    try {
      const data = await archiveApi.getVersions(strategyId);
      versions.value = data.data;
    } catch { versions.value = []; }
  }

  async function compareVersions(strategyId: string, versionA: string, versionB: string) {
    try {
      const data = await archiveApi.compareVersions(strategyId, versionA, versionB);
      comparison.value = data.data;
    } catch { comparison.value = null; }
  }

  async function archiveRun(runId: string, data: { strategy_id: string; strategy_version?: string; tag?: string; label?: string }) {
    try {
      loading.value = true;
      return await archiveApi.archiveRun(runId, data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateTag(runId: string, tag: string) {
    try {
      return await archiveApi.updateTag(runId, tag);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  return { entries, versions, comparison, total, loading, error, fetchEntries, fetchVersions, compareVersions, archiveRun, updateTag };
});

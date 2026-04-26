import { defineStore } from 'pinia';
import { ref } from 'vue';
import { governanceApi } from '@/api/governance';
import type { QualityScore, ArchiveRun, LifecycleResult } from '@/types';

export const useGovernanceStore = defineStore('governance', () => {
  const qualityScores = ref<QualityScore[]>([]);
  const symbols = ref<string[]>([]);
  const archiveRuns = ref<ArchiveRun[]>([]);
  const archiveStatus = ref<Record<string, unknown> | null>(null);
  const status = ref<Record<string, unknown> | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchQualityScores(params?: { symbol?: string }) {
    try {
      const data = await governanceApi.getQualityScores(params);
      qualityScores.value = data.data;
    } catch { qualityScores.value = []; }
  }

  async function fetchSymbols() {
    try {
      const data = await governanceApi.getQualitySymbols();
      symbols.value = data.data;
    } catch { symbols.value = []; }
  }

  async function evaluateQuality(data: { symbol: string; timeframe: string }) {
    try {
      return await governanceApi.evaluateQuality(data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function fetchArchiveStatus() {
    try {
      const data = await governanceApi.getArchiveStatus();
      archiveStatus.value = data.data;
    } catch { archiveStatus.value = null; }
  }

  async function runArchive(data: { symbols: string[]; start_time: string; end_time: string }) {
    try {
      loading.value = true;
      return await governanceApi.runArchive(data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchArchiveRuns(params?: { limit?: number }) {
    try {
      const data = await governanceApi.getArchiveRuns(params);
      archiveRuns.value = data.data;
    } catch { archiveRuns.value = []; }
  }

  async function lifecycleDryRun(data: { symbol: string; timeframe: string; action: string }) {
    try {
      return await governanceApi.lifecycleDryRun(data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function lifecycleExecute(data: { symbol: string; timeframe: string; action: string; confirmed: boolean }) {
    try {
      return await governanceApi.lifecycleExecute(data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function fetchStatus() {
    try {
      const data = await governanceApi.getStatus();
      status.value = data.data;
    } catch { status.value = null; }
  }

  return {
    qualityScores, symbols, archiveRuns, archiveStatus, status, loading, error,
    fetchQualityScores, fetchSymbols, evaluateQuality, fetchArchiveStatus,
    runArchive, fetchArchiveRuns, lifecycleDryRun, lifecycleExecute, fetchStatus,
  };
});

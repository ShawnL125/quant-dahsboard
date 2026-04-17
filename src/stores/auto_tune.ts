import { defineStore } from 'pinia';
import { ref } from 'vue';
import { autoTuneApi } from '@/api/auto_tune';
import type { AutoTuneRun, AutoTuneSchedule } from '@/types';

export const useAutoTuneStore = defineStore('autoTune', () => {
  const runs = ref<AutoTuneRun[]>([]);
  const schedules = ref<AutoTuneSchedule[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRuns(params?: { strategy_id?: string; limit?: number }) {
    try {
      const data = await autoTuneApi.getRuns(params);
      runs.value = data.runs;
    } catch { runs.value = []; }
  }

  async function fetchSchedules() {
    try {
      const data = await autoTuneApi.getSchedules();
      schedules.value = data.schedules;
    } catch { schedules.value = []; }
  }

  async function triggerRun(data: { strategy_id: string; apply_mode?: string; data_path?: string }) {
    loading.value = true;
    try {
      return await autoTuneApi.triggerRun(data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function confirmRun(runId: string) {
    try { await autoTuneApi.confirmRun(runId); await fetchRuns(); } catch { /* ignore */ }
  }

  async function rollbackRun(runId: string) {
    try { await autoTuneApi.rollbackRun(runId); await fetchRuns(); } catch { /* ignore */ }
  }

  async function deleteSchedule(scheduleId: string) {
    try { await autoTuneApi.deleteSchedule(scheduleId); await fetchSchedules(); } catch { /* ignore */ }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([fetchRuns(), fetchSchedules()]);
    } finally {
      loading.value = false;
    }
  }

  return {
    runs, schedules, loading, error,
    fetchRuns, fetchSchedules, triggerRun, confirmRun, rollbackRun, deleteSchedule, fetchAll,
  };
});

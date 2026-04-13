import { defineStore } from 'pinia';
import { ref } from 'vue';
import { qualityApi } from '@/api/quality';
import type { QualityAlert, HealthReadyResponse, SystemStatusResponse } from '@/types';

const MAX_ALERTS = 200;

export const useQualityStore = defineStore('quality', () => {
  const alerts = ref<QualityAlert[]>([]);
  const healthReady = ref<HealthReadyResponse | null>(null);
  const systemStatus = ref<SystemStatusResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function addAlert(alert: QualityAlert) {
    alerts.value = [alert, ...alerts.value].slice(0, MAX_ALERTS);
  }

  async function fetchHealthReady() {
    try {
      healthReady.value = await qualityApi.getHealthReady();
    } catch {
      /* health endpoint may be unavailable */
    }
  }

  async function fetchSystemStatus() {
    try {
      systemStatus.value = await qualityApi.getSystemStatus();
    } catch {
      /* status endpoint may be unavailable */
    }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([fetchHealthReady(), fetchSystemStatus()]);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  function clearAlerts() {
    alerts.value = [];
  }

  return {
    alerts,
    healthReady,
    systemStatus,
    loading,
    error,
    addAlert,
    fetchHealthReady,
    fetchSystemStatus,
    fetchAll,
    clearAlerts,
  };
});

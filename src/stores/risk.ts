import { defineStore } from 'pinia';
import { ref } from 'vue';
import { riskApi } from '@/api/risk';
import type { RiskStatus, ExposureData, RiskEvent, RiskConfig, DrawdownPoint } from '@/types';

export const useRiskStore = defineStore('risk', () => {
  const status = ref<RiskStatus | null>(null);
  const exposure = ref<ExposureData | null>(null);
  const events = ref<RiskEvent[]>([]);
  const eventsTotal = ref(0);
  const config = ref<RiskConfig | null>(null);
  const drawdownHistory = ref<DrawdownPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchStatus() {
    try {
      const data = await riskApi.getStatus();
      status.value = data;
      if (data?.drawdown) {
        drawdownHistory.value = [
          ...drawdownHistory.value,
          { time: Date.now(), value: data.drawdown.current_pct },
        ].slice(-600);
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchExposure() {
    try {
      exposure.value = await riskApi.getExposure();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchEvents(limit = 20, offset = 0) {
    try {
      const data = await riskApi.getEvents(limit, offset);
      events.value = data.events;
      eventsTotal.value = data.total;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchConfig() {
    try {
      config.value = await riskApi.getConfig();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchAll() {
    loading.value = true;
    await Promise.all([fetchStatus(), fetchExposure(), fetchEvents(), fetchConfig()]);
    loading.value = false;
  }

  async function postKillSwitch(payload: { level: 'GLOBAL' | 'SYMBOL' | 'STRATEGY'; target?: string; reason?: string; activate: boolean }) {
    try {
      await riskApi.postKillSwitch(payload);
      await fetchStatus();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  function updateFromWS(data: Record<string, unknown>) {
    const wsEvent: RiskEvent = {
      time: new Date().toISOString(),
      event_type: String(data.action || ''),
      level: String(data.level || ''),
      target: String(data.target || ''),
      reason: String(data.reason || ''),
      metadata: data,
    };
    events.value = [wsEvent, ...events.value];
    eventsTotal.value += 1;
    fetchStatus();
  }

  return {
    status,
    exposure,
    events,
    eventsTotal,
    config,
    drawdownHistory,
    loading,
    error,
    fetchStatus,
    fetchExposure,
    fetchEvents,
    fetchConfig,
    fetchAll,
    postKillSwitch,
    updateFromWS,
  };
});

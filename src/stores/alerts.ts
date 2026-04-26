import { defineStore } from 'pinia';
import { ref } from 'vue';
import { alertsApi } from '@/api/alerts';
import type { AlertRule, CreateAlertRule, UpdateAlertRule, AlertFiring } from '@/types';

export const useAlertsStore = defineStore('alerts', () => {
  const rules = ref<AlertRule[]>([]);
  const firings = ref<AlertFiring[]>([]);
  const activeAlerts = ref<AlertFiring[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRules(params?: { alert_type?: string; enabled_only?: boolean }) {
    try {
      const data = await alertsApi.listRules(params);
      rules.value = data.data;
    } catch { rules.value = []; }
  }

  async function createRule(data: CreateAlertRule) {
    try {
      const resp = await alertsApi.createRule(data);
      rules.value = [...rules.value, resp.data];
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function updateRule(ruleId: string, data: UpdateAlertRule) {
    try {
      const resp = await alertsApi.updateRule(ruleId, data);
      const idx = rules.value.findIndex((r) => r.rule_id === ruleId);
      if (idx >= 0) {
        rules.value[idx] = resp.data;
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function deleteRule(ruleId: string) {
    try {
      await alertsApi.deleteRule(ruleId);
      rules.value = rules.value.filter((r) => r.rule_id !== ruleId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function fetchFirings(params?: { rule_id?: string; status?: string; limit?: number; offset?: number }) {
    try {
      const data = await alertsApi.listFirings(params);
      firings.value = data.data;
    } catch { firings.value = []; }
  }

  async function fetchActiveAlerts() {
    try {
      const data = await alertsApi.getActiveAlerts();
      activeAlerts.value = data.data;
    } catch { activeAlerts.value = []; }
  }

  async function manualEvaluate(ruleId: string) {
    try {
      return await alertsApi.manualEvaluate(ruleId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([fetchRules(), fetchActiveAlerts()]);
    } finally {
      loading.value = false;
    }
  }

  function updateAlertFromWS(data: Record<string, unknown>) {
    if (!data?.firing_id) return;
    const incoming = data as unknown as AlertFiring;
    const idx = firings.value.findIndex((f) => f.firing_id === incoming.firing_id);
    if (idx >= 0) {
      firings.value[idx] = incoming;
    } else {
      firings.value = [incoming, ...firings.value];
    }
    // Update active alerts
    if (!incoming.resolved_at) {
      const activeIdx = activeAlerts.value.findIndex((a) => a.firing_id === incoming.firing_id);
      if (activeIdx >= 0) {
        activeAlerts.value[activeIdx] = incoming;
      } else {
        activeAlerts.value = [incoming, ...activeAlerts.value];
      }
    } else {
      activeAlerts.value = activeAlerts.value.filter((a) => a.firing_id !== incoming.firing_id);
    }
  }

  return {
    rules, firings, activeAlerts, loading, error,
    fetchRules, createRule, updateRule, deleteRule,
    fetchFirings, fetchActiveAlerts, manualEvaluate, fetchAll, updateAlertFromWS,
  };
});

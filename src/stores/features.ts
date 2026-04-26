import { defineStore } from 'pinia';
import { ref } from 'vue';
import { featuresApi } from '@/api/features';
import type { FeatureDefinition, FeatureValue } from '@/types';

export const useFeaturesStore = defineStore('features', () => {
  const definitions = ref<FeatureDefinition[]>([]);
  const values = ref<FeatureValue[]>([]);
  const status = ref<Record<string, unknown> | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDefinitions(params?: { feature_type?: string }) {
    try {
      const data = await featuresApi.listDefinitions(params);
      definitions.value = data.data;
    } catch { definitions.value = []; }
  }

  async function fetchValues(params?: { symbol?: string; timeframe?: string; feature_name?: string; limit?: number }) {
    try {
      const data = await featuresApi.queryValues(params);
      values.value = data.data;
    } catch { values.value = []; }
  }

  async function registerDefinition(data: { name: string; feature_type?: string; source?: string }) {
    try {
      const result = await featuresApi.registerDefinition(data);
      await fetchDefinitions();
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function deleteDefinition(name: string) {
    try {
      await featuresApi.deleteDefinition(name);
      definitions.value = definitions.value.filter((d) => d.name !== name);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function precompute(data: { symbol: string; timeframe: string }) {
    try {
      loading.value = true;
      return await featuresApi.precompute(data);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatus() {
    try {
      const data = await featuresApi.getStatus();
      status.value = data.data;
    } catch { status.value = null; }
  }

  return {
    definitions, values, status, loading, error,
    fetchDefinitions, fetchValues, registerDefinition, deleteDefinition, precompute, fetchStatus,
  };
});

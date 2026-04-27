<template>
  <div class="lifecycle-section">
    <a-spin :spinning="store.loading">
      <!-- Configure Step -->
      <div class="lifecycle-card">
        <div class="section-header">
          <span class="section-title">Lifecycle Management</span>
        </div>

        <div class="lifecycle-form">
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Symbol</label>
              <a-input
                v-model:value="form.symbol"
                size="small"
                placeholder="e.g. BTC/USDT"
                :disabled="isDryRunLocked"
              />
            </div>
            <div class="form-field">
              <label class="form-label">Timeframe</label>
              <a-input
                v-model:value="form.timeframe"
                size="small"
                placeholder="e.g. 1h"
                :disabled="isDryRunLocked"
              />
            </div>
            <div class="form-field">
              <label class="form-label">Action</label>
              <a-select v-model:value="form.action" size="small" style="width: 140px" :disabled="isDryRunLocked">
                <a-select-option value="archive">Archive</a-select-option>
                <a-select-option value="cleanup">Cleanup</a-select-option>
                <a-select-option value="validate">Validate</a-select-option>
              </a-select>
            </div>
            <div class="form-field form-actions">
              <a-button v-if="isDryRunLocked" size="small" @click="clearDryRun">
                Clear Preview
              </a-button>
              <a-button
                size="small"
                type="primary"
                :disabled="isDryRunLocked || !form.symbol || !form.timeframe || !form.action"
                :loading="dryRunning"
                @click="onDryRun"
              >
                Dry Run
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Step -->
      <div v-if="dryRunResult" class="lifecycle-card page-section">
        <div class="section-header">
          <span class="section-title">Dry Run Preview</span>
          <a-popconfirm
            title="Execute this lifecycle action?"
            ok-text="Confirm"
            cancel-text="Cancel"
            @confirm="onExecute"
          >
            <a-button
              size="small"
              type="primary"
              :loading="executing"
              :disabled="dryRunResult.warnings.length > 0 && dryRunResult.warnings.some((w) => w.toLowerCase().includes('error'))"
            >
              Confirm Execute
            </a-button>
          </a-popconfirm>
        </div>

        <div class="preview-grid">
          <div class="preview-item">
            <span class="preview-label">Symbol</span>
            <span class="preview-value text-bold">{{ dryRunResult.symbol }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Timeframe</span>
            <span class="preview-value text-mono">{{ dryRunResult.timeframe }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Action</span>
            <span class="preview-value">{{ dryRunResult.action }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Affected Records</span>
            <span class="preview-value text-bold">{{ dryRunResult.affected_records }}</span>
          </div>
        </div>

        <div v-if="dryRunResult.warnings.length > 0" class="warnings-block">
          <div class="warnings-title">Warnings</div>
          <ul class="warnings-list">
            <li v-for="(warning, idx) in dryRunResult.warnings" :key="idx" class="warning-item">
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Status Display -->
      <div v-if="store.status" class="lifecycle-card page-section">
        <div class="section-header">
          <span class="section-title">Status</span>
        </div>
        <table class="kv-table">
          <tbody>
            <tr v-for="(value, key) in store.status" :key="String(key)">
              <td class="kv-key text-mono">{{ key }}</td>
              <td class="kv-value">{{ formatValue(value) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useGovernanceStore } from '@/stores/governance';
import { message } from 'ant-design-vue';
import type { LifecycleResult } from '@/types';

const store = useGovernanceStore();

const form = reactive({
  symbol: '',
  timeframe: '',
  action: 'archive',
});

type LifecyclePayload = {
  symbol: string;
  timeframe: string;
  action: string;
};

const dryRunResult = ref<LifecycleResult | null>(null);
const previewPayload = ref<Readonly<LifecyclePayload> | null>(null);
const dryRunning = ref(false);
const executing = ref(false);
const isDryRunLocked = computed(() => previewPayload.value !== null);

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); }
    catch { return String(value); }
  }
  return String(value);
}

function clearDryRun() {
  dryRunResult.value = null;
  previewPayload.value = null;
}

async function onDryRun() {
  const symbol = form.symbol.trim();
  const timeframe = form.timeframe.trim();

  if (!symbol || !timeframe || !form.action) {
    message.warning('Symbol, timeframe, and action are required');
    return;
  }

  form.symbol = symbol;
  form.timeframe = timeframe;

  const payload = Object.freeze({
    symbol,
    timeframe,
    action: form.action,
  });

  dryRunning.value = true;
  clearDryRun();
  try {
    const result = await store.lifecycleDryRun(payload);
    previewPayload.value = payload;
    dryRunResult.value = result.data as LifecycleResult;
  } catch {
    message.error('Dry run failed');
  } finally {
    dryRunning.value = false;
  }
}

async function onExecute() {
  if (!dryRunResult.value || !previewPayload.value) return;
  executing.value = true;
  try {
    await store.lifecycleExecute({
      ...previewPayload.value,
      confirmed: true,
    });
    message.success('Lifecycle action executed');
    clearDryRun();
    await store.fetchStatus();
  } catch {
    message.error('Execution failed');
  } finally {
    executing.value = false;
  }
}

onMounted(() => {
  store.fetchStatus();
});
</script>

<style scoped>
.lifecycle-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-section {
  margin-top: var(--q-card-gap);
}

.lifecycle-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.lifecycle-form {
  margin-top: 4px;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.form-actions {
  padding-top: 18px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

@media (max-width: 700px) {
  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.preview-value {
  font-size: 13px;
  color: var(--q-text);
}

.warnings-block {
  border-top: 1px solid var(--q-border);
  padding-top: 12px;
  margin-top: 4px;
}

.warnings-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-warning);
  margin-bottom: 8px;
}

.warnings-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: var(--q-text);
}

.warning-item {
  margin-bottom: 4px;
  line-height: 1.5;
}

.kv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.kv-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--q-border);
}

.kv-table tr:last-child td { border-bottom: none; }

.kv-key {
  color: var(--q-text-muted);
  font-size: 11px;
  width: 200px;
}

.kv-value {
  color: var(--q-text);
}

.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
.text-bold { font-weight: 600; }
</style>

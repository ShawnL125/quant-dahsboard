<template>
  <div class="rebalance-section">
    <a-spin :spinning="store.loading">
      <!-- Status Card -->
      <div class="detail-subsection">
        <div class="section-header">
          <span class="section-title">Rebalance Status</span>
          <a-button size="small" @click="refreshAll">Refresh</a-button>
        </div>
        <template v-if="store.status">
          <div class="rebalance-status-grid">
            <div class="rebalance-metric">
              <span class="rebalance-label">Drift</span>
              <span
                class="rebalance-value"
                :class="parseFloat(store.status.drift_pct) > 5 ? 'val-negative' : 'val-positive'"
              >
                {{ parseFloat(store.status.drift_pct).toFixed(2) }}%
              </span>
            </div>
            <div class="rebalance-metric">
              <span class="rebalance-label">Status</span>
              <span
                class="status-pill"
                :class="store.status.status === 'balanced' ? 'status-ok' : 'status-warning'"
              >
                {{ store.status.status }}
              </span>
            </div>
            <div class="rebalance-metric">
              <span class="rebalance-label">Last Rebalance</span>
              <span class="text-muted">
                {{ store.status.last_rebalance_at ? formatTime(store.status.last_rebalance_at) : 'Never' }}
              </span>
            </div>
          </div>
        </template>
        <div v-else class="empty-sm">No rebalance status</div>
      </div>

      <!-- Drift Breakdown -->
      <div class="detail-subsection">
        <div class="section-title">Drift Breakdown</div>
        <table v-if="driftRows.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Target %</th>
              <th>Actual %</th>
              <th>Drift %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in driftRows" :key="row.asset">
              <td class="text-bold">{{ row.asset }}</td>
              <td class="text-mono">{{ row.target }}</td>
              <td class="text-mono">{{ row.actual }}</td>
              <td class="text-mono" :class="parseFloat(row.drift) > 0 ? 'val-negative' : 'val-positive'">
                {{ row.drift }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-sm">No drift data</div>
      </div>

      <!-- Rebalance History -->
      <div class="detail-subsection">
        <div class="section-title">Rebalance History</div>
        <table v-if="store.history.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Drift</th>
              <th>Orders</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in store.history" :key="r.rebalance_id">
              <td class="text-muted">{{ formatTime(r.created_at) }}</td>
              <td>
                <span class="status-pill" :class="r.status === 'completed' ? 'status-ok' : 'status-warning'">
                  {{ r.status }}
                </span>
              </td>
              <td class="text-mono">{{ parseFloat(r.drift_pct).toFixed(2) }}%</td>
              <td>{{ r.orders_executed }}/{{ r.orders_planned }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-sm">No rebalance history</div>
      </div>

      <!-- Actions -->
      <div class="rebalance-actions">
        <a-button size="small" @click="openTargetsModal">Update Targets</a-button>
        <a-popconfirm title="Trigger rebalance for this strategy?" @confirm="onTriggerRebalance">
          <a-button size="small" type="primary" :loading="store.loading">Trigger Rebalance</a-button>
        </a-popconfirm>
      </div>
    </a-spin>

    <!-- Update Targets Modal -->
    <a-modal
      v-model:open="targetsModalOpen"
      title="Update Target Weights"
      @ok="onUpdateTargets"
      :confirm-loading="updating"
    >
      <a-form layout="vertical">
        <a-form-item v-for="(weight, asset) in targetForm" :key="asset" :label="asset">
          <a-input-number
            v-model:value="targetForm[asset]"
            :min="0"
            :max="100"
            :step="0.1"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
      <div class="target-total" :class="isTargetTotalValid ? 'target-total-valid' : 'target-total-invalid'">
        Total: {{ targetWeightTotal.toFixed(2) }}%
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useRebalanceStore } from '@/stores/rebalance';
import { message } from 'ant-design-vue';

const props = defineProps<{
  strategyId: string;
}>();

const store = useRebalanceStore();
const targetsModalOpen = ref(false);
const updating = ref(false);

const targetForm = reactive<Record<string, number>>({});
const targetWeightTotal = computed(() => Object.values(targetForm).reduce((sum, weight) => sum + weight, 0));
const isTargetTotalValid = computed(() => Math.abs(Number(targetWeightTotal.value.toFixed(4)) - 100) <= 0.0001);

const driftRows = computed(() => {
  if (!store.drift?.asset_drift) return [];
  return Object.entries(store.drift.asset_drift).map(([asset, data]) => ({
    asset,
    target: data.target_pct,
    actual: data.actual_pct,
    drift: data.drift_pct,
  }));
});

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

async function refreshAll() {
  await Promise.all([
    store.fetchStatus(props.strategyId),
    store.fetchDrift(props.strategyId),
    store.fetchHistory({ strategy_id: props.strategyId }),
  ]);
}

function openTargetsModal() {
  const weights = store.status?.target_weights ?? {};
  Object.keys(targetForm).forEach((key) => delete targetForm[key]);
  for (const [asset, weight] of Object.entries(weights)) {
    targetForm[asset] = Number((weight * 100).toFixed(4));
  }
  targetsModalOpen.value = true;
}

async function onTriggerRebalance() {
  const targetWeights = store.status?.target_weights ?? {};
  try {
    await store.triggerRebalance({ strategy_id: props.strategyId, target_weights: targetWeights });
    message.success('Rebalance triggered');
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : 'Failed to trigger rebalance');
  }
}

async function onUpdateTargets() {
  const entries = Object.entries(targetForm);
  if (entries.length === 0) {
    message.warning('At least one target weight is required');
    return;
  }

  if (entries.some(([, weight]) => !Number.isFinite(weight) || weight < 0 || weight > 100)) {
    message.warning('Each target weight must be between 0% and 100%');
    return;
  }

  if (!isTargetTotalValid.value) {
    message.warning('Target weights must sum to 100%');
    return;
  }

  const targetWeights = Object.fromEntries(
    entries.map(([asset, weight]) => [asset, Number((weight / 100).toFixed(6))]),
  );

  updating.value = true;
  try {
    await store.updateTargets({ strategy_id: props.strategyId, target_weights: targetWeights });
    message.success('Target weights updated');
    targetsModalOpen.value = false;
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : 'Failed to update targets');
  } finally {
    updating.value = false;
  }
}

watch(
  () => props.strategyId,
  () => {
    refreshAll();
  },
  { immediate: true },
);
</script>

<style scoped>
.rebalance-section {
  display: flex;
  flex-direction: column;
}

.detail-subsection {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.rebalance-status-grid {
  display: flex;
  gap: 20px;
}

.rebalance-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rebalance-label {
  font-size: 11px;
  color: var(--q-text-muted);
}

.rebalance-value {
  font-size: 14px;
  font-weight: 700;
}

.status-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.status-ok {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.status-warning {
  background: rgba(234, 179, 8, 0.12);
  color: #eab308;
}

.val-positive {
  color: var(--q-success);
}

.val-negative {
  color: var(--q-error);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
}

.data-table td {
  padding: 8px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.text-muted {
  color: var(--q-text-muted);
  font-size: 11px;
}

.text-bold {
  font-weight: 600;
}

.text-mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.empty-sm {
  text-align: center;
  color: var(--q-text-muted);
  padding: 12px 0;
  font-size: 12px;
}

.rebalance-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.target-total {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
}

.target-total-valid {
  color: var(--q-success);
}

.target-total-invalid {
  color: var(--q-error);
}
</style>

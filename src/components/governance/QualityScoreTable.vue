<template>
  <div class="quality-section">
    <a-spin :spinning="store.loading">
      <!-- Filter Row -->
      <div class="filter-row">
        <a-select
          v-model:value="selectedSymbol"
          size="small"
          style="width: 180px"
          placeholder="Filter by symbol"
          allow-clear
          @change="onSymbolFilter"
        >
          <a-select-option v-for="s in store.symbols" :key="s" :value="s">{{ s }}</a-select-option>
        </a-select>
        <a-button size="small" type="primary" @click="evalModalOpen = true">Evaluate</a-button>
        <a-button size="small" @click="onRefresh">Refresh</a-button>
      </div>

      <!-- Scores Table -->
      <div class="scores-card">
        <table v-if="store.qualityScores.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Overall Score</th>
              <th>Completeness</th>
              <th>Freshness</th>
              <th>Anomalies</th>
              <th>Last Evaluated</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="score in store.qualityScores" :key="score.symbol">
              <td class="text-bold">{{ score.symbol }}</td>
              <td>
                <span :class="scoreClass(score.overall_score)">
                  {{ parseFloat(score.overall_score).toFixed(3) }}
                </span>
              </td>
              <td>
                <span :class="scoreClass(score.completeness_pct)">
                  {{ parseFloat(score.completeness_pct).toFixed(1) }}%
                </span>
              </td>
              <td>
                <span :class="scoreClass(score.freshness_score)">
                  {{ parseFloat(score.freshness_score).toFixed(3) }}
                </span>
              </td>
              <td>
                <span :class="score.anomaly_count > 0 ? 'val-negative' : 'val-positive'">
                  {{ score.anomaly_count }}
                </span>
              </td>
              <td class="text-muted">{{ formatTime(score.last_evaluated_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No quality scores available</div>
      </div>
    </a-spin>

    <!-- Evaluate Modal -->
    <a-modal
      v-model:open="evalModalOpen"
      title="Evaluate Quality"
      @ok="onEvaluate"
      :confirm-loading="evaluating"
    >
      <a-form layout="vertical">
        <a-form-item label="Symbol" required>
          <a-input v-model:value="evalForm.symbol" placeholder="e.g. BTC/USDT" />
        </a-form-item>
        <a-form-item label="Timeframe" required>
          <a-input v-model:value="evalForm.timeframe" placeholder="e.g. 1h" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useGovernanceStore } from '@/stores/governance';
import { message } from 'ant-design-vue';

const store = useGovernanceStore();

const selectedSymbol = ref<string | undefined>(undefined);
const evalModalOpen = ref(false);
const evaluating = ref(false);
const evalForm = reactive({ symbol: '', timeframe: '' });

function scoreClass(value: string): string {
  const num = parseFloat(value);
  if (num >= 0.8) return 'val-positive';
  if (num >= 0.5) return 'val-warning';
  return 'val-negative';
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}

function onSymbolFilter(value: string | undefined) {
  store.fetchQualityScores(value ? { symbol: value } : undefined);
}

function onRefresh() {
  store.fetchQualityScores(selectedSymbol.value ? { symbol: selectedSymbol.value } : undefined);
  store.fetchSymbols();
}

async function onEvaluate() {
  if (!evalForm.symbol || !evalForm.timeframe) {
    message.warning('Symbol and timeframe are required');
    return;
  }
  evaluating.value = true;
  try {
    await store.evaluateQuality({ symbol: evalForm.symbol, timeframe: evalForm.timeframe });
    message.success('Quality evaluation started');
    evalModalOpen.value = false;
    evalForm.symbol = '';
    evalForm.timeframe = '';
    store.fetchQualityScores(selectedSymbol.value ? { symbol: selectedSymbol.value } : undefined);
  } catch {
    message.error('Quality evaluation failed');
  } finally {
    evaluating.value = false;
  }
}

onMounted(() => {
  store.fetchQualityScores();
  store.fetchSymbols();
});
</script>

<style scoped>
.quality-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.scores-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
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
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); }

.val-positive { color: var(--q-success); font-weight: 600; }
.val-negative { color: var(--q-error); font-weight: 600; }
.val-warning { color: var(--q-warning); font-weight: 600; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

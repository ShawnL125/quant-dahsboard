<template>
  <div class="funding-page">
    <a-spin :spinning="store.loading">
      <!-- Current Rates -->
      <div class="card">
        <div class="section-header">
          <span class="section-title">Current Funding Rates</span>
          <a-button size="small" @click="onRefresh">Refresh</a-button>
        </div>
        <div v-if="Object.keys(store.currentRates).length > 0" class="rate-grid">
          <div v-for="(rate, symbol) in store.currentRates" :key="symbol" class="rate-card">
            <div class="rate-symbol">{{ symbol }}</div>
            <div class="rate-value" :class="parseFloat(rate.funding_rate) >= 0 ? 'val-positive' : 'val-negative'">
              {{ (parseFloat(rate.funding_rate) * 100).toFixed(4) }}%
            </div>
            <div v-if="rate.mark_price" class="rate-row">
              <span class="rate-label">Mark Price</span>
              <span class="rate-mono">{{ rate.mark_price }}</span>
            </div>
            <div class="rate-time">{{ formatTime(rate.funding_time) }}</div>
          </div>
        </div>
        <div v-else class="empty-state">No funding rate data</div>
      </div>

      <!-- Historical Rates -->
      <div class="card page-section">
        <div class="section-header">
          <span class="section-title">Historical Rates</span>
          <div class="header-actions">
            <a-select
              v-model:value="selectedSymbol"
              size="small"
              style="width: 160px"
              placeholder="Select symbol"
              @change="onSymbolChange"
            >
              <a-select-option v-for="sym in symbolList" :key="sym" :value="sym">{{ sym }}</a-select-option>
            </a-select>
          </div>
        </div>
        <table v-if="store.historyRates.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Rate</th>
              <th>Mark Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rate in store.historyRates" :key="rate.funding_time + rate.symbol">
              <td class="text-muted">{{ formatTime(rate.funding_time) }}</td>
              <td class="text-bold">{{ rate.symbol }}</td>
              <td class="text-mono" :class="parseFloat(rate.funding_rate) >= 0 ? 'val-positive' : 'val-negative'">
                {{ (parseFloat(rate.funding_rate) * 100).toFixed(4) }}%
              </td>
              <td class="text-mono">{{ rate.mark_price || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">{{ selectedSymbol ? 'No history for this symbol' : 'Select a symbol to view history' }}</div>
      </div>

      <!-- Funding Cost Summary -->
      <div class="card page-section">
        <div class="section-header">
          <span class="section-title">Funding Cost Summary</span>
          <div class="header-actions">
            <a-select
              v-model:value="costStrategyId"
              size="small"
              style="width: 160px"
              placeholder="Select strategy"
              allow-clear
              @change="onCostStrategyChange"
            >
              <a-select-option v-for="s in strategyIds" :key="s" :value="s">{{ s }}</a-select-option>
            </a-select>
          </div>
        </div>
        <div v-if="store.costSummary" class="cost-summary">
          <div class="cost-row">
            <span class="cost-label">Strategy</span>
            <span class="cost-value">{{ store.costSummary.strategy_id }}</span>
          </div>
          <div class="cost-row">
            <span class="cost-label">Total Cost</span>
            <span class="cost-value text-mono" :class="parseFloat(store.costSummary.total_cost) < 0 ? 'val-negative' : 'val-positive'">
              {{ store.costSummary.total_cost }}
            </span>
          </div>
          <div class="cost-row">
            <span class="cost-label">Records</span>
            <span class="cost-value">{{ store.costSummary.record_count }}</span>
          </div>
        </div>
        <div v-else class="empty-state">{{ costStrategyId ? 'No cost data' : 'Select a strategy to view cost' }}</div>
      </div>

      <!-- Backfill -->
      <div class="card page-section">
        <div class="section-header">
          <span class="section-title">Backfill</span>
        </div>
        <div class="backfill-form">
          <a-input v-model:value="backfillSymbol" placeholder="Symbol (e.g. BTC/USDT)" size="small" style="width: 180px" />
          <a-input v-model:value="backfillExchange" placeholder="Exchange" size="small" style="width: 120px" />
          <a-button size="small" type="primary" :loading="backfillLoading" @click="onBackfill">Backfill</a-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFundingStore } from '@/stores/funding';
import { useStrategiesStore } from '@/stores/strategies';
import { fundingApi } from '@/api/funding';
import { message } from 'ant-design-vue';

const store = useFundingStore();
const strategiesStore = useStrategiesStore();

const selectedSymbol = ref<string | undefined>(undefined);
const costStrategyId = ref<string | undefined>(undefined);
const backfillSymbol = ref('');
const backfillExchange = ref('');
const backfillLoading = ref(false);

const symbolList = computed(() => Object.keys(store.currentRates));
const strategyIds = computed(() => strategiesStore.strategies.map((s) => s.strategy_id));

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function onRefresh() { store.fetchAll(); }

function onSymbolChange(sym: string) {
  store.fetchHistory(sym, { limit: 50 });
}

function onCostStrategyChange(id: string | undefined) {
  if (id) store.fetchCost(id);
  else store.costSummary = null;
}

async function onBackfill() {
  if (!backfillSymbol.value || !backfillExchange.value) {
    message.warning('Symbol and exchange are required');
    return;
  }
  backfillLoading.value = true;
  try {
    const result = await fundingApi.backfill({ symbol: backfillSymbol.value, exchange: backfillExchange.value });
    message.success(`Backfilled ${result.records_fetched} records`);
  } catch {
    message.error('Backfill failed');
  } finally {
    backfillLoading.value = false;
  }
}

onMounted(() => {
  store.fetchAll();
  strategiesStore.fetchStrategies();
});
</script>

<style scoped>
.funding-page { display: flex; flex-direction: column; gap: var(--q-card-gap); }
.page-section { margin-top: var(--q-card-gap); }

.card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.header-actions { display: flex; gap: 8px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--q-primary-dark); }

.rate-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
.rate-card { background: var(--q-bg); border: 1px solid var(--q-border); border-radius: 8px; padding: 10px 12px; }
.rate-symbol { font-size: 11px; font-weight: 600; color: var(--q-text-muted); text-transform: uppercase; margin-bottom: 4px; }
.rate-value { font-size: 18px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; }
.rate-row { display: flex; justify-content: space-between; padding: 2px 0; margin-top: 4px; }
.rate-label { font-size: 11px; color: var(--q-text-muted); }
.rate-mono { font-size: 12px; font-weight: 600; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--q-text); }
.rate-time { font-size: 10px; color: var(--q-text-muted); margin-top: 4px; }

.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { text-align: left; color: var(--q-text-muted); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; padding: 6px 0; }
.data-table td { padding: 8px 0; color: var(--q-text); border-bottom: 1px solid var(--q-border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
.val-positive { color: var(--q-success); }
.val-negative { color: var(--q-error); }

.cost-summary { display: flex; flex-direction: column; gap: 6px; }
.cost-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--q-border); }
.cost-row:last-child { border-bottom: none; }
.cost-label { font-size: 12px; color: var(--q-text-muted); }
.cost-value { font-size: 13px; font-weight: 600; color: var(--q-text); }

.backfill-form { display: flex; gap: 8px; align-items: center; }

.empty-state { text-align: center; color: var(--q-text-muted); padding: 24px 0; font-size: 13px; }
</style>

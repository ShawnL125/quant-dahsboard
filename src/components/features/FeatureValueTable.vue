<template>
  <div class="values-card">
    <div class="section-header">
      <span class="section-title">Feature Values</span>
      <a-button size="small" @click="store.fetchValues()">Refresh</a-button>
    </div>

    <!-- Filter Row -->
    <div class="filter-row">
      <a-input
        v-model:value="filters.symbol"
        placeholder="Symbol"
        allow-clear
        size="small"
        style="width: 140px"
      />
      <a-input
        v-model:value="filters.timeframe"
        placeholder="Timeframe"
        allow-clear
        size="small"
        style="width: 120px"
      />
      <a-input
        v-model:value="filters.feature_name"
        placeholder="Feature name"
        allow-clear
        size="small"
        style="width: 160px"
      />
      <a-button size="small" type="primary" @click="onSearch">Search</a-button>
    </div>

    <table v-if="store.values.length > 0" class="data-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Timeframe</th>
          <th>Feature</th>
          <th>Timestamp</th>
          <th>Candle Count</th>
          <th>Values</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(val, i) in store.values" :key="i">
          <td class="text-bold">{{ val.symbol }}</td>
          <td class="text-mono">{{ val.timeframe }}</td>
          <td class="text-mono">{{ val.feature_name }}</td>
          <td class="text-muted">{{ formatTime(val.timestamp) }}</td>
          <td class="text-bold">{{ val.candle_count }}</td>
          <td>
            <div class="json-cell" :class="{ expanded: expandedRows.has(i) }" @click="toggleExpand(i)">
              {{ formatValues(val.values) }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">No feature values found</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useFeaturesStore } from '@/stores/features';

const store = useFeaturesStore();

const filters = reactive({
  symbol: '',
  timeframe: '',
  feature_name: '',
});

const expandedRows = ref(new Set<number>());

function onSearch() {
  const params: { symbol?: string; timeframe?: string; feature_name?: string } = {};
  if (filters.symbol) params.symbol = filters.symbol;
  if (filters.timeframe) params.timeframe = filters.timeframe;
  if (filters.feature_name) params.feature_name = filters.feature_name;
  store.fetchValues(params);
}

function toggleExpand(index: number) {
  const next = new Set(expandedRows.value);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  expandedRows.value = next;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function formatValues(values: Record<string, unknown>): string {
  if (!values) return '-';
  try {
    return JSON.stringify(values, null, 2);
  } catch {
    return String(values);
  }
}
</script>

<style scoped>
.values-card {
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

.filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
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

.text-muted { color: var(--q-text-muted); }
.text-bold { font-weight: 600; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.json-cell {
  background: var(--q-bg);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'SF Mono', monospace;
  font-size: 11px;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: max-height 0.2s ease;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.json-cell.expanded {
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

<template>
  <div class="exposure-card">
    <div class="exposure-header">
      <div class="exposure-header-left">
        <span class="exposure-title">Exposure</span>
        <span class="exposure-summary">
          {{ exposurePct.toFixed(1) }}% / {{ maxPct.toFixed(0) }}% max
        </span>
      </div>
    </div>
    <div class="exposure-bar-wrap">
      <div class="exposure-bar-bg">
        <div
          class="exposure-bar-fill"
          :style="{ width: barPct + '%', background: barColor }"
        ></div>
      </div>
    </div>

    <a-table
      v-if="rows.length > 0"
      :columns="columns"
      :data-source="rows"
      :pagination="false"
      size="small"
      row-key="key"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'value'">
          ${{ record.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
        </template>
        <template v-if="column.key === 'pct'">
          <div class="pct-cell">
            <span :class="{ 'pct-warn': record.overLimit }">{{ record.pctOfEquity.toFixed(1) }}%</span>
            <div class="mini-bar-bg">
              <div class="mini-bar-fill" :style="{ width: record.sharePct + '%' }"></div>
            </div>
          </div>
        </template>
      </template>
    </a-table>

    <div v-if="rows.length > 0" class="exposure-footer">
      {{ rows.length }} position{{ rows.length !== 1 ? 's' : '' }}
      &middot; Total: ${{ totalExposureFormatted }}
      &middot; {{ exposurePct.toFixed(1) }}%
    </div>
    <div v-else class="exposure-empty">No open positions</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ExposureData, RiskConfig } from '@/types';

const props = defineProps<{
  exposure: ExposureData;
  config: RiskConfig | null;
}>();

const maxPct = computed(() => props.exposure?.max_total_pct ?? 100);
const exposurePct = computed(() => props.exposure?.total_pct ?? 0);
const barPct = computed(() => {
  if (!maxPct.value) return 0;
  return Math.min((exposurePct.value / maxPct.value) * 100, 100);
});
const barColor = computed(() => {
  const ratio = barPct.value;
  if (ratio > 75) return 'var(--q-error)';
  if (ratio > 50) return 'var(--q-warning)';
  return 'var(--q-success)';
});

const totalExposureFormatted = computed(() => {
  const v = props.exposure?.total_exposure;
  if (v == null) return '0';
  return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
});

const columns = [
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
  { title: 'Side', dataIndex: 'side', key: 'side' },
  { title: 'Value', key: 'value' },
  { title: '% Equity', key: 'pct' },
];

const rows = computed(() => {
  if (!props.exposure?.by_symbol) return [];
  const totalValue = props.exposure.total_exposure || 1;
  const singleLimit = props.config?.max_single_asset_pct ?? Infinity;
  return Object.entries(props.exposure.by_symbol).map(([key, s]) => ({
    key,
    symbol: s.symbol + ' / ' + s.exchange,
    side: s.side,
    value: s.value,
    pctOfEquity: s.pct_of_equity,
    sharePct: totalValue > 0 ? (s.value / totalValue) * 100 : 0,
    overLimit: s.pct_of_equity > singleLimit,
  }));
});
</script>

<style scoped>
.exposure-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.exposure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.exposure-header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.exposure-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.exposure-summary {
  font-size: 12px;
  color: var(--q-text-secondary);
}

.exposure-bar-wrap {
  margin-bottom: 16px;
}

.exposure-bar-bg {
  height: 6px;
  background: var(--q-bg);
  border-radius: 3px;
  overflow: hidden;
}

.exposure-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.pct-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pct-warn {
  color: var(--q-error);
  font-weight: 600;
}

.mini-bar-bg {
  width: 60px;
  height: 4px;
  background: var(--q-bg);
  border-radius: 2px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  background: var(--q-primary);
  border-radius: 2px;
  opacity: 0.5;
}

.exposure-footer {
  margin-top: 8px;
  font-size: 11px;
  color: var(--q-text-muted);
  text-align: center;
}

.exposure-empty {
  padding: 20px;
  text-align: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>

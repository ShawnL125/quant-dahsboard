<template>
  <div class="chart-card">
    <div class="chart-card-header">
      <span class="chart-title">Equity Curve</span>
      <span class="chart-range">{{ points.length }} points</span>
    </div>
    <v-chart
      v-if="points.length > 1"
      :option="chartOption"
      style="height: 260px; width: 100%"
      autoresize
    />
    <div v-else class="chart-empty">No equity data</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';
import { CHART_GRID, CHART_TOOLTIP, LINE_SERIES_DEFAULTS } from '@/utils/chart-theme';
import type { BacktestEquityPoint } from '@/types';

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  points: BacktestEquityPoint[];
}>();

const chartOption = computed(() => {
  const times = props.points.map((p) => {
    try {
      return new Date(p.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return p.timestamp;
    }
  });
  const values = props.points.map((p) => parseFloat(p.equity));

  return {
    tooltip: {
      ...CHART_TOOLTIP,
      valueFormatter: (v: number) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    grid: CHART_GRID,
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: times,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#787b86', fontSize: 10, interval: 'auto' as const },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        color: '#787b86',
        fontSize: 10,
        formatter: (v: number) => '$' + (v / 1000).toFixed(1) + 'k',
      },
      splitLine: { lineStyle: { color: '#2a2e39' } },
    },
    series: [{
      name: 'Equity',
      type: 'line' as const,
      ...LINE_SERIES_DEFAULTS,
      data: values,
    }],
  };
});
</script>

<style scoped>
.chart-card {
  background: var(--q-card);
  border: 1px solid var(--q-border);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: none;
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.chart-range {
  font-size: 11px;
  color: var(--q-text-muted);
}

.chart-empty {
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>

<template>
  <div class="chart-card">
    <div class="chart-card-header">
      <span class="chart-title">Equity Curve</span>
      <span class="chart-range">Last 30 days</span>
    </div>
    <v-chart
      v-if="values.length > 0"
      :option="chartOption"
      style="height: 280px; width: 100%"
      autoresize
    />
    <div v-else class="chart-empty">No equity data yet</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';
import { LINE_SERIES_DEFAULTS, CHART_GRID, CHART_TOOLTIP } from '@/utils/chart-theme';

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  timestamps: string[];
  values: number[];
}>();

const chartOption = computed(() => ({
  tooltip: CHART_TOOLTIP,
  grid: CHART_GRID,
  xAxis: {
    type: 'category' as const,
    boundaryGap: false,
    data: props.timestamps,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value' as const,
    show: false,
  },
  series: [
    {
      name: 'Equity',
      type: 'line' as const,
      ...LINE_SERIES_DEFAULTS,
      data: props.values,
    },
  ],
}));
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
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>

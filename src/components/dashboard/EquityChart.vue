<template>
  <a-card title="Equity Curve">
    <v-chart
      v-if="values.length > 0"
      :option="chartOption"
      style="height: 320px; width: 100%"
      autoresize
    />
    <a-empty v-else description="No equity data yet" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const props = defineProps<{
  timestamps: string[];
  values: number[];
}>();

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis' as const,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category' as const,
    boundaryGap: false,
    data: props.timestamps,
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: {
      formatter: '${value}',
    },
  },
  series: [
    {
      name: 'Equity',
      type: 'line' as const,
      smooth: true,
      data: props.values,
      lineStyle: { color: '#1890ff' },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24,144,255,0.3)' },
            { offset: 1, color: 'rgba(24,144,255,0.02)' },
          ],
        },
      },
    },
  ],
}));
</script>

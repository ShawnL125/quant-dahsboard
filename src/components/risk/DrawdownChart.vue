<template>
  <div class="chart-card">
    <div class="chart-card-header">
      <div class="chart-header-left">
        <span class="chart-title">Drawdown</span>
        <span class="chart-value" :class="drawdownValue > 5 ? 'value-warn' : 'value-ok'">
          {{ drawdownValue.toFixed(1) }}%
          <span class="trend-arrow">{{ drawdownValue > 0 ? '↓' : '—' }}</span>
        </span>
      </div>
      <div class="chart-header-right">
        <span class="chart-meta">Peak: ${{ formatNum(drawdown?.peak_equity) }}</span>
      </div>
    </div>
    <v-chart
      v-if="history.length > 1"
      :option="chartOption"
      style="height: 220px; width: 100%"
      autoresize
    />
    <div v-else class="chart-empty">Collecting drawdown data...</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';
import { CHART_GRID, CHART_TOOLTIP } from '@/utils/chart-theme';
import type { DrawdownData, DrawdownPoint } from '@/types';

use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

const props = defineProps<{
  drawdown: DrawdownData | null | undefined;
  history: DrawdownPoint[];
}>();

const drawdownValue = computed(() => props.drawdown?.current_pct ?? 0);

function formatNum(v: number | undefined | null): string {
  if (v == null) return '—';
  return Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const chartOption = computed(() => {
  const times = props.history.map((p) => {
    const d = new Date(p.time);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const values = props.history.map((p) => -p.value);

  const markLines: Array<{ yAxis: number; lineStyle: Record<string, unknown>; label: Record<string, unknown> }> = [];
  if (props.drawdown?.max_threshold) {
    markLines.push({
      yAxis: -props.drawdown.max_threshold,
      lineStyle: { color: '#ef5350', type: 'dashed' as const, width: 1.5 },
      label: { formatter: 'HALT', color: '#ef5350', fontSize: 10, position: 'insideEndTop' as const },
    });
  }
  if (props.drawdown?.reduce_threshold) {
    markLines.push({
      yAxis: -props.drawdown.reduce_threshold,
      lineStyle: { color: '#ff9800', type: 'dashed' as const, width: 1.5 },
      label: { formatter: 'REDUCE', color: '#ff9800', fontSize: 10, position: 'insideEndTop' as const },
    });
  }

  return {
    tooltip: { ...CHART_TOOLTIP, valueFormatter: (v: number) => `${v.toFixed(2)}%` },
    grid: CHART_GRID,
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: times,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#787b86', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#787b86', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#2a2e39' } },
    },
    series: [{
      name: 'Drawdown',
      type: 'line' as const,
      smooth: true,
      symbol: 'none' as const,
      data: values,
      lineStyle: { color: '#ef5350', width: 2 },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(239, 83, 80, 0.25)' },
            { offset: 1, color: 'rgba(239, 83, 80, 0.02)' },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: 'none' as const,
        data: markLines,
      },
    }],
  };
});
</script>

<style scoped>
.chart-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.chart-value {
  font-size: 18px;
  font-weight: 700;
}

.value-ok {
  color: var(--q-success);
}

.value-warn {
  color: var(--q-error);
}

.trend-arrow {
  font-size: 14px;
}

.chart-header-right {
  display: flex;
  gap: 12px;
}

.chart-meta {
  font-size: 11px;
  color: var(--q-text-muted);
}

.chart-empty {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>

<template>
  <div class="donut-card" @click="router.push('/positions')" style="cursor: pointer;">
    <div class="donut-title">
      <span>Positions</span>
      <span class="view-link">View All →</span>
    </div>
    <div v-if="positions.length > 0" class="donut-body">
      <v-chart :option="chartOption" style="height: 160px; width: 160px" autoresize />
      <div class="donut-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--q-success)"></span>
          <span class="legend-label">Profit</span>
          <span class="legend-count">{{ profitCount }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--q-primary)"></span>
          <span class="legend-label">Open</span>
          <span class="legend-count">{{ neutralCount }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--q-error)"></span>
          <span class="legend-label">Loss</span>
          <span class="legend-count">{{ lossCount }}</span>
        </div>
      </div>
    </div>
    <div v-else class="donut-empty">No open positions</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import VChart from 'vue-echarts';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from 'echarts/core';
import type { Position } from '@/types';

use([PieChart, TooltipComponent, CanvasRenderer]);

const router = useRouter();

const props = defineProps<{
  positions: Position[];
}>();

const profitCount = computed(() =>
  props.positions.filter((p) => parseFloat(p.unrealized_pnl) > 0).length,
);
const lossCount = computed(() =>
  props.positions.filter((p) => parseFloat(p.unrealized_pnl) < 0).length,
);
const neutralCount = computed(() =>
  props.positions.filter((p) => parseFloat(p.unrealized_pnl) === 0).length,
);

const chartOption = computed(() => {
  const data = [];
  if (profitCount.value > 0) data.push({ value: profitCount.value, name: 'Profit', itemStyle: { color: '#10b981' } });
  if (neutralCount.value > 0) data.push({ value: neutralCount.value, name: 'Open', itemStyle: { color: '#3b82f6' } });
  if (lossCount.value > 0) data.push({ value: lossCount.value, name: 'Loss', itemStyle: { color: '#ef4444' } });
  if (data.length === 0) data.push({ value: 1, name: 'None', itemStyle: { color: '#e2e8f0' } });

  return {
    tooltip: { show: false },
    series: [{
      type: 'pie' as const,
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      data,
      label: {
        show: true,
        position: 'center',
        formatter: () => String(props.positions.length),
        fontSize: 20,
        fontWeight: 700,
        color: '#1e3a8a',
      },
      emphasis: { disabled: true },
      animation: false,
    }],
  };
});
</script>

<style scoped>
.donut-card {
  background: var(--q-card);
  border: 1px solid var(--q-border);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: none;
}

.donut-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-link {
  font-size: 12px;
  color: var(--q-primary);
  font-weight: 500;
}

.view-link:hover {
  text-decoration: underline;
}

.donut-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  color: var(--q-text-secondary);
}

.legend-count {
  font-weight: 600;
  color: var(--q-text);
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}

.donut-empty {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-text-muted);
  font-size: 13px;
}
</style>

<template>
  <div v-if="result">
    <MetricsCards :result="result" />
    <a-card title="Detailed Metrics" style="margin-top: 16px">
      <a-descriptions bordered :column="2" size="small">
        <a-descriptions-item label="Group ID">
          {{ result.group_id }}
        </a-descriptions-item>
        <a-descriptions-item label="Total Return">
          {{ parseFloat(result.total_return_pct).toFixed(2) }}%
        </a-descriptions-item>
        <a-descriptions-item label="Sharpe Ratio">
          {{ parseFloat(result.sharpe_ratio).toFixed(2) }}
        </a-descriptions-item>
        <a-descriptions-item label="Calmar Ratio">
          {{ parseFloat(result.calmar_ratio).toFixed(2) }}
        </a-descriptions-item>
        <a-descriptions-item label="Max Drawdown">
          {{ parseFloat(result.max_drawdown_pct).toFixed(2) }}%
        </a-descriptions-item>
        <a-descriptions-item label="Win Rate">
          {{ parseFloat(result.win_rate).toFixed(1) }}%
        </a-descriptions-item>
        <a-descriptions-item label="Total Trades">
          {{ result.total_trades }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
  <a-empty v-else description="No result to display" />
</template>

<script setup lang="ts">
import MetricsCards from './MetricsCards.vue';
import type { BacktestResult } from '@/types';

defineProps<{
  result: BacktestResult | null;
}>();
</script>

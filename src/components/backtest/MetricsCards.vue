<template>
  <a-row :gutter="16">
    <a-col :span="4">
      <a-card>
        <a-statistic
          title="Total Return"
          :value="parseFloat(result.total_return_pct)"
          :precision="2"
          suffix="%"
          :value-style="parseFloat(result.total_return_pct) >= 0 ? { color: '#3f8600' } : { color: '#cf1322' }"
        />
      </a-card>
    </a-col>
    <a-col :span="4">
      <a-card>
        <a-statistic
          title="Sharpe Ratio"
          :value="parseFloat(result.sharpe_ratio)"
          :precision="2"
        />
      </a-card>
    </a-col>
    <a-col :span="4">
      <a-card>
        <a-statistic
          title="Max Drawdown"
          :value="parseFloat(result.max_drawdown_pct)"
          :precision="2"
          suffix="%"
          :value-style="{ color: '#cf1322' }"
        />
      </a-card>
    </a-col>
    <a-col :span="4">
      <a-card>
        <a-statistic
          title="Win Rate"
          :value="parseFloat(result.win_rate)"
          :precision="1"
          suffix="%"
        />
      </a-card>
    </a-col>
    <a-col :span="4">
      <a-card>
        <a-statistic
          title="Total Trades"
          :value="result.total_trades"
        />
      </a-card>
    </a-col>
    <a-col :span="4">
      <a-card>
        <a-statistic
          title="Calmar Ratio"
          :value="parseFloat(result.calmar_ratio)"
          :precision="2"
        />
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import type { BacktestResult } from '@/types';

defineProps<{
  result: BacktestResult;
}>();
</script>

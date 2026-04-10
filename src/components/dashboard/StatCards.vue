<template>
  <a-row :gutter="16">
    <a-col :span="6">
      <a-card>
        <a-statistic
          title="Net Equity"
          :value="totalEquity"
          :precision="2"
          prefix="$"
        />
      </a-card>
    </a-col>
    <a-col :span="6">
      <a-card>
        <a-statistic
          title="Available Balance"
          :value="availableBalance"
          :precision="2"
          prefix="$"
        />
      </a-card>
    </a-col>
    <a-col :span="6">
      <a-card>
        <a-statistic
          title="Total P&L"
          :value="totalPnl"
          :precision="2"
          prefix="$"
          :value-style="totalPnl >= 0 ? { color: '#3f8600' } : { color: '#cf1322' }"
        />
      </a-card>
    </a-col>
    <a-col :span="6">
      <a-card>
        <a-statistic
          title="Unrealized P&L"
          :value="unrealizedPnl"
          :precision="2"
          prefix="$"
          :value-style="parseFloat(unrealizedPnl) >= 0 ? { color: '#3f8600' } : { color: '#cf1322' }"
        />
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  totalEquity: string;
  availableBalance: string;
  realizedPnl: string;
  unrealizedPnl: string;
}>();

const totalPnl = computed(
  () => parseFloat(props.realizedPnl || '0') + parseFloat(props.unrealizedPnl || '0'),
);
</script>

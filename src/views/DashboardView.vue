<template>
  <div>
    <a-spin :spinning="tradingStore.loading">
      <StatCards
        :total-equity="tradingStore.portfolio?.total_equity || '0'"
        :available-balance="tradingStore.portfolio?.available_balance || '0'"
        :realized-pnl="tradingStore.portfolio?.realized_pnl || '0'"
        :unrealized-pnl="tradingStore.portfolio?.unrealized_pnl || '0'"
      />
    </a-spin>

    <SystemStatusBar
      :exchanges="systemStore.status?.connected_exchanges || []"
      :running-strategies="runningStrategies"
      :total-strategies="0"
      :uptime="systemStore.liveness?.uptime_seconds || 0"
      style="margin-top: 16px"
    />

    <EquityChart
      :timestamps="equityTimestamps"
      :values="equityValues"
      style="margin-top: 16px"
    />

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="14">
        <PositionTable
          :positions="tradingStore.positions"
          @close="onClosePosition"
        />
      </a-col>
      <a-col :span="10">
        <RecentTrades :trades="recentTrades" />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTradingStore } from '@/stores/trading';
import { useOrdersStore } from '@/stores/orders';
import { useSystemStore } from '@/stores/system';
import StatCards from '@/components/dashboard/StatCards.vue';
import EquityChart from '@/components/dashboard/EquityChart.vue';
import PositionTable from '@/components/dashboard/PositionTable.vue';
import RecentTrades from '@/components/dashboard/RecentTrades.vue';
import SystemStatusBar from '@/components/dashboard/SystemStatusBar.vue';
import { message } from 'ant-design-vue';

const tradingStore = useTradingStore();
const ordersStore = useOrdersStore();
const systemStore = useSystemStore();

const equityTimestamps = ref<string[]>([]);
const equityValues = ref<number[]>([]);

const runningStrategies = computed(() => 0);

const recentTrades = computed(() =>
  ordersStore.orderHistory
    .filter((o) => ['FILLED', 'PARTIALLY_FILLED'].includes(o.status))
    .slice(0, 20),
);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function onClosePosition() {
  message.info('Position close requested');
}

function updateEquitySnapshot() {
  if (tradingStore.portfolio?.total_equity) {
    const now = new Date().toLocaleTimeString();
    const value = parseFloat(tradingStore.portfolio.total_equity);
    equityTimestamps.value = [...equityTimestamps.value, now].slice(-50);
    equityValues.value = [...equityValues.value, value].slice(-50);
  }
}

onMounted(async () => {
  await Promise.all([
    tradingStore.fetchAll(),
    ordersStore.fetchOrders(),
    systemStore.fetchAll(),
  ]);
  updateEquitySnapshot();
  pollTimer = setInterval(async () => {
    await Promise.all([
      tradingStore.fetchAll(),
      ordersStore.fetchOrders(),
    ]);
    updateEquitySnapshot();
  }, 5000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

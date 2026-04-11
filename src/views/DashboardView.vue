<template>
  <div class="dashboard">
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
      class="dashboard-row"
    />

    <div class="dashboard-row dashboard-charts">
      <EquityChart
        :timestamps="equityTimestamps"
        :values="equityValues"
        class="chart-equity"
      />
      <PositionsDonut
        :positions="tradingStore.positions"
        class="chart-positions"
      />
    </div>

    <RecentTrades
      :trades="recentTrades"
      class="dashboard-row"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTradingStore } from '@/stores/trading';
import { useOrdersStore } from '@/stores/orders';
import { useSystemStore } from '@/stores/system';
import StatCards from '@/components/dashboard/StatCards.vue';
import EquityChart from '@/components/dashboard/EquityChart.vue';
import PositionsDonut from '@/components/dashboard/PositionsDonut.vue';
import RecentTrades from '@/components/dashboard/RecentTrades.vue';
import SystemStatusBar from '@/components/dashboard/SystemStatusBar.vue';

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

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.dashboard-row {
  margin-top: 0;
}

.dashboard-charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--q-card-gap);
}

.chart-equity {
  min-width: 0;
}

.chart-positions {
  min-width: 0;
}
</style>

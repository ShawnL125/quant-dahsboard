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
import { ref, computed, inject, watch, onMounted, onUnmounted, type Ref } from 'vue';
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
const wsConnected = inject<Ref<boolean>>('wsConnected', ref(false));

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

async function pollData() {
  await Promise.all([
    tradingStore.fetchAll(),
    ordersStore.fetchOrders(),
  ]);
  updateEquitySnapshot();
}

function startPolling() {
  if (pollTimer) return;
  pollData();
  pollTimer = setInterval(pollData, 5000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// WS 连接状态变化时切换轮询策略
watch(wsConnected, (connected) => {
  if (connected) {
    stopPolling();
  } else {
    startPolling();
  }
});

onMounted(async () => {
  // 初始加载：HTTP 拉一次全量数据
  await Promise.all([
    tradingStore.fetchAll(),
    ordersStore.fetchOrders(),
    systemStore.fetchAll(),
  ]);
  updateEquitySnapshot();

  // 如果 WS 没连上，启动轮询兜底
  if (!wsConnected.value) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
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

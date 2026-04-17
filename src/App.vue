<template>
  <router-view v-if="isPublicRoute" />
  <template v-else>
    <AppLayout />
  </template>
</template>

<script setup lang="ts">
import { provide, ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import { useWebSocket } from '@/composables/useWebSocket';
import { systemApi } from '@/api/system';
import { useTradingStore } from '@/stores/trading';
import { useOrdersStore } from '@/stores/orders';
import { useRiskStore } from '@/stores/risk';
import { useSignalsStore } from '@/stores/signals';
import { useQualityStore } from '@/stores/quality';
import { useAccountStore } from '@/stores/account';
import { useFundingStore } from '@/stores/funding';
import { useStrategiesStore } from '@/stores/strategies';
import { useReconciliationStore } from '@/stores/reconciliation';

const route = useRoute();
const wsConnected = ref(false);
const paperTrading = ref(false);

provide('wsConnected', wsConnected);
provide('paperTrading', paperTrading);

const isPublicRoute = computed(() => route.meta?.public === true);

const ws = useWebSocket({
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  apiKey: import.meta.env.VITE_API_KEY,
});

let wsPollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  if (isPublicRoute.value) return;

  const tradingStore = useTradingStore();
  const ordersStore = useOrdersStore();
  const riskStore = useRiskStore();
  const signalsStore = useSignalsStore();
  const qualityStore = useQualityStore();
  const accountStore = useAccountStore();
  const fundingStore = useFundingStore();
  const strategiesStore = useStrategiesStore();
  const reconStore = useReconciliationStore();

  ws.onMessage((msg) => {
    const data = msg.data as Record<string, unknown>;
    switch (msg.channel) {
      case 'positions':
        tradingStore.updatePositionsFromWS(msg.data);
        break;
      case 'pnl':
        tradingStore.updatePortfolioFromWS(data);
        break;
      case 'orders':
        ordersStore.updateOrderFromWS(data);
        break;
      case 'trades':
      case 'system':
        break;
      case 'account':
        accountStore.updateSnapshotFromWS(data);
        break;
      case 'margin':
        accountStore.updateMarginFromWS(data);
        break;
      case 'reconcile':
        reconStore.fetchAlerts();
        break;
      case 'funding':
        fundingStore.updateRatesFromWS(data);
        break;
      case 'params':
        strategiesStore.updateParamsFromWS(data);
        break;
      case 'notifications':
        break;
      case 'risk':
        riskStore.updateFromWS(msg.data as Record<string, unknown>, msg.timestamp);
        break;
      case 'signals':
        signalsStore.addSignal(msg.data as import('@/types').SignalEvent);
        break;
      case 'quality':
        qualityStore.addAlert(msg.data as import('@/types').QualityAlert);
        break;
    }
  });

  ws.connect();
  ws.subscribe(['orders', 'positions', 'pnl', 'system', 'trades', 'risk', 'signals', 'quality', 'account', 'margin', 'reconcile', 'funding', 'params', 'notifications']);
  wsPollTimer = setInterval(() => {
    wsConnected.value = ws.isConnected.value;
  }, 1000);

  try {
    const status = await systemApi.getPaperStatus();
    paperTrading.value = status.paper_trading === true;
  } catch {
    /* Backend not running */
  }
});

onUnmounted(() => {
  if (wsPollTimer) clearInterval(wsPollTimer);
  ws.disconnect();
});
</script>

<style>
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--q-bg);
  color: var(--q-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

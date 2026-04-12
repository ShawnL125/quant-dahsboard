<template>
  <AppLayout />
</template>

<script setup lang="ts">
import { provide, ref, onMounted, onUnmounted } from 'vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import { useWebSocket } from '@/composables/useWebSocket';
import { systemApi } from '@/api/system';
import { useTradingStore } from '@/stores/trading';
import { useOrdersStore } from '@/stores/orders';

const wsConnected = ref(false);
const paperTrading = ref(false);

provide('wsConnected', wsConnected);
provide('paperTrading', paperTrading);

const ws = useWebSocket({
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  apiKey: import.meta.env.VITE_API_KEY,
});

let wsPollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  const tradingStore = useTradingStore();
  const ordersStore = useOrdersStore();

  ws.onMessage((msg) => {
    switch (msg.channel) {
      case 'positions':
        tradingStore.updatePositionsFromWS(msg.data);
        break;
      case 'pnl':
        tradingStore.updatePortfolioFromWS(msg.data as Record<string, unknown>);
        break;
      case 'orders':
        ordersStore.updateOrderFromWS(msg.data as Record<string, unknown>);
        break;
      case 'trades':
      case 'system':
        break;
    }
  });

  ws.connect();
  ws.subscribe(['orders', 'positions', 'pnl', 'system', 'trades']);
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

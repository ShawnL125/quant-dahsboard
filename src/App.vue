<template>
  <AppLayout />
</template>

<script setup lang="ts">
import { provide, ref, onMounted, onUnmounted } from 'vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import { useWebSocket } from '@/composables/useWebSocket';
import { systemApi } from '@/api/system';

const wsConnected = ref(false);
const paperTrading = ref(false);

provide('wsConnected', wsConnected);
provide('paperTrading', paperTrading);

const ws = useWebSocket({
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  apiKey: import.meta.env.VITE_API_KEY,
});

ws.onMessage((msg) => {
  console.log('[WS]', msg.channel, msg.data);
});

let wsPollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  ws.connect();
  wsPollTimer = setInterval(() => { wsConnected.value = ws.isConnected.value; }, 1000);
  try {
    const status = await systemApi.getPaperStatus();
    paperTrading.value = status.paper_trading === true;
  } catch { /* Backend not running */ }
});

onUnmounted(() => {
  if (wsPollTimer) clearInterval(wsPollTimer);
  ws.disconnect();
});
</script>

<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
</style>

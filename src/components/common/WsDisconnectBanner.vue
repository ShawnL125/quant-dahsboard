<template>
  <div v-if="showBanner" class="ws-disconnect-banner">
    <span class="ws-banner-text">WebSocket disconnected. Reconnecting... (attempt {{ wsReconnectAttempt }})</span>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, type Ref } from 'vue';
import { message } from 'ant-design-vue';

const wsConnected = inject<Ref<boolean>>('wsConnected', ref(false) as Ref<boolean>);
const wsReconnectAttempt = inject<Ref<number>>('wsReconnectAttempt', ref(0) as Ref<number>);

const showBanner = ref(false);
let bannerTimer: ReturnType<typeof setTimeout> | null = null;

watch(wsConnected, (connected, wasConnected) => {
  if (!connected) {
    // Disconnected — show banner after 5 seconds
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      if (!wsConnected.value) {
        showBanner.value = true;
      }
    }, 5000);
  } else if (connected && !wasConnected) {
    // Reconnected — show success and hide banner
    if (showBanner.value) {
      message.success('Connection restored');
    }
    showBanner.value = false;
    if (bannerTimer) {
      clearTimeout(bannerTimer);
      bannerTimer = null;
    }
  }
});
</script>

<style scoped>
.ws-disconnect-banner {
  background: var(--q-error-light, rgba(239, 68, 68, 0.1));
  color: var(--q-error);
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--q-error);
}

.ws-banner-text {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>

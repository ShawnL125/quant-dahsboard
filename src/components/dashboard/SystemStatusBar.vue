<template>
  <div class="status-bar">
    <div class="status-pill pill-blue">
      <span class="pill-icon">📊</span>
      <span>{{ exchanges.length }} Exchanges</span>
    </div>
    <div class="status-pill pill-green">
      <span class="pill-icon">⚡</span>
      <span>{{ runningStrategies }} / {{ totalStrategies }} Strategies</span>
    </div>
    <div class="status-pill pill-gray">
      <span class="pill-icon">🕐</span>
      <span>{{ formatUptime(uptime) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  exchanges: string[];
  runningStrategies: number;
  totalStrategies: number;
  uptime: number;
}>();

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
</script>

<style scoped>
.status-bar {
  display: flex;
  gap: 8px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.pill-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
}

.pill-green {
  background: var(--q-success-light);
  color: var(--q-success);
}

.pill-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
}

.pill-icon {
  font-size: 14px;
}
</style>

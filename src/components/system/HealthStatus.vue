<template>
  <div class="health-grid">
    <div class="health-card">
      <span class="health-label">Liveness</span>
      <div class="health-status">
        <span class="status-dot" :class="isLive ? 'dot-ok' : 'dot-error'"></span>
        <span class="status-text">{{ liveness?.status || 'Unknown' }}</span>
      </div>
    </div>
    <div class="health-card">
      <span class="health-label">Readiness</span>
      <div class="health-status">
        <span class="status-dot" :class="isReady ? 'dot-ok' : 'dot-error'"></span>
        <span class="status-text">{{ readiness?.status || 'Unknown' }}</span>
      </div>
    </div>
    <div class="health-card">
      <span class="health-label">Uptime</span>
      <span class="uptime-value">{{ formatUptime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HealthStatus } from '@/types';

const props = defineProps<{
  liveness: HealthStatus | null;
  readiness: HealthStatus | null;
}>();

const isLive = computed(() =>
  props.liveness?.status === 'ok' || props.liveness?.status === 'healthy',
);

const isReady = computed(() =>
  props.readiness?.status === 'ok' || props.readiness?.status === 'ready',
);

const formatUptime = computed(() => {
  const seconds = props.liveness?.uptime_seconds ?? 0;
  if (!seconds || seconds <= 0) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
});
</script>

<style scoped>
.health-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--q-card-gap);
}

.health-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.health-label {
  font-size: 12px;
  color: var(--q-text-muted);
  display: block;
  margin-bottom: 10px;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-ok { background: var(--q-success); }
.dot-error { background: var(--q-error); }

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-text);
}

.uptime-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--q-primary-dark);
}
</style>

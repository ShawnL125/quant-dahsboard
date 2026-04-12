<template>
  <a-drawer
    :open="open"
    :width="480"
    @close="emit('close')"
  >
    <template #title>
      <div class="drawer-title">
        <span>{{ strategy?.strategy_id || 'Strategy Details' }}</span>
        <span v-if="strategy" class="status-pill" :class="strategy.is_running ? 'status-running' : 'status-stopped'">
          {{ strategy.is_running ? 'Running' : 'Stopped' }}
        </span>
      </div>
    </template>
    <template v-if="strategy">
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Symbols</span>
          <span class="metric-value">
            <span v-for="sym in strategy.symbols" :key="sym" class="tag-blue">{{ sym }}</span>
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Exchanges</span>
          <span class="metric-value">
            <span v-for="ex in strategy.exchanges" :key="ex" class="tag-gray">{{ ex }}</span>
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Timeframes</span>
          <span class="metric-value">{{ strategy.timeframes.join(', ') }}</span>
        </div>
      </div>

      <div class="params-section">
        <div class="section-title">Parameters</div>
        <div v-if="Object.keys(strategy.parameters).length > 0" class="params-grid">
          <div v-for="(value, key) in strategy.parameters" :key="String(key)" class="param-row">
            <span class="param-key">{{ String(key) }}</span>
            <span class="param-value">{{ JSON.stringify(value) }}</span>
          </div>
        </div>
        <div v-else class="empty-params">No parameters</div>
      </div>
    </template>
    <div v-else class="empty-state">No strategy selected</div>
  </a-drawer>
</template>

<script setup lang="ts">
import type { Strategy } from '@/types';

defineProps<{
  strategy: Strategy | null;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.status-pill {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.status-running { background: var(--q-success-light); color: var(--q-success); }
.status-stopped { background: var(--q-hover); color: var(--q-text-muted); }

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  background: var(--q-bg);
  border-radius: 8px;
  padding: 12px;
}

.metric-label {
  display: block;
  font-size: 11px;
  color: var(--q-text-muted);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--q-text);
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
}

.tag-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
}

.params-section { margin-top: 8px; }

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
}

.params-grid {
  display: flex;
  flex-direction: column;
  background: var(--q-bg);
  border-radius: 8px;
  overflow: hidden;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--q-border);
}

.param-row:last-child { border-bottom: none; }

.param-key { color: var(--q-text-secondary); font-weight: 500; }

.param-value {
  color: var(--q-text);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.empty-params {
  text-align: center;
  color: var(--q-text-muted);
  padding: 16px 0;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 40px 0;
  font-size: 13px;
}
</style>

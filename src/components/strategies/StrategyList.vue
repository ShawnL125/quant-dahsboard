<template>
  <div class="strategy-grid">
    <div v-for="s in strategies" :key="s.strategy_id" class="strategy-card">
      <div class="card-header">
        <span class="strategy-name">{{ s.strategy_id }}</span>
        <a-switch
          :checked="s.is_running"
          @change="(checked: boolean) => emit('toggle', s.strategy_id, checked)"
        />
      </div>
      <div class="card-body">
        <div class="metrics-row">
          <div class="metric">
            <span class="metric-label">Symbol</span>
            <span class="metric-value">
              <span v-for="sym in s.symbols" :key="sym" class="tag-blue">{{ sym }}</span>
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Exchange</span>
            <span class="metric-value">
              <span v-for="ex in s.exchanges" :key="ex" class="tag-gray">{{ ex }}</span>
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Timeframe</span>
            <span class="metric-value">{{ s.timeframes.join(', ') }}</span>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <span class="view-link" @click="emit('view', s.strategy_id)">View Details →</span>
        <span class="status-dot" :class="s.is_running ? 'running' : 'stopped'"></span>
      </div>
    </div>
    <div v-if="strategies.length === 0" class="empty-state">No strategies found</div>
  </div>
</template>

<script setup lang="ts">
import type { Strategy } from '@/types';

defineProps<{
  strategies: Strategy[];
}>();

const emit = defineEmits<{
  toggle: [id: string, enabled: boolean];
  view: [id: string];
}>();
</script>

<style scoped>
.strategy-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--q-card-gap);
}

.strategy-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.strategy-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--q-text);
}

.card-body { flex: 1; }

.metrics-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.metric-label { color: var(--q-text-muted); }

.metric-value {
  font-weight: 500;
  color: var(--q-text);
  display: flex;
  gap: 4px;
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

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--q-border);
}

.view-link {
  font-size: 12px;
  color: var(--q-primary);
  cursor: pointer;
  font-weight: 500;
}

.view-link:hover { text-decoration: underline; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.running { background: var(--q-success); }
.status-dot.stopped { background: var(--q-text-muted); }

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--q-text-muted);
  padding: 40px 0;
  font-size: 13px;
}
</style>

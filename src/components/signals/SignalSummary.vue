<template>
  <div class="signal-summary">
    <div class="summary-header">
      <span class="summary-title">Latest Signals by Strategy</span>
    </div>
    <div v-if="Object.keys(latestByStrategy).length === 0" class="empty-state">No signals yet</div>
    <div v-else class="strategy-grid">
      <div v-for="(evt, strategyId) in latestByStrategy" :key="strategyId" class="strategy-card">
        <div class="strategy-name">{{ strategyId }}</div>
        <div class="strategy-signal">
          <span class="signal-direction" :class="directionClass(evt.signal.direction)">
            {{ evt.signal.direction }}
          </span>
          <span class="signal-symbol">{{ evt.signal.symbol }}</span>
        </div>
        <div class="strategy-meta">
          <span class="strength-label">Strength: {{ parseFloat(evt.signal.strength).toFixed(2) }}</span>
          <span class="signal-time">{{ formatTime(evt.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignalEvent } from '@/types';

defineProps<{
  latestByStrategy: Record<string, SignalEvent>;
}>();

function directionClass(dir: string): string {
  switch (dir) {
    case 'LONG': return 'dir-long';
    case 'SHORT': return 'dir-short';
    case 'CLOSE': return 'dir-close';
    default: return '';
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.signal-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.strategy-card {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.strategy-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.strategy-signal {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signal-direction {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.dir-long { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.dir-short { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.dir-close { background: rgba(156, 163, 175, 0.12); color: #9ca3af; }

.signal-symbol {
  font-size: 12px;
  font-weight: 500;
  color: var(--q-text);
}

.strategy-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strength-label {
  font-size: 11px;
  color: var(--q-text-secondary);
}

.signal-time {
  font-size: 11px;
  color: var(--q-text-muted);
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 16px 0;
  font-size: 13px;
}
</style>

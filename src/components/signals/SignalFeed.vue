<template>
  <div class="signal-feed">
    <div class="feed-header">
      <span class="feed-title">Live Signals</span>
      <span v-if="signals.length > 0" class="feed-badge">{{ signals.length }}</span>
    </div>

    <div v-if="signals.length === 0" class="empty-state">Waiting for signals...</div>

    <div v-else class="signal-list">
      <div v-for="s in signals" :key="s.event_id" class="signal-row">
        <span class="signal-direction" :class="directionClass(s.signal.direction)">
          {{ s.signal.direction }}
        </span>
        <div class="signal-body">
          <div class="signal-top">
            <span class="signal-symbol">{{ s.signal.symbol }}</span>
            <span class="signal-exchange">{{ s.signal.exchange }}</span>
            <span class="signal-strategy">{{ s.signal.strategy_id }}</span>
          </div>
          <div class="signal-reason">{{ s.signal.reason }}</div>
          <div v-if="s.signal.target_price || s.signal.stop_price" class="signal-prices">
            <span v-if="s.signal.target_price" class="price-tag">Target: {{ s.signal.target_price }}</span>
            <span v-if="s.signal.stop_price" class="price-tag">Stop: {{ s.signal.stop_price }}</span>
          </div>
        </div>
        <div class="signal-meta">
          <div class="signal-strength">
            <div class="strength-bar">
              <div class="strength-fill" :style="{ width: strengthPct(s.signal.strength) }"></div>
            </div>
            <span class="strength-val">{{ parseFloat(s.signal.strength).toFixed(2) }}</span>
          </div>
          <span class="signal-time">{{ formatTime(s.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignalEvent } from '@/types';

defineProps<{
  signals: SignalEvent[];
}>();

function directionClass(dir: string): string {
  switch (dir) {
    case 'LONG': return 'dir-long';
    case 'SHORT': return 'dir-short';
    case 'CLOSE': return 'dir-close';
    default: return '';
  }
}

function strengthPct(val: string): string {
  const pct = Math.min(100, Math.max(0, parseFloat(val) * 100));
  return `${pct}%`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.signal-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feed-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feed-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.feed-badge {
  background: var(--q-primary-light);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.signal-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 500px;
  overflow-y: auto;
}

.signal-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--q-border);
}

.signal-list .signal-row:last-child { border-bottom: none; }

.signal-direction {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  min-width: 50px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.dir-long { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.dir-short { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.dir-close { background: rgba(156, 163, 175, 0.12); color: #9ca3af; }

.signal-body {
  flex: 1;
  min-width: 0;
}

.signal-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.signal-symbol {
  font-weight: 600;
  font-size: 13px;
  color: var(--q-text);
}

.signal-exchange {
  font-size: 11px;
  color: var(--q-text-muted);
}

.signal-strategy {
  font-size: 11px;
  color: var(--q-primary);
  font-weight: 500;
}

.signal-reason {
  font-size: 12px;
  color: var(--q-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.signal-prices {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.price-tag {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--q-text-muted);
}

.signal-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.signal-strength {
  display: flex;
  align-items: center;
  gap: 6px;
}

.strength-bar {
  width: 40px;
  height: 4px;
  background: var(--q-border);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  background: var(--q-primary);
  border-radius: 2px;
}

.strength-val {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--q-text-secondary);
}

.signal-time {
  font-size: 11px;
  color: var(--q-text-muted);
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

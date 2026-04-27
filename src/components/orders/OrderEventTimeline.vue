<template>
  <div class="event-timeline">
    <a-spin v-if="loading" size="small" />
    <div v-else-if="events.length === 0" class="timeline-empty">No events found</div>
    <div v-else class="timeline-items">
      <div
        v-for="(evt, i) in sortedEvents"
        :key="evt.event_id"
        class="timeline-item"
      >
        <div class="timeline-dot" :class="dotClass(evt.event_type)"></div>
        <div v-if="i < sortedEvents.length - 1" class="timeline-line"></div>
        <div class="timeline-content">
          <span class="timeline-type">{{ evt.event_type }}</span>
          <span class="timeline-time">{{ formatTime(evt.timestamp) }}</span>
          <div v-if="evt.data && Object.keys(evt.data).length > 0" class="timeline-details">
            <span v-for="(val, key) in evt.data" :key="String(key)" class="timeline-detail">
              {{ key }}: {{ val }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OrderEvent } from '@/types';

const props = defineProps<{
  events: OrderEvent[];
  loading: boolean;
}>();

const sortedEvents = computed(() =>
  [...props.events].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  ),
);

function dotClass(type: string): string {
  const t = type.toUpperCase();
  if (t.includes('FILL') || t.includes('COMPLETE')) return 'dot-success';
  if (t.includes('CANCEL') || t.includes('REJECT') || t.includes('FAIL')) return 'dot-error';
  if (t.includes('SUBMIT') || t.includes('CREATE')) return 'dot-primary';
  return 'dot-default';
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.event-timeline {
  padding: 8px 0 8px 12px;
}

.timeline-empty {
  color: var(--q-text-muted);
  font-size: 12px;
  padding: 8px 0;
}

.timeline-items {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-bottom: 12px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  z-index: 1;
}

.dot-success { background: var(--q-success); }
.dot-error { background: var(--q-error); }
.dot-primary { background: var(--q-primary); }
.dot-default { background: var(--q-text-muted); }

.timeline-line {
  position: absolute;
  left: 3.5px;
  top: 14px;
  bottom: 0;
  width: 1px;
  background: var(--q-border);
}

.timeline-content {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-type {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-text);
}

.timeline-time {
  font-size: 11px;
  color: var(--q-text-muted);
}

.timeline-details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 2px;
}

.timeline-detail {
  font-size: 10px;
  color: var(--q-text-secondary);
  font-family: 'JetBrains Mono', monospace;
}
</style>

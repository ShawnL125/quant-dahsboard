<template>
  <div class="events-card">
    <div class="events-header">
      <span class="events-title">Risk Events</span>
      <a-button size="small" @click="$emit('refresh')">Refresh</a-button>
    </div>

    <a-table
      v-if="events.length > 0"
      :columns="columns"
      :data-source="events"
      :pagination="pagination"
      size="small"
      row-key="time"
      :row-class-name="rowClass"
    >
      <template #expandedRowRender="{ record }">
        <pre class="event-meta">{{ formatMeta(record.metadata) }}</pre>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'time'">
          {{ formatTime(record.time) }}
        </template>
        <template v-if="column.key === 'event_type'">
          <a-tag :color="typeColor(record.event_type)">{{ record.event_type }}</a-tag>
        </template>
        <template v-if="column.key === 'level'">
          {{ record.level }}{{ record.target && record.target !== record.level ? ': ' + record.target : '' }}
        </template>
      </template>
    </a-table>

    <div v-else class="events-empty">No risk events</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RiskEvent } from '@/types';

const props = defineProps<{
  events: RiskEvent[];
  total: number;
  currentPage?: number;
  pageSize?: number;
}>();

const emit = defineEmits<{
  refresh: [];
  'page-change': [page: number];
}>();

const pageSize = computed(() => props.pageSize ?? 20);
const currentPage = computed(() => props.currentPage ?? 1);

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: props.total,
  simple: true,
  onChange: (page: number) => emit('page-change', page),
}));

const columns = [
  { title: 'Time', key: 'time', width: 80 },
  { title: 'Type', key: 'event_type', width: 140 },
  { title: 'Level', key: 'level', width: 120 },
  { title: 'Reason', dataIndex: 'reason', key: 'reason' },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function typeColor(type: string): string {
  if (type.includes('HALT') || type.includes('BLOCKED')) return 'red';
  if (type.includes('WARNING') || type.includes('WARN')) return 'orange';
  return 'blue';
}

function rowClass(record: RiskEvent): string {
  if (record.event_type.includes('HALT') || record.event_type.includes('BLOCKED')) return 'row-critical';
  if (record.event_type.includes('WARNING') || record.event_type.includes('WARN')) return 'row-warning';
  return '';
}

function formatMeta(meta: Record<string, unknown>): string {
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return '{}';
  }
}
</script>

<style scoped>
.events-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.events-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.events-empty {
  padding: 20px;
  text-align: center;
  color: var(--q-text-muted);
  font-size: 13px;
}

.event-meta {
  font-size: 11px;
  color: var(--q-text-secondary);
  background: var(--q-bg);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0;
  max-height: 120px;
  overflow-y: auto;
}
</style>

<style>
.row-critical td {
  background: rgba(239, 68, 68, 0.06) !important;
}

.row-warning td {
  background: rgba(245, 158, 11, 0.06) !important;
}
</style>

<template>
  <a-card title="Recent Trades">
    <a-table
      :columns="columns"
      :data-source="trades"
      :pagination="{ pageSize: 10 }"
      size="small"
      row-key="order_id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'side'">
          <a-tag :color="record.side === 'BUY' ? 'green' : 'red'">
            {{ record.side }}
          </a-tag>
        </template>
        <template v-if="column.key === 'time'">
          {{ formatTime(record.created_at) }}
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import type { Order } from '@/types';

defineProps<{
  trades: Order[];
}>();

const columns = [
  { title: 'Time', key: 'time' },
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
  { title: 'Side', dataIndex: 'side', key: 'side' },
  { title: 'Price', dataIndex: 'avg_fill_price', key: 'price' },
  { title: 'Quantity', dataIndex: 'filled_quantity', key: 'quantity' },
];

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleTimeString();
  } catch {
    return dateStr;
  }
}
</script>

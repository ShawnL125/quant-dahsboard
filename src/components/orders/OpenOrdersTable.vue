<template>
  <a-card title="Open Orders">
    <a-table
      :columns="columns"
      :data-source="orders"
      :pagination="false"
      size="small"
      row-key="order_id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'side'">
          <a-tag :color="record.side === 'BUY' ? 'green' : 'red'">
            {{ record.side }}
          </a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag>{{ record.status }}</a-tag>
        </template>
        <template v-if="column.key === 'time'">
          {{ formatTime(record.created_at) }}
        </template>
        <template v-if="column.key === 'action'">
          <a-popconfirm
            title="Cancel this order?"
            @confirm="emit('cancel', record.order_id)"
          >
            <a-button type="link" danger size="small">Cancel</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import type { Order } from '@/types';

defineProps<{
  orders: Order[];
}>();

const emit = defineEmits<{
  cancel: [orderId: string];
}>();

const columns = [
  { title: 'Order ID', dataIndex: 'order_id', key: 'order_id', ellipsis: true },
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
  { title: 'Side', dataIndex: 'side', key: 'side' },
  { title: 'Type', dataIndex: 'order_type', key: 'order_type' },
  { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
  { title: 'Price', dataIndex: 'price', key: 'price' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Time', key: 'time' },
  { title: 'Action', key: 'action' },
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

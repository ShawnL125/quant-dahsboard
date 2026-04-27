<template>
  <a-card title="Open Positions">
    <a-table
      :columns="columns"
      :data-source="positions"
      :pagination="false"
      size="small"
      row-key="symbol"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'side'">
          <a-tag :color="record.side === 'LONG' || record.side === 'BUY' ? 'green' : 'red'">
            {{ record.side }}
          </a-tag>
        </template>
        <template v-if="column.key === 'unrealized_pnl'">
          <span :style="{ color: parseFloat(record.unrealized_pnl) >= 0 ? 'var(--q-success)' : 'var(--q-error)' }" class="text-mono">
            {{ parseFloat(record.unrealized_pnl).toFixed(2) }}
          </span>
        </template>
        <template v-if="column.key === 'action'">
          <a-popconfirm
            title="Close this position?"
            @confirm="emit('close', record)"
          >
            <a-button type="link" danger size="small">Close</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import type { Position } from '@/types';

defineProps<{
  positions: Position[];
}>();

const emit = defineEmits<{
  close: [position: Position];
}>();

const columns = [
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
  { title: 'Exchange', dataIndex: 'exchange', key: 'exchange' },
  { title: 'Side', dataIndex: 'side', key: 'side' },
  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
  { title: 'Entry Price', dataIndex: 'entry_price', key: 'entry_price' },
  { title: 'Unrealized P&L', dataIndex: 'unrealized_pnl', key: 'unrealized_pnl' },
  { title: 'Action', key: 'action' },
];
</script>

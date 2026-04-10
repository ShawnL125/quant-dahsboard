<template>
  <div>
    <OrderForm @placed="onOrderPlaced" />

    <OpenOrdersTable
      :orders="ordersStore.openOrders"
      @cancel="onCancelOrder"
      style="margin-top: 16px"
    />

    <a-card title="Order History" style="margin-top: 16px">
      <a-table
        :columns="historyColumns"
        :data-source="ordersStore.orderHistory"
        :pagination="{ pageSize: 15 }"
        size="small"
        row-key="order_id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'side'">
            <a-tag :color="record.side === 'BUY' ? 'green' : 'red'">{{ record.side }}</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag>{{ record.status }}</a-tag>
          </template>
          <template v-if="column.key === 'time'">
            {{ formatTime(record.created_at) }}
          </template>
        </template>
      </a-table>
    </a-card>

    <a-alert
      v-if="ordersStore.error"
      :message="ordersStore.error"
      type="error"
      show-icon
      style="margin-top: 16px"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import OrderForm from '@/components/orders/OrderForm.vue';
import OpenOrdersTable from '@/components/orders/OpenOrdersTable.vue';
import { message } from 'ant-design-vue';

const ordersStore = useOrdersStore();

const historyColumns = [
  { title: 'Order ID', dataIndex: 'order_id', key: 'order_id', ellipsis: true },
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
  { title: 'Side', dataIndex: 'side', key: 'side' },
  { title: 'Type', dataIndex: 'order_type', key: 'order_type' },
  { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
  { title: 'Price', dataIndex: 'price', key: 'price' },
  { title: 'Filled', dataIndex: 'filled_quantity', key: 'filled' },
  { title: 'Avg Price', dataIndex: 'avg_fill_price', key: 'avg_price' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Time', key: 'time' },
];

async function onOrderPlaced() {
  message.success('Order placed');
  await ordersStore.fetchOrders();
}

async function onCancelOrder(orderId: string) {
  try {
    await ordersStore.cancelOrder(orderId);
    message.success('Order cancelled');
  } catch {
    message.error('Failed to cancel order');
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

onMounted(() => {
  ordersStore.fetchOrders();
});
</script>

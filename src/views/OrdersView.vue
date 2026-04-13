<template>
  <div class="orders-page">
    <OrderForm @placed="onOrderPlaced" />

    <a-tabs v-model:activeKey="activeTab" class="orders-tabs">
      <a-tab-pane key="open" tab="Open Orders">
        <OpenOrdersTable
          :orders="ordersStore.openOrders"
          @cancel="onCancelOrder"
        />
      </a-tab-pane>
      <a-tab-pane key="history" tab="History">
        <OrderHistoryTable :orders="ordersStore.orderHistory" />
      </a-tab-pane>
    </a-tabs>

    <a-alert
      v-if="ordersStore.error"
      :message="ordersStore.error"
      type="error"
      show-icon
      class="page-section"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import type { Order } from '@/types';
import OrderForm from '@/components/orders/OrderForm.vue';
import OpenOrdersTable from '@/components/orders/OpenOrdersTable.vue';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable.vue';
import { message } from 'ant-design-vue';

const ordersStore = useOrdersStore();
const activeTab = ref('open');

async function onOrderPlaced() {
  message.success('Order placed');
  await ordersStore.fetchOrders();
}

async function onCancelOrder(order: Order) {
  try {
    await ordersStore.cancelOrder(order.order_id, order.symbol, order.exchange);
    message.success('Order cancelled');
  } catch {
    message.error('Failed to cancel order');
  }
}

onMounted(() => {
  ordersStore.fetchOrders();
});
</script>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: 0; }

.orders-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
</style>

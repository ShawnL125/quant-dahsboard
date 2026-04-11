<template>
  <div class="orders-page">
    <OrderForm @placed="onOrderPlaced" />

    <OpenOrdersTable
      :orders="ordersStore.openOrders"
      @cancel="onCancelOrder"
      class="page-section"
    />

    <div class="orders-card page-section">
      <div class="card-header">
        <span class="card-title">Order History</span>
        <span v-if="ordersStore.orderHistory.length > 0" class="card-badge">
          {{ ordersStore.orderHistory.length }}
        </span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Type</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Filled</th>
            <th>Avg Price</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedHistory" :key="order.order_id">
            <td class="text-mono text-muted">{{ order.order_id?.slice(0, 8) }}</td>
            <td class="text-bold">{{ order.symbol }}</td>
            <td>
              <span class="side-pill" :class="order.side === 'BUY' ? 'side-buy' : 'side-sell'">
                {{ order.side }}
              </span>
            </td>
            <td>{{ order.order_type }}</td>
            <td>{{ order.quantity }}</td>
            <td>{{ order.price || '-' }}</td>
            <td>{{ order.filled_quantity || '0' }}</td>
            <td>{{ order.avg_fill_price || '-' }}</td>
            <td>
              <span class="status-pill" :class="statusClass(order.status)">{{ order.status }}</span>
            </td>
            <td class="text-muted">{{ formatTime(order.created_at) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="ordersStore.orderHistory.length > pageSize" class="pagination">
        <span class="page-info">{{ pageStart + 1 }}-{{ pageEnd }} of {{ ordersStore.orderHistory.length }}</span>
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">←</button>
        <button class="page-btn" :disabled="pageEnd >= ordersStore.orderHistory.length" @click="currentPage++">→</button>
      </div>
    </div>

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
import { ref, computed, onMounted } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import type { Order } from '@/types';
import OrderForm from '@/components/orders/OrderForm.vue';
import OpenOrdersTable from '@/components/orders/OpenOrdersTable.vue';
import { message } from 'ant-design-vue';

const ordersStore = useOrdersStore();
const currentPage = ref(1);
const pageSize = 15;

const pageStart = computed(() => (currentPage.value - 1) * pageSize);
const pageEnd = computed(() => Math.min(pageStart.value + pageSize, ordersStore.orderHistory.length));
const paginatedHistory = computed(() =>
  ordersStore.orderHistory.slice(pageStart.value, pageEnd.value),
);

function statusClass(status: string): string {
  switch (status) {
    case 'FILLED': return 'status-filled';
    case 'CANCELED': return 'status-canceled';
    case 'PARTIALLY_FILLED': return 'status-partial';
    default: return 'status-default';
  }
}

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

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
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

.orders-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.card-badge {
  background: var(--q-primary-light);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
}

.data-table td {
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-muted { color: var(--q-text-muted); }
.text-bold { font-weight: 600; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.side-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
}

.side-buy { background: var(--q-success-light); color: var(--q-success); }
.side-sell { background: var(--q-error-light); color: var(--q-error); }

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
}

.status-filled { background: var(--q-success-light); color: var(--q-success); }
.status-canceled { background: var(--q-hover); color: var(--q-text-muted); }
.status-partial { background: var(--q-primary-light); color: var(--q-primary); }
.status-default { background: var(--q-hover); color: var(--q-text-secondary); }

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.page-info { font-size: 12px; color: var(--q-text-muted); }

.page-btn {
  background: var(--q-card);
  border: 1px solid var(--q-border);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  color: var(--q-text);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--q-primary);
  color: var(--q-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

<template>
  <div class="orders-card">
    <div class="card-header">
      <span class="card-title">Order History</span>
      <span v-if="orders.length > 0" class="card-badge">{{ orders.length }}</span>
    </div>

    <div class="filter-bar">
      <a-input
        v-model:value="filterSymbol"
        placeholder="Symbol filter"
        allow-clear
        size="small"
        style="width: 140px"
        @press-enter="applyFilter"
        @clear="applyFilter"
      />
      <a-input
        v-model:value="filterExchange"
        placeholder="Exchange filter"
        allow-clear
        size="small"
        style="width: 140px"
        @press-enter="applyFilter"
        @clear="applyFilter"
      />
      <a-button size="small" @click="applyFilter">Filter</a-button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px"></th>
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
        <template v-for="order in paginatedOrders" :key="order.order_id">
          <tr class="history-row" @click="toggleExpand(order.order_id)">
            <td class="expand-cell">
              <span class="expand-icon" :class="{ expanded: expandedId === order.order_id }">▶</span>
            </td>
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
          <tr v-if="expandedId === order.order_id" class="expand-row">
            <td colspan="11">
              <OrderEventTimeline
                :events="eventsForOrder(order.order_id)"
                :loading="eventsLoading"
              />
            </td>
          </tr>
        </template>
        <tr v-if="orders.length === 0">
          <td colspan="11" class="empty-state">No order history</td>
        </tr>
      </tbody>
    </table>

    <div v-if="orders.length > pageSize" class="pagination">
      <span class="page-info">{{ pageStart + 1 }}-{{ pageEnd }} of {{ orders.length }}</span>
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">←</button>
      <button class="page-btn" :disabled="pageEnd >= orders.length" @click="currentPage++">→</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import type { Order, OrderEvent } from '@/types';
import OrderEventTimeline from './OrderEventTimeline.vue';

const ordersStore = useOrdersStore();

const props = defineProps<{
  orders: Order[];
}>();

const currentPage = ref(1);
const pageSize = 15;
const expandedId = ref<string | null>(null);
const eventsLoading = ref(false);
const filterSymbol = ref('');
const filterExchange = ref('');

const pageStart = computed(() => (currentPage.value - 1) * pageSize);
const pageEnd = computed(() => Math.min(pageStart.value + pageSize, props.orders.length));
const paginatedOrders = computed(() =>
  props.orders.slice(pageStart.value, pageEnd.value),
);

function eventsForOrder(orderId: string): OrderEvent[] {
  return ordersStore.orderEvents[orderId] ?? [];
}

async function toggleExpand(orderId: string) {
  if (expandedId.value === orderId) {
    expandedId.value = null;
    return;
  }
  expandedId.value = orderId;
  if (!ordersStore.orderEvents[orderId]) {
    eventsLoading.value = true;
    await ordersStore.fetchOrderEvents(orderId);
    eventsLoading.value = false;
  }
}

async function applyFilter() {
  currentPage.value = 1;
  await ordersStore.fetchOrderHistory({
    symbol: filterSymbol.value || undefined,
    exchange: filterExchange.value || undefined,
  });
}

function statusClass(status: string): string {
  switch (status) {
    case 'FILLED': return 'status-filled';
    case 'CANCELED': return 'status-canceled';
    case 'PARTIALLY_FILLED': return 'status-partial';
    default: return 'status-default';
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}
</script>

<style scoped>
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

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
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

.history-row {
  cursor: pointer;
}

.history-row:hover td { background: var(--q-hover); }

.expand-cell {
  width: 30px;
  text-align: center;
}

.expand-icon {
  font-size: 9px;
  color: var(--q-text-muted);
  transition: transform 0.15s ease;
  display: inline-block;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.expand-row td {
  padding: 8px 8px 8px 40px;
  background: var(--q-bg);
  border-bottom: 1px solid var(--q-border);
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 20px 0;
}

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

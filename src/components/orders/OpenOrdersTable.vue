<template>
  <div class="orders-card">
    <div class="card-header">
      <span class="card-title">Open Orders</span>
      <span v-if="orders.length > 0" class="card-badge">{{ orders.length }}</span>
    </div>
    <table v-if="orders.length > 0" class="data-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Filled</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.order_id">
          <td class="text-muted">{{ formatTime(order.created_at) }}</td>
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
          <td>
            <a-popconfirm title="Cancel this order?" @confirm="emit('cancel', order)">
              <a-button size="small" type="link" danger class="cancel-btn">Cancel</a-button>
            </a-popconfirm>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">No open orders</div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types';

defineProps<{
  orders: Order[];
}>();

const emit = defineEmits<{
  cancel: [order: Order];
}>();

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleTimeString(); }
  catch { return dateStr; }
}
</script>

<style scoped>
.orders-card {
  background: var(--q-card);
  border: 1px solid var(--q-border);
  border-radius: 4px;
  padding: var(--q-card-padding);
  box-shadow: none;
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
  color: var(--q-text);
}

.card-badge {
  border: 1px solid var(--q-primary);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: transparent;
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

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background: var(--q-hover);
}

.text-muted { color: var(--q-text-muted); }
.text-bold { font-weight: 600; }

.side-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: transparent;
}

.side-buy { border: 1px solid var(--q-success); color: var(--q-success); }
.side-sell { border: 1px solid var(--q-error); color: var(--q-error); }

.cancel-btn {
  font-size: 12px;
  font-weight: 500;
  padding: 0;
  color: var(--q-error);
}

.cancel-btn:hover { text-decoration: underline; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

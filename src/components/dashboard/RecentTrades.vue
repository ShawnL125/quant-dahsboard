<template>
  <div class="trades-card">
    <div class="trades-header">
      <span class="trades-title">Recent Trades</span>
      <router-link to="/orders" class="trades-link">View All →</router-link>
    </div>
    <table v-if="trades.length > 0" class="trades-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Side</th>
          <th>Price</th>
          <th>Qty</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trade in trades.slice(0, 5)" :key="trade.order_id">
          <td class="symbol">{{ trade.symbol }}</td>
          <td>
            <span class="side-pill" :class="trade.side === 'BUY' ? 'side-buy' : 'side-sell'">
              {{ trade.side }}
            </span>
          </td>
          <td>{{ trade.avg_fill_price || trade.price || '-' }}</td>
          <td>{{ trade.filled_quantity || trade.quantity }}</td>
          <td class="time">{{ formatTime(trade.created_at) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="trades-empty">No recent trades</div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types';

defineProps<{
  trades: Order[];
}>();

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleTimeString();
  } catch {
    return dateStr;
  }
}
</script>

<style scoped>
.trades-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.trades-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.trades-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.trades-link {
  font-size: 12px;
  color: var(--q-primary);
  cursor: pointer;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.trades-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
}

.trades-table td {
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.trades-table tbody tr:last-child td {
  border-bottom: none;
}

.trades-table tbody tr:hover td {
  background: var(--q-hover);
}

.symbol {
  font-weight: 600;
  color: var(--q-text);
}

.side-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
}

.side-buy {
  background: var(--q-success-light);
  color: var(--q-success);
}

.side-sell {
  background: var(--q-error-light);
  color: var(--q-error);
}

.time {
  color: var(--q-text-muted);
}

.trades-empty {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

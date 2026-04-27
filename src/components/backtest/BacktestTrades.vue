<template>
  <div class="trades-card">
    <div class="card-header">
      <span class="card-title">Trades</span>
      <span v-if="trades.length > 0" class="card-badge">{{ trades.length }}</span>
    </div>
    <table v-if="trades.length > 0" class="data-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Side</th>
          <th>Entry</th>
          <th>Exit</th>
          <th>Qty</th>
          <th>P&L</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(trade, i) in trades" :key="i">
          <td class="text-bold">{{ trade.symbol }}</td>
          <td>
            <span class="side-pill" :class="trade.side === 'BUY' ? 'side-buy' : 'side-sell'">
              {{ trade.side }}
            </span>
          </td>
          <td>{{ fmtPrice(trade.entry_price) }}</td>
          <td>{{ fmtPrice(trade.exit_price) }}</td>
          <td>{{ trade.quantity }}</td>
          <td :class="pnlClass(trade.pnl)">{{ fmtPnl(trade.pnl) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">No trades</div>
  </div>
</template>

<script setup lang="ts">
import type { BacktestTrade } from '@/types';

defineProps<{
  trades: BacktestTrade[];
}>();

function fmtPrice(v: string): string {
  return parseFloat(v).toFixed(2);
}

function fmtPnl(v: string): string {
  const n = parseFloat(v);
  return (n >= 0 ? '+' : '') + n.toFixed(2);
}

function pnlClass(v: string): string {
  return parseFloat(v) >= 0 ? 'text-success' : 'text-error';
}
</script>

<style scoped>
.trades-card {
  background: var(--q-card);
  border: 1px solid var(--q-border);
  border-radius: var(--q-card-radius);
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
  color: var(--q-primary-dark);
}

.card-badge {
  background: transparent;
  border: 1px solid var(--q-primary);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
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
  padding: 8px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td { border-bottom: none; }

.text-bold { font-weight: 600; }
.text-success { color: var(--q-success); font-weight: 600; }
.text-error { color: var(--q-error); font-weight: 600; }

.side-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  letter-spacing: 0.02em;
}

.side-buy { background: transparent; border: 1px solid var(--q-success); color: var(--q-success); }
.side-sell { background: transparent; border: 1px solid var(--q-error); color: var(--q-error); }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 20px 0;
  font-size: 13px;
}
</style>

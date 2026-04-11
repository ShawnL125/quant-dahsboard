<template>
  <div class="positions-page">
    <div class="summary-bar">
      <div class="summary-item">
        <span class="summary-label">Total Positions</span>
        <span class="summary-value">{{ tradingStore.positions.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Profit</span>
        <span class="summary-value text-success">{{ profitCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Loss</span>
        <span class="summary-value text-error">{{ lossCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Unrealized P&L</span>
        <span class="summary-value" :class="totalPnl >= 0 ? 'text-success' : 'text-error'">
          {{ totalPnl >= 0 ? '+' : '' }}{{ totalPnl.toFixed(2) }}
        </span>
      </div>
    </div>

    <div class="positions-card page-section">
      <table v-if="tradingStore.positions.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Exchange</th>
            <th>Side</th>
            <th>Quantity</th>
            <th>Entry Price</th>
            <th>Unrealized P&L</th>
            <th>Stop Loss</th>
            <th>Take Profit</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pos in tradingStore.positions" :key="pos.symbol + pos.exchange">
            <td class="text-bold">{{ pos.symbol }}</td>
            <td>
              <span class="tag-gray">{{ pos.exchange }}</span>
            </td>
            <td>
              <span class="side-pill" :class="isLong(pos) ? 'side-buy' : 'side-sell'">
                {{ pos.side }}
              </span>
            </td>
            <td>{{ pos.quantity }}</td>
            <td>{{ pos.entry_price }}</td>
            <td :class="parseFloat(pos.unrealized_pnl) >= 0 ? 'text-success' : 'text-error'">
              {{ parseFloat(pos.unrealized_pnl) >= 0 ? '+' : '' }}{{ parseFloat(pos.unrealized_pnl).toFixed(2) }}
            </td>
            <td class="text-muted">{{ pos.stop_loss || '-' }}</td>
            <td class="text-muted">{{ pos.take_profit || '-' }}</td>
            <td>
              <a-popconfirm title="Close this position?" @confirm="onClosePosition(pos)">
                <span class="close-btn">Close</span>
              </a-popconfirm>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">No open positions</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTradingStore } from '@/stores/trading';
import type { Position } from '@/types';
import { message } from 'ant-design-vue';

const tradingStore = useTradingStore();

const profitCount = computed(() =>
  tradingStore.positions.filter((p) => parseFloat(p.unrealized_pnl) > 0).length,
);

const lossCount = computed(() =>
  tradingStore.positions.filter((p) => parseFloat(p.unrealized_pnl) < 0).length,
);

const totalPnl = computed(() =>
  tradingStore.positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pnl || '0'), 0),
);

function isLong(pos: Position): boolean {
  return pos.side === 'LONG' || pos.side === 'BUY';
}

function onClosePosition(_pos: Position) {
  message.info('Position close requested');
}

onMounted(() => {
  tradingStore.fetchPositions();
});
</script>

<style scoped>
.positions-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: 0; }

.summary-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--q-card-gap);
}

.summary-item {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: 16px;
  box-shadow: var(--q-card-shadow);
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--q-text-muted);
  margin-bottom: 6px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--q-text);
}

.text-success { color: var(--q-success); }
.text-error { color: var(--q-error); }

.positions-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
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

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); }

.tag-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
}

.side-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
}

.side-buy { background: var(--q-success-light); color: var(--q-success); }
.side-sell { background: var(--q-error-light); color: var(--q-error); }

.close-btn {
  color: var(--q-error);
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
}

.close-btn:hover { text-decoration: underline; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 40px 0;
  font-size: 13px;
}
</style>

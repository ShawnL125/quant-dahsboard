<template>
  <div class="entry-table-wrapper">
    <table v-if="entries.length > 0" class="data-table">
      <thead>
        <tr>
          <th>Strategy</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Entry Price</th>
          <th>Exit Price</th>
          <th>PNL</th>
          <th>Rating</th>
          <th>Status</th>
          <th>Tags</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.entry_id">
          <td class="text-mono">{{ entry.strategy_id }}</td>
          <td class="text-bold">{{ entry.symbol }}</td>
          <td>
            <span class="side-pill" :class="entry.side === 'BUY' ? 'side-buy' : 'side-sell'">
              {{ entry.side }}
            </span>
          </td>
          <td class="text-mono">{{ entry.entry_price }}</td>
          <td class="text-mono">{{ entry.exit_price ?? '-' }}</td>
          <td class="text-mono" :class="pnlClass(entry.realized_pnl)">
            {{ formatPnl(entry.realized_pnl) }}
          </td>
          <td>
            <span v-if="entry.rating !== null" class="rating-badge">{{ entry.rating }}/5</span>
            <span v-else class="text-muted">-</span>
          </td>
          <td>
            <span class="status-pill" :class="statusClass(entry.status)">{{ entry.status }}</span>
          </td>
          <td>
            <span v-if="entry.tags.length > 0" class="text-mono">{{ entry.tags.join(', ') }}</span>
            <span v-else class="text-muted">-</span>
          </td>
          <td>
            <div class="action-btns">
              <a-button v-if="entry.status === 'pending'" size="small" type="primary" @click="$emit('review', entry)">
                Review
              </a-button>
              <a-button size="small" @click="$emit('edit', entry)">Edit</a-button>
              <a-popconfirm
                v-if="entry.status === 'pending'"
                title="Dismiss this entry?"
                @confirm="$emit('dismiss', entry.entry_id)"
              >
                <a-button size="small" danger>Dismiss</a-button>
              </a-popconfirm>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">No journal entries</div>
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry } from '@/types';

defineProps<{
  entries: JournalEntry[];
}>();

defineEmits<{
  review: [entry: JournalEntry];
  edit: [entry: JournalEntry];
  dismiss: [entryId: string];
}>();

function formatPnl(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  const prefix = num >= 0 ? '+' : '';
  return prefix + num.toFixed(2);
}

function pnlClass(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return '';
  return num > 0 ? 'val-positive' : 'val-negative';
}

function statusClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'REVIEWED') return 'status-ok';
  if (s === 'DISMISSED') return 'status-error';
  if (s === 'PENDING') return 'status-pending';
  return '';
}
</script>

<style scoped>
.entry-table-wrapper {
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
  padding: 8px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background: var(--q-hover);
}

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.side-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.side-buy {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.side-sell {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.status-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.status-ok {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.status-error {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.status-pending {
  background: rgba(156, 163, 175, 0.12);
  color: #9ca3af;
}

.val-positive { color: var(--q-success); }
.val-negative { color: var(--q-error); }

.rating-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.1);
  color: var(--q-primary);
}

.action-btns {
  display: flex;
  gap: 4px;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

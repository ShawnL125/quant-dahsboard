<template>
  <div class="steps-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>Step</th>
          <th>Time</th>
          <th>Action</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>PNL</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="step in steps" :key="step.step_index">
          <td class="text-mono">{{ step.step_index }}</td>
          <td class="text-muted">{{ formatTime(step.timestamp) }}</td>
          <td>
            <span class="status-pill" :class="actionClass(step.action)">{{ step.action }}</span>
          </td>
          <td class="text-mono">{{ parseFloat(step.price).toFixed(2) }}</td>
          <td class="text-mono">{{ parseFloat(step.quantity).toFixed(4) }}</td>
          <td :class="pnlClass(step.pnl)" class="text-mono">{{ parseFloat(step.pnl).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ReplayStep } from '@/types';

defineProps<{
  steps: ReplayStep[];
}>();

function actionClass(action: string): string {
  switch (action.toUpperCase()) {
    case 'BUY': return 'action-buy';
    case 'SELL': return 'action-sell';
    case 'HOLD': return 'action-hold';
    default: return 'action-default';
  }
}

function pnlClass(pnl: string): string {
  const val = parseFloat(pnl);
  if (val > 0) return 'val-positive';
  if (val < 0) return 'val-negative';
  return '';
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}
</script>

<style scoped>
.steps-card {
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

.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.action-buy { border: 1px solid var(--q-success); color: var(--q-success); background: transparent; }
.action-sell { border: 1px solid var(--q-error); color: var(--q-error); background: transparent; }
.action-hold { border: 1px solid var(--q-primary); color: var(--q-primary); background: transparent; }
.action-default { border: 1px solid var(--q-text-muted); color: var(--q-text-muted); background: transparent; }

.val-positive { color: var(--q-success); font-weight: 600; }
.val-negative { color: var(--q-error); font-weight: 600; }

.text-muted { color: var(--q-text-muted); }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
</style>

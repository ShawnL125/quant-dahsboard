<template>
  <div class="windows-section">
    <div class="section-title">Windows ({{ windows.length }})</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Train Period</th>
          <th>Test Period</th>
          <th>Score</th>
          <th>Overfitting</th>
          <th>Best Params</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="w in windows" :key="w.window_index">
          <td>{{ w.window_index + 1 }}</td>
          <td class="text-muted">{{ shortDate(w.train_start) }} — {{ shortDate(w.train_end) }}</td>
          <td class="text-muted">{{ shortDate(w.test_start) }} — {{ shortDate(w.test_end) }}</td>
          <td class="text-bold">{{ w.objective_score.toFixed(4) }}</td>
          <td>
            <span class="overfit-badge" :class="overfitClass(w.overfitting_ratio)">
              {{ (w.overfitting_ratio * 100).toFixed(1) }}%
            </span>
          </td>
          <td class="params-cell">{{ formatParams(w.best_params) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="bestParams.length > 0" class="params-section">
      <div class="section-title">Parameter Stability</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Window</th>
            <th>Score</th>
            <th>Overfitting</th>
            <th>Parameters</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bp in bestParams" :key="bp.window_index">
            <td>{{ bp.window_index + 1 }}</td>
            <td>{{ bp.objective_score.toFixed(4) }}</td>
            <td>
              <span class="overfit-badge" :class="overfitClass(bp.overfitting_ratio)">
                {{ (bp.overfitting_ratio * 100).toFixed(1) }}%
              </span>
            </td>
            <td class="params-cell">{{ formatParams(bp.best_params) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WalkForwardWindow, WalkForwardBestParams } from '@/types';

defineProps<{
  windows: WalkForwardWindow[];
  bestParams: WalkForwardBestParams[];
}>();

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function overfitClass(ratio: number): string {
  if (ratio > 0.5) return 'overfit-high';
  if (ratio > 0.2) return 'overfit-mid';
  return 'overfit-low';
}

function formatParams(params: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return '-';
  return Object.entries(params)
    .map(([k, v]) => `${k}=${typeof v === 'number' ? v.toFixed(4) : v}`)
    .join(', ');
}
</script>

<style scoped>
.windows-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 8px;
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

.text-muted { color: var(--q-text-muted); }
.text-bold { font-weight: 600; }

.params-cell {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 10px;
  color: var(--q-text-secondary);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overfit-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.overfit-low { background: var(--q-success-light); color: var(--q-success); }
.overfit-mid { background: var(--q-warning-light); color: var(--q-warning); }
.overfit-high { background: var(--q-error-light); color: var(--q-error); }
</style>

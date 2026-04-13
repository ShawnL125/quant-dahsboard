<template>
  <div class="analytics-page">
    <a-spin :spinning="store.loading">
      <div class="stats-section">
        <div class="section-title">Strategy Performance</div>
        <div v-if="store.strategyStats.length > 0" class="stats-grid">
          <div v-for="snap in store.strategyStats" :key="snap.snapshot_id" class="stat-card">
            <div class="stat-strategy">{{ snap.strategy_id }}</div>
            <div class="stat-metrics">
              <div class="metric">
                <span class="metric-label">P&L</span>
                <span class="metric-value" :class="parseFloat(snap.total_pnl) >= 0 ? 'val-positive' : 'val-negative'">
                  {{ parseFloat(snap.total_pnl).toFixed(2) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Win Rate</span>
                <span class="metric-value">{{ (parseFloat(snap.win_rate) * 100).toFixed(1) }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Sharpe</span>
                <span class="metric-value">{{ snap.sharpe_ratio ? parseFloat(snap.sharpe_ratio).toFixed(2) : '-' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Trades</span>
                <span class="metric-value">{{ snap.total_trades }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Profit Factor</span>
                <span class="metric-value">{{ parseFloat(snap.profit_factor).toFixed(2) }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Max DD</span>
                <span class="metric-value val-negative">{{ (parseFloat(snap.max_drawdown_pct)).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">No strategy stats available</div>
      </div>

      <div class="quality-section page-section">
        <div class="section-row">
          <div v-if="store.consecutiveLosses" class="quality-card">
            <div class="quality-title">Consecutive Losses</div>
            <div class="quality-big">{{ store.consecutiveLosses.consecutive_losses }}</div>
            <div class="quality-sub">max: {{ store.consecutiveLosses.max_consecutive_losses }}</div>
          </div>
          <div v-if="store.signalQuality" class="quality-card">
            <div class="quality-title">Signal Quality</div>
            <div class="quality-big">{{ (parseFloat(store.signalQuality.fill_rate) * 100).toFixed(1) }}%</div>
            <div class="quality-sub">{{ store.signalQuality.trade_count }} trades / {{ store.signalQuality.signal_count }} signals</div>
          </div>
        </div>
      </div>

      <div class="trips-section page-section">
        <div class="section-header">
          <span class="section-title">Round-Trip Trades</span>
          <span v-if="store.roundTripsTotal > 0" class="section-badge">{{ store.roundTripsTotal }}</span>
        </div>
        <table v-if="store.roundTrips.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P&L</th>
              <th>Fee</th>
              <th>Duration</th>
              <th>Strategy</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rt in store.roundTrips" :key="rt.trade_id">
              <td class="text-bold">{{ rt.symbol }}</td>
              <td>
                <span class="side-pill" :class="rt.side === 'long' ? 'side-long' : 'side-short'">{{ rt.side }}</span>
              </td>
              <td class="text-mono">{{ parseFloat(rt.entry_price).toFixed(2) }}</td>
              <td class="text-mono">{{ parseFloat(rt.exit_price).toFixed(2) }}</td>
              <td class="text-mono text-bold" :class="parseFloat(rt.net_pnl) >= 0 ? 'val-positive' : 'val-negative'">
                {{ parseFloat(rt.net_pnl) >= 0 ? '+' : '' }}{{ parseFloat(rt.net_pnl).toFixed(2) }}
              </td>
              <td class="text-mono">{{ parseFloat(rt.fee).toFixed(2) }}</td>
              <td>{{ formatDuration(rt.holding_duration_sec) }}</td>
              <td class="text-muted">{{ rt.strategy_id }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No round-trip trades</div>
      </div>

      <div class="signals-section page-section">
        <div class="section-header">
          <span class="section-title">Signal History</span>
          <span v-if="store.signalsTotal > 0" class="section-badge">{{ store.signalsTotal }}</span>
        </div>
        <table v-if="store.signals.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Direction</th>
              <th>Strength</th>
              <th>Strategy</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sig in store.signals" :key="sig.signal_id">
              <td class="text-muted">{{ formatTime(sig.time) }}</td>
              <td class="text-bold">{{ sig.symbol }}</td>
              <td>
                <span class="side-pill" :class="sig.direction === 'long' ? 'side-long' : 'side-short'">{{ sig.direction }}</span>
              </td>
              <td class="text-mono">{{ parseFloat(sig.strength).toFixed(2) }}</td>
              <td class="text-muted">{{ sig.strategy_id }}</td>
              <td class="text-muted text-ellipsis" :title="sig.reason">{{ sig.reason }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No signal history</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAnalyticsStore } from '@/stores/analytics';

const store = useAnalyticsStore();

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(0)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

onMounted(async () => {
  await store.fetchAll();
  await Promise.all([
    store.fetchRoundTrips({ limit: 50 }),
    store.fetchSignals({ limit: 50 }),
  ]);
});
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: var(--q-card-gap); }

.stats-section,
.quality-section,
.trips-section,
.signals-section {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-header .section-title { margin-bottom: 0; }

.section-badge {
  background: var(--q-primary-light);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}

.stat-card {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 12px;
}

.stat-strategy {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
  margin-bottom: 8px;
}

.stat-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.val-positive { color: var(--q-success); }
.val-negative { color: var(--q-error); }

.section-row {
  display: flex;
  gap: 12px;
}

.quality-card {
  flex: 1;
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.quality-title {
  font-size: 11px;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.quality-big {
  font-size: 28px;
  font-weight: 700;
  color: var(--q-text);
}

.quality-sub {
  font-size: 11px;
  color: var(--q-text-muted);
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
.data-table tbody tr:hover td { background: var(--q-hover); }

.side-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.side-long { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.side-short { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.text-ellipsis {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

<template>
  <div class="account-page">
    <a-spin :spinning="store.loading">
      <AccountsList />
      <div class="margin-section">
        <div class="section-header">
          <span class="section-title">Margin Status</span>
          <div class="header-actions">
            <a-button size="small" @click="onSync">Sync All</a-button>
            <a-button size="small" @click="onRefresh">Refresh</a-button>
          </div>
        </div>
        <div v-if="store.margins.length > 0" class="margin-grid">
          <div v-for="m in store.margins" :key="m.exchange" class="margin-card" :class="m.liquidation_risk ? 'margin-risk' : ''">
            <div class="margin-exchange">{{ m.exchange }}</div>
            <div class="margin-value-row">
              <span class="margin-label">Ratio</span>
              <span class="margin-value" :class="parseFloat(m.margin_ratio) < 0.2 ? 'val-negative' : ''">{{ (parseFloat(m.margin_ratio) * 100).toFixed(1) }}%</span>
            </div>
            <div class="margin-value-row">
              <span class="margin-label">Equity</span>
              <span class="margin-value">{{ m.total_equity }}</span>
            </div>
            <div class="margin-value-row">
              <span class="margin-label">Position Value</span>
              <span class="margin-value">{{ m.total_position_value }}</span>
            </div>
            <div v-if="m.liquidation_risk" class="liquidation-warning">Liquidation Risk</div>
          </div>
        </div>
        <div v-else class="empty-state">No margin data</div>
      </div>

      <div class="snapshots-section page-section">
        <div class="section-header">
          <span class="section-title">Account Snapshots</span>
          <span v-if="store.snapshots.length > 0" class="section-badge">{{ store.snapshots.length }}</span>
        </div>
        <div v-if="store.snapshots.length > 0" class="snapshot-grid">
          <div v-for="snap in store.snapshots" :key="snap.snapshot_id" class="snapshot-card">
            <div class="snapshot-header">
              <span class="snapshot-exchange">{{ snap.exchange }}</span>
              <span class="snapshot-type">{{ snap.snapshot_type }}</span>
            </div>
            <div class="snapshot-equity">{{ snap.total_equity }}</div>
            <div v-for="(amount, asset) in snap.balances" :key="asset" class="snapshot-row">
              <span class="snapshot-asset">{{ asset }}</span>
              <span class="snapshot-amount">{{ amount }}</span>
            </div>
            <div class="snapshot-time">{{ formatTime(snap.created_at) }}</div>
          </div>
        </div>
        <div v-else class="empty-state">No account snapshots</div>
      </div>

      <div class="recon-section page-section">
        <div class="section-header">
          <span class="section-title">Account Reconciliations</span>
          <a-button size="small" @click="onReconcile">Reconcile Now</a-button>
        </div>
        <table v-if="store.reconciliations.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Exchange</th>
              <th>Matched</th>
              <th>Diff (USD)</th>
              <th>Corrections</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rec in store.reconciliations" :key="rec.reconcile_id">
              <td class="text-bold">{{ rec.exchange }}</td>
              <td><span class="status-pill" :class="rec.matched ? 'status-ok' : 'status-mismatch'">{{ rec.matched ? 'Yes' : 'No' }}</span></td>
              <td class="text-mono" :class="parseFloat(rec.total_diff_usd) !== 0 ? 'val-negative' : ''">{{ rec.total_diff_usd }}</td>
              <td>{{ rec.corrections_count }}</td>
              <td class="text-muted">{{ formatTime(rec.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No reconciliation history</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAccountStore } from '@/stores/account';
import { useAccountsStore } from '@/stores/accounts';
import AccountsList from '@/components/account/AccountsList.vue';

const store = useAccountStore();
const accountsStore = useAccountsStore();

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function onRefresh() { store.fetchAll(); }
function onSync() { store.syncAll().then(() => store.fetchAll()); }
function onReconcile() { store.reconcile().then(() => store.fetchReconciliations()); }

onMounted(() => { store.fetchAll(); accountsStore.fetchAccounts(); });
</script>

<style scoped>
.account-page { display: flex; flex-direction: column; gap: var(--q-card-gap); }
.page-section { margin-top: var(--q-card-gap); }

.margin-section,
.snapshots-section,
.recon-section {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.header-actions { display: flex; gap: 8px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--q-primary-dark); }
.section-badge { background: var(--q-primary-light); color: var(--q-primary); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }

.margin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.margin-card { background: var(--q-bg); border: 1px solid var(--q-border); border-radius: 8px; padding: 12px; }
.margin-card.margin-risk { border-color: var(--q-error); background: rgba(239, 68, 68, 0.05); }
.margin-exchange { font-size: 11px; font-weight: 600; color: var(--q-text-muted); text-transform: uppercase; margin-bottom: 8px; }
.margin-value-row { display: flex; justify-content: space-between; padding: 2px 0; }
.margin-label { font-size: 11px; color: var(--q-text-muted); }
.margin-value { font-size: 13px; font-weight: 600; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--q-text); }
.liquidation-warning { margin-top: 6px; font-size: 10px; font-weight: 700; color: var(--q-error); text-transform: uppercase; }

.snapshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.snapshot-card { background: var(--q-bg); border: 1px solid var(--q-border); border-radius: 8px; padding: 10px 12px; }
.snapshot-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.snapshot-exchange { font-size: 11px; font-weight: 600; color: var(--q-text-muted); text-transform: uppercase; }
.snapshot-type { font-size: 10px; color: var(--q-primary); }
.snapshot-equity { font-size: 16px; font-weight: 700; color: var(--q-text); font-family: 'SF Mono', 'Fira Code', monospace; margin-bottom: 6px; }
.snapshot-row { display: flex; justify-content: space-between; padding: 1px 0; }
.snapshot-asset { font-size: 12px; color: var(--q-text); }
.snapshot-amount { font-size: 12px; font-weight: 600; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--q-text); }
.snapshot-time { font-size: 10px; color: var(--q-text-muted); margin-top: 6px; }

.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { text-align: left; color: var(--q-text-muted); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; padding: 6px 0; }
.data-table td { padding: 8px 0; color: var(--q-text); border-bottom: 1px solid var(--q-border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
.val-negative { color: var(--q-error); }

.status-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.status-ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.status-mismatch { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.empty-state { text-align: center; color: var(--q-text-muted); padding: 24px 0; font-size: 13px; }
</style>

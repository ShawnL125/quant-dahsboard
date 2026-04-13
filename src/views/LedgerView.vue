<template>
  <div class="ledger-page">
    <a-spin :spinning="store.loading">
      <div class="balances-section">
        <div class="section-header">
          <span class="section-title">Account Balances</span>
          <div class="header-actions">
            <a-button size="small" @click="showCashFlow = true">Cash Flow</a-button>
            <a-button size="small" @click="onRefresh">Refresh</a-button>
          </div>
        </div>
        <div v-if="Object.keys(store.balances).length > 0" class="balances-grid">
          <div v-for="(assets, account) in store.balances" :key="account" class="balance-card">
            <div class="balance-account">{{ account }}</div>
            <div v-for="(amount, asset) in assets" :key="asset" class="balance-row">
              <span class="balance-asset">{{ asset }}</span>
              <span class="balance-amount">{{ amount }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">No balance data</div>
      </div>

      <div class="summary-section page-section">
        <div class="section-header">
          <span class="section-title">Daily Summary</span>
          <div class="header-actions">
            <a-date-picker v-model:value="summaryDate" size="small" format="YYYY-MM-DD" value-format="YYYY-MM-DD" @change="onDateChange" />
          </div>
        </div>
        <table v-if="store.dailySummary.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Asset</th>
              <th>Opening</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Closing</th>
              <th>Entries</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in store.dailySummary" :key="`${row.account}-${row.asset}`">
              <td class="text-bold">{{ row.account }}</td>
              <td class="text-mono">{{ row.asset }}</td>
              <td class="text-mono">{{ row.opening_balance }}</td>
              <td class="text-mono val-debit">{{ row.total_debit }}</td>
              <td class="text-mono val-credit">{{ row.total_credit }}</td>
              <td class="text-mono text-bold">{{ row.closing_balance }}</td>
              <td>{{ row.entry_count }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">Select a date to view daily summary</div>
      </div>

      <div class="entries-section page-section">
        <div class="section-header">
          <span class="section-title">Ledger Entries</span>
          <span v-if="store.entriesTotal > 0" class="section-badge">{{ store.entriesTotal }}</span>
        </div>
        <table v-if="store.entries.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Account</th>
              <th>Counter</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Ref</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in store.entries" :key="entry.entry_id">
              <td class="text-muted">{{ formatTime(entry.timestamp) }}</td>
              <td class="text-bold">{{ entry.account }}</td>
              <td class="text-muted">{{ entry.counter_account }}</td>
              <td class="text-mono" :class="parseFloat(entry.debit) > 0 ? 'val-debit' : ''">{{ entry.debit }}</td>
              <td class="text-mono" :class="parseFloat(entry.credit) > 0 ? 'val-credit' : ''">{{ entry.credit }}</td>
              <td class="text-mono text-bold">{{ entry.balance }}</td>
              <td class="text-muted">{{ entry.reference_type }}:{{ entry.reference_id.slice(0, 8) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No ledger entries</div>
      </div>

      <a-modal v-model:open="showCashFlow" title="Record Cash Flow" @ok="onSubmitCashFlow" :confirm-loading="submitting">
        <a-form layout="vertical">
          <a-form-item label="Type">
            <a-select v-model:value="cashFlow.flow_type">
              <a-select-option value="deposit">Deposit</a-select-option>
              <a-select-option value="withdrawal">Withdrawal</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="Asset">
            <a-input v-model:value="cashFlow.asset" placeholder="USDT" />
          </a-form-item>
          <a-form-item label="Amount">
            <a-input v-model:value="cashFlow.amount" placeholder="0.00" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLedgerStore } from '@/stores/ledger';

const store = useLedgerStore();
const summaryDate = ref(new Date().toISOString().slice(0, 10));
const showCashFlow = ref(false);
const submitting = ref(false);
const cashFlow = ref({ flow_type: 'deposit' as 'deposit' | 'withdrawal', asset: 'USDT', amount: '' });

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function onRefresh() {
  store.fetchAll();
  store.fetchDailySummary(summaryDate.value);
}

function onDateChange(date: string | null) {
  if (date) store.fetchDailySummary(date);
}

async function onSubmitCashFlow() {
  if (!cashFlow.value.amount) return;
  submitting.value = true;
  try {
    await store.postCashFlow(cashFlow.value);
    showCashFlow.value = false;
    cashFlow.value = { flow_type: 'deposit', asset: 'USDT', amount: '' };
    store.fetchAll();
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  store.fetchAll();
  store.fetchDailySummary(summaryDate.value);
});
</script>

<style scoped>
.ledger-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: var(--q-card-gap); }

.balances-section,
.summary-section,
.entries-section {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.section-badge {
  background: var(--q-primary-light);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.balances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.balance-card {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 10px 12px;
}

.balance-account {
  font-size: 11px;
  font-weight: 600;
  color: var(--q-text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.balance-asset {
  font-size: 12px;
  font-weight: 500;
  color: var(--q-text);
}

.balance-amount {
  font-size: 13px;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--q-text);
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

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.val-debit { color: var(--q-error); }
.val-credit { color: var(--q-success); }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

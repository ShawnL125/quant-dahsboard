<template>
  <div class="accounts-section">
    <div class="section-header">
      <span class="section-title">Accounts</span>
      <a-button size="small" @click="store.fetchAccounts()">Refresh</a-button>
    </div>
    <div v-if="store.accounts.length > 0" class="accounts-grid">
      <div v-for="acct in store.accounts" :key="acct.account_id" class="account-card">
        <div class="account-exchange">{{ acct.exchange }}</div>
        <div class="account-label">{{ acct.label }}</div>
        <span v-if="acct.is_default" class="default-badge">Default</span>
        <div class="account-actions">
          <a-popconfirm
            title="Kill this account? This will disable trading."
            @confirm="onKill(acct.account_id)"
          >
            <a-button size="small" danger>Kill</a-button>
          </a-popconfirm>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">No accounts configured</div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import { useAccountsStore } from '@/stores/accounts';

const store = useAccountsStore();

async function onKill(accountId: string) {
  try {
    await store.killAccount(accountId);
    message.success('Account killed');
  } catch {
    message.error('Failed to kill account');
  }
}
</script>

<style scoped>
.accounts-section {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--q-primary-dark); }

.accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }

.account-card {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 12px;
}

.account-exchange {
  font-size: 11px;
  font-weight: 600;
  color: var(--q-text-muted);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.account-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
  margin-bottom: 6px;
}

.default-badge {
  display: inline-block;
  border: 1px solid var(--q-primary);
  color: var(--q-primary);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 4px;
  background: transparent;
  margin-bottom: 8px;
}

.account-actions { margin-top: 8px; }

.empty-state { text-align: center; color: var(--q-text-muted); padding: 24px 0; font-size: 13px; }
</style>

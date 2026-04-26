import { defineStore } from 'pinia';
import { ref } from 'vue';
import { accountsApi } from '@/api/accounts';
import type { ExchangeAccount } from '@/types';

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<ExchangeAccount[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAccounts() {
    try {
      accounts.value = await accountsApi.list();
    } catch { accounts.value = []; }
  }

  async function killAccount(accountId: string) {
    try {
      await accountsApi.kill(accountId);
      const idx = accounts.value.findIndex((a) => a.account_id === accountId);
      if (idx >= 0) {
        accounts.value[idx] = { ...accounts.value[idx], is_active: false };
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function unkillAccount(accountId: string) {
    try {
      await accountsApi.unkill(accountId);
      const idx = accounts.value.findIndex((a) => a.account_id === accountId);
      if (idx >= 0) {
        accounts.value[idx] = { ...accounts.value[idx], is_active: true };
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  return { accounts, loading, error, fetchAccounts, killAccount, unkillAccount };
});

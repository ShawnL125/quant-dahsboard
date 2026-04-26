import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccountsStore } from '@/stores/accounts';
import { accountsApi } from '@/api/accounts';
import type { ExchangeAccount } from '@/types';

vi.mock('@/api/accounts', () => ({
  accountsApi: {
    list: vi.fn(),
    get: vi.fn(),
    kill: vi.fn(),
    unkill: vi.fn(),
  },
}));

const mockedApi = vi.mocked(accountsApi);

const fakeAccount: ExchangeAccount = {
  account_id: 'acc1',
  exchange: 'binance',
  label: 'Main Account',
  is_default: true,
};

describe('accounts store', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('initial state', () => {
    it('has empty accounts', () => {
      const store = useAccountsStore();
      expect(store.accounts).toEqual([]);
    });
    it('has loading false and error null', () => {
      const store = useAccountsStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchAccounts()', () => {
    it('sets accounts on success', async () => {
      mockedApi.list.mockResolvedValue([fakeAccount]);
      const store = useAccountsStore();
      await store.fetchAccounts();
      expect(store.accounts).toEqual([fakeAccount]);
    });
    it('sets accounts to empty on failure', async () => {
      mockedApi.list.mockRejectedValue(new Error('fail'));
      const store = useAccountsStore();
      await store.fetchAccounts();
      expect(store.accounts).toEqual([]);
    });
  });

  describe('killAccount()', () => {
    it('calls kill API', async () => {
      mockedApi.kill.mockResolvedValue({ status: 'killed', account_id: 'acc1' });
      const store = useAccountsStore();
      store.accounts = [fakeAccount];
      await store.killAccount('acc1');
      expect(mockedApi.kill).toHaveBeenCalledWith('acc1');
    });
    it('sets error on failure', async () => {
      mockedApi.kill.mockRejectedValue(new Error('kill fail'));
      const store = useAccountsStore();
      await expect(store.killAccount('acc1')).rejects.toThrow('kill fail');
      expect(store.error).toBe('kill fail');
    });
  });

  describe('unkillAccount()', () => {
    it('calls unkill API', async () => {
      mockedApi.unkill.mockResolvedValue({ status: 'unkilled', account_id: 'acc1' });
      const store = useAccountsStore();
      store.accounts = [fakeAccount];
      await store.unkillAccount('acc1');
      expect(mockedApi.unkill).toHaveBeenCalledWith('acc1');
    });
    it('sets error on failure', async () => {
      mockedApi.unkill.mockRejectedValue(new Error('unkill fail'));
      const store = useAccountsStore();
      await expect(store.unkillAccount('acc1')).rejects.toThrow('unkill fail');
      expect(store.error).toBe('unkill fail');
    });
  });
});

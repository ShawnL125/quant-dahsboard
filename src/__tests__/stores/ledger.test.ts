import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLedgerStore } from '@/stores/ledger';
import { ledgerApi } from '@/api/ledger';
import type { LedgerEntry, DailySummary, LedgerConfigResponse, CashFlowResponse } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/ledger', () => ({
  ledgerApi: {
    getBalances: vi.fn(),
    getBalance: vi.fn(),
    getEntries: vi.fn(),
    getEntriesByReference: vi.fn(),
    getDailySummary: vi.fn(),
    postCashFlow: vi.fn(),
    getConfig: vi.fn(),
  },
}));

const mockedLedgerApi = vi.mocked(ledgerApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeBalances = { binance: { USDT: '10000', BTC: '0.5' } };
const fakeEntries: LedgerEntry[] = [
  { entry_id: 'e-1', account: 'binance', amount: '100' } as unknown as LedgerEntry,
];
const fakeDailySummary: DailySummary[] = [
  { date: '2026-01-01', total_pnl: '500' } as unknown as DailySummary,
];
const fakeConfig: LedgerConfigResponse = { version: '1.0' } as unknown as LedgerConfigResponse;
const fakeCashFlowResult: CashFlowResponse = { entry_id: 'cf-1', status: 'posted' } as unknown as CashFlowResponse;

// ── Tests ────────────────────────────────────────────────────────────
describe('ledger store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty balances', () => {
      const store = useLedgerStore();
      expect(store.balances).toEqual({});
    });

    it('has empty entries and zero total', () => {
      const store = useLedgerStore();
      expect(store.entries).toEqual([]);
      expect(store.entriesTotal).toBe(0);
    });

    it('has empty dailySummary', () => {
      const store = useLedgerStore();
      expect(store.dailySummary).toEqual([]);
    });

    it('has null config', () => {
      const store = useLedgerStore();
      expect(store.config).toBeNull();
    });

    it('has loading false and error null', () => {
      const store = useLedgerStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchBalances ─────────────────────────────────────────────────
  describe('fetchBalances()', () => {
    it('sets balances on success', async () => {
      mockedLedgerApi.getBalances.mockResolvedValue(fakeBalances);

      const store = useLedgerStore();
      await store.fetchBalances();

      expect(store.balances).toEqual(fakeBalances);
    });

    it('sets error on failure', async () => {
      mockedLedgerApi.getBalances.mockRejectedValue(new Error('Server error'));

      const store = useLedgerStore();
      await store.fetchBalances();

      expect(store.error).toBe('Server error');
    });
  });

  // ── fetchEntries ──────────────────────────────────────────────────
  describe('fetchEntries()', () => {
    it('sets entries and entriesTotal on success', async () => {
      mockedLedgerApi.getEntries.mockResolvedValue({ entries: fakeEntries, total: 1 });

      const store = useLedgerStore();
      await store.fetchEntries();

      expect(store.entries).toEqual(fakeEntries);
      expect(store.entriesTotal).toBe(1);
    });

    it('passes params to API', async () => {
      mockedLedgerApi.getEntries.mockResolvedValue({ entries: [], total: 0 });

      const store = useLedgerStore();
      await store.fetchEntries({ account: 'binance' });

      expect(mockedLedgerApi.getEntries).toHaveBeenCalledWith({ account: 'binance' });
    });

    it('sets error on failure', async () => {
      mockedLedgerApi.getEntries.mockRejectedValue(new Error('fail'));

      const store = useLedgerStore();
      await store.fetchEntries();

      expect(store.error).toBe('fail');
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedLedgerApi.getEntries.mockReturnValue(new Promise((r) => { resolve = r; }) as any);

      const store = useLedgerStore();
      const promise = store.fetchEntries();

      expect(store.loading).toBe(true);

      resolve({ entries: [], total: 0 });
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── fetchDailySummary ─────────────────────────────────────────────
  describe('fetchDailySummary()', () => {
    it('sets dailySummary on success', async () => {
      mockedLedgerApi.getDailySummary.mockResolvedValue(fakeDailySummary);

      const store = useLedgerStore();
      await store.fetchDailySummary('2026-01-01');

      expect(store.dailySummary).toEqual(fakeDailySummary);
      expect(mockedLedgerApi.getDailySummary).toHaveBeenCalledWith('2026-01-01', undefined);
    });

    it('passes account parameter', async () => {
      mockedLedgerApi.getDailySummary.mockResolvedValue([]);

      const store = useLedgerStore();
      await store.fetchDailySummary('2026-01-01', 'binance');

      expect(mockedLedgerApi.getDailySummary).toHaveBeenCalledWith('2026-01-01', 'binance');
    });

    it('sets error on failure', async () => {
      mockedLedgerApi.getDailySummary.mockRejectedValue(new Error('fail'));

      const store = useLedgerStore();
      await store.fetchDailySummary('2026-01-01');

      expect(store.error).toBe('fail');
    });
  });

  // ── fetchConfig ───────────────────────────────────────────────────
  describe('fetchConfig()', () => {
    it('sets config on success', async () => {
      mockedLedgerApi.getConfig.mockResolvedValue(fakeConfig);

      const store = useLedgerStore();
      await store.fetchConfig();

      expect(store.config).toEqual(fakeConfig);
    });

    it('silently handles failure', async () => {
      mockedLedgerApi.getConfig.mockRejectedValue(new Error('fail'));

      const store = useLedgerStore();
      await store.fetchConfig();

      // config stays null, no error set
      expect(store.config).toBeNull();
    });
  });

  // ── postCashFlow ──────────────────────────────────────────────────
  describe('postCashFlow()', () => {
    it('returns the API result', async () => {
      const request = { account: 'binance', amount: '100', asset: 'USDT', direction: 'in' };
      mockedLedgerApi.postCashFlow.mockResolvedValue(fakeCashFlowResult);

      const store = useLedgerStore();
      const result = await store.postCashFlow(request as any);

      expect(result).toEqual(fakeCashFlowResult);
      expect(mockedLedgerApi.postCashFlow).toHaveBeenCalledWith(request);
    });

    it('propagates error from API', async () => {
      mockedLedgerApi.postCashFlow.mockRejectedValue(new Error('bad request'));

      const store = useLedgerStore();
      await expect(store.postCashFlow({} as any)).rejects.toThrow('bad request');
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('fetches balances, entries, and config in parallel', async () => {
      mockedLedgerApi.getBalances.mockResolvedValue(fakeBalances);
      mockedLedgerApi.getEntries.mockResolvedValue({ entries: fakeEntries, total: 1 });
      mockedLedgerApi.getConfig.mockResolvedValue(fakeConfig);

      const store = useLedgerStore();
      await store.fetchAll();

      expect(store.balances).toEqual(fakeBalances);
      expect(store.entries).toEqual(fakeEntries);
      expect(store.entriesTotal).toBe(1);
      expect(store.config).toEqual(fakeConfig);
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedLedgerApi.getBalances.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedLedgerApi.getEntries.mockResolvedValue({ entries: [], total: 0 });
      mockedLedgerApi.getConfig.mockResolvedValue({ enabled: true, track_funding: true, snapshot_interval_hours: 1, daily_summary_hour_utc: 0 } as import('@/types').LedgerConfigResponse);

      const store = useLedgerStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolve({});
      await promise;

      expect(store.loading).toBe(false);
    });
  });
});

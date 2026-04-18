import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFundingStore } from '@/stores/funding';
import { fundingApi } from '@/api/funding';
import type { FundingRate, FundingCostSummary } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/funding', () => ({
  fundingApi: {
    getCurrent: vi.fn(),
    getHistory: vi.fn(),
    getCost: vi.fn(),
    backfill: vi.fn(),
  },
}));

const mockedFundingApi = vi.mocked(fundingApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeRateBTC: FundingRate = {
  symbol: 'BTC/USDT', funding_rate: '0.0001', timestamp: '2026-01-01T00:00:00Z',
} as unknown as FundingRate;

const fakeRateETH: FundingRate = {
  symbol: 'ETH/USDT', funding_rate: '0.0002', timestamp: '2026-01-01T00:00:00Z',
} as unknown as FundingRate;

const fakeCostSummary: FundingCostSummary = {
  total_cost: '100.50', total_income: '50.25',
} as unknown as FundingCostSummary;

// ── Tests ────────────────────────────────────────────────────────────
describe('funding store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty currentRates', () => {
      const store = useFundingStore();
      expect(store.currentRates).toEqual({});
    });

    it('has empty historyRates', () => {
      const store = useFundingStore();
      expect(store.historyRates).toEqual([]);
    });

    it('has null costSummary', () => {
      const store = useFundingStore();
      expect(store.costSummary).toBeNull();
    });

    it('has loading false and error null', () => {
      const store = useFundingStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchCurrent ──────────────────────────────────────────────────
  describe('fetchCurrent()', () => {
    it('sets currentRates on success', async () => {
      mockedFundingApi.getCurrent.mockResolvedValue({
        rates: { 'BTC/USDT': fakeRateBTC },
      });

      const store = useFundingStore();
      await store.fetchCurrent();

      expect(store.currentRates).toEqual({ 'BTC/USDT': fakeRateBTC });
    });

    it('sets currentRates to empty on failure', async () => {
      mockedFundingApi.getCurrent.mockRejectedValue(new Error('fail'));

      const store = useFundingStore();
      await store.fetchCurrent();

      expect(store.currentRates).toEqual({});
    });
  });

  // ── fetchHistory ──────────────────────────────────────────────────
  describe('fetchHistory()', () => {
    it('sets historyRates on success', async () => {
      mockedFundingApi.getHistory.mockResolvedValue({ rates: [fakeRateBTC, fakeRateETH] });

      const store = useFundingStore();
      await store.fetchHistory('BTC/USDT');

      expect(store.historyRates).toEqual([fakeRateBTC, fakeRateETH]);
      expect(mockedFundingApi.getHistory).toHaveBeenCalledWith('BTC/USDT', undefined);
    });

    it('passes params to API', async () => {
      mockedFundingApi.getHistory.mockResolvedValue({ rates: [] });

      const store = useFundingStore();
      await store.fetchHistory('BTC/USDT', { limit: 10, offset: 5 });

      expect(mockedFundingApi.getHistory).toHaveBeenCalledWith('BTC/USDT', { limit: 10, offset: 5 });
    });

    it('sets historyRates to empty on failure', async () => {
      mockedFundingApi.getHistory.mockRejectedValue(new Error('fail'));

      const store = useFundingStore();
      await store.fetchHistory('BTC/USDT');

      expect(store.historyRates).toEqual([]);
    });
  });

  // ── fetchCost ─────────────────────────────────────────────────────
  describe('fetchCost()', () => {
    it('sets costSummary on success', async () => {
      mockedFundingApi.getCost.mockResolvedValue({ summary: fakeCostSummary });

      const store = useFundingStore();
      await store.fetchCost('strat-1');

      expect(store.costSummary).toEqual(fakeCostSummary);
      expect(mockedFundingApi.getCost).toHaveBeenCalledWith('strat-1', undefined);
    });

    it('passes params to API', async () => {
      mockedFundingApi.getCost.mockResolvedValue({ summary: fakeCostSummary });

      const store = useFundingStore();
      await store.fetchCost('strat-1', { start: '2026-01-01', end: '2026-02-01' });

      expect(mockedFundingApi.getCost).toHaveBeenCalledWith('strat-1', { start: '2026-01-01', end: '2026-02-01' });
    });

    it('sets costSummary to null on failure', async () => {
      mockedFundingApi.getCost.mockRejectedValue(new Error('fail'));

      const store = useFundingStore();
      await store.fetchCost('strat-1');

      expect(store.costSummary).toBeNull();
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('only calls fetchCurrent', async () => {
      mockedFundingApi.getCurrent.mockResolvedValue({
        rates: { 'BTC/USDT': fakeRateBTC },
      });

      const store = useFundingStore();
      await store.fetchAll();

      expect(mockedFundingApi.getCurrent).toHaveBeenCalledOnce();
      expect(mockedFundingApi.getHistory).not.toHaveBeenCalled();
      expect(mockedFundingApi.getCost).not.toHaveBeenCalled();
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedFundingApi.getCurrent.mockReturnValue(new Promise((r) => { resolve = r; }) as any);

      const store = useFundingStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolve({ rates: {} });
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── updateRatesFromWS ─────────────────────────────────────────────
  describe('updateRatesFromWS()', () => {
    it('updates currentRates for the symbol', () => {
      const store = useFundingStore();
      store.currentRates = { 'BTC/USDT': fakeRateBTC };

      const updatedRate = { symbol: 'BTC/USDT', funding_rate: '0.0003', timestamp: '2026-01-02T00:00:00Z' };
      store.updateRatesFromWS(updatedRate as unknown as Record<string, unknown>);

      expect(store.currentRates['BTC/USDT']).toEqual(updatedRate);
    });

    it('adds new symbol to currentRates', () => {
      const store = useFundingStore();
      store.currentRates = { 'BTC/USDT': fakeRateBTC };

      store.updateRatesFromWS(fakeRateETH as unknown as Record<string, unknown>);

      expect(Object.keys(store.currentRates)).toHaveLength(2);
      expect(store.currentRates['ETH/USDT']).toEqual(fakeRateETH);
    });

    it('does nothing when symbol is missing', () => {
      const store = useFundingStore();
      store.currentRates = { 'BTC/USDT': fakeRateBTC };

      store.updateRatesFromWS({ funding_rate: '0.0001' } as Record<string, unknown>);

      expect(Object.keys(store.currentRates)).toHaveLength(1);
    });

    it('does nothing when funding_rate is missing', () => {
      const store = useFundingStore();
      store.currentRates = { 'BTC/USDT': fakeRateBTC };

      store.updateRatesFromWS({ symbol: 'ETH/USDT' } as Record<string, unknown>);

      expect(Object.keys(store.currentRates)).toHaveLength(1);
    });

    it('does nothing when data is empty', () => {
      const store = useFundingStore();
      store.currentRates = { 'BTC/USDT': fakeRateBTC };

      store.updateRatesFromWS({} as Record<string, unknown>);

      expect(Object.keys(store.currentRates)).toHaveLength(1);
    });
  });
});

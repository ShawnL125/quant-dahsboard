import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFeesStore } from '@/stores/fees';
import { feesApi } from '@/api/fees';
import type { FeeSummary, FeeBreakdown, VipProgress, FeeDeviation, StrategyFeeReport } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/fees', () => ({
  feesApi: {
    getSummary: vi.fn(),
    getBreakdown: vi.fn(),
    getVipProgress: vi.fn(),
    getDeviation: vi.fn(),
    getStrategyReport: vi.fn(),
  },
}));

const mockedApi = vi.mocked(feesApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeSummary: FeeSummary[] = [
  { date: '2026-01-01', exchange: 'binance', account_id: 'main', total_fee: '10.5', trade_volume: '1000' },
];

const fakeBreakdown: FeeBreakdown = {
  maker_count: 50,
  taker_count: 30,
  maker_fee: '5.0',
  taker_fee: '3.0',
  maker_ratio: '0.6',
};

const fakeVipProgress: VipProgress = {
  current_tier: 'VIP0',
  rolling_volume_30d: '50000',
  next_tier: 'VIP1',
  volume_to_next: '50000',
  progress_pct: '50',
};

const fakeDeviation: FeeDeviation = {
  total_actual: '10.5',
  total_estimated: '10.0',
  deviation_bps: '5',
  trade_count: 100,
};

const fakeStrategyReport: StrategyFeeReport = {
  strategy_id: 's1',
  total_fee: '8.0',
  total_estimated: '7.5',
  trade_count: 45,
};

// ── Tests ────────────────────────────────────────────────────────────
describe('fees store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty summary', () => {
      const store = useFeesStore();
      expect(store.summary).toEqual([]);
    });

    it('has null breakdown', () => {
      const store = useFeesStore();
      expect(store.breakdown).toBeNull();
    });

    it('has null vipProgress', () => {
      const store = useFeesStore();
      expect(store.vipProgress).toBeNull();
    });

    it('has null deviation', () => {
      const store = useFeesStore();
      expect(store.deviation).toBeNull();
    });

    it('has null strategyReport', () => {
      const store = useFeesStore();
      expect(store.strategyReport).toBeNull();
    });

    it('has loading false and error null', () => {
      const store = useFeesStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchSummary ──────────────────────────────────────────────────
  describe('fetchSummary()', () => {
    it('sets summary on success', async () => {
      mockedApi.getSummary.mockResolvedValue({ data: fakeSummary, total: 1 });

      const store = useFeesStore();
      await store.fetchSummary();

      expect(store.summary).toEqual(fakeSummary);
    });

    it('sets summary to empty on failure', async () => {
      mockedApi.getSummary.mockRejectedValue(new Error('fail'));

      const store = useFeesStore();
      await store.fetchSummary();

      expect(store.summary).toEqual([]);
    });
  });

  // ── fetchBreakdown ────────────────────────────────────────────────
  describe('fetchBreakdown()', () => {
    it('sets breakdown on success', async () => {
      mockedApi.getBreakdown.mockResolvedValue({ data: fakeBreakdown });

      const store = useFeesStore();
      await store.fetchBreakdown();

      expect(store.breakdown).toEqual(fakeBreakdown);
    });

    it('sets breakdown to null on failure', async () => {
      mockedApi.getBreakdown.mockRejectedValue(new Error('fail'));

      const store = useFeesStore();
      await store.fetchBreakdown();

      expect(store.breakdown).toBeNull();
    });
  });

  // ── fetchVipProgress ──────────────────────────────────────────────
  describe('fetchVipProgress()', () => {
    it('sets vipProgress on success', async () => {
      mockedApi.getVipProgress.mockResolvedValue({ data: fakeVipProgress });

      const store = useFeesStore();
      await store.fetchVipProgress({ exchange: 'binance' });

      expect(store.vipProgress).toEqual(fakeVipProgress);
      expect(mockedApi.getVipProgress).toHaveBeenCalledWith({ exchange: 'binance' });
    });

    it('sets vipProgress to null on failure', async () => {
      mockedApi.getVipProgress.mockRejectedValue(new Error('fail'));

      const store = useFeesStore();
      await store.fetchVipProgress();

      expect(store.vipProgress).toBeNull();
    });
  });

  // ── fetchDeviation ────────────────────────────────────────────────
  describe('fetchDeviation()', () => {
    it('sets deviation on success', async () => {
      mockedApi.getDeviation.mockResolvedValue({ data: fakeDeviation });

      const store = useFeesStore();
      await store.fetchDeviation();

      expect(store.deviation).toEqual(fakeDeviation);
    });

    it('sets deviation to null on failure', async () => {
      mockedApi.getDeviation.mockRejectedValue(new Error('fail'));

      const store = useFeesStore();
      await store.fetchDeviation();

      expect(store.deviation).toBeNull();
    });
  });

  // ── fetchStrategyReport ───────────────────────────────────────────
  describe('fetchStrategyReport()', () => {
    it('sets strategyReport on success', async () => {
      mockedApi.getStrategyReport.mockResolvedValue({ data: fakeStrategyReport });

      const store = useFeesStore();
      await store.fetchStrategyReport({ strategy_id: 's1' });

      expect(store.strategyReport).toEqual(fakeStrategyReport);
      expect(mockedApi.getStrategyReport).toHaveBeenCalledWith({ strategy_id: 's1' });
    });

    it('sets strategyReport to null on failure', async () => {
      mockedApi.getStrategyReport.mockRejectedValue(new Error('fail'));

      const store = useFeesStore();
      await store.fetchStrategyReport();

      expect(store.strategyReport).toBeNull();
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('calls summary, breakdown, vipProgress, and deviation in parallel', async () => {
      mockedApi.getSummary.mockResolvedValue({ data: fakeSummary, total: 1 });
      mockedApi.getBreakdown.mockResolvedValue({ data: fakeBreakdown });
      mockedApi.getVipProgress.mockResolvedValue({ data: fakeVipProgress });
      mockedApi.getDeviation.mockResolvedValue({ data: fakeDeviation });

      const store = useFeesStore();
      await store.fetchAll({ exchange: 'binance' });

      expect(mockedApi.getSummary).toHaveBeenCalledWith({ exchange: 'binance' });
      expect(mockedApi.getBreakdown).toHaveBeenCalledWith({ exchange: 'binance' });
      expect(mockedApi.getVipProgress).toHaveBeenCalledWith({ exchange: 'binance' });
      expect(mockedApi.getDeviation).toHaveBeenCalledWith({ exchange: 'binance' });
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolveSummary!: (v: unknown) => void;
      mockedApi.getSummary.mockReturnValue(new Promise((r) => { resolveSummary = r; }) as any);
      mockedApi.getBreakdown.mockResolvedValue({ data: fakeBreakdown });
      mockedApi.getVipProgress.mockResolvedValue({ data: fakeVipProgress });
      mockedApi.getDeviation.mockResolvedValue({ data: fakeDeviation });

      const store = useFeesStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolveSummary({ data: [], total: 0 });
      await promise;

      expect(store.loading).toBe(false);
    });
  });
});

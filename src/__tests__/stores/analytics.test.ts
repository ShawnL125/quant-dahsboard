import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnalyticsStore } from '@/stores/analytics';
import { analyticsApi } from '@/api/analytics';
import type { AnalyticsSignal, RoundTrip, StrategyStatsSnapshot, ConsecutiveLossesResponse, SignalQualityResponse, AnalyticsConfigResponse } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getSignals: vi.fn(),
    getRoundTrips: vi.fn(),
    getRoundTrip: vi.fn(),
    getStrategyStats: vi.fn(),
    getStrategyStatsHistory: vi.fn(),
    getConsecutiveLosses: vi.fn(),
    getSignalQuality: vi.fn(),
    getConfig: vi.fn(),
  },
}));

const mockedAnalyticsApi = vi.mocked(analyticsApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeSignals: AnalyticsSignal[] = [
  { signal_id: 'sig-1', symbol: 'BTC/USDT', direction: 'long', strategy_id: 'strat-1' } as unknown as AnalyticsSignal,
];

const fakeRoundTrips: RoundTrip[] = [
  { trade_id: 'trade-1', symbol: 'BTC/USDT', side: 'buy', pnl: '500' } as unknown as RoundTrip,
];

const fakeStrategyStats: StrategyStatsSnapshot[] = [
  { strategy_id: 'strat-1', total_trades: 100 } as unknown as StrategyStatsSnapshot,
];

const fakeConsecutiveLosses: ConsecutiveLossesResponse = {
  current_streak: 3, max_streak: 5,
} as unknown as ConsecutiveLossesResponse;

const fakeSignalQuality: SignalQualityResponse = {
  total: 50, win_rate: 0.6,
} as unknown as SignalQualityResponse;

const fakeConfig: AnalyticsConfigResponse = {
  version: '1.0',
} as unknown as AnalyticsConfigResponse;

// ── Tests ────────────────────────────────────────────────────────────
describe('analytics store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty signals and zero total', () => {
      const store = useAnalyticsStore();
      expect(store.signals).toEqual([]);
      expect(store.signalsTotal).toBe(0);
    });

    it('has empty roundTrips and zero total', () => {
      const store = useAnalyticsStore();
      expect(store.roundTrips).toEqual([]);
      expect(store.roundTripsTotal).toBe(0);
    });

    it('has empty strategyStats', () => {
      const store = useAnalyticsStore();
      expect(store.strategyStats).toEqual([]);
    });

    it('has null consecutiveLosses', () => {
      const store = useAnalyticsStore();
      expect(store.consecutiveLosses).toBeNull();
    });

    it('has null signalQuality', () => {
      const store = useAnalyticsStore();
      expect(store.signalQuality).toBeNull();
    });

    it('has null selectedRoundTrip', () => {
      const store = useAnalyticsStore();
      expect(store.selectedRoundTrip).toBeNull();
    });

    it('has empty statsHistory', () => {
      const store = useAnalyticsStore();
      expect(store.statsHistory).toEqual([]);
    });

    it('has null config', () => {
      const store = useAnalyticsStore();
      expect(store.config).toBeNull();
    });

    it('has loading false and error null', () => {
      const store = useAnalyticsStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchSignals ──────────────────────────────────────────────────
  describe('fetchSignals()', () => {
    it('sets signals and signalsTotal on success', async () => {
      mockedAnalyticsApi.getSignals.mockResolvedValue({ signals: fakeSignals, total: 1 });

      const store = useAnalyticsStore();
      await store.fetchSignals();

      expect(store.signals).toEqual(fakeSignals);
      expect(store.signalsTotal).toBe(1);
    });

    it('sets error on failure', async () => {
      mockedAnalyticsApi.getSignals.mockRejectedValue(new Error('Server error'));

      const store = useAnalyticsStore();
      await store.fetchSignals();

      expect(store.error).toBe('Server error');
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedAnalyticsApi.getSignals.mockReturnValue(new Promise((r) => { resolve = r; }) as any);

      const store = useAnalyticsStore();
      const promise = store.fetchSignals();

      expect(store.loading).toBe(true);

      resolve({ signals: [], total: 0 });
      await promise;

      expect(store.loading).toBe(false);
    });

    it('passes params to API', async () => {
      mockedAnalyticsApi.getSignals.mockResolvedValue({ signals: [], total: 0 });

      const store = useAnalyticsStore();
      await store.fetchSignals({ symbol: 'BTC/USDT' });

      expect(mockedAnalyticsApi.getSignals).toHaveBeenCalledWith({ symbol: 'BTC/USDT' });
    });
  });

  // ── fetchRoundTrips ───────────────────────────────────────────────
  describe('fetchRoundTrips()', () => {
    it('sets roundTrips and roundTripsTotal on success', async () => {
      mockedAnalyticsApi.getRoundTrips.mockResolvedValue({ round_trips: fakeRoundTrips, total: 1 });

      const store = useAnalyticsStore();
      await store.fetchRoundTrips();

      expect(store.roundTrips).toEqual(fakeRoundTrips);
      expect(store.roundTripsTotal).toBe(1);
    });

    it('sets error on failure', async () => {
      mockedAnalyticsApi.getRoundTrips.mockRejectedValue(new Error('fail'));

      const store = useAnalyticsStore();
      await store.fetchRoundTrips();

      expect(store.error).toBe('fail');
    });
  });

  // ── fetchStrategyStats ────────────────────────────────────────────
  describe('fetchStrategyStats()', () => {
    it('sets strategyStats on success', async () => {
      mockedAnalyticsApi.getStrategyStats.mockResolvedValue({ snapshots: fakeStrategyStats });

      const store = useAnalyticsStore();
      await store.fetchStrategyStats('strat-1');

      expect(store.strategyStats).toEqual(fakeStrategyStats);
      expect(mockedAnalyticsApi.getStrategyStats).toHaveBeenCalledWith('strat-1');
    });

    it('sets error on failure', async () => {
      mockedAnalyticsApi.getStrategyStats.mockRejectedValue(new Error('fail'));

      const store = useAnalyticsStore();
      await store.fetchStrategyStats();

      expect(store.error).toBe('fail');
    });
  });

  // ── fetchConsecutiveLosses ────────────────────────────────────────
  describe('fetchConsecutiveLosses()', () => {
    it('sets consecutiveLosses on success', async () => {
      mockedAnalyticsApi.getConsecutiveLosses.mockResolvedValue(fakeConsecutiveLosses);

      const store = useAnalyticsStore();
      await store.fetchConsecutiveLosses('strat-1');

      expect(store.consecutiveLosses).toEqual(fakeConsecutiveLosses);
    });

    it('silently handles failure (optional endpoint)', async () => {
      mockedAnalyticsApi.getConsecutiveLosses.mockRejectedValue(new Error('fail'));

      const store = useAnalyticsStore();
      await store.fetchConsecutiveLosses();

      // consecutiveLosses stays null, no error set
      expect(store.consecutiveLosses).toBeNull();
      expect(store.error).toBeNull();
    });
  });

  // ── fetchSignalQuality ────────────────────────────────────────────
  describe('fetchSignalQuality()', () => {
    it('sets signalQuality on success', async () => {
      mockedAnalyticsApi.getSignalQuality.mockResolvedValue(fakeSignalQuality);

      const store = useAnalyticsStore();
      await store.fetchSignalQuality();

      expect(store.signalQuality).toEqual(fakeSignalQuality);
    });

    it('silently handles failure (optional endpoint)', async () => {
      mockedAnalyticsApi.getSignalQuality.mockRejectedValue(new Error('fail'));

      const store = useAnalyticsStore();
      await store.fetchSignalQuality();

      expect(store.signalQuality).toBeNull();
      expect(store.error).toBeNull();
    });
  });

  // ── fetchRoundTrip ────────────────────────────────────────────────
  describe('fetchRoundTrip()', () => {
    it('sets selectedRoundTrip on success', async () => {
      const fakeTrip = { trade_id: 'trade-1', symbol: 'BTC/USDT' } as unknown as RoundTrip;
      mockedAnalyticsApi.getRoundTrip.mockResolvedValue(fakeTrip);

      const store = useAnalyticsStore();
      await store.fetchRoundTrip('trade-1');

      expect(store.selectedRoundTrip).toEqual(fakeTrip);
      expect(mockedAnalyticsApi.getRoundTrip).toHaveBeenCalledWith('trade-1');
    });

    it('sets selectedRoundTrip to null on failure', async () => {
      const store = useAnalyticsStore();
      store.selectedRoundTrip = { trade_id: 'old' } as unknown as RoundTrip;

      mockedAnalyticsApi.getRoundTrip.mockRejectedValue(new Error('not found'));

      await store.fetchRoundTrip('missing');

      expect(store.selectedRoundTrip).toBeNull();
    });
  });

  // ── fetchStatsHistory ─────────────────────────────────────────────
  describe('fetchStatsHistory()', () => {
    it('sets statsHistory on success', async () => {
      const fakeHistory = [{ strategy_id: 'strat-1', date: '2026-01-01' }] as unknown as StrategyStatsSnapshot[];
      mockedAnalyticsApi.getStrategyStatsHistory.mockResolvedValue({ history: fakeHistory });

      const store = useAnalyticsStore();
      await store.fetchStatsHistory('strat-1');

      expect(store.statsHistory).toEqual(fakeHistory);
    });

    it('sets statsHistory to empty on failure', async () => {
      mockedAnalyticsApi.getStrategyStatsHistory.mockRejectedValue(new Error('fail'));

      const store = useAnalyticsStore();
      await store.fetchStatsHistory('strat-1');

      expect(store.statsHistory).toEqual([]);
    });
  });

  // ── fetchConfig ───────────────────────────────────────────────────
  describe('fetchConfig()', () => {
    it('sets config on success', async () => {
      mockedAnalyticsApi.getConfig.mockResolvedValue(fakeConfig);

      const store = useAnalyticsStore();
      await store.fetchConfig();

      expect(store.config).toEqual(fakeConfig);
    });

    it('sets config to null on failure', async () => {
      mockedAnalyticsApi.getConfig.mockRejectedValue(new Error('fail'));

      const store = useAnalyticsStore();
      await store.fetchConfig();

      expect(store.config).toBeNull();
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('calls fetchStrategyStats, fetchConsecutiveLosses, and fetchSignalQuality in parallel', async () => {
      mockedAnalyticsApi.getStrategyStats.mockResolvedValue({ snapshots: fakeStrategyStats });
      mockedAnalyticsApi.getConsecutiveLosses.mockResolvedValue(fakeConsecutiveLosses);
      mockedAnalyticsApi.getSignalQuality.mockResolvedValue(fakeSignalQuality);

      const store = useAnalyticsStore();
      await store.fetchAll();

      expect(store.strategyStats).toEqual(fakeStrategyStats);
      expect(store.consecutiveLosses).toEqual(fakeConsecutiveLosses);
      expect(store.signalQuality).toEqual(fakeSignalQuality);
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedAnalyticsApi.getStrategyStats.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedAnalyticsApi.getConsecutiveLosses.mockResolvedValue(fakeConsecutiveLosses);
      mockedAnalyticsApi.getSignalQuality.mockResolvedValue(fakeSignalQuality);

      const store = useAnalyticsStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolve({ snapshots: [] });
      await promise;

      expect(store.loading).toBe(false);
    });
  });
});

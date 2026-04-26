import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAttributionStore } from '@/stores/attribution';
import { attributionApi } from '@/api/attribution';
import type { AttributionReport, TradeContribution, RollforwardBucket, RegimeAttribution, BenchmarkComparison } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/attribution', () => ({
  attributionApi: {
    computeReport: vi.fn(),
    listReports: vi.fn(),
    getReport: vi.fn(),
    deleteReport: vi.fn(),
    getContributions: vi.fn(),
    getRollforward: vi.fn(),
    getRegime: vi.fn(),
    compareBenchmark: vi.fn(),
  },
}));

const mockedApi = vi.mocked(attributionApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeReport: AttributionReport = {
  report_id: 'r1',
  strategy_id: 's1',
  start_time: '2026-01-01',
  end_time: '2026-02-01',
  total_pnl: '500',
  total_trades: 100,
  winning_trades: 60,
  losing_trades: 40,
  win_rate: '0.6',
  profit_factor: '1.5',
  trading_pnl: '550',
  fee_cost: '30',
  funding_cost: '20',
  by_symbol: {},
  by_side: {},
  by_hour: {},
  by_day: {},
  by_regime: {},
  entry_quality_score: '0.8',
  exit_quality_score: '0.7',
  strategy_return_pct: '5.0',
  benchmark_return_pct: '3.0',
  alpha: '2.0',
  top_winner_concentration: '0.3',
  top_loser_concentration: '0.2',
  top_winners: [],
  top_losers: [],
  metadata: {},
  created_at: '2026-01-15',
};

const fakeContribution: TradeContribution = {
  trade_id: 't1',
  symbol: 'BTC/USDT',
  side: 'BUY',
  entry_time: null,
  exit_time: null,
  net_pnl: '50',
  holding_duration_sec: 3600,
  market_regime: 'trending',
  entry_score: '0.8',
  exit_score: '0.7',
};

const fakeRollforward: RollforwardBucket = {
  bucket_start: '2026-01-01',
  bucket_end: '2026-01-02',
  trading_pnl: '100',
  fee_cost: '5',
  funding_cost: '3',
  net_change: '92',
  cumulative_equity: '1092',
};

const fakeRegime: RegimeAttribution = {
  regime: 'trending',
  start_time: '2026-01-01',
  end_time: '2026-01-15',
  avg_volatility: '0.15',
  trend_direction: 'UP',
};

const fakeBenchmark: BenchmarkComparison = {
  strategy_return_pct: '5.0',
  benchmark_return_pct: '3.0',
  alpha: '2.0',
  total_pnl: '500',
  total_trades: 100,
};

// ── Tests ────────────────────────────────────────────────────────────
describe('attribution store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty reports', () => {
      const store = useAttributionStore();
      expect(store.reports).toEqual([]);
    });

    it('has null selectedReport', () => {
      const store = useAttributionStore();
      expect(store.selectedReport).toBeNull();
    });

    it('has empty contributions', () => {
      const store = useAttributionStore();
      expect(store.contributions).toEqual([]);
    });

    it('has empty rollforward', () => {
      const store = useAttributionStore();
      expect(store.rollforward).toEqual([]);
    });

    it('has empty regime', () => {
      const store = useAttributionStore();
      expect(store.regime).toEqual([]);
    });

    it('has null benchmark', () => {
      const store = useAttributionStore();
      expect(store.benchmark).toBeNull();
    });

    it('has loading false and error null', () => {
      const store = useAttributionStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── computeReport ─────────────────────────────────────────────────
  describe('computeReport()', () => {
    it('sets selectedReport on success', async () => {
      mockedApi.computeReport.mockResolvedValue({ data: fakeReport });

      const store = useAttributionStore();
      await store.computeReport({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.selectedReport).toEqual(fakeReport);
      expect(store.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedApi.computeReport.mockRejectedValue(new Error('compute fail'));

      const store = useAttributionStore();
      await store.computeReport({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.error).toBe('compute fail');
      expect(store.loading).toBe(false);
    });
  });

  // ── fetchReports ──────────────────────────────────────────────────
  describe('fetchReports()', () => {
    it('sets reports on success', async () => {
      mockedApi.listReports.mockResolvedValue({ data: [fakeReport], total: 1 });

      const store = useAttributionStore();
      await store.fetchReports();

      expect(store.reports).toEqual([fakeReport]);
    });

    it('sets reports to empty on failure', async () => {
      mockedApi.listReports.mockRejectedValue(new Error('fail'));

      const store = useAttributionStore();
      await store.fetchReports();

      expect(store.reports).toEqual([]);
    });
  });

  // ── fetchReport ───────────────────────────────────────────────────
  describe('fetchReport()', () => {
    it('sets selectedReport on success', async () => {
      mockedApi.getReport.mockResolvedValue({ data: fakeReport });

      const store = useAttributionStore();
      await store.fetchReport('r1');

      expect(store.selectedReport).toEqual(fakeReport);
      expect(mockedApi.getReport).toHaveBeenCalledWith('r1');
    });

    it('sets selectedReport to null on failure', async () => {
      mockedApi.getReport.mockRejectedValue(new Error('fail'));

      const store = useAttributionStore();
      await store.fetchReport('r1');

      expect(store.selectedReport).toBeNull();
    });
  });

  // ── deleteReport ──────────────────────────────────────────────────
  describe('deleteReport()', () => {
    it('removes report from list', async () => {
      mockedApi.deleteReport.mockResolvedValue({ data: { report_id: 'r1', deleted: true } });

      const store = useAttributionStore();
      store.reports = [fakeReport, { ...fakeReport, report_id: 'r2' }];
      await store.deleteReport('r1');

      expect(store.reports).toHaveLength(1);
      expect(store.reports[0].report_id).toBe('r2');
      expect(mockedApi.deleteReport).toHaveBeenCalledWith('r1');
    });

    it('sets error on failure', async () => {
      mockedApi.deleteReport.mockRejectedValue(new Error('delete fail'));

      const store = useAttributionStore();
      store.reports = [fakeReport];
      await store.deleteReport('r1');

      expect(store.error).toBe('delete fail');
    });
  });

  // ── fetchContributions ────────────────────────────────────────────
  describe('fetchContributions()', () => {
    it('sets contributions on success', async () => {
      mockedApi.getContributions.mockResolvedValue({ data: [fakeContribution] });

      const store = useAttributionStore();
      await store.fetchContributions({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.contributions).toEqual([fakeContribution]);
    });

    it('sets contributions to empty on failure', async () => {
      mockedApi.getContributions.mockRejectedValue(new Error('fail'));

      const store = useAttributionStore();
      await store.fetchContributions({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.contributions).toEqual([]);
    });
  });

  // ── fetchRollforward ──────────────────────────────────────────────
  describe('fetchRollforward()', () => {
    it('sets rollforward on success', async () => {
      mockedApi.getRollforward.mockResolvedValue({ data: [fakeRollforward] });

      const store = useAttributionStore();
      await store.fetchRollforward({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.rollforward).toEqual([fakeRollforward]);
    });

    it('sets rollforward to empty on failure', async () => {
      mockedApi.getRollforward.mockRejectedValue(new Error('fail'));

      const store = useAttributionStore();
      await store.fetchRollforward({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.rollforward).toEqual([]);
    });
  });

  // ── fetchRegime ───────────────────────────────────────────────────
  describe('fetchRegime()', () => {
    it('sets regime on success', async () => {
      mockedApi.getRegime.mockResolvedValue({ data: [fakeRegime] });

      const store = useAttributionStore();
      await store.fetchRegime({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.regime).toEqual([fakeRegime]);
    });

    it('sets regime to empty on failure', async () => {
      mockedApi.getRegime.mockRejectedValue(new Error('fail'));

      const store = useAttributionStore();
      await store.fetchRegime({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.regime).toEqual([]);
    });
  });

  // ── fetchBenchmark ────────────────────────────────────────────────
  describe('fetchBenchmark()', () => {
    it('sets benchmark on success', async () => {
      mockedApi.compareBenchmark.mockResolvedValue({ data: fakeBenchmark });

      const store = useAttributionStore();
      await store.fetchBenchmark({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.benchmark).toEqual(fakeBenchmark);
    });

    it('sets benchmark to null on failure', async () => {
      mockedApi.compareBenchmark.mockRejectedValue(new Error('fail'));

      const store = useAttributionStore();
      await store.fetchBenchmark({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });

      expect(store.benchmark).toBeNull();
    });
  });
});

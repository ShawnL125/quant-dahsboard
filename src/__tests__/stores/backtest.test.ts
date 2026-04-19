import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBacktestStore } from '@/stores/backtest';
import { backtestApi } from '@/api/backtest';
import type { BacktestHistoryItem, BacktestResult, BacktestRunRecord, BacktestEquityPoint, BacktestTrade } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/backtest', () => ({
  backtestApi: {
    runBacktest: vi.fn(),
    getStatus: vi.fn(),
    getResult: vi.fn(),
    getHistory: vi.fn(),
    getRuns: vi.fn(),
    getRun: vi.fn(),
    getEquity: vi.fn(),
    getTrades: vi.fn(),
    compare: vi.fn(),
    importResults: vi.fn(),
  },
}));

const mockedBacktestApi = vi.mocked(backtestApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeHistory: BacktestHistoryItem[] = [
  { task_id: 'task-1', status: 'COMPLETED', created_at: '2026-01-01T00:00:00Z', total_return_pct: '12.5', sharpe_ratio: '1.8' },
];

const fakeRuns: BacktestRunRecord[] = [
  {
    run_id: 'run-1',
    symbol: 'BTC/USDT',
    exchange: 'binance',
    timeframe: '1h',
    start_time: '2025-01-01T00:00:00Z',
    end_time: '2025-12-31T00:00:00Z',
    group_id: 'grp-1',
    strategy_ids: ['strat-1'],
    initial_balance: '10000',
    total_return_pct: '12.5',
    sharpe_ratio: '1.8',
    calmar_ratio: '2.1',
    max_drawdown_pct: '8.0',
    win_rate: '55.0',
    total_trades: 120,
    status: 'COMPLETED',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const fakeResult: BacktestResult = {
  group_id: 'grp-1',
  total_return_pct: '12.5',
  sharpe_ratio: '1.8',
  calmar_ratio: '2.1',
  max_drawdown_pct: '8.0',
  win_rate: '55.0',
  total_trades: 120,
};

const fakeEquity: BacktestEquityPoint[] = [
  { run_id: 'run-1', timestamp: '2025-01-01T00:00:00Z', equity: '10000' },
  { run_id: 'run-1', timestamp: '2025-06-01T00:00:00Z', equity: '11250' },
];

const fakeTrades: BacktestTrade[] = [
  {
    run_id: 'run-1',
    symbol: 'BTC/USDT',
    exchange: 'binance',
    side: 'buy',
    entry_time: '2025-01-15T10:00:00Z',
    exit_time: '2025-01-20T14:00:00Z',
    entry_price: '40000.00',
    exit_price: '45000.00',
    quantity: '0.1',
    pnl: '500.00',
  },
];

// ── Tests ────────────────────────────────────────────────────────────
describe('backtest store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty history', () => {
      const store = useBacktestStore();
      expect(store.history).toEqual([]);
    });

    it('has empty runs', () => {
      const store = useBacktestStore();
      expect(store.runs).toEqual([]);
    });

    it('has null currentResult', () => {
      const store = useBacktestStore();
      expect(store.currentResult).toBeNull();
    });

    it('has null currentRun', () => {
      const store = useBacktestStore();
      expect(store.currentRun).toBeNull();
    });

    it('has empty currentEquity and currentTrades', () => {
      const store = useBacktestStore();
      expect(store.currentEquity).toEqual([]);
      expect(store.currentTrades).toEqual([]);
    });

    it('has null currentTaskId', () => {
      const store = useBacktestStore();
      expect(store.currentTaskId).toBeNull();
    });

    it('has empty taskStatus', () => {
      const store = useBacktestStore();
      expect(store.taskStatus).toBe('');
    });

    it('has loading false and error null', () => {
      const store = useBacktestStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchHistory ─────────────────────────────────────────────────
  describe('fetchHistory()', () => {
    it('sets history on success', async () => {
      mockedBacktestApi.getHistory.mockResolvedValue(fakeHistory);

      const store = useBacktestStore();
      await store.fetchHistory();

      expect(store.history).toEqual(fakeHistory);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedBacktestApi.getHistory.mockReturnValue(new Promise((r) => { resolve = r; }) as any);

      const store = useBacktestStore();
      const promise = store.fetchHistory();

      expect(store.loading).toBe(true);

      resolve(fakeHistory);
      await promise;

      expect(store.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedBacktestApi.getHistory.mockRejectedValue(new Error('Server error'));

      const store = useBacktestStore();
      await store.fetchHistory();

      expect(store.error).toBe('Server error');
      expect(store.loading).toBe(false);
    });

    it('handles non-Error rejection in catch', async () => {
      mockedBacktestApi.getHistory.mockRejectedValue('string error');

      const store = useBacktestStore();
      await store.fetchHistory();

      expect(store.error).toBe('string error');
      expect(store.loading).toBe(false);
    });
  });

  // ── fetchRuns ────────────────────────────────────────────────────
  describe('fetchRuns()', () => {
    it('sets runs on success', async () => {
      mockedBacktestApi.getRuns.mockResolvedValue(fakeRuns);

      const store = useBacktestStore();
      await store.fetchRuns();

      expect(store.runs).toEqual(fakeRuns);
    });

    it('sets error on failure', async () => {
      mockedBacktestApi.getRuns.mockRejectedValue(new Error('timeout'));

      const store = useBacktestStore();
      await store.fetchRuns();

      expect(store.error).toBe('timeout');
    });
  });

  // ── fetchRunDetails ──────────────────────────────────────────────
  describe('fetchRunDetails()', () => {
    it('fetches run, equity, and trades in parallel', async () => {
      mockedBacktestApi.getRun.mockResolvedValue(fakeRuns[0]);
      mockedBacktestApi.getEquity.mockResolvedValue(fakeEquity);
      mockedBacktestApi.getTrades.mockResolvedValue(fakeTrades);

      const store = useBacktestStore();
      await store.fetchRunDetails('run-1');

      expect(mockedBacktestApi.getRun).toHaveBeenCalledWith('run-1');
      expect(mockedBacktestApi.getEquity).toHaveBeenCalledWith('run-1');
      expect(mockedBacktestApi.getTrades).toHaveBeenCalledWith('run-1');

      expect(store.currentRun).toEqual(fakeRuns[0]);
      expect(store.currentEquity).toEqual(fakeEquity);
      expect(store.currentTrades).toEqual(fakeTrades);
      expect(store.currentTaskId).toBe('run-1');
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedBacktestApi.getRun.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedBacktestApi.getEquity.mockResolvedValue([]);
      mockedBacktestApi.getTrades.mockResolvedValue([]);

      const store = useBacktestStore();
      const promise = store.fetchRunDetails('run-1');

      expect(store.loading).toBe(true);

      resolve(fakeRuns[0]);
      await promise;

      expect(store.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedBacktestApi.getRun.mockRejectedValue(new Error('not found'));

      const store = useBacktestStore();
      await store.fetchRunDetails('run-999');

      expect(store.error).toBe('not found');
      expect(store.loading).toBe(false);
    });
  });

  // ── runBacktest ──────────────────────────────────────────────────
  describe('runBacktest()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calls API, sets currentTaskId, starts polling', async () => {
      // Use a deferred status so we can observe PENDING state before the poll resolves
      let resolveStatus!: (v: unknown) => void;
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-new' });
      mockedBacktestApi.getStatus.mockReturnValue(new Promise((r) => { resolveStatus = r; }) as any);
      mockedBacktestApi.getResult.mockResolvedValue(fakeResult);
      mockedBacktestApi.getHistory.mockResolvedValue(fakeHistory);

      const store = useBacktestStore();
      await store.runBacktest({ symbol: 'BTC/USDT' });

      expect(mockedBacktestApi.runBacktest).toHaveBeenCalledWith({ symbol: 'BTC/USDT' });
      expect(store.currentTaskId).toBe('task-new');
      expect(store.taskStatus).toBe('PENDING');

      // Now resolve the status check as COMPLETED
      resolveStatus({ status: 'COMPLETED' });
      // Flush microtasks so the poll continuation runs
      await vi.advanceTimersByTimeAsync(0);

      expect(store.currentResult).toEqual(fakeResult);
      expect(store.loading).toBe(false);
    });

    it('sets error on API failure', async () => {
      mockedBacktestApi.runBacktest.mockRejectedValue(new Error('bad request'));

      const store = useBacktestStore();
      await store.runBacktest({ symbol: 'BAD' });

      expect(store.error).toBe('bad request');
      expect(store.loading).toBe(false);
    });
  });

  // ── pollStatus ───────────────────────────────────────────────────
  describe('pollStatus()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls until COMPLETED, then fetches result', async () => {
      mockedBacktestApi.getStatus
        .mockResolvedValueOnce({ status: 'PENDING' })
        .mockResolvedValueOnce({ status: 'RUNNING' })
        .mockResolvedValueOnce({ status: 'COMPLETED' });
      mockedBacktestApi.getResult.mockResolvedValue(fakeResult);
      mockedBacktestApi.getHistory.mockResolvedValue(fakeHistory);

      const store = useBacktestStore();

      // Use runBacktest to kick off polling
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-poll' });
      await store.runBacktest();
      // The initial poll() is called synchronously, so advance 0 for first poll
      await vi.advanceTimersByTimeAsync(0);
      // First poll returned PENDING, so it scheduled another after 2s
      expect(store.taskStatus).toBe('PENDING');

      await vi.advanceTimersByTimeAsync(2000);
      // Second poll returned RUNNING, schedules another
      expect(store.taskStatus).toBe('RUNNING');

      await vi.advanceTimersByTimeAsync(2000);
      // Third poll returned COMPLETED, fetches result
      expect(store.taskStatus).toBe('COMPLETED');
      expect(store.currentResult).toEqual(fakeResult);
      expect(store.loading).toBe(false);
    });

    it('stops polling on FAILED', async () => {
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-fail' });
      mockedBacktestApi.getStatus.mockResolvedValue({ status: 'FAILED' });

      const store = useBacktestStore();
      await store.runBacktest();

      await vi.advanceTimersByTimeAsync(0);

      expect(store.taskStatus).toBe('FAILED');
      expect(store.error).toBe('Backtest failed');
      expect(store.loading).toBe(false);
    });

    it('handles DONE status as completed', async () => {
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-done' });
      mockedBacktestApi.getStatus.mockResolvedValue({ status: 'DONE' });
      mockedBacktestApi.getResult.mockResolvedValue(fakeResult);
      mockedBacktestApi.getHistory.mockResolvedValue(fakeHistory);

      const store = useBacktestStore();
      await store.runBacktest();

      await vi.advanceTimersByTimeAsync(0);

      expect(store.taskStatus).toBe('DONE');
      expect(store.currentResult).toEqual(fakeResult);
      expect(store.loading).toBe(false);
    });

    it('uses state field as fallback for status', async () => {
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-state' });
      mockedBacktestApi.getStatus
        .mockResolvedValueOnce({ state: 'PENDING' })
        .mockResolvedValueOnce({ state: 'COMPLETED' });
      mockedBacktestApi.getResult.mockResolvedValue(fakeResult);
      mockedBacktestApi.getHistory.mockResolvedValue(fakeHistory);

      const store = useBacktestStore();
      await store.runBacktest();

      await vi.advanceTimersByTimeAsync(0);
      expect(store.taskStatus).toBe('PENDING');

      await vi.advanceTimersByTimeAsync(2000);
      expect(store.taskStatus).toBe('COMPLETED');
      expect(store.currentResult).toEqual(fakeResult);
    });

    it('stops polling on getStatus error', async () => {
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-err' });
      mockedBacktestApi.getStatus.mockRejectedValue(new Error('network'));

      const store = useBacktestStore();
      await store.runBacktest();

      await vi.advanceTimersByTimeAsync(0);

      expect(store.loading).toBe(false);
    });

    it('treats UNKNOWN status as a terminal polling failure', async () => {
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-unk' });
      mockedBacktestApi.getStatus.mockResolvedValue({}); // no status, no state

      const store = useBacktestStore();
      await store.runBacktest();

      await vi.advanceTimersByTimeAsync(0);

      expect(store.taskStatus).toBe('UNKNOWN');
      expect(store.error).toBe('Backtest status unknown');
      expect(store.loading).toBe(false);

      await vi.advanceTimersByTimeAsync(10000);
      expect(mockedBacktestApi.getStatus).toHaveBeenCalledTimes(1);
    });

    it('retries polling when status is RUNNING', async () => {
      mockedBacktestApi.runBacktest.mockResolvedValue({ task_id: 'task-run' });
      mockedBacktestApi.getStatus
        .mockResolvedValueOnce({ status: 'RUNNING' })
        .mockResolvedValueOnce({ status: 'COMPLETED' });
      mockedBacktestApi.getResult.mockResolvedValue(fakeResult);
      mockedBacktestApi.getHistory.mockResolvedValue(fakeHistory);

      const store = useBacktestStore();
      await store.runBacktest();

      await vi.advanceTimersByTimeAsync(0);
      expect(store.taskStatus).toBe('RUNNING');

      await vi.advanceTimersByTimeAsync(2000);
      expect(store.taskStatus).toBe('COMPLETED');
      expect(store.loading).toBe(false);
    });
  });

  // ── fetchResult ──────────────────────────────────────────────────
  describe('fetchResult()', () => {
    it('sets currentResult and currentTaskId', async () => {
      mockedBacktestApi.getResult.mockResolvedValue(fakeResult);

      const store = useBacktestStore();
      await store.fetchResult('task-1');

      expect(store.currentResult).toEqual(fakeResult);
      expect(store.currentTaskId).toBe('task-1');
    });

    it('sets error on failure', async () => {
      mockedBacktestApi.getResult.mockRejectedValue(new Error('not found'));

      const store = useBacktestStore();
      await store.fetchResult('task-missing');

      expect(store.error).toBe('not found');
    });
  });
});

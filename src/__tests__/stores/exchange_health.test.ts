import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExchangeHealthStore } from '@/stores/exchange_health';
import { exchangeHealthApi } from '@/api/exchange_health';
import type { ExchangeHealthStatus, HealthCheckResult, FailoverAction } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/exchange_health', () => ({
  exchangeHealthApi: {
    getStatus: vi.fn(),
    getFailovers: vi.fn(),
    getHistory: vi.fn(),
    triggerCheck: vi.fn(),
  },
}));

const mockedApi = vi.mocked(exchangeHealthApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeStatus: ExchangeHealthStatus = {
  exchange: 'binance',
  is_healthy: true,
  latency_ms: 42,
  error_rate_pct: 0.5,
  last_check_at: '2026-01-01T00:00:00Z',
  consecutive_failures: 0,
};

const fakeFailover: FailoverAction = {
  action_id: 'fail-1',
  from_exchange: 'binance',
  to_exchange: 'kraken',
  reason: 'high latency',
  triggered_at: '2026-01-01T00:00:00Z',
};

const fakeCheckResult: HealthCheckResult = {
  exchange: 'binance',
  latency_ms: 30,
  success: true,
  error_message: null,
  checked_at: '2026-01-01T00:00:00Z',
};

// ── Tests ────────────────────────────────────────────────────────────
describe('exchangeHealth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty statuses', () => {
      const store = useExchangeHealthStore();
      expect(store.statuses).toEqual({});
    });

    it('has empty failovers', () => {
      const store = useExchangeHealthStore();
      expect(store.failovers).toEqual([]);
    });

    it('has empty history', () => {
      const store = useExchangeHealthStore();
      expect(store.history).toEqual([]);
    });

    it('is not loading', () => {
      const store = useExchangeHealthStore();
      expect(store.loading).toBe(false);
    });

    it('has null error', () => {
      const store = useExchangeHealthStore();
      expect(store.error).toBeNull();
    });
  });

  // ── fetchStatus ───────────────────────────────────────────────────
  describe('fetchStatus()', () => {
    it('sets statuses on success', async () => {
      mockedApi.getStatus.mockResolvedValue({ data: { binance: fakeStatus } });
      const store = useExchangeHealthStore();
      await store.fetchStatus();
      expect(store.statuses).toEqual({ binance: fakeStatus });
    });

    it('clears statuses on failure', async () => {
      mockedApi.getStatus.mockRejectedValue(new Error('fail'));
      const store = useExchangeHealthStore();
      store.statuses = { binance: fakeStatus };
      await store.fetchStatus();
      expect(store.statuses).toEqual({});
    });
  });

  // ── fetchFailovers ────────────────────────────────────────────────
  describe('fetchFailovers()', () => {
    it('sets failovers on success', async () => {
      mockedApi.getFailovers.mockResolvedValue({ data: [fakeFailover] });
      const store = useExchangeHealthStore();
      await store.fetchFailovers();
      expect(store.failovers).toEqual([fakeFailover]);
    });

    it('clears failovers on failure', async () => {
      mockedApi.getFailovers.mockRejectedValue(new Error('fail'));
      const store = useExchangeHealthStore();
      store.failovers = [fakeFailover];
      await store.fetchFailovers();
      expect(store.failovers).toEqual([]);
    });

    it('passes limit parameter', async () => {
      mockedApi.getFailovers.mockResolvedValue({ data: [] });
      const store = useExchangeHealthStore();
      await store.fetchFailovers(10);
      expect(mockedApi.getFailovers).toHaveBeenCalledWith(10);
    });
  });

  // ── fetchHistory ──────────────────────────────────────────────────
  describe('fetchHistory()', () => {
    it('sets history on success', async () => {
      mockedApi.getHistory.mockResolvedValue({ data: [fakeCheckResult] });
      const store = useExchangeHealthStore();
      await store.fetchHistory('binance');
      expect(store.history).toEqual([fakeCheckResult]);
    });

    it('clears history on failure', async () => {
      mockedApi.getHistory.mockRejectedValue(new Error('fail'));
      const store = useExchangeHealthStore();
      store.history = [fakeCheckResult];
      await store.fetchHistory('binance');
      expect(store.history).toEqual([]);
    });

    it('passes exchange and limit parameters', async () => {
      mockedApi.getHistory.mockResolvedValue({ data: [] });
      const store = useExchangeHealthStore();
      await store.fetchHistory('kraken', 25);
      expect(mockedApi.getHistory).toHaveBeenCalledWith('kraken', 25);
    });
  });

  // ── triggerCheck ──────────────────────────────────────────────────
  describe('triggerCheck()', () => {
    it('sets loading during check and refreshes status on success', async () => {
      mockedApi.triggerCheck.mockResolvedValue({ data: fakeCheckResult });
      mockedApi.getStatus.mockResolvedValue({ data: { binance: fakeStatus } });
      const store = useExchangeHealthStore();

      const promise = store.triggerCheck('binance');
      expect(store.loading).toBe(true);

      const result = await promise;
      expect(store.loading).toBe(false);
      expect(result).toEqual({ data: fakeCheckResult });
      expect(mockedApi.getStatus).toHaveBeenCalled();
    });

    it('sets error and rethrows on failure', async () => {
      mockedApi.triggerCheck.mockRejectedValue(new Error('check failed'));
      const store = useExchangeHealthStore();

      await expect(store.triggerCheck('binance')).rejects.toThrow('check failed');
      expect(store.error).toBe('check failed');
      expect(store.loading).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWarmupStore } from '@/stores/warmup';
import { warmupApi } from '@/api/warmup';
import type { WarmupStatus, WarmupResult } from '@/types';

vi.mock('@/api/warmup', () => ({
  warmupApi: {
    getStatus: vi.fn(),
    getResults: vi.fn(),
  },
}));

const mockedApi = vi.mocked(warmupApi);

const fakeStatus: WarmupStatus = { running: true, progress: 0.5 };
const fakeResults: WarmupResult[] = [
  {
    symbol: 'BTC/USDT',
    timeframe: '1h',
    state: 'loaded',
    source: 'db',
    requested_count: 500,
    loaded_count: 500,
    duration_seconds: 1.2,
    timestamp: '2026-04-26T00:00:00Z',
    error: null,
  },
];

describe('warmup store', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('initial state', () => {
    it('has null status', () => {
      const store = useWarmupStore();
      expect(store.status).toBeNull();
    });
    it('has empty results', () => {
      const store = useWarmupStore();
      expect(store.results).toEqual([]);
    });
    it('has loading false and error null', () => {
      const store = useWarmupStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchStatus()', () => {
    it('sets status on success', async () => {
      mockedApi.getStatus.mockResolvedValue({ data: fakeStatus });
      const store = useWarmupStore();
      await store.fetchStatus();
      expect(store.status).toEqual(fakeStatus);
    });
    it('sets status to null on failure', async () => {
      mockedApi.getStatus.mockRejectedValue(new Error('fail'));
      const store = useWarmupStore();
      await store.fetchStatus();
      expect(store.status).toBeNull();
    });
  });

  describe('fetchResults()', () => {
    it('sets results on success', async () => {
      mockedApi.getResults.mockResolvedValue({ data: fakeResults });
      const store = useWarmupStore();
      await store.fetchResults();
      expect(store.results).toEqual(fakeResults);
    });
    it('sets results to empty array on failure', async () => {
      mockedApi.getResults.mockRejectedValue(new Error('fail'));
      const store = useWarmupStore();
      await store.fetchResults();
      expect(store.results).toEqual([]);
    });
    it('passes params to API', async () => {
      mockedApi.getResults.mockResolvedValue({ data: fakeResults });
      const store = useWarmupStore();
      await store.fetchResults({ symbol: 'BTC/USDT', timeframe: '1h' });
      expect(mockedApi.getResults).toHaveBeenCalledWith({ symbol: 'BTC/USDT', timeframe: '1h' });
    });
  });
});

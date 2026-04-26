import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFeaturesStore } from '@/stores/features';
import { featuresApi } from '@/api/features';
import type { FeatureDefinition, FeatureValue } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/features', () => ({
  featuresApi: {
    registerDefinition: vi.fn(),
    listDefinitions: vi.fn(),
    getDefinition: vi.fn(),
    deleteDefinition: vi.fn(),
    queryValues: vi.fn(),
    getValue: vi.fn(),
    precompute: vi.fn(),
    getStatus: vi.fn(),
  },
}));

const mockedApi = vi.mocked(featuresApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeDefinition: FeatureDefinition = {
  name: 'rsi_14',
  feature_type: 'indicator',
  source: 'ta',
  min_periods: 14,
  output_keys: ['rsi'],
  params: { period: 14 },
  description: 'Relative Strength Index',
};

const fakeValue: FeatureValue = {
  symbol: 'BTC/USDT',
  timeframe: '1h',
  feature_name: 'rsi_14',
  timestamp: '2026-01-01T00:00:00Z',
  values: { rsi: 65.3 },
  candle_count: 100,
};

// ── Tests ────────────────────────────────────────────────────────────
describe('features store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty definitions', () => {
      const store = useFeaturesStore();
      expect(store.definitions).toEqual([]);
    });

    it('has empty values', () => {
      const store = useFeaturesStore();
      expect(store.values).toEqual([]);
    });

    it('has null status', () => {
      const store = useFeaturesStore();
      expect(store.status).toBeNull();
    });

    it('is not loading', () => {
      const store = useFeaturesStore();
      expect(store.loading).toBe(false);
    });

    it('has null error', () => {
      const store = useFeaturesStore();
      expect(store.error).toBeNull();
    });
  });

  // ── fetchDefinitions ──────────────────────────────────────────────
  describe('fetchDefinitions()', () => {
    it('sets definitions on success', async () => {
      mockedApi.listDefinitions.mockResolvedValue({ data: [fakeDefinition] });
      const store = useFeaturesStore();
      await store.fetchDefinitions();
      expect(store.definitions).toEqual([fakeDefinition]);
    });

    it('clears definitions on failure', async () => {
      mockedApi.listDefinitions.mockRejectedValue(new Error('fail'));
      const store = useFeaturesStore();
      store.definitions = [fakeDefinition];
      await store.fetchDefinitions();
      expect(store.definitions).toEqual([]);
    });

    it('passes params to API', async () => {
      mockedApi.listDefinitions.mockResolvedValue({ data: [] });
      const store = useFeaturesStore();
      await store.fetchDefinitions({ feature_type: 'indicator' });
      expect(mockedApi.listDefinitions).toHaveBeenCalledWith({ feature_type: 'indicator' });
    });
  });

  // ── fetchValues ───────────────────────────────────────────────────
  describe('fetchValues()', () => {
    it('sets values on success', async () => {
      mockedApi.queryValues.mockResolvedValue({ data: [fakeValue] });
      const store = useFeaturesStore();
      await store.fetchValues();
      expect(store.values).toEqual([fakeValue]);
    });

    it('clears values on failure', async () => {
      mockedApi.queryValues.mockRejectedValue(new Error('fail'));
      const store = useFeaturesStore();
      store.values = [fakeValue];
      await store.fetchValues();
      expect(store.values).toEqual([]);
    });

    it('passes params to API', async () => {
      mockedApi.queryValues.mockResolvedValue({ data: [] });
      const store = useFeaturesStore();
      await store.fetchValues({ symbol: 'BTC/USDT', limit: 10 });
      expect(mockedApi.queryValues).toHaveBeenCalledWith({ symbol: 'BTC/USDT', limit: 10 });
    });
  });

  // ── registerDefinition ────────────────────────────────────────────
  describe('registerDefinition()', () => {
    it('registers and refreshes definitions on success', async () => {
      mockedApi.registerDefinition.mockResolvedValue({ data: fakeDefinition });
      mockedApi.listDefinitions.mockResolvedValue({ data: [fakeDefinition] });
      const store = useFeaturesStore();

      const result = await store.registerDefinition({ name: 'rsi_14' });
      expect(result).toEqual({ data: fakeDefinition });
      expect(mockedApi.listDefinitions).toHaveBeenCalled();
    });

    it('sets error and rethrows on failure', async () => {
      mockedApi.registerDefinition.mockRejectedValue(new Error('duplicate'));
      const store = useFeaturesStore();

      await expect(store.registerDefinition({ name: 'rsi_14' })).rejects.toThrow('duplicate');
      expect(store.error).toBe('duplicate');
    });
  });

  // ── deleteDefinition ──────────────────────────────────────────────
  describe('deleteDefinition()', () => {
    it('removes definition from list on success', async () => {
      mockedApi.deleteDefinition.mockResolvedValue({ data: { removed: true, name: 'rsi_14' } });
      const store = useFeaturesStore();
      store.definitions = [fakeDefinition];

      await store.deleteDefinition('rsi_14');
      expect(store.definitions).toEqual([]);
      expect(mockedApi.deleteDefinition).toHaveBeenCalledWith('rsi_14');
    });

    it('sets error and rethrows on failure', async () => {
      mockedApi.deleteDefinition.mockRejectedValue(new Error('not found'));
      const store = useFeaturesStore();

      await expect(store.deleteDefinition('missing')).rejects.toThrow('not found');
      expect(store.error).toBe('not found');
    });
  });

  // ── precompute ────────────────────────────────────────────────────
  describe('precompute()', () => {
    it('sets loading and returns result on success', async () => {
      mockedApi.precompute.mockResolvedValue({ data: { computed_candles: 500 } });
      const store = useFeaturesStore();

      const promise = store.precompute({ symbol: 'BTC/USDT', timeframe: '1h' });
      expect(store.loading).toBe(true);

      const result = await promise;
      expect(store.loading).toBe(false);
      expect(result).toEqual({ data: { computed_candles: 500 } });
    });

    it('sets error and loading false on failure', async () => {
      mockedApi.precompute.mockRejectedValue(new Error('compute failed'));
      const store = useFeaturesStore();

      await expect(store.precompute({ symbol: 'BTC/USDT', timeframe: '1h' })).rejects.toThrow('compute failed');
      expect(store.error).toBe('compute failed');
      expect(store.loading).toBe(false);
    });
  });

  // ── fetchStatus ───────────────────────────────────────────────────
  describe('fetchStatus()', () => {
    it('sets status on success', async () => {
      mockedApi.getStatus.mockResolvedValue({ data: { total_definitions: 5 } });
      const store = useFeaturesStore();
      await store.fetchStatus();
      expect(store.status).toEqual({ total_definitions: 5 });
    });

    it('clears status on failure', async () => {
      mockedApi.getStatus.mockRejectedValue(new Error('fail'));
      const store = useFeaturesStore();
      store.status = { total_definitions: 5 };
      await store.fetchStatus();
      expect(store.status).toBeNull();
    });
  });
});

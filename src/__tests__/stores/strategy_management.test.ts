import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStrategyMgmtStore } from '@/stores/strategy_management';
import { strategyMgmtApi } from '@/api/strategy_management';
import type { StrategyMgmtRecord } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/strategy_management', () => ({
  strategyMgmtApi: {
    listStrategies: vi.fn(),
    loadStrategy: vi.fn(),
    startStrategy: vi.fn(),
    stopStrategy: vi.fn(),
    reloadStrategy: vi.fn(),
    unloadStrategy: vi.fn(),
  },
}));

const mockedApi = vi.mocked(strategyMgmtApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeStrategy: StrategyMgmtRecord = {
  strategy_id: 'strat-1',
  status: 'LOADED',
  version: '1.0.0',
  author: 'test',
  description: 'Test strategy',
  source_path: 'plugins/test.py',
  loaded_at: '2026-01-01T00:00:00Z',
  started_at: null,
};

const fakeStrategy2: StrategyMgmtRecord = {
  ...fakeStrategy,
  strategy_id: 'strat-2',
  source_path: 'plugins/test2.py',
};

// ── Tests ────────────────────────────────────────────────────────────
describe('strategyManagement store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty strategies', () => {
      const store = useStrategyMgmtStore();
      expect(store.strategies).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useStrategyMgmtStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchStrategies ───────────────────────────────────────────────
  describe('fetchStrategies()', () => {
    it('sets strategies on success', async () => {
      mockedApi.listStrategies.mockResolvedValue([fakeStrategy, fakeStrategy2]);

      const store = useStrategyMgmtStore();
      await store.fetchStrategies();

      expect(store.strategies).toEqual([fakeStrategy, fakeStrategy2]);
      expect(store.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedApi.listStrategies.mockRejectedValue(new Error('network'));

      const store = useStrategyMgmtStore();
      await store.fetchStrategies();

      expect(store.error).toBe('network');
      expect(store.loading).toBe(false);
    });
  });

  // ── loadStrategy ──────────────────────────────────────────────────
  describe('loadStrategy()', () => {
    it('appends loaded strategy to list', async () => {
      mockedApi.loadStrategy.mockResolvedValue(fakeStrategy);

      const store = useStrategyMgmtStore();
      store.strategies = [fakeStrategy2];
      await store.loadStrategy('plugins/test.py');

      expect(store.strategies).toHaveLength(2);
      expect(store.strategies[1]).toEqual(fakeStrategy);
      expect(mockedApi.loadStrategy).toHaveBeenCalledWith('plugins/test.py');
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.loadStrategy.mockRejectedValue(new Error('load fail'));

      const store = useStrategyMgmtStore();
      await expect(store.loadStrategy('plugins/bad.py')).rejects.toThrow('load fail');

      expect(store.error).toBe('load fail');
    });
  });

  // ── startStrategy ─────────────────────────────────────────────────
  describe('startStrategy()', () => {
    it('updates status to STARTED optimistically', async () => {
      mockedApi.startStrategy.mockResolvedValue({ strategy_id: 'strat-1', status: 'STARTED' });

      const store = useStrategyMgmtStore();
      store.strategies = [{ ...fakeStrategy }];
      await store.startStrategy('strat-1');

      expect(store.strategies[0].status).toBe('STARTED');
      expect(mockedApi.startStrategy).toHaveBeenCalledWith('strat-1');
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.startStrategy.mockRejectedValue(new Error('start fail'));

      const store = useStrategyMgmtStore();
      store.strategies = [{ ...fakeStrategy }];
      await expect(store.startStrategy('strat-1')).rejects.toThrow('start fail');

      expect(store.error).toBe('start fail');
    });
  });

  // ── stopStrategy ──────────────────────────────────────────────────
  describe('stopStrategy()', () => {
    it('updates status to STOPPED', async () => {
      mockedApi.stopStrategy.mockResolvedValue({ strategy_id: 'strat-1', status: 'STOPPED' });

      const store = useStrategyMgmtStore();
      store.strategies = [{ ...fakeStrategy, status: 'STARTED' }];
      await store.stopStrategy('strat-1');

      expect(store.strategies[0].status).toBe('STOPPED');
      expect(mockedApi.stopStrategy).toHaveBeenCalledWith('strat-1');
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.stopStrategy.mockRejectedValue(new Error('stop fail'));

      const store = useStrategyMgmtStore();
      store.strategies = [{ ...fakeStrategy }];
      await expect(store.stopStrategy('strat-1')).rejects.toThrow('stop fail');

      expect(store.error).toBe('stop fail');
    });
  });

  // ── reloadStrategy ────────────────────────────────────────────────
  describe('reloadStrategy()', () => {
    it('updates status from API response', async () => {
      mockedApi.reloadStrategy.mockResolvedValue({ strategy_id: 'strat-1', status: 'STARTED', state_preserved: true });

      const store = useStrategyMgmtStore();
      store.strategies = [{ ...fakeStrategy, status: 'STOPPED' }];
      await store.reloadStrategy('strat-1');

      expect(store.strategies[0].status).toBe('STARTED');
      expect(mockedApi.reloadStrategy).toHaveBeenCalledWith('strat-1');
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.reloadStrategy.mockRejectedValue(new Error('reload fail'));

      const store = useStrategyMgmtStore();
      store.strategies = [{ ...fakeStrategy }];
      await expect(store.reloadStrategy('strat-1')).rejects.toThrow('reload fail');

      expect(store.error).toBe('reload fail');
    });
  });

  // ── unloadStrategy ────────────────────────────────────────────────
  describe('unloadStrategy()', () => {
    it('removes strategy from list', async () => {
      mockedApi.unloadStrategy.mockResolvedValue({ strategy_id: 'strat-1', status: 'UNLOADED' });

      const store = useStrategyMgmtStore();
      store.strategies = [fakeStrategy, fakeStrategy2];
      await store.unloadStrategy('strat-1');

      expect(store.strategies).toHaveLength(1);
      expect(store.strategies[0].strategy_id).toBe('strat-2');
      expect(mockedApi.unloadStrategy).toHaveBeenCalledWith('strat-1');
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.unloadStrategy.mockRejectedValue(new Error('unload fail'));

      const store = useStrategyMgmtStore();
      store.strategies = [fakeStrategy];
      await expect(store.unloadStrategy('strat-1')).rejects.toThrow('unload fail');

      expect(store.error).toBe('unload fail');
    });
  });
});

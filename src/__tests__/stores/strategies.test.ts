import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStrategiesStore } from '@/stores/strategies';
import { strategiesApi } from '@/api/strategies';
import type { Strategy, ParamAuditEntry } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/strategies', () => ({
  strategiesApi: {
    getStrategies: vi.fn(),
    getStrategy: vi.fn(),
    toggleStrategy: vi.fn(),
    reloadStrategies: vi.fn(),
    getParams: vi.fn(),
    updateParams: vi.fn(),
    getParamsAudit: vi.fn(),
  },
}));

const mockedStrategiesApi = vi.mocked(strategiesApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeStrategies: Strategy[] = [
  {
    strategy_id: 'strat-1',
    symbols: ['BTC/USDT'],
    exchanges: ['binance'],
    timeframes: ['1h'],
    is_running: true,
    parameters: { threshold: '0.5' },
  },
  {
    strategy_id: 'strat-2',
    symbols: ['ETH/USDT'],
    exchanges: ['binance'],
    timeframes: ['4h'],
    is_running: false,
    parameters: { threshold: '0.3' },
  },
];

const fakeAudit: ParamAuditEntry[] = [
  {
    time: '2026-01-01T00:00:00Z',
    param_name: 'threshold',
    old_value: '0.3',
    new_value: '0.5',
    source: 'manual',
  },
];

// ── Tests ────────────────────────────────────────────────────────────
describe('strategies store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty strategies list', () => {
      const store = useStrategiesStore();
      expect(store.strategies).toEqual([]);
    });

    it('has null selectedStrategy', () => {
      const store = useStrategiesStore();
      expect(store.selectedStrategy).toBeNull();
    });

    it('has empty params', () => {
      const store = useStrategiesStore();
      expect(store.params).toEqual({});
    });

    it('has empty paramsSource', () => {
      const store = useStrategiesStore();
      expect(store.paramsSource).toBe('');
    });

    it('has empty paramsAudit', () => {
      const store = useStrategiesStore();
      expect(store.paramsAudit).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useStrategiesStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchStrategies ──────────────────────────────────────────────
  describe('fetchStrategies()', () => {
    it('sets strategies list on success', async () => {
      mockedStrategiesApi.getStrategies.mockResolvedValue(fakeStrategies);

      const store = useStrategiesStore();
      await store.fetchStrategies();

      expect(store.strategies).toEqual(fakeStrategies);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedStrategiesApi.getStrategies.mockReturnValue(
        new Promise((r) => { resolve = r; }) as any,
      );

      const store = useStrategiesStore();
      const promise = store.fetchStrategies();

      expect(store.loading).toBe(true);

      resolve(fakeStrategies);
      await promise;

      expect(store.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedStrategiesApi.getStrategies.mockRejectedValue(new Error('Server error'));

      const store = useStrategiesStore();
      await store.fetchStrategies();

      expect(store.error).toBe('Server error');
      expect(store.loading).toBe(false);
    });
  });

  // ── toggleStrategy ───────────────────────────────────────────────
  describe('toggleStrategy()', () => {
    it('calls API and updates strategy.is_running', async () => {
      mockedStrategiesApi.toggleStrategy.mockResolvedValue({});
      mockedStrategiesApi.getStrategies.mockResolvedValue(fakeStrategies);

      const store = useStrategiesStore();
      // Pre-populate strategies
      await store.fetchStrategies();

      await store.toggleStrategy('strat-2', true);

      expect(mockedStrategiesApi.toggleStrategy).toHaveBeenCalledWith('strat-2', true);
      const updated = store.strategies.find((s) => s.strategy_id === 'strat-2');
      expect(updated?.is_running).toBe(true);
    });

    it('sets error on failure', async () => {
      mockedStrategiesApi.toggleStrategy.mockRejectedValue(new Error('forbidden'));

      const store = useStrategiesStore();
      await store.toggleStrategy('strat-1', false);

      expect(store.error).toBe('forbidden');
    });
  });

  // ── reloadStrategies ─────────────────────────────────────────────
  describe('reloadStrategies()', () => {
    it('calls reload API then refetches', async () => {
      mockedStrategiesApi.reloadStrategies.mockResolvedValue({});
      mockedStrategiesApi.getStrategies.mockResolvedValue(fakeStrategies);

      const store = useStrategiesStore();
      await store.reloadStrategies();

      expect(mockedStrategiesApi.reloadStrategies).toHaveBeenCalledOnce();
      expect(mockedStrategiesApi.getStrategies).toHaveBeenCalledOnce();
      expect(store.strategies).toEqual(fakeStrategies);
    });

    it('sets error on reload failure', async () => {
      mockedStrategiesApi.reloadStrategies.mockRejectedValue(new Error('reload failed'));

      const store = useStrategiesStore();
      await store.reloadStrategies();

      expect(store.error).toBe('reload failed');
    });
  });

  // ── selectStrategy ───────────────────────────────────────────────
  describe('selectStrategy()', () => {
    it('sets selectedStrategy from API', async () => {
      mockedStrategiesApi.getStrategy.mockResolvedValue(fakeStrategies[0]);

      const store = useStrategiesStore();
      await store.selectStrategy('strat-1');

      expect(mockedStrategiesApi.getStrategy).toHaveBeenCalledWith('strat-1');
      expect(store.selectedStrategy).toEqual(fakeStrategies[0]);
    });

    it('sets error on failure', async () => {
      mockedStrategiesApi.getStrategy.mockRejectedValue(new Error('not found'));

      const store = useStrategiesStore();
      await store.selectStrategy('strat-999');

      expect(store.error).toBe('not found');
    });
  });

  // ── fetchParams ──────────────────────────────────────────────────
  describe('fetchParams()', () => {
    it('sets params and paramsSource', async () => {
      mockedStrategiesApi.getParams.mockResolvedValue({
        strategy_id: 'strat-1',
        params: { threshold: '0.5', period: '14' },
        source: 'file',
      });

      const store = useStrategiesStore();
      await store.fetchParams('strat-1');

      expect(store.params).toEqual({ threshold: '0.5', period: '14' });
      expect(store.paramsSource).toBe('file');
    });

    it('resets params on error', async () => {
      mockedStrategiesApi.getParams.mockRejectedValue(new Error('fail'));

      const store = useStrategiesStore();
      store.$patch({ params: { old: 'value' }, paramsSource: 'old_source' });

      await store.fetchParams('strat-1');

      expect(store.params).toEqual({});
      expect(store.paramsSource).toBe('');
    });
  });

  // ── updateParams ─────────────────────────────────────────────────
  describe('updateParams()', () => {
    it('calls API, merges into params, then fetches audit', async () => {
      mockedStrategiesApi.updateParams.mockResolvedValue({
        strategy_id: 'strat-1',
        applied: true,
        errors: [],
      });
      mockedStrategiesApi.getParamsAudit.mockResolvedValue({
        strategy_id: 'strat-1',
        audit: fakeAudit,
      });

      const store = useStrategiesStore();
      store.$patch({ params: { threshold: '0.5' } });

      await store.updateParams('strat-1', { threshold: '0.7' });

      expect(mockedStrategiesApi.updateParams).toHaveBeenCalledWith('strat-1', { threshold: '0.7' });
      expect(store.params).toEqual({ threshold: '0.7' });
      expect(mockedStrategiesApi.getParamsAudit).toHaveBeenCalledWith('strat-1', undefined);
      expect(store.paramsAudit).toEqual(fakeAudit);
    });

    it('throws when API returns errors', async () => {
      mockedStrategiesApi.updateParams.mockResolvedValue({
        strategy_id: 'strat-1',
        applied: false,
        errors: ['Invalid value for threshold'],
      });

      const store = useStrategiesStore();
      await expect(store.updateParams('strat-1', { threshold: 'bad' }))
        .rejects.toThrow('Invalid value for threshold');
    });
  });

  // ── fetchParamsAudit ─────────────────────────────────────────────
  describe('fetchParamsAudit()', () => {
    it('sets audit log', async () => {
      mockedStrategiesApi.getParamsAudit.mockResolvedValue({
        strategy_id: 'strat-1',
        audit: fakeAudit,
      });

      const store = useStrategiesStore();
      await store.fetchParamsAudit('strat-1');

      expect(store.paramsAudit).toEqual(fakeAudit);
    });

    it('passes limit parameter', async () => {
      mockedStrategiesApi.getParamsAudit.mockResolvedValue({
        strategy_id: 'strat-1',
        audit: [],
      });

      const store = useStrategiesStore();
      await store.fetchParamsAudit('strat-1', 10);

      expect(mockedStrategiesApi.getParamsAudit).toHaveBeenCalledWith('strat-1', 10);
    });

    it('resets audit to empty on error', async () => {
      mockedStrategiesApi.getParamsAudit.mockRejectedValue(new Error('fail'));

      const store = useStrategiesStore();
      store.$patch({ paramsAudit: fakeAudit });

      await store.fetchParamsAudit('strat-1');

      expect(store.paramsAudit).toEqual([]);
    });
  });

  // ── updateParamsFromWS ───────────────────────────────────────────
  describe('updateParamsFromWS()', () => {
    it('updates params when strategy_id matches selectedStrategy', () => {
      const store = useStrategiesStore();
      (store as any).selectedStrategy = fakeStrategies[0];
      (store as any).params = { threshold: '0.5' };
      (store as any).paramsSource = 'file';

      store.updateParamsFromWS({
        strategy_id: 'strat-1',
        params: { threshold: '0.8' },
        source: 'ws',
      });

      expect(store.params).toEqual({ threshold: '0.8' });
      expect(store.paramsSource).toBe('ws');
    });

    it('does not update when strategy_id does not match selectedStrategy', () => {
      const store = useStrategiesStore();
      (store as any).selectedStrategy = fakeStrategies[0];
      (store as any).params = { threshold: '0.5' };
      (store as any).paramsSource = 'file';

      store.updateParamsFromWS({
        strategy_id: 'strat-2',
        params: { threshold: '0.9' },
        source: 'ws',
      });

      expect(store.params).toEqual({ threshold: '0.5' });
      expect(store.paramsSource).toBe('file');
    });

    it('does not update when no strategy_id in data', () => {
      const store = useStrategiesStore();
      (store as any).selectedStrategy = fakeStrategies[0];
      (store as any).params = { threshold: '0.5' };

      store.updateParamsFromWS({ params: { threshold: '0.9' } });

      expect(store.params).toEqual({ threshold: '0.5' });
    });

    it('keeps existing paramsSource when WS data has no source', () => {
      const store = useStrategiesStore();
      (store as any).selectedStrategy = fakeStrategies[0];
      (store as any).params = { threshold: '0.5' };
      (store as any).paramsSource = 'file';

      store.updateParamsFromWS({
        strategy_id: 'strat-1',
        params: { threshold: '0.6' },
      });

      expect(store.paramsSource).toBe('file');
    });
  });
});

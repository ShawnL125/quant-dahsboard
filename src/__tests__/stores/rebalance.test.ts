import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRebalanceStore } from '@/stores/rebalance';
import { rebalanceApi } from '@/api/rebalance';
import type { RebalanceResult, RebalanceStatus, RebalanceDrift } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/rebalance', () => ({
  rebalanceApi: {
    triggerRebalance: vi.fn(),
    getStatus: vi.fn(),
    getHistory: vi.fn(),
    getDrift: vi.fn(),
    updateTargets: vi.fn(),
  },
}));

const mockedApi = vi.mocked(rebalanceApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeStatus: RebalanceStatus = {
  strategy_id: 'strat-1',
  current_weights: { BTC: 0.5, ETH: 0.5 },
  target_weights: { BTC: 0.6, ETH: 0.4 },
  drift_pct: '3.5',
  last_rebalance_at: '2026-01-01T10:00:00Z',
  status: 'drifting',
};

const fakeResult: RebalanceResult = {
  rebalance_id: 'reb-1',
  strategy_id: 'strat-1',
  status: 'completed',
  target_weights: { BTC: 0.6, ETH: 0.4 },
  actual_weights: { BTC: 0.5, ETH: 0.5 },
  drift_pct: '1.0',
  orders_planned: 2,
  orders_executed: 2,
  created_at: '2026-01-01T10:00:00Z',
};

const fakeResult2: RebalanceResult = {
  ...fakeResult,
  rebalance_id: 'reb-2',
  created_at: '2026-01-02T10:00:00Z',
};

const fakeDrift: RebalanceDrift = {
  strategy_id: 'strat-1',
  total_drift_pct: '5.0',
  asset_drift: {
    BTC: { target_pct: '60', actual_pct: '55', drift_pct: '5' },
    ETH: { target_pct: '40', actual_pct: '45', drift_pct: '5' },
  },
};

// ── Tests ────────────────────────────────────────────────────────────
describe('rebalance store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty history', () => {
      const store = useRebalanceStore();
      expect(store.history).toEqual([]);
    });

    it('has null status', () => {
      const store = useRebalanceStore();
      expect(store.status).toBeNull();
    });

    it('has null drift', () => {
      const store = useRebalanceStore();
      expect(store.drift).toBeNull();
    });

    it('has loading false and error null', () => {
      const store = useRebalanceStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchStatus ───────────────────────────────────────────────────
  describe('fetchStatus()', () => {
    it('sets status on success', async () => {
      mockedApi.getStatus.mockResolvedValue({ data: fakeStatus });

      const store = useRebalanceStore();
      await store.fetchStatus('strat-1');

      expect(store.status).toEqual(fakeStatus);
      expect(mockedApi.getStatus).toHaveBeenCalledWith('strat-1');
    });

    it('sets status to null on failure', async () => {
      mockedApi.getStatus.mockRejectedValue(new Error('fail'));

      const store = useRebalanceStore();
      await store.fetchStatus('strat-1');

      expect(store.status).toBeNull();
    });
  });

  // ── fetchHistory ──────────────────────────────────────────────────
  describe('fetchHistory()', () => {
    it('sets history on success', async () => {
      mockedApi.getHistory.mockResolvedValue({ data: [fakeResult, fakeResult2] });

      const store = useRebalanceStore();
      await store.fetchHistory({ strategy_id: 'strat-1' });

      expect(store.history).toEqual([fakeResult, fakeResult2]);
      expect(mockedApi.getHistory).toHaveBeenCalledWith({ strategy_id: 'strat-1' });
    });

    it('passes limit and offset params', async () => {
      mockedApi.getHistory.mockResolvedValue({ data: [fakeResult] });

      const store = useRebalanceStore();
      await store.fetchHistory({ strategy_id: 'strat-1', limit: 10, offset: 5 });

      expect(mockedApi.getHistory).toHaveBeenCalledWith({ strategy_id: 'strat-1', limit: 10, offset: 5 });
    });

    it('sets history to empty on failure', async () => {
      mockedApi.getHistory.mockRejectedValue(new Error('fail'));

      const store = useRebalanceStore();
      await store.fetchHistory({ strategy_id: 'strat-1' });

      expect(store.history).toEqual([]);
    });
  });

  // ── fetchDrift ────────────────────────────────────────────────────
  describe('fetchDrift()', () => {
    it('sets drift on success', async () => {
      mockedApi.getDrift.mockResolvedValue({ data: fakeDrift });

      const store = useRebalanceStore();
      await store.fetchDrift('strat-1');

      expect(store.drift).toEqual(fakeDrift);
      expect(mockedApi.getDrift).toHaveBeenCalledWith('strat-1');
    });

    it('sets drift to null on failure', async () => {
      mockedApi.getDrift.mockRejectedValue(new Error('fail'));

      const store = useRebalanceStore();
      await store.fetchDrift('strat-1');

      expect(store.drift).toBeNull();
    });
  });

  // ── triggerRebalance ──────────────────────────────────────────────
  describe('triggerRebalance()', () => {
    const payload = {
      strategy_id: 'strat-1',
      target_weights: { BTC: 0.6, ETH: 0.4 },
    };

    it('returns result and refreshes history on success', async () => {
      mockedApi.triggerRebalance.mockResolvedValue({ data: fakeResult });
      mockedApi.getHistory.mockResolvedValue({ data: [fakeResult] });

      const store = useRebalanceStore();
      const result = await store.triggerRebalance(payload);

      expect(result.data).toEqual(fakeResult);
      expect(mockedApi.triggerRebalance).toHaveBeenCalledWith(payload);
      expect(mockedApi.getHistory).toHaveBeenCalledWith({ strategy_id: 'strat-1' });
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolveReq!: (v: unknown) => void;
      mockedApi.triggerRebalance.mockReturnValue(new Promise((r) => { resolveReq = r; }) as any);

      const store = useRebalanceStore();
      const promise = store.triggerRebalance(payload);

      expect(store.loading).toBe(true);

      resolveReq({ data: fakeResult });
      mockedApi.getHistory.mockResolvedValue({ data: [] });
      await promise;

      expect(store.loading).toBe(false);
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.triggerRebalance.mockRejectedValue(new Error('trigger fail'));

      const store = useRebalanceStore();
      await expect(store.triggerRebalance(payload)).rejects.toThrow('trigger fail');

      expect(store.error).toBe('trigger fail');
      expect(store.loading).toBe(false);
    });
  });

  // ── updateTargets ─────────────────────────────────────────────────
  describe('updateTargets()', () => {
    const payload = {
      strategy_id: 'strat-1',
      target_weights: { BTC: 0.7, ETH: 0.3 },
    };

    it('updates status on success', async () => {
      const updatedStatus = { ...fakeStatus, target_weights: { BTC: 0.7, ETH: 0.3 } };
      mockedApi.updateTargets.mockResolvedValue({ data: updatedStatus });

      const store = useRebalanceStore();
      const result = await store.updateTargets(payload);

      expect(store.status).toEqual(updatedStatus);
      expect(mockedApi.updateTargets).toHaveBeenCalledWith(payload);
      expect(result.data).toEqual(updatedStatus);
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.updateTargets.mockRejectedValue(new Error('update fail'));

      const store = useRebalanceStore();
      await expect(store.updateTargets(payload)).rejects.toThrow('update fail');

      expect(store.error).toBe('update fail');
    });
  });
});

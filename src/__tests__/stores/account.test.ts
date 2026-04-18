import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccountStore } from '@/stores/account';
import { accountApi } from '@/api/account';
import type { AccountSnapshot, AccountReconciliation, MarginStatus } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/account', () => ({
  accountApi: {
    getSnapshots: vi.fn(),
    getSnapshotByExchange: vi.fn(),
    sync: vi.fn(),
    reconcile: vi.fn(),
    getReconciliations: vi.fn(),
    getMargin: vi.fn(),
  },
}));

const mockedAccountApi = vi.mocked(accountApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeSnapshots: AccountSnapshot[] = [
  { snapshot_id: 'snap-1', exchange: 'binance', timestamp: '2026-01-01T00:00:00Z' } as unknown as AccountSnapshot,
];

const fakeReconciliations: AccountReconciliation[] = [
  { id: 'recon-1', exchange: 'binance' } as unknown as AccountReconciliation,
];

const fakeMargins: MarginStatus[] = [
  { exchange: 'binance', margin_ratio: 0.1 } as unknown as MarginStatus,
];

// ── Tests ────────────────────────────────────────────────────────────
describe('account store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty snapshots', () => {
      const store = useAccountStore();
      expect(store.snapshots).toEqual([]);
    });

    it('has empty reconciliations', () => {
      const store = useAccountStore();
      expect(store.reconciliations).toEqual([]);
    });

    it('has empty margins', () => {
      const store = useAccountStore();
      expect(store.margins).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useAccountStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchSnapshots ────────────────────────────────────────────────
  describe('fetchSnapshots()', () => {
    it('sets snapshots on success', async () => {
      mockedAccountApi.getSnapshots.mockResolvedValue({ snapshots: fakeSnapshots });

      const store = useAccountStore();
      await store.fetchSnapshots();

      expect(store.snapshots).toEqual(fakeSnapshots);
    });

    it('sets snapshots to empty on failure', async () => {
      mockedAccountApi.getSnapshots.mockRejectedValue(new Error('fail'));

      const store = useAccountStore();
      await store.fetchSnapshots();

      expect(store.snapshots).toEqual([]);
    });
  });

  // ── fetchReconciliations ──────────────────────────────────────────
  describe('fetchReconciliations()', () => {
    it('sets reconciliations on success', async () => {
      mockedAccountApi.getReconciliations.mockResolvedValue({ reconciliations: fakeReconciliations });

      const store = useAccountStore();
      await store.fetchReconciliations();

      expect(store.reconciliations).toEqual(fakeReconciliations);
    });

    it('sets reconciliations to empty on failure', async () => {
      mockedAccountApi.getReconciliations.mockRejectedValue(new Error('fail'));

      const store = useAccountStore();
      await store.fetchReconciliations();

      expect(store.reconciliations).toEqual([]);
    });
  });

  // ── fetchMargin ───────────────────────────────────────────────────
  describe('fetchMargin()', () => {
    it('sets margins on success', async () => {
      mockedAccountApi.getMargin.mockResolvedValue({ margins: fakeMargins });

      const store = useAccountStore();
      await store.fetchMargin();

      expect(store.margins).toEqual(fakeMargins);
    });

    it('sets margins to empty on failure', async () => {
      mockedAccountApi.getMargin.mockRejectedValue(new Error('fail'));

      const store = useAccountStore();
      await store.fetchMargin();

      expect(store.margins).toEqual([]);
    });
  });

  // ── syncAll ───────────────────────────────────────────────────────
  describe('syncAll()', () => {
    it('calls accountApi.sync', async () => {
      mockedAccountApi.sync.mockResolvedValue({ synced_exchanges: ['binance'], snapshot_ids: ['snap-1'] });

      const store = useAccountStore();
      await store.syncAll();

      expect(mockedAccountApi.sync).toHaveBeenCalledOnce();
    });

    it('silently handles failure', async () => {
      mockedAccountApi.sync.mockRejectedValue(new Error('sync failed'));

      const store = useAccountStore();
      await store.syncAll();

      // Should not throw
      expect(store.error).toBeNull();
    });
  });

  // ── reconcile ─────────────────────────────────────────────────────
  describe('reconcile()', () => {
    it('calls accountApi.reconcile with exchange', async () => {
      mockedAccountApi.reconcile.mockResolvedValue({ results: fakeReconciliations });

      const store = useAccountStore();
      await store.reconcile('binance');

      expect(mockedAccountApi.reconcile).toHaveBeenCalledWith('binance');
    });

    it('silently handles failure', async () => {
      mockedAccountApi.reconcile.mockRejectedValue(new Error('recon failed'));

      const store = useAccountStore();
      await store.reconcile();

      expect(store.error).toBeNull();
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('fetches snapshots, reconciliations, and margin in parallel', async () => {
      mockedAccountApi.getSnapshots.mockResolvedValue({ snapshots: fakeSnapshots });
      mockedAccountApi.getReconciliations.mockResolvedValue({ reconciliations: fakeReconciliations });
      mockedAccountApi.getMargin.mockResolvedValue({ margins: fakeMargins });

      const store = useAccountStore();
      await store.fetchAll();

      expect(mockedAccountApi.getSnapshots).toHaveBeenCalledOnce();
      expect(mockedAccountApi.getReconciliations).toHaveBeenCalledOnce();
      expect(mockedAccountApi.getMargin).toHaveBeenCalledOnce();
      expect(store.snapshots).toEqual(fakeSnapshots);
      expect(store.reconciliations).toEqual(fakeReconciliations);
      expect(store.margins).toEqual(fakeMargins);
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedAccountApi.getSnapshots.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedAccountApi.getReconciliations.mockResolvedValue({ reconciliations: [] });
      mockedAccountApi.getMargin.mockResolvedValue({ margins: [] });

      const store = useAccountStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolve({ snapshots: [] });
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── updateMarginFromWS ────────────────────────────────────────────
  describe('updateMarginFromWS()', () => {
    it('updates existing margin by exchange', () => {
      const store = useAccountStore();
      store.margins = [...fakeMargins];

      const updated = { exchange: 'binance', margin_ratio: 0.5 } as unknown as MarginStatus;
      store.updateMarginFromWS(updated as unknown as Record<string, unknown>);

      expect(store.margins).toHaveLength(1);
      expect(store.margins[0]).toEqual(updated);
    });

    it('appends margin for new exchange', () => {
      const store = useAccountStore();
      store.margins = [...fakeMargins];

      const newMargin = { exchange: 'okx', margin_ratio: 0.2 } as unknown as MarginStatus;
      store.updateMarginFromWS(newMargin as unknown as Record<string, unknown>);

      expect(store.margins).toHaveLength(2);
      expect(store.margins[1]).toEqual(newMargin);
    });

    it('does nothing when exchange is missing', () => {
      const store = useAccountStore();
      store.margins = [...fakeMargins];

      store.updateMarginFromWS({} as Record<string, unknown>);

      expect(store.margins).toHaveLength(1);
    });
  });

  // ── updateSnapshotFromWS ──────────────────────────────────────────
  describe('updateSnapshotFromWS()', () => {
    it('updates existing snapshot by snapshot_id', () => {
      const store = useAccountStore();
      store.snapshots = [...fakeSnapshots];

      const updated = { ...fakeSnapshots[0], timestamp: '2026-02-01T00:00:00Z' };
      store.updateSnapshotFromWS(updated as unknown as Record<string, unknown>);

      expect(store.snapshots).toHaveLength(1);
      expect(store.snapshots[0]).toEqual(updated);
    });

    it('prepends snapshot for new snapshot_id', () => {
      const store = useAccountStore();
      store.snapshots = [...fakeSnapshots];

      const newSnap = { snapshot_id: 'snap-2', exchange: 'okx', timestamp: '2026-01-01T00:00:00Z' } as unknown as AccountSnapshot;
      store.updateSnapshotFromWS(newSnap as unknown as Record<string, unknown>);

      expect(store.snapshots).toHaveLength(2);
      expect(store.snapshots[0]).toEqual(newSnap);
    });

    it('does nothing when snapshot_id is missing', () => {
      const store = useAccountStore();
      store.snapshots = [...fakeSnapshots];

      store.updateSnapshotFromWS({} as Record<string, unknown>);

      expect(store.snapshots).toHaveLength(1);
    });
  });
});

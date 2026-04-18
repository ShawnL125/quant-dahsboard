import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReconciliationStore } from '@/stores/reconciliation';
import { reconciliationApi } from '@/api/reconciliation';
import type { ReconAlert } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/reconciliation', () => ({
  reconciliationApi: {
    run: vi.fn(),
    getReports: vi.fn(),
    getReport: vi.fn(),
    getAlerts: vi.fn(),
  },
}));

const mockedReconApi = vi.mocked(reconciliationApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeAlerts: ReconAlert[] = [
  { id: 'alert-1', severity: 'high', message: 'Mismatch detected' } as unknown as ReconAlert,
];

const fakeReports = [
  { report_id: 'rpt-1', status: 'completed', created_at: '2026-01-01T00:00:00Z' },
];

const fakeRunResult = {
  report_id: 'rpt-new',
  trade_match_count: 0,
  alert_count: 1,
};

// ── Tests ────────────────────────────────────────────────────────────
describe('reconciliation store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty alerts', () => {
      const store = useReconciliationStore();
      expect(store.alerts).toEqual([]);
    });

    it('has empty reports', () => {
      const store = useReconciliationStore();
      expect(store.reports).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useReconciliationStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchAlerts ───────────────────────────────────────────────────
  describe('fetchAlerts()', () => {
    it('sets alerts on success', async () => {
      mockedReconApi.getAlerts.mockResolvedValue(fakeAlerts);

      const store = useReconciliationStore();
      await store.fetchAlerts();

      expect(store.alerts).toEqual(fakeAlerts);
    });

    it('sets alerts to empty on failure', async () => {
      mockedReconApi.getAlerts.mockRejectedValue(new Error('fail'));

      const store = useReconciliationStore();
      await store.fetchAlerts();

      expect(store.alerts).toEqual([]);
    });
  });

  // ── fetchReports ──────────────────────────────────────────────────
  describe('fetchReports()', () => {
    it('sets reports on success', async () => {
      mockedReconApi.getReports.mockResolvedValue(fakeReports);

      const store = useReconciliationStore();
      await store.fetchReports();

      expect(store.reports).toEqual(fakeReports);
    });

    it('sets reports to empty on failure', async () => {
      mockedReconApi.getReports.mockRejectedValue(new Error('fail'));

      const store = useReconciliationStore();
      await store.fetchReports();

      expect(store.reports).toEqual([]);
    });
  });

  // ── runReconciliation ─────────────────────────────────────────────
  describe('runReconciliation()', () => {
    it('returns API result on success', async () => {
      mockedReconApi.run.mockResolvedValue(fakeRunResult as import('@/types').ReconciliationRunResponse);

      const store = useReconciliationStore();
      const result = await store.runReconciliation({ backtest_run_id: 'run-1' });

      expect(result).toEqual(fakeRunResult);
      expect(mockedReconApi.run).toHaveBeenCalledWith({ backtest_run_id: 'run-1' });
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedReconApi.run.mockReturnValue(new Promise((r) => { resolve = r; }) as any);

      const store = useReconciliationStore();
      const promise = store.runReconciliation({ backtest_run_id: 'run-1' });

      expect(store.loading).toBe(true);

      resolve(fakeRunResult);
      await promise;

      expect(store.loading).toBe(false);
    });

    it('sets error and returns null on failure', async () => {
      mockedReconApi.run.mockRejectedValue(new Error('reconciliation failed'));

      const store = useReconciliationStore();
      const result = await store.runReconciliation({ backtest_run_id: 'run-1' });

      expect(result).toBeNull();
      expect(store.error).toBe('reconciliation failed');
      expect(store.loading).toBe(false);
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('fetches alerts and reports in parallel', async () => {
      mockedReconApi.getAlerts.mockResolvedValue(fakeAlerts);
      mockedReconApi.getReports.mockResolvedValue(fakeReports);

      const store = useReconciliationStore();
      await store.fetchAll();

      expect(mockedReconApi.getAlerts).toHaveBeenCalledOnce();
      expect(mockedReconApi.getReports).toHaveBeenCalledOnce();
      expect(store.alerts).toEqual(fakeAlerts);
      expect(store.reports).toEqual(fakeReports);
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedReconApi.getAlerts.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedReconApi.getReports.mockResolvedValue([]);

      const store = useReconciliationStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolve([]);
      await promise;

      expect(store.loading).toBe(false);
    });
  });
});

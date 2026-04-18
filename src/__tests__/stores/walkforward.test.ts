import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWalkforwardStore } from '@/stores/walkforward';
import { walkforwardApi } from '@/api/walkforward';
import type { WalkForwardRun, WalkForwardWindow, WalkForwardBestParams } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/walkforward', () => ({
  walkforwardApi: {
    run: vi.fn(),
    getRuns: vi.fn(),
    getRun: vi.fn(),
    getWindows: vi.fn(),
    getBestParams: vi.fn(),
    compare: vi.fn(),
  },
}));

const mockedWalkforwardApi = vi.mocked(walkforwardApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeRuns: WalkForwardRun[] = [
  { run_id: 'run-1', status: 'COMPLETED', created_at: '2026-01-01T00:00:00Z' } as unknown as WalkForwardRun,
];

const fakeWindows: WalkForwardWindow[] = [
  { window_id: 'win-1', run_id: 'run-1', window_type: 'train' } as unknown as WalkForwardWindow,
];

const fakeBestParams: WalkForwardBestParams[] = [
  { window_id: 'win-1', params: { period: 14 } } as unknown as WalkForwardBestParams,
];

// ── Tests ────────────────────────────────────────────────────────────
describe('walkforward store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty runs', () => {
      const store = useWalkforwardStore();
      expect(store.runs).toEqual([]);
    });

    it('has empty currentWindows', () => {
      const store = useWalkforwardStore();
      expect(store.currentWindows).toEqual([]);
    });

    it('has empty currentBestParams', () => {
      const store = useWalkforwardStore();
      expect(store.currentBestParams).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useWalkforwardStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchRuns ─────────────────────────────────────────────────────
  describe('fetchRuns()', () => {
    it('sets runs on success', async () => {
      mockedWalkforwardApi.getRuns.mockResolvedValue(fakeRuns);

      const store = useWalkforwardStore();
      await store.fetchRuns();

      expect(store.runs).toEqual(fakeRuns);
    });

    it('sets error on failure', async () => {
      mockedWalkforwardApi.getRuns.mockRejectedValue(new Error('Server error'));

      const store = useWalkforwardStore();
      await store.fetchRuns();

      expect(store.error).toBe('Server error');
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedWalkforwardApi.getRuns.mockReturnValue(new Promise((r) => { resolve = r; }) as any);

      const store = useWalkforwardStore();
      const promise = store.fetchRuns();

      expect(store.loading).toBe(true);

      resolve([]);
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── fetchWindows ──────────────────────────────────────────────────
  describe('fetchWindows()', () => {
    it('fetches windows and bestParams in parallel', async () => {
      mockedWalkforwardApi.getWindows.mockResolvedValue(fakeWindows);
      mockedWalkforwardApi.getBestParams.mockResolvedValue(fakeBestParams);

      const store = useWalkforwardStore();
      await store.fetchWindows('run-1');

      expect(mockedWalkforwardApi.getWindows).toHaveBeenCalledWith('run-1');
      expect(mockedWalkforwardApi.getBestParams).toHaveBeenCalledWith('run-1');
      expect(store.currentWindows).toEqual(fakeWindows);
      expect(store.currentBestParams).toEqual(fakeBestParams);
    });

    it('sets error on failure', async () => {
      mockedWalkforwardApi.getWindows.mockRejectedValue(new Error('not found'));

      const store = useWalkforwardStore();
      await store.fetchWindows('run-999');

      expect(store.error).toBe('not found');
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedWalkforwardApi.getWindows.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedWalkforwardApi.getBestParams.mockResolvedValue([]);

      const store = useWalkforwardStore();
      const promise = store.fetchWindows('run-1');

      expect(store.loading).toBe(true);

      resolve([]);
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── submitRun ─────────────────────────────────────────────────────
  describe('submitRun()', () => {
    it('calls API then fetchRuns', async () => {
      mockedWalkforwardApi.run.mockResolvedValue({ run_id: 'run-new' });
      mockedWalkforwardApi.getRuns.mockResolvedValue(fakeRuns);

      const store = useWalkforwardStore();
      await store.submitRun({ symbol: 'BTC/USDT' });

      expect(mockedWalkforwardApi.run).toHaveBeenCalledWith({ symbol: 'BTC/USDT' });
      expect(mockedWalkforwardApi.getRuns).toHaveBeenCalledOnce();
      expect(store.runs).toEqual(fakeRuns);
    });

    it('clears error before request', async () => {
      mockedWalkforwardApi.run.mockResolvedValue({});
      mockedWalkforwardApi.getRuns.mockResolvedValue([]);

      const store = useWalkforwardStore();
      store.error = 'previous error';

      await store.submitRun({});

      expect(store.error).toBeNull();
    });

    it('sets error on API failure', async () => {
      mockedWalkforwardApi.run.mockRejectedValue(new Error('bad request'));

      const store = useWalkforwardStore();
      await store.submitRun({});

      expect(store.error).toBe('bad request');
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedWalkforwardApi.run.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedWalkforwardApi.getRuns.mockResolvedValue([]);

      const store = useWalkforwardStore();
      const promise = store.submitRun({});

      expect(store.loading).toBe(true);

      resolve({});
      await promise;

      expect(store.loading).toBe(false);
    });
  });
});

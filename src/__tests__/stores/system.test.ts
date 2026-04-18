import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/stores/system';
import { systemApi } from '@/api/system';
import type { HealthStatus } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/system', () => ({
  systemApi: {
    getLiveness: vi.fn(),
    getReadiness: vi.fn(),
    getStatus: vi.fn(),
    getConfig: vi.fn(),
    getEventStats: vi.fn(),
    getPaperStatus: vi.fn(),
    reloadConfig: vi.fn(),
  },
}));

const mockedSystemApi = vi.mocked(systemApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeLiveness: HealthStatus = {
  status: 'alive',
  uptime_seconds: 300,
  trading_mode: 'paper',
};

const fakeReadiness: HealthStatus = {
  status: 'ready',
  uptime_seconds: 300,
};

// ── Tests ────────────────────────────────────────────────────────────
describe('system store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has null liveness', () => {
      const store = useSystemStore();
      expect(store.liveness).toBeNull();
    });

    it('has null readiness', () => {
      const store = useSystemStore();
      expect(store.readiness).toBeNull();
    });

    it('has null status', () => {
      const store = useSystemStore();
      expect(store.status).toBeNull();
    });

    it('has null config', () => {
      const store = useSystemStore();
      expect(store.config).toBeNull();
    });

    it('has null eventStats', () => {
      const store = useSystemStore();
      expect(store.eventStats).toBeNull();
    });

    it('is not loading', () => {
      const store = useSystemStore();
      expect(store.loading).toBe(false);
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('sets all data on success', async () => {
      mockedSystemApi.getStatus.mockResolvedValue({ version: '1.0' } as any);
      mockedSystemApi.getLiveness.mockResolvedValue(fakeLiveness);
      mockedSystemApi.getReadiness.mockResolvedValue(fakeReadiness);
      mockedSystemApi.getConfig.mockResolvedValue({ environment: 'prod' } as any);
      mockedSystemApi.getEventStats.mockResolvedValue({ total: 42 } as any);

      const store = useSystemStore();
      await store.fetchAll();

      expect(store.status).toEqual({ version: '1.0' });
      expect(store.liveness).toEqual(fakeLiveness);
      expect(store.liveness!.trading_mode).toBe('paper');
      expect(store.readiness).toEqual(fakeReadiness);
      expect(store.config).toEqual({ environment: 'prod' });
      expect(store.eventStats).toEqual({ total: 42 });
      expect(store.loading).toBe(false);
    });

    it('calls all APIs in parallel', async () => {
      mockedSystemApi.getStatus.mockResolvedValue({} as any);
      mockedSystemApi.getLiveness.mockResolvedValue(fakeLiveness);
      mockedSystemApi.getReadiness.mockResolvedValue(fakeReadiness);
      mockedSystemApi.getConfig.mockResolvedValue({} as any);
      mockedSystemApi.getEventStats.mockResolvedValue({} as any);

      const store = useSystemStore();
      await store.fetchAll();

      expect(mockedSystemApi.getStatus).toHaveBeenCalled();
      expect(mockedSystemApi.getLiveness).toHaveBeenCalled();
      expect(mockedSystemApi.getReadiness).toHaveBeenCalled();
      expect(mockedSystemApi.getConfig).toHaveBeenCalled();
      expect(mockedSystemApi.getEventStats).toHaveBeenCalled();
    });

    it('sets loading during request', async () => {
      let resolveStatus!: (v: unknown) => void;
      mockedSystemApi.getStatus.mockReturnValue(new Promise((r) => { resolveStatus = r; }) as any);
      mockedSystemApi.getLiveness.mockResolvedValue(fakeLiveness);
      mockedSystemApi.getReadiness.mockResolvedValue(fakeReadiness);
      mockedSystemApi.getConfig.mockResolvedValue({} as any);
      mockedSystemApi.getEventStats.mockResolvedValue({} as any);

      const store = useSystemStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolveStatus({ version: '1.0' });
      await promise;

      expect(store.loading).toBe(false);
    });

    it('resilient to individual failures (Promise.allSettled)', async () => {
      mockedSystemApi.getStatus.mockRejectedValue(new Error('fail'));
      mockedSystemApi.getLiveness.mockRejectedValue(new Error('fail'));
      mockedSystemApi.getReadiness.mockRejectedValue(new Error('fail'));
      mockedSystemApi.getConfig.mockResolvedValue({ environment: 'dev' } as any);
      mockedSystemApi.getEventStats.mockResolvedValue({} as any);

      const store = useSystemStore();
      await store.fetchAll();

      expect(store.loading).toBe(false);
      // Config and eventStats were set by successful calls
      expect(store.config).toEqual({ environment: 'dev' });
    });
  });

  // ── reloadConfig ──────────────────────────────────────────────────
  describe('reloadConfig()', () => {
    it('calls API then fetches config', async () => {
      mockedSystemApi.reloadConfig.mockResolvedValue({ status: 'ok' });
      mockedSystemApi.getConfig.mockResolvedValue({ environment: 'dev' } as any);

      const store = useSystemStore();
      await store.reloadConfig();

      expect(mockedSystemApi.reloadConfig).toHaveBeenCalled();
      expect(mockedSystemApi.getConfig).toHaveBeenCalled();
      expect(store.config).toEqual({ environment: 'dev' });
    });

    it('silently handles failure', async () => {
      mockedSystemApi.reloadConfig.mockRejectedValue(new Error('fail'));

      const store = useSystemStore();
      await store.reloadConfig();

      expect(mockedSystemApi.getConfig).not.toHaveBeenCalled();
    });
  });
});

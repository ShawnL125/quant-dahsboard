import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGovernanceStore } from '@/stores/governance';
import { governanceApi } from '@/api/governance';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/governance', () => ({
  governanceApi: {
    getQualityScores: vi.fn(),
    getQualitySymbols: vi.fn(),
    evaluateQuality: vi.fn(),
    getArchiveStatus: vi.fn(),
    runArchive: vi.fn(),
    getArchiveRuns: vi.fn(),
    lifecycleDryRun: vi.fn(),
    lifecycleExecute: vi.fn(),
    getStatus: vi.fn(),
  },
}));

const mockedApi = vi.mocked(governanceApi);

const qualityFixture = {
  symbol: 'BTC/USDT',
  overall_score: '0.95',
  completeness_pct: '98.5',
  freshness_score: '0.99',
  anomaly_count: 2,
  last_evaluated_at: '2026-01-01T00:00:00Z',
};

const archiveRunFixture = {
  run_id: 'run-1',
  symbols: ['BTC/USDT'],
  start_time: '2026-01-01T00:00:00Z',
  end_time: '2026-01-02T00:00:00Z',
  status: 'completed',
  records_archived: 1000,
  created_at: '2026-01-01T00:00:00Z',
};

const lifecycleFixture = {
  symbol: 'BTC/USDT',
  timeframe: '1h',
  action: 'archive',
  dry_run: true,
  affected_records: 500,
  warnings: [],
  executed: false,
};

describe('governance store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('has empty qualityScores', () => {
      const store = useGovernanceStore();
      expect(store.qualityScores).toEqual([]);
    });

    it('has empty symbols', () => {
      const store = useGovernanceStore();
      expect(store.symbols).toEqual([]);
    });

    it('has empty archiveRuns', () => {
      const store = useGovernanceStore();
      expect(store.archiveRuns).toEqual([]);
    });

    it('has null archiveStatus', () => {
      const store = useGovernanceStore();
      expect(store.archiveStatus).toBeNull();
    });

    it('has null status', () => {
      const store = useGovernanceStore();
      expect(store.status).toBeNull();
    });

    it('has loading false', () => {
      const store = useGovernanceStore();
      expect(store.loading).toBe(false);
    });

    it('has error null', () => {
      const store = useGovernanceStore();
      expect(store.error).toBeNull();
    });
  });

  describe('fetchQualityScores()', () => {
    it('sets qualityScores on success', async () => {
      mockedApi.getQualityScores.mockResolvedValue({ data: [qualityFixture] });
      const store = useGovernanceStore();
      await store.fetchQualityScores();
      expect(store.qualityScores).toEqual([qualityFixture]);
    });

    it('sets empty array on failure', async () => {
      mockedApi.getQualityScores.mockRejectedValue(new Error('fail'));
      const store = useGovernanceStore();
      await store.fetchQualityScores();
      expect(store.qualityScores).toEqual([]);
    });
  });

  describe('fetchSymbols()', () => {
    it('sets symbols on success', async () => {
      mockedApi.getQualitySymbols.mockResolvedValue({ data: ['BTC/USDT', 'ETH/USDT'] });
      const store = useGovernanceStore();
      await store.fetchSymbols();
      expect(store.symbols).toEqual(['BTC/USDT', 'ETH/USDT']);
    });

    it('sets empty array on failure', async () => {
      mockedApi.getQualitySymbols.mockRejectedValue(new Error('fail'));
      const store = useGovernanceStore();
      await store.fetchSymbols();
      expect(store.symbols).toEqual([]);
    });
  });

  describe('evaluateQuality()', () => {
    it('returns result on success', async () => {
      mockedApi.evaluateQuality.mockResolvedValue({ data: qualityFixture });
      const store = useGovernanceStore();
      const result = await store.evaluateQuality({ symbol: 'BTC/USDT', timeframe: '1h' });
      expect(result.data).toEqual(qualityFixture);
    });

    it('sets error and throws on failure', async () => {
      mockedApi.evaluateQuality.mockRejectedValue(new Error('eval failed'));
      const store = useGovernanceStore();
      await expect(store.evaluateQuality({ symbol: 'BTC/USDT', timeframe: '1h' })).rejects.toThrow('eval failed');
      expect(store.error).toBe('eval failed');
    });
  });

  describe('fetchArchiveStatus()', () => {
    it('sets archiveStatus on success', async () => {
      mockedApi.getArchiveStatus.mockResolvedValue({ data: { active: true } });
      const store = useGovernanceStore();
      await store.fetchArchiveStatus();
      expect(store.archiveStatus).toEqual({ active: true });
    });

    it('sets null on failure', async () => {
      mockedApi.getArchiveStatus.mockRejectedValue(new Error('fail'));
      const store = useGovernanceStore();
      await store.fetchArchiveStatus();
      expect(store.archiveStatus).toBeNull();
    });
  });

  describe('runArchive()', () => {
    it('returns result on success', async () => {
      mockedApi.runArchive.mockResolvedValue({ data: archiveRunFixture });
      const store = useGovernanceStore();
      const result = await store.runArchive({ symbols: ['BTC/USDT'], start_time: '2026-01-01', end_time: '2026-01-02' });
      expect(result.data).toEqual(archiveRunFixture);
      expect(store.loading).toBe(false);
    });

    it('sets error and throws on failure', async () => {
      mockedApi.runArchive.mockRejectedValue(new Error('archive failed'));
      const store = useGovernanceStore();
      await expect(store.runArchive({ symbols: ['BTC/USDT'], start_time: '2026-01-01', end_time: '2026-01-02' })).rejects.toThrow('archive failed');
      expect(store.error).toBe('archive failed');
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchArchiveRuns()', () => {
    it('sets archiveRuns on success', async () => {
      mockedApi.getArchiveRuns.mockResolvedValue({ data: [archiveRunFixture] });
      const store = useGovernanceStore();
      await store.fetchArchiveRuns();
      expect(store.archiveRuns).toEqual([archiveRunFixture]);
    });

    it('sets empty array on failure', async () => {
      mockedApi.getArchiveRuns.mockRejectedValue(new Error('fail'));
      const store = useGovernanceStore();
      await store.fetchArchiveRuns();
      expect(store.archiveRuns).toEqual([]);
    });
  });

  describe('lifecycleDryRun()', () => {
    it('returns result on success', async () => {
      mockedApi.lifecycleDryRun.mockResolvedValue({ data: lifecycleFixture });
      const store = useGovernanceStore();
      const result = await store.lifecycleDryRun({ symbol: 'BTC/USDT', timeframe: '1h', action: 'archive' });
      expect(result.data).toEqual(lifecycleFixture);
    });

    it('sets error and throws on failure', async () => {
      mockedApi.lifecycleDryRun.mockRejectedValue(new Error('dry run failed'));
      const store = useGovernanceStore();
      await expect(store.lifecycleDryRun({ symbol: 'BTC/USDT', timeframe: '1h', action: 'archive' })).rejects.toThrow('dry run failed');
      expect(store.error).toBe('dry run failed');
    });
  });

  describe('lifecycleExecute()', () => {
    it('returns result on success', async () => {
      const executed = { ...lifecycleFixture, dry_run: false, executed: true };
      mockedApi.lifecycleExecute.mockResolvedValue({ data: executed });
      const store = useGovernanceStore();
      const result = await store.lifecycleExecute({ symbol: 'BTC/USDT', timeframe: '1h', action: 'archive', confirmed: true });
      expect(result.data).toEqual(executed);
    });

    it('sets error and throws on failure', async () => {
      mockedApi.lifecycleExecute.mockRejectedValue(new Error('execute failed'));
      const store = useGovernanceStore();
      await expect(store.lifecycleExecute({ symbol: 'BTC/USDT', timeframe: '1h', action: 'archive', confirmed: true })).rejects.toThrow('execute failed');
      expect(store.error).toBe('execute failed');
    });
  });

  describe('fetchStatus()', () => {
    it('sets status on success', async () => {
      mockedApi.getStatus.mockResolvedValue({ data: { healthy: true } });
      const store = useGovernanceStore();
      await store.fetchStatus();
      expect(store.status).toEqual({ healthy: true });
    });

    it('sets null on failure', async () => {
      mockedApi.getStatus.mockRejectedValue(new Error('fail'));
      const store = useGovernanceStore();
      await store.fetchStatus();
      expect(store.status).toBeNull();
    });
  });
});

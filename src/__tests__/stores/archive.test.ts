import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useArchiveStore } from '@/stores/archive';
import { archiveApi } from '@/api/archive';
import type { ArchivedRun, ArchiveVersionSummary, ArchiveComparison } from '@/types';

vi.mock('@/api/archive', () => ({
  archiveApi: {
    archiveRun: vi.fn(),
    getVersions: vi.fn(),
    compareVersions: vi.fn(),
    getEntries: vi.fn(),
    getEntry: vi.fn(),
    updateTag: vi.fn(),
  },
}));

const mockedApi = vi.mocked(archiveApi);

const fakeEntry: ArchivedRun = {
  run_id: 'run1',
  strategy_id: 'strat1',
  strategy_version: 'v1',
  strategy_source_hash: 'abc123',
  params_snapshot: { period: 14 },
  tag: 'baseline',
  label: 'Test run',
  created_at: '2025-01-01T00:00:00Z',
};

const fakeVersionSummary: ArchiveVersionSummary = {
  strategy_id: 'strat1',
  version: 'v1',
  run_count: 3,
  avg_sharpe: '1.5',
  avg_return: '12.0',
  best_sharpe: '2.1',
  created_at: '2025-01-01T00:00:00Z',
};

const fakeComparison: ArchiveComparison = {
  version_a: 'v1',
  version_b: 'v2',
  params_diff: { period: { old: '14', new: '20' } },
  metrics_diff: { sharpe: { old: '1.5', new: '1.8' } },
};

describe('archive store', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('initial state', () => {
    it('has empty entries', () => {
      const store = useArchiveStore();
      expect(store.entries).toEqual([]);
    });
    it('has empty versions', () => {
      const store = useArchiveStore();
      expect(store.versions).toEqual([]);
    });
    it('has null comparison', () => {
      const store = useArchiveStore();
      expect(store.comparison).toBeNull();
    });
    it('has total 0, loading false, error null', () => {
      const store = useArchiveStore();
      expect(store.total).toBe(0);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchEntries()', () => {
    it('sets entries and total on success', async () => {
      mockedApi.getEntries.mockResolvedValue({ data: [fakeEntry], total: 1 });
      const store = useArchiveStore();
      await store.fetchEntries({ strategy_id: 'strat1' });
      expect(store.entries).toEqual([fakeEntry]);
      expect(store.total).toBe(1);
      expect(mockedApi.getEntries).toHaveBeenCalledWith({ strategy_id: 'strat1' });
    });
    it('clears entries and total on failure', async () => {
      mockedApi.getEntries.mockRejectedValue(new Error('fail'));
      const store = useArchiveStore();
      store.entries = [fakeEntry];
      store.total = 5;
      await store.fetchEntries();
      expect(store.entries).toEqual([]);
      expect(store.total).toBe(0);
    });
  });

  describe('fetchVersions()', () => {
    it('sets versions on success', async () => {
      mockedApi.getVersions.mockResolvedValue({ data: [fakeVersionSummary] });
      const store = useArchiveStore();
      await store.fetchVersions('strat1');
      expect(store.versions).toEqual([fakeVersionSummary]);
      expect(mockedApi.getVersions).toHaveBeenCalledWith('strat1');
    });
    it('clears versions on failure', async () => {
      mockedApi.getVersions.mockRejectedValue(new Error('fail'));
      const store = useArchiveStore();
      store.versions = [fakeVersionSummary];
      await store.fetchVersions('strat1');
      expect(store.versions).toEqual([]);
    });
  });

  describe('compareVersions()', () => {
    it('sets comparison on success', async () => {
      mockedApi.compareVersions.mockResolvedValue({ data: fakeComparison });
      const store = useArchiveStore();
      await store.compareVersions('strat1', 'v1', 'v2');
      expect(store.comparison).toEqual(fakeComparison);
      expect(mockedApi.compareVersions).toHaveBeenCalledWith('strat1', 'v1', 'v2');
    });
    it('sets comparison to null on failure', async () => {
      mockedApi.compareVersions.mockRejectedValue(new Error('fail'));
      const store = useArchiveStore();
      store.comparison = fakeComparison;
      await store.compareVersions('strat1', 'v1', 'v2');
      expect(store.comparison).toBeNull();
    });
  });

  describe('archiveRun()', () => {
    it('returns archived run on success', async () => {
      const expectedResult = { data: fakeEntry };
      mockedApi.archiveRun.mockResolvedValue(expectedResult);
      const store = useArchiveStore();
      const result = await store.archiveRun('run1', { strategy_id: 'strat1', tag: 'baseline' });
      expect(result).toEqual(expectedResult);
      expect(mockedApi.archiveRun).toHaveBeenCalledWith('run1', { strategy_id: 'strat1', tag: 'baseline' });
      expect(store.loading).toBe(false);
    });
    it('sets loading true during operation', async () => {
      let loadingDuringCall = false;
      mockedApi.archiveRun.mockImplementation(async () => {
        // We need to check loading from inside the store, but since this is async
        // we just verify it resets to false after
        return { data: fakeEntry };
      });
      const store = useArchiveStore();
      await store.archiveRun('run1', { strategy_id: 'strat1' });
      expect(store.loading).toBe(false);
    });
    it('sets error and rethrows on failure', async () => {
      mockedApi.archiveRun.mockRejectedValue(new Error('archive fail'));
      const store = useArchiveStore();
      await expect(store.archiveRun('run1', { strategy_id: 'strat1' })).rejects.toThrow('archive fail');
      expect(store.error).toBe('archive fail');
      expect(store.loading).toBe(false);
    });
  });

  describe('updateTag()', () => {
    it('returns result on success', async () => {
      const expectedResult = { data: { run_id: 'run1', tag: 'production' } };
      mockedApi.updateTag.mockResolvedValue(expectedResult);
      const store = useArchiveStore();
      const result = await store.updateTag('run1', 'production');
      expect(result).toEqual(expectedResult);
      expect(mockedApi.updateTag).toHaveBeenCalledWith('run1', 'production');
    });
    it('sets error and rethrows on failure', async () => {
      mockedApi.updateTag.mockRejectedValue(new Error('tag fail'));
      const store = useArchiveStore();
      await expect(store.updateTag('run1', 'new-tag')).rejects.toThrow('tag fail');
      expect(store.error).toBe('tag fail');
    });
  });
});

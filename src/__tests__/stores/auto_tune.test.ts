import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAutoTuneStore } from '@/stores/auto_tune';
import { autoTuneApi } from '@/api/auto_tune';
import type { AutoTuneRun, AutoTuneSchedule } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/auto_tune', () => ({
  autoTuneApi: {
    triggerRun: vi.fn(),
    confirmRun: vi.fn(),
    rollbackRun: vi.fn(),
    getRuns: vi.fn(),
    createSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
    getSchedules: vi.fn(),
  },
}));

const mockedAutoTuneApi = vi.mocked(autoTuneApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeRuns: AutoTuneRun[] = [
  { run_id: 'run-1', strategy_id: 'strat-1', status: 'COMPLETED', created_at: '2026-01-01T00:00:00Z' } as unknown as AutoTuneRun,
];

const fakeSchedules: AutoTuneSchedule[] = [
  { schedule_id: 'sched-1', strategy_id: 'strat-1', cron_expr: '0 0 * * *', apply_mode: 'auto' } as unknown as AutoTuneSchedule,
];

const fakeTriggerResult = { task_id: 'task-new', status: 'PENDING', strategy_id: 'strat-1' };

// ── Tests ────────────────────────────────────────────────────────────
describe('auto_tune store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty runs', () => {
      const store = useAutoTuneStore();
      expect(store.runs).toEqual([]);
    });

    it('has empty schedules', () => {
      const store = useAutoTuneStore();
      expect(store.schedules).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useAutoTuneStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchRuns ─────────────────────────────────────────────────────
  describe('fetchRuns()', () => {
    it('sets runs on success', async () => {
      mockedAutoTuneApi.getRuns.mockResolvedValue({ runs: fakeRuns });

      const store = useAutoTuneStore();
      await store.fetchRuns();

      expect(store.runs).toEqual(fakeRuns);
    });

    it('passes params to API', async () => {
      mockedAutoTuneApi.getRuns.mockResolvedValue({ runs: [] });

      const store = useAutoTuneStore();
      await store.fetchRuns({ strategy_id: 'strat-1', limit: 10 });

      expect(mockedAutoTuneApi.getRuns).toHaveBeenCalledWith({ strategy_id: 'strat-1', limit: 10 });
    });

    it('sets runs to empty on failure', async () => {
      mockedAutoTuneApi.getRuns.mockRejectedValue(new Error('fail'));

      const store = useAutoTuneStore();
      await store.fetchRuns();

      expect(store.runs).toEqual([]);
    });
  });

  // ── fetchSchedules ────────────────────────────────────────────────
  describe('fetchSchedules()', () => {
    it('sets schedules on success', async () => {
      mockedAutoTuneApi.getSchedules.mockResolvedValue({ schedules: fakeSchedules });

      const store = useAutoTuneStore();
      await store.fetchSchedules();

      expect(store.schedules).toEqual(fakeSchedules);
    });

    it('sets schedules to empty on failure', async () => {
      mockedAutoTuneApi.getSchedules.mockRejectedValue(new Error('fail'));

      const store = useAutoTuneStore();
      await store.fetchSchedules();

      expect(store.schedules).toEqual([]);
    });
  });

  // ── triggerRun ────────────────────────────────────────────────────
  describe('triggerRun()', () => {
    it('returns API result on success', async () => {
      mockedAutoTuneApi.triggerRun.mockResolvedValue(fakeTriggerResult);

      const store = useAutoTuneStore();
      const result = await store.triggerRun({ strategy_id: 'strat-1' });

      expect(result).toEqual(fakeTriggerResult);
      expect(mockedAutoTuneApi.triggerRun).toHaveBeenCalledWith({ strategy_id: 'strat-1' });
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedAutoTuneApi.triggerRun.mockReturnValue(new Promise((r) => { resolve = r; }) as any);

      const store = useAutoTuneStore();
      const promise = store.triggerRun({ strategy_id: 'strat-1' });

      expect(store.loading).toBe(true);

      resolve(fakeTriggerResult);
      await promise;

      expect(store.loading).toBe(false);
    });

    it('sets error and returns null on failure', async () => {
      mockedAutoTuneApi.triggerRun.mockRejectedValue(new Error('trigger failed'));

      const store = useAutoTuneStore();
      const result = await store.triggerRun({ strategy_id: 'strat-1' });

      expect(result).toBeNull();
      expect(store.error).toBe('trigger failed');
      expect(store.loading).toBe(false);
    });
  });

  // ── confirmRun ────────────────────────────────────────────────────
  describe('confirmRun()', () => {
    it('calls API then fetchRuns', async () => {
      mockedAutoTuneApi.confirmRun.mockResolvedValue({ status: 'confirmed' });
      mockedAutoTuneApi.getRuns.mockResolvedValue({ runs: fakeRuns });

      const store = useAutoTuneStore();
      await store.confirmRun('run-1');

      expect(mockedAutoTuneApi.confirmRun).toHaveBeenCalledWith('run-1');
      expect(mockedAutoTuneApi.getRuns).toHaveBeenCalledOnce();
      expect(store.runs).toEqual(fakeRuns);
    });

    it('silently handles failure', async () => {
      mockedAutoTuneApi.confirmRun.mockRejectedValue(new Error('fail'));

      const store = useAutoTuneStore();
      await store.confirmRun('run-1');

      // Should not throw, runs stay empty
      expect(store.runs).toEqual([]);
    });
  });

  // ── rollbackRun ───────────────────────────────────────────────────
  describe('rollbackRun()', () => {
    it('calls API then fetchRuns', async () => {
      mockedAutoTuneApi.rollbackRun.mockResolvedValue({ status: 'rolled_back' });
      mockedAutoTuneApi.getRuns.mockResolvedValue({ runs: fakeRuns });

      const store = useAutoTuneStore();
      await store.rollbackRun('run-1');

      expect(mockedAutoTuneApi.rollbackRun).toHaveBeenCalledWith('run-1');
      expect(mockedAutoTuneApi.getRuns).toHaveBeenCalledOnce();
      expect(store.runs).toEqual(fakeRuns);
    });

    it('silently handles failure', async () => {
      mockedAutoTuneApi.rollbackRun.mockRejectedValue(new Error('fail'));

      const store = useAutoTuneStore();
      await store.rollbackRun('run-1');

      expect(store.runs).toEqual([]);
    });
  });

  // ── deleteSchedule ────────────────────────────────────────────────
  describe('deleteSchedule()', () => {
    it('calls API then fetchSchedules', async () => {
      mockedAutoTuneApi.deleteSchedule.mockResolvedValue({ deleted: true, schedule_id: 'sched-1' });
      mockedAutoTuneApi.getSchedules.mockResolvedValue({ schedules: fakeSchedules });

      const store = useAutoTuneStore();
      await store.deleteSchedule('sched-1');

      expect(mockedAutoTuneApi.deleteSchedule).toHaveBeenCalledWith('sched-1');
      expect(mockedAutoTuneApi.getSchedules).toHaveBeenCalledOnce();
      expect(store.schedules).toEqual(fakeSchedules);
    });

    it('silently handles failure', async () => {
      mockedAutoTuneApi.deleteSchedule.mockRejectedValue(new Error('fail'));

      const store = useAutoTuneStore();
      await store.deleteSchedule('sched-1');

      expect(store.schedules).toEqual([]);
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('fetches runs and schedules in parallel', async () => {
      mockedAutoTuneApi.getRuns.mockResolvedValue({ runs: fakeRuns });
      mockedAutoTuneApi.getSchedules.mockResolvedValue({ schedules: fakeSchedules });

      const store = useAutoTuneStore();
      await store.fetchAll();

      expect(mockedAutoTuneApi.getRuns).toHaveBeenCalledOnce();
      expect(mockedAutoTuneApi.getSchedules).toHaveBeenCalledOnce();
      expect(store.runs).toEqual(fakeRuns);
      expect(store.schedules).toEqual(fakeSchedules);
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolve!: (v: unknown) => void;
      mockedAutoTuneApi.getRuns.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
      mockedAutoTuneApi.getSchedules.mockResolvedValue({ schedules: [] });

      const store = useAutoTuneStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolve({ runs: [] });
      await promise;

      expect(store.loading).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReplayStore } from '@/stores/replay';
import { replayApi } from '@/api/replay';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/replay', () => ({
  replayApi: {
    run: vi.fn(),
    getTask: vi.fn(),
    getScenarios: vi.fn(),
    getScenario: vi.fn(),
    deleteScenario: vi.fn(),
    getSteps: vi.fn(),
    getStep: vi.fn(),
    getSummary: vi.fn(),
    compare: vi.fn(),
    getTradeContext: vi.fn(),
  },
}));

const mockedApi = vi.mocked(replayApi);

const taskFixture = {
  task_id: 'task-1',
  scenario_id: 'scen-1',
  strategy_id: 'strat-1',
  symbol: 'BTC/USDT',
  status: 'running',
  progress_pct: '0.50',
  created_at: '2026-01-01T00:00:00Z',
  completed_at: null,
};

const scenarioFixture = {
  scenario_id: 'scen-1',
  name: 'Test Scenario',
  description: 'A test scenario',
  symbol: 'BTC/USDT',
  start_time: '2026-01-01T00:00:00Z',
  end_time: '2026-01-02T00:00:00Z',
  config: {},
  created_at: '2026-01-01T00:00:00Z',
};

const stepFixture = {
  step_index: 0,
  timestamp: '2026-01-01T00:00:00Z',
  action: 'buy',
  price: '50000',
  quantity: '1',
  pnl: '0',
  metadata: {},
};

const summaryFixture = {
  task_id: 'task-1',
  total_steps: 10,
  total_pnl: '1000',
  max_drawdown_pct: '5.0',
  sharpe_ratio: '1.5',
  win_rate: '0.6',
  trade_count: 5,
};

describe('replay store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('has null currentTask', () => {
      const store = useReplayStore();
      expect(store.currentTask).toBeNull();
    });

    it('has empty scenarios', () => {
      const store = useReplayStore();
      expect(store.scenarios).toEqual([]);
    });

    it('has empty currentSteps', () => {
      const store = useReplayStore();
      expect(store.currentSteps).toEqual([]);
    });

    it('has null summary', () => {
      const store = useReplayStore();
      expect(store.summary).toBeNull();
    });

    it('has loading false', () => {
      const store = useReplayStore();
      expect(store.loading).toBe(false);
    });

    it('has error null', () => {
      const store = useReplayStore();
      expect(store.error).toBeNull();
    });
  });

  describe('run()', () => {
    it('sets currentTask on success', async () => {
      mockedApi.run.mockResolvedValue({ data: taskFixture });
      const store = useReplayStore();
      const result = await store.run({ strategy_id: 'strat-1', symbol: 'BTC/USDT' });
      expect(store.currentTask).toEqual(taskFixture);
      expect(result.data).toEqual(taskFixture);
      expect(store.loading).toBe(false);
    });

    it('sets error and throws on failure', async () => {
      mockedApi.run.mockRejectedValue(new Error('run failed'));
      const store = useReplayStore();
      await expect(store.run({ strategy_id: 'strat-1', symbol: 'BTC/USDT' })).rejects.toThrow('run failed');
      expect(store.error).toBe('run failed');
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchTask()', () => {
    it('sets currentTask on success', async () => {
      mockedApi.getTask.mockResolvedValue({ data: taskFixture });
      const store = useReplayStore();
      await store.fetchTask('task-1');
      expect(store.currentTask).toEqual(taskFixture);
    });

    it('sets currentTask to null on failure', async () => {
      mockedApi.getTask.mockRejectedValue(new Error('fail'));
      const store = useReplayStore();
      await store.fetchTask('task-1');
      expect(store.currentTask).toBeNull();
    });
  });

  describe('fetchScenarios()', () => {
    it('sets scenarios on success', async () => {
      mockedApi.getScenarios.mockResolvedValue({ data: [scenarioFixture] });
      const store = useReplayStore();
      await store.fetchScenarios();
      expect(store.scenarios).toEqual([scenarioFixture]);
    });

    it('sets empty array on failure', async () => {
      mockedApi.getScenarios.mockRejectedValue(new Error('fail'));
      const store = useReplayStore();
      await store.fetchScenarios();
      expect(store.scenarios).toEqual([]);
    });
  });

  describe('deleteScenario()', () => {
    it('removes scenario from list on success', async () => {
      mockedApi.deleteScenario.mockResolvedValue({ data: { deleted: true } });
      const store = useReplayStore();
      store.scenarios = [scenarioFixture];
      await store.deleteScenario('scen-1');
      expect(store.scenarios).toEqual([]);
    });

    it('sets error and throws on failure', async () => {
      mockedApi.deleteScenario.mockRejectedValue(new Error('delete failed'));
      const store = useReplayStore();
      await expect(store.deleteScenario('scen-1')).rejects.toThrow('delete failed');
      expect(store.error).toBe('delete failed');
    });
  });

  describe('fetchSteps()', () => {
    it('sets currentSteps on success', async () => {
      mockedApi.getSteps.mockResolvedValue({ data: [stepFixture] });
      const store = useReplayStore();
      await store.fetchSteps('scen-1');
      expect(store.currentSteps).toEqual([stepFixture]);
    });

    it('sets empty array on failure', async () => {
      mockedApi.getSteps.mockRejectedValue(new Error('fail'));
      const store = useReplayStore();
      await store.fetchSteps('scen-1');
      expect(store.currentSteps).toEqual([]);
    });
  });

  describe('fetchSummary()', () => {
    it('sets summary on success', async () => {
      mockedApi.getSummary.mockResolvedValue({ data: summaryFixture });
      const store = useReplayStore();
      await store.fetchSummary('task-1');
      expect(store.summary).toEqual(summaryFixture);
    });

    it('sets null on failure', async () => {
      mockedApi.getSummary.mockRejectedValue(new Error('fail'));
      const store = useReplayStore();
      await store.fetchSummary('task-1');
      expect(store.summary).toBeNull();
    });
  });
});

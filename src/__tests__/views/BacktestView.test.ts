import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BacktestView from '@/views/BacktestView.vue';

const mockFetchRuns = vi.fn().mockResolvedValue(undefined);
const mockFetchHistory = vi.fn().mockResolvedValue(undefined);

vi.mock('@/stores/backtest', () => ({
  useBacktestStore: () => ({
    loading: false,
    runs: [],
    history: [],
    currentResult: null,
    currentRun: null,
    currentEquity: [],
    currentTrades: [],
    taskStatus: null,
    taskError: null,
    error: null,
    fetchRuns: mockFetchRuns,
    fetchHistory: mockFetchHistory,
    fetchRunDetails: vi.fn(),
    fetchResult: vi.fn(),
    runBacktest: vi.fn(),
  }),
}));

vi.mock('@/api/backtest', () => ({
  backtestApi: {
    compare: vi.fn().mockResolvedValue([]),
    importResults: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/components/backtest/BacktestResult.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

describe('BacktestView', () => {
  beforeEach(() => {
    mockFetchRuns.mockClear();
    mockFetchHistory.mockClear();
  });

  function mountBacktest() {
    return mount(BacktestView, {
      global: {
        stubs: {
          ATabs: { template: '<div><slot /></div>' },
          ATabPane: { template: '<div><slot /></div>' },
          AModal: { template: '<div><slot /></div>' },
          AAlert: { template: '<div />' },
          AButton: { template: '<button><slot /></button>' },
          AProgress: { template: '<div />' },
        },
      },
    });
  }

  it('renders the .backtest-page container', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.backtest-page').exists()).toBe(true);
  });

  it('calls fetchRuns and fetchHistory on mount', () => {
    mountBacktest();
    expect(mockFetchRuns).toHaveBeenCalledTimes(1);
    expect(mockFetchHistory).toHaveBeenCalledTimes(1);
  });

  it('renders run section', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.run-card').exists()).toBe(true);
  });

  it('does not render BacktestResult when currentResult is null', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.child-stub').exists()).toBe(false);
  });
});

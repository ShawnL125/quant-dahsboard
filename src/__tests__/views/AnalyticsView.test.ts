import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AnalyticsView from '@/views/AnalyticsView.vue';

const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockFetchRoundTrips = vi.fn().mockResolvedValue(undefined);
const mockFetchSignals = vi.fn().mockResolvedValue(undefined);

vi.mock('@/stores/analytics', () => ({
  useAnalyticsStore: () => ({
    loading: false,
    strategyStats: [],
    roundTrips: [],
    roundTripsTotal: 0,
    signals: [],
    signalsTotal: 0,
    consecutiveLosses: null,
    signalQuality: null,
    selectedRoundTrip: null,
    statsHistory: [],
    fetchAll: mockFetchAll,
    fetchRoundTrips: mockFetchRoundTrips,
    fetchSignals: mockFetchSignals,
    fetchRoundTrip: vi.fn(),
    fetchStatsHistory: vi.fn(),
    fetchStrategyStats: vi.fn(),
    fetchStrategyStatsHistory: vi.fn(),
  }),
}));

describe('AnalyticsView', () => {
  beforeEach(() => {
    mockFetchAll.mockClear();
    mockFetchRoundTrips.mockClear();
    mockFetchSignals.mockClear();
  });

  function mountAnalytics() {
    return mount(AnalyticsView, {
      global: {
        stubs: {
          ASpin: { template: '<div><slot /></div>' },
          AModal: { template: '<div><slot /></div>' },
          AButton: { template: '<button><slot /></button>' },
        },
      },
    });
  }

  it('renders the .analytics-page container', () => {
    const wrapper = mountAnalytics();
    expect(wrapper.find('.analytics-page').exists()).toBe(true);
  });

  it('calls fetchAll on mount', async () => {
    mountAnalytics();
    await vi.dynamicImportSettled();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
  });

  it('renders strategy stats section', () => {
    const wrapper = mountAnalytics();
    expect(wrapper.find('.stats-section').exists()).toBe(true);
  });

  it('renders round trips section', () => {
    const wrapper = mountAnalytics();
    expect(wrapper.find('.trips-section').exists()).toBe(true);
  });
});

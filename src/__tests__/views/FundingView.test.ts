import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import FundingView from '@/views/FundingView.vue';

const mockFetchAll = vi.fn();
const mockFetchHistory = vi.fn();
const mockFetchCost = vi.fn();

vi.mock('@/stores/funding', () => ({
  useFundingStore: () => ({
    loading: false,
    currentRates: {},
    historyRates: [],
    costSummary: null,
    error: null,
    fetchAll: mockFetchAll,
    fetchHistory: mockFetchHistory,
    fetchCost: mockFetchCost,
  }),
}));

const mockFetchStrategies = vi.fn();

vi.mock('@/stores/strategies', () => ({
  useStrategiesStore: () => ({
    strategies: [],
    loading: false,
    error: null,
    fetchStrategies: mockFetchStrategies,
  }),
}));

vi.mock('@/api/funding', () => ({
  fundingApi: {
    backfill: vi.fn().mockResolvedValue({ records_fetched: 0 }),
  },
}));

const childStubs = {
  'a-spin': { template: '<div><slot /></div>' },
  'a-button': { template: '<button><slot /></button>' },
  'a-select': { template: '<select><slot /></select>' },
  'a-select-option': { template: '<option><slot /></option>' },
  'a-input': { template: '<input />' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FundingView', () => {
  it('renders .funding-page container', () => {
    const wrapper = shallowMount(FundingView, { global: { stubs: childStubs } });
    expect(wrapper.find('.funding-page').exists()).toBe(true);
  });

  it('calls fetchAll and fetchStrategies on mount', () => {
    shallowMount(FundingView, { global: { stubs: childStubs } });
    expect(mockFetchAll).toHaveBeenCalledOnce();
    expect(mockFetchStrategies).toHaveBeenCalledOnce();
  });

  it('renders current rates section', () => {
    const wrapper = shallowMount(FundingView, { global: { stubs: childStubs } });
    const titles = wrapper.findAll('.section-title');
    expect(titles.some((el) => el.text().includes('Current Funding Rates'))).toBe(true);
  });

  it('renders historical rates section', () => {
    const wrapper = shallowMount(FundingView, { global: { stubs: childStubs } });
    const titles = wrapper.findAll('.section-title');
    expect(titles.some((el) => el.text().includes('Historical Rates'))).toBe(true);
  });
});

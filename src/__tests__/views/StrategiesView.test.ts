import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import StrategiesView from '@/views/StrategiesView.vue';
import StrategyList from '@/components/strategies/StrategyList.vue';

const mockFetchStrategies = vi.fn();
const mockToggleStrategy = vi.fn();
const mockSelectStrategy = vi.fn();
const mockFetchParams = vi.fn();
const mockFetchParamsAudit = vi.fn();
const mockUpdateParams = vi.fn();
const mockReloadStrategies = vi.fn();

const defaultStrategies = [
  { strategy_id: 's1', is_running: true, symbols: ['BTC'], exchanges: ['binance'], timeframes: ['1h'], parameters: {} },
  { strategy_id: 's2', is_running: false, symbols: ['ETH'], exchanges: ['okx'], timeframes: ['4h'], parameters: {} },
];

let mockStrategies = [...defaultStrategies];
let mockError: string | null = null;

vi.mock('@/stores/strategies', () => ({
  useStrategiesStore: () => ({
    get strategies() { return mockStrategies; },
    get error() { return mockError; },
    loading: false,
    fetchStrategies: mockFetchStrategies,
    toggleStrategy: mockToggleStrategy,
    selectStrategy: mockSelectStrategy,
    fetchParams: mockFetchParams,
    fetchParamsAudit: mockFetchParamsAudit,
    updateParams: mockUpdateParams,
    reloadStrategies: mockReloadStrategies,
    params: {},
    paramsSource: '',
    paramsAudit: [],
    selectedStrategy: null,
  }),
}));

const childStubs = {
  StrategyList: {
    template: '<div class="child-stub" />',
    props: ['strategies'],
  },
  'a-alert': { template: '<div class="ant-alert" />' },
  'a-button': { template: '<button><slot /></button>' },
  'a-drawer': { template: '<div><slot /></div>' },
  'a-input': { template: '<input />' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockStrategies = [...defaultStrategies];
  mockError = null;
});

describe('StrategiesView', () => {
  it('renders .strategies-page container', () => {
    const wrapper = mount(StrategiesView, { global: { stubs: childStubs } });
    expect(wrapper.find('.strategies-page').exists()).toBe(true);
  });

  it('calls store.fetchStrategies on mount', () => {
    mount(StrategiesView, { global: { stubs: childStubs } });
    expect(mockFetchStrategies).toHaveBeenCalledOnce();
  });

  it('passes strategies to StrategyList', () => {
    const wrapper = mount(StrategiesView, { global: { stubs: childStubs } });
    const list = wrapper.findComponent(StrategyList);
    expect(list.exists()).toBe(true);
    expect(list.props('strategies')).toEqual(mockStrategies);
  });

  it('displays correct activeCount', () => {
    const wrapper = mount(StrategiesView, { global: { stubs: childStubs } });
    expect(wrapper.find('.active-count').text()).toBe('1 Active');
    expect(wrapper.find('.total-count').text()).toBe('/ 2 Total');
  });

  it('shows error alert when store.error is set', () => {
    mockError = 'Something went wrong';
    const wrapper = mount(StrategiesView, { global: { stubs: childStubs } });
    expect(wrapper.find('.ant-alert').exists()).toBe(true);
  });
});

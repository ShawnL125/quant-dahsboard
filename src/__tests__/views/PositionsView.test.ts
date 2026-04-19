import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PositionsView from '@/views/PositionsView.vue';

let mockFetchPositions: ReturnType<typeof vi.fn>;
let mockPositions: any[];

const defaultPositions = [
  { symbol: 'BTC', exchange: 'binance', side: 'LONG', quantity: '0.5', entry_price: '50000', unrealized_pnl: '100', stop_loss: null, take_profit: null },
  { symbol: 'ETH', exchange: 'binance', side: 'SHORT', quantity: '2', entry_price: '3000', unrealized_pnl: '-50', stop_loss: null, take_profit: null },
];

vi.mock('@/stores/trading', () => ({
  useTradingStore: () => ({
    get positions() { return mockPositions; },
    fetchPositions: mockFetchPositions,
  }),
}));

beforeEach(() => {
  mockFetchPositions = vi.fn();
  mockPositions = [...defaultPositions];
});

function mountView() {
  setActivePinia(createPinia());
  return mount(PositionsView, {
    global: {
      stubs: {
        'a-popconfirm': {
          template: '<div class="a-popconfirm-stub"><slot /></div>',
        },
      },
    },
  });
}

describe('PositionsView', () => {
  it('renders .positions-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.positions-page').exists()).toBe(true);
  });

  it('calls fetchPositions on mount', () => {
    mountView();
    expect(mockFetchPositions).toHaveBeenCalled();
  });

  it('shows "No open positions" when positions are empty', () => {
    mockPositions = [];
    const wrapper = mountView();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toBe('No open positions');
  });

  it('shows profit and loss counts in summary', () => {
    const wrapper = mountView();
    const summaryValues = wrapper.findAll('.summary-value');
    expect(summaryValues[0].text()).toBe('2');
    expect(summaryValues[1].text()).toBe('1');
    expect(summaryValues[2].text()).toBe('1');
  });

  it('computes total unrealized PnL correctly', () => {
    const wrapper = mountView();
    const summaryValues = wrapper.findAll('.summary-value');
    expect(summaryValues[3].text()).toBe('+50.00');
  });
});

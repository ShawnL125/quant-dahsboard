import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, reactive } from 'vue';
import DashboardView from '@/views/DashboardView.vue';

const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockFetchOrders = vi.fn().mockResolvedValue(undefined);
const mockSystemFetchAll = vi.fn().mockResolvedValue(undefined);

let mockOrderHistory: Array<{ order_id: string; status: string }> = [];

vi.mock('@/stores/trading', () => ({
  useTradingStore: () => ({
    loading: false,
    positions: [],
    portfolio: {
      total_equity: '10000',
      available_balance: '5000',
      realized_pnl: '100',
      unrealized_pnl: '50',
    },
    fetchAll: mockFetchAll,
    fetchPositions: vi.fn(),
  }),
}));

vi.mock('@/stores/orders', () => ({
  useOrdersStore: () => ({
    orders: [],
    get orderHistory() {
      return mockOrderHistory;
    },
    fetchOrders: mockFetchOrders,
  }),
}));

vi.mock('@/stores/system', () => ({
  useSystemStore: () => ({
    status: null,
    liveness: null,
    loading: false,
    fetchAll: mockSystemFetchAll,
  }),
}));

vi.mock('@/components/dashboard/StatCards.vue', () => ({
  default: { template: '<div class="child-stub stat-cards" />' },
}));

vi.mock('@/components/dashboard/SystemStatusBar.vue', () => ({
  default: { template: '<div class="child-stub system-status-bar" />' },
}));

vi.mock('@/components/dashboard/EquityChart.vue', () => ({
  default: { template: '<div class="child-stub equity-chart" />' },
}));

vi.mock('@/components/dashboard/PositionsDonut.vue', () => ({
  default: { template: '<div class="child-stub positions-donut" />' },
}));

vi.mock('@/components/dashboard/RecentTrades.vue', () => ({
  default: { template: '<div class="child-stub recent-trades" />' },
}));

describe('DashboardView', () => {
  function mountDashboard() {
    return mount(DashboardView, {
      global: {
        provide: {
          wsConnected: ref(false),
        },
        stubs: {
          ASpin: { template: '<div><slot /></div>' },
        },
      },
    });
  }

  it('renders the .dashboard container', () => {
    const wrapper = mountDashboard();
    expect(wrapper.find('.dashboard').exists()).toBe(true);
  });

  it('calls all three store fetch methods on mount', () => {
    mockFetchAll.mockClear();
    mockFetchOrders.mockClear();
    mockSystemFetchAll.mockClear();
    mountDashboard();
    expect(mockFetchAll).toHaveBeenCalled();
    expect(mockFetchOrders).toHaveBeenCalled();
    expect(mockSystemFetchAll).toHaveBeenCalled();
  });

  it('renders StatCards component', () => {
    const wrapper = mountDashboard();
    expect(wrapper.findAll('.child-stub').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all child component stubs', () => {
    const wrapper = mountDashboard();
    expect(wrapper.findAll('.child-stub')).toHaveLength(5);
  });

  it('recentTrades computed filters FILLED and PARTIALLY_FILLED orders', () => {
    mockOrderHistory = [
      { order_id: '1', status: 'FILLED' },
      { order_id: '2', status: 'PARTIALLY_FILLED' },
      { order_id: '3', status: 'CANCELED' },
      { order_id: '4', status: 'NEW' },
      { order_id: '5', status: 'FILLED' },
    ];

    const wrapper = mountDashboard();
    const recentTrades = wrapper.vm.recentTrades as Array<{ order_id: string; status: string }>;
    expect(recentTrades).toHaveLength(3);
    expect(recentTrades.every((o) => ['FILLED', 'PARTIALLY_FILLED'].includes(o.status))).toBe(true);

    mockOrderHistory = [];
  });
});

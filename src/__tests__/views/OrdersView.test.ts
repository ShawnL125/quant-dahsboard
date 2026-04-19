import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import OrdersView from '@/views/OrdersView.vue';

const mockFetchOrders = vi.fn();

vi.mock('@/stores/orders', () => ({
  useOrdersStore: () => ({
    orders: [],
    openOrders: [],
    orderHistory: [],
    trackedOrders: [],
    slBindings: [],
    trailingStops: [],
    algoOrders: [],
    error: null,
    loading: false,
    fetchOrders: mockFetchOrders,
    fetchOrderHistory: vi.fn(),
    cancelOrder: vi.fn(),
    placeOrder: vi.fn(),
    fetchTrackedOrders: vi.fn(),
    fetchSLBindings: vi.fn(),
    fetchTrailingStops: vi.fn(),
    fetchAlgoOrders: vi.fn(),
    deactivateTrailingStop: vi.fn(),
    submitAlgoOrder: vi.fn(),
    cancelAlgoOrder: vi.fn(),
    pauseAlgoOrder: vi.fn(),
    resumeAlgoOrder: vi.fn(),
  }),
}));

vi.mock('@/components/orders/OrderForm.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

vi.mock('@/components/orders/OpenOrdersTable.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

vi.mock('@/components/orders/OrderHistoryTable.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

describe('OrdersView', () => {
  beforeEach(() => {
    mockFetchOrders.mockClear();
  });

  function mountOrders() {
    return mount(OrdersView, {
      global: {
        stubs: {
          ATabs: { template: '<div class="orders-tabs"><slot /></div>' },
          ATabPane: { template: '<div><slot /></div>' },
          AModal: { template: '<div><slot /></div>' },
          AAlert: { template: '<div />' },
        },
      },
    });
  }

  it('renders the .orders-page container', () => {
    const wrapper = mountOrders();
    expect(wrapper.find('.orders-page').exists()).toBe(true);
  });

  it('calls fetchOrders on mount', () => {
    mountOrders();
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
  });

  it('renders OrderForm component', () => {
    const wrapper = mountOrders();
    const stubs = wrapper.findAll('.child-stub');
    expect(stubs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders tabs area', () => {
    const wrapper = mountOrders();
    expect(wrapper.find('.orders-tabs').exists()).toBe(true);
  });
});

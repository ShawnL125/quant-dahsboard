import { beforeEach, describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Order, OrderEvent } from '@/types';

const mockFetchOrderHistory = vi.fn();
const mockFetchOrderEvents = vi.fn();
const mockOrderEvents = vi.fn(() => ({}));

vi.mock('@/stores/orders', () => ({
  useOrdersStore: () => ({
    fetchOrderHistory: mockFetchOrderHistory,
    fetchOrderEvents: mockFetchOrderEvents,
    get orderEvents() { return mockOrderEvents(); },
  }),
}));

const fakeOrders: Order[] = Array.from({ length: 18 }, (_, i) => ({
  order_id: `hist-${i + 1}`,
  symbol: i % 2 === 0 ? 'BTC/USDT' : 'ETH/USDT',
  exchange: i % 3 === 0 ? 'binance' : 'okx',
  side: i % 2 === 0 ? 'BUY' : 'SELL',
  status: ['FILLED', 'CANCELED', 'PARTIALLY_FILLED', 'REJECTED'][i % 4],
  order_type: i % 2 === 0 ? 'LIMIT' : 'MARKET',
  quantity: String((i + 1) * 0.01),
  price: i % 2 === 0 ? String(10000 + i * 100) : undefined,
  filled_quantity: i % 2 === 0 ? String((i + 1) * 0.01) : '0',
  avg_fill_price: i % 2 === 0 ? String(10000 + i * 50) : undefined,
  created_at: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
}));

const smallOrderSet: Order[] = [
  { order_id: 'hist-a', symbol: 'BTC/USDT', exchange: 'binance', side: 'BUY', status: 'FILLED', order_type: 'LIMIT', quantity: '0.001', price: '10000', filled_quantity: '0.001', avg_fill_price: '10000', created_at: '2026-01-01T00:00:00Z' },
  { order_id: 'hist-b', symbol: 'ETH/USDT', exchange: 'okx', side: 'SELL', status: 'CANCELED', order_type: 'MARKET', quantity: '0.1', created_at: '2026-01-02T00:00:00Z' },
];

const antStubs = {
  'a-input': {
    template: '<input class="ant-input" />',
    props: ['value', 'placeholder'],
  },
  'a-button': {
    template: '<button class="ant-btn" @click="$emit(\'click\')"><slot /></button>',
    props: ['size'],
  },
  'OrderEventTimeline': {
    template: '<div class="event-timeline-stub">Timeline</div>',
    props: ['events', 'loading'],
  },
};

function mountComponent(orders: Order[] = []) {
  return mount(
    { template: '<div><OrderHistoryTable :orders="orders" /></div>' },
    {
      data: () => ({ orders }),
      global: {
        stubs: {
          ...antStubs,
          OrderHistoryTable: false,
        },
      },
    },
  );
}

import OrderHistoryTable from '@/components/orders/OrderHistoryTable.vue';

function mountDirect(orders: Order[] = []) {
  return mount(OrderHistoryTable, {
    props: { orders },
    global: { stubs: antStubs },
  });
}

describe('OrderHistoryTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    mockFetchOrderHistory.mockResolvedValue(undefined);
    mockFetchOrderEvents.mockResolvedValue(undefined);
    mockOrderEvents.mockReturnValue({});
  });

  it('renders .orders-card container', () => {
    const wrapper = mountDirect();
    expect(wrapper.find('.orders-card').exists()).toBe(true);
  });

  it('renders table rows for orders', () => {
    const wrapper = mountDirect(smallOrderSet);
    const rows = wrapper.findAll('.history-row');
    expect(rows).toHaveLength(2);
  });

  it('shows empty state when no orders', () => {
    const wrapper = mountDirect([]);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toContain('No order history');
  });

  it('shows .pagination when orders exceed pageSize', () => {
    const wrapper = mountDirect(fakeOrders);
    expect(wrapper.find('.pagination').exists()).toBe(true);
  });

  it('hides .pagination when orders fit in one page', () => {
    const wrapper = mountDirect(smallOrderSet);
    expect(wrapper.find('.pagination').exists()).toBe(false);
  });

  it('renders .filter-bar with symbol and exchange inputs', () => {
    const wrapper = mountDirect(smallOrderSet);
    expect(wrapper.find('.filter-bar').exists()).toBe(true);
    const inputs = wrapper.findAll('.ant-input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('toggles .expand-row on row click', async () => {
    mockOrderEvents.mockReturnValue({});
    const wrapper = mountDirect(smallOrderSet);
    expect(wrapper.findAll('.expand-row')).toHaveLength(0);

    const firstRow = wrapper.findAll('.history-row')[0];
    await firstRow.trigger('click');

    expect(wrapper.findAll('.expand-row')).toHaveLength(1);

    await firstRow.trigger('click');
    expect(wrapper.findAll('.expand-row')).toHaveLength(0);
  });

  it('shows .status-filled for FILLED orders', () => {
    const wrapper = mountDirect(smallOrderSet);
    const pills = wrapper.findAll('.status-pill');
    const filled = pills.find((p) => p.classes('status-filled'));
    expect(filled).toBeTruthy();
    expect(filled!.text()).toBe('FILLED');
  });

  it('shows .status-canceled for CANCELED orders', () => {
    const wrapper = mountDirect(smallOrderSet);
    const pills = wrapper.findAll('.status-pill');
    const canceled = pills.find((p) => p.classes('status-canceled'));
    expect(canceled).toBeTruthy();
    expect(canceled!.text()).toBe('CANCELED');
  });

  it('shows .status-default for unknown statuses', () => {
    const orders: Order[] = [
      { order_id: 'h-x', symbol: 'BTC/USDT', exchange: 'binance', side: 'BUY', status: 'REJECTED', order_type: 'LIMIT', quantity: '0.001', created_at: '2026-01-01T00:00:00Z' },
    ];
    const wrapper = mountDirect(orders);
    const pills = wrapper.findAll('.status-pill');
    const defaultPill = pills.find((p) => p.classes('status-default'));
    expect(defaultPill).toBeTruthy();
    expect(defaultPill!.text()).toBe('REJECTED');
  });

  it('calls fetchOrderEvents on row expand', async () => {
    mockOrderEvents.mockReturnValue({});
    const wrapper = mountDirect(smallOrderSet);
    const firstRow = wrapper.findAll('.history-row')[0];
    await firstRow.trigger('click');

    expect(mockFetchOrderEvents).toHaveBeenCalledWith('hist-a');
  });

  it('renders .page-info with correct range', () => {
    const wrapper = mountDirect(fakeOrders);
    const pageInfo = wrapper.find('.page-info');
    expect(pageInfo.text()).toContain('1-15 of 18');
  });
});

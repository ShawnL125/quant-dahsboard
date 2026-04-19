import { beforeEach, describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import OpenOrdersTable from '@/components/orders/OpenOrdersTable.vue';
import type { Order } from '@/types';

const fakeOrders: Order[] = [
  { order_id: 'ord-1', symbol: 'BTC/USDT', exchange: 'binance', side: 'BUY', status: 'OPEN', order_type: 'LIMIT', quantity: '0.001', price: '10000', filled_quantity: '0', created_at: '2026-01-01T00:00:00Z' },
  { order_id: 'ord-2', symbol: 'ETH/USDT', exchange: 'binance', side: 'SELL', status: 'OPEN', order_type: 'MARKET', quantity: '0.1', created_at: '2026-01-01T00:00:00Z' },
];

const antStubs = {
  'a-popconfirm': {
    template: '<div class="ant-popconfirm" @confirm="$emit(\'confirm\')"><slot /></div>',
  },
};

function mountComponent(orders: Order[] = []) {
  return mount(OpenOrdersTable, {
    props: { orders },
    global: { stubs: antStubs },
  });
}

describe('OpenOrdersTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('renders .orders-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.orders-card').exists()).toBe(true);
  });

  it('renders .empty-state when orders is empty', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toContain('No open orders');
  });

  it('renders .data-table when orders exist', () => {
    const wrapper = mountComponent(fakeOrders);
    expect(wrapper.find('.data-table').exists()).toBe(true);
    expect(wrapper.find('.empty-state').exists()).toBe(false);
  });

  it('renders a table row for each order', () => {
    const wrapper = mountComponent(fakeOrders);
    const rows = wrapper.findAll('.data-table tbody tr');
    expect(rows).toHaveLength(2);
  });

  it('renders order symbols in rows', () => {
    const wrapper = mountComponent(fakeOrders);
    expect(wrapper.text()).toContain('BTC/USDT');
    expect(wrapper.text()).toContain('ETH/USDT');
  });

  it('shows .side-buy for BUY orders', () => {
    const wrapper = mountComponent(fakeOrders);
    const buyPill = wrapper.findAll('.side-pill').find((el) => el.classes('side-buy'));
    expect(buyPill).toBeTruthy();
    expect(buyPill!.text()).toBe('BUY');
  });

  it('shows .side-sell for SELL orders', () => {
    const wrapper = mountComponent(fakeOrders);
    const sellPill = wrapper.findAll('.side-pill').find((el) => el.classes('side-sell'));
    expect(sellPill).toBeTruthy();
    expect(sellPill!.text()).toBe('SELL');
  });

  it('renders .cancel-btn per row', () => {
    const wrapper = mountComponent(fakeOrders);
    const cancelBtns = wrapper.findAll('.cancel-btn');
    expect(cancelBtns).toHaveLength(2);
    expect(cancelBtns[0].text()).toBe('Cancel');
  });

  it('wraps cancel-btn inside a-popconfirm stub', () => {
    const wrapper = mountComponent(fakeOrders);
    const popconfirms = wrapper.findAll('.ant-popconfirm');
    expect(popconfirms).toHaveLength(2);
    expect(popconfirms[0].find('.cancel-btn').exists()).toBe(true);
  });

  it('emits cancel event when popconfirm confirm is triggered', async () => {
    const wrapper = mountComponent(fakeOrders);
    const firstPopconfirm = wrapper.findAll('.ant-popconfirm')[0];
    await firstPopconfirm.trigger('confirm');

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('cancel')![0]).toEqual([fakeOrders[0]]);
  });
});

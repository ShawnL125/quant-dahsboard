import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RecentTrades from '@/components/dashboard/RecentTrades.vue';
import type { Order } from '@/types';

const fakeTrades: Order[] = [
  {
    order_id: 'o1', symbol: 'BTC/USDT', side: 'BUY', type: 'limit',
    quantity: '0.5', price: '50000', status: 'filled',
    created_at: '2026-01-01T10:00:00Z', filled_quantity: '0.5', avg_fill_price: '49900',
  },
  {
    order_id: 'o2', symbol: 'ETH/USDT', side: 'SELL', type: 'market',
    quantity: '2.0', price: '3000', status: 'filled',
    created_at: '2026-01-01T11:00:00Z', filled_quantity: '2.0', avg_fill_price: '3010',
  },
];

const routerLinkStub = {
  props: ['to'],
  template: '<a class="router-link"><slot /></a>',
};

function mountComponent(trades: Order[] = fakeTrades) {
  return mount(RecentTrades, {
    props: { trades },
    global: { stubs: { 'router-link': routerLinkStub } },
  });
}

describe('RecentTrades', () => {
  it('renders .trades-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.trades-card').exists()).toBe(true);
  });

  it('shows title "Recent Trades" and View All link', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.trades-title').text()).toBe('Recent Trades');
    const link = wrapper.find('.trades-link');
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain('View All');
  });

  it('renders trades-table when trades exist', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.trades-table').exists()).toBe(true);
    expect(wrapper.find('.trades-empty').exists()).toBe(false);
  });

  it('shows trades-empty when no trades', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.find('.trades-empty').exists()).toBe(true);
    expect(wrapper.find('.trades-table').exists()).toBe(false);
    expect(wrapper.text()).toContain('No recent trades');
  });

  it('applies side-buy for BUY and side-sell for SELL', () => {
    const wrapper = mountComponent();
    const pills = wrapper.findAll('.side-pill');
    expect(pills[0].classes()).toContain('side-buy');
    expect(pills[0].text()).toBe('BUY');
    expect(pills[1].classes()).toContain('side-sell');
    expect(pills[1].text()).toBe('SELL');
  });

  it('shows at most 5 trades', () => {
    const manyTrades: Order[] = Array.from({ length: 8 }, (_, i) => ({
      order_id: `o${i}`,
      symbol: `SYM${i}/USDT`,
      side: i % 2 === 0 ? 'BUY' : 'SELL',
      type: 'limit',
      quantity: '1',
      price: '100',
      status: 'filled',
      created_at: `2026-01-01T${String(i).padStart(2, '0')}:00:00Z`,
    }));
    const wrapper = mountComponent(manyTrades);
    const rows = wrapper.findAll('.trades-table tbody tr');
    expect(rows).toHaveLength(5);
  });

  it('shows dash for missing created_at', () => {
    const tradeNoDate: Order[] = [
      {
        order_id: 'o-no-date', symbol: 'BTC/USDT', side: 'BUY', type: 'market',
        quantity: '1', price: '50000', status: 'filled',
      },
    ];
    const wrapper = mountComponent(tradeNoDate);
    const timeCell = wrapper.findAll('.trades-table tbody tr')[0].findAll('td')[4];
    expect(timeCell.text()).toBe('-');
  });
});

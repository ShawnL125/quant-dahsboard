import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BacktestTrades from '@/components/backtest/BacktestTrades.vue';
import type { BacktestTrade } from '@/types';

const fakeTrades: BacktestTrade[] = [
  {
    run_id: 'r1', symbol: 'BTC/USDT', exchange: 'binance', side: 'BUY',
    entry_time: '2026-01-01T00:00:00Z', exit_time: '2026-01-01T01:00:00Z',
    entry_price: '50000.00', exit_price: '51000.00', quantity: '0.1', pnl: '100.00',
  },
  {
    run_id: 'r1', symbol: 'ETH/USDT', exchange: 'binance', side: 'SELL',
    entry_time: '2026-01-01T02:00:00Z', exit_time: '2026-01-01T03:00:00Z',
    entry_price: '3000.00', exit_price: '2950.00', quantity: '1.0', pnl: '-50.00',
  },
];

function mountComponent(trades: BacktestTrade[] = fakeTrades) {
  return mount(BacktestTrades, { props: { trades } });
}

describe('BacktestTrades', () => {
  it('renders .trades-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.trades-card').exists()).toBe(true);
  });

  it('shows card-title Trades', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.card-title').text()).toBe('Trades');
  });

  it('shows badge with trade count when trades exist', () => {
    const wrapper = mountComponent();
    const badge = wrapper.find('.card-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('2');
  });

  it('renders data-table when trades exist', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.data-table').exists()).toBe(true);
    expect(wrapper.find('.empty-state').exists()).toBe(false);
  });

  it('renders correct number of trade rows', () => {
    const wrapper = mountComponent();
    const rows = wrapper.findAll('.data-table tbody tr');
    expect(rows.length).toBe(2);
  });

  it('shows symbol in bold', () => {
    const wrapper = mountComponent();
    const firstSymbol = wrapper.findAll('.text-bold')[0];
    expect(firstSymbol.text()).toBe('BTC/USDT');
  });

  it('shows side pill with correct class', () => {
    const wrapper = mountComponent();
    const pills = wrapper.findAll('.side-pill');
    expect(pills[0].classes()).toContain('side-buy');
    expect(pills[1].classes()).toContain('side-sell');
  });

  it('applies text-success for positive P&L and text-error for negative', () => {
    const wrapper = mountComponent();
    const cells = wrapper.findAll('.data-table tbody tr');
    const pnl0 = cells[0].findAll('td')[5];
    const pnl1 = cells[1].findAll('td')[5];
    expect(pnl0.classes()).toContain('text-success');
    expect(pnl1.classes()).toContain('text-error');
  });

  it('formats positive P&L with + prefix', () => {
    const wrapper = mountComponent();
    const cells = wrapper.findAll('.data-table tbody tr');
    const pnl0 = cells[0].findAll('td')[5];
    expect(pnl0.text()).toContain('+100.00');
  });

  it('shows empty-state when no trades', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.data-table').exists()).toBe(false);
    expect(wrapper.text()).toContain('No trades');
  });

  it('does not show badge when no trades', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.find('.card-badge').exists()).toBe(false);
  });
});

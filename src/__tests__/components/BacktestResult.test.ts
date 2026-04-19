import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('@/utils/chart-theme', () => ({
  CHART_COLORS: {},
  LINE_SERIES_DEFAULTS: {},
  CHART_GRID: {},
  CHART_TOOLTIP: {},
}));

import BacktestResultComponent from '@/components/backtest/BacktestResult.vue';
import type { BacktestResult, BacktestEquityPoint, BacktestTrade } from '@/types';

const fakeResult: BacktestResult = {
  group_id: 'grp-1',
  total_return_pct: '12.5',
  sharpe_ratio: '1.85',
  calmar_ratio: '2.1',
  max_drawdown_pct: '-8.3',
  win_rate: '62.5',
  total_trades: 48,
};

const fakeEquity: BacktestEquityPoint[] = [
  { run_id: 'r1', timestamp: '2026-01-01', equity: '100000' },
  { run_id: 'r1', timestamp: '2026-01-02', equity: '105000' },
];

const fakeTrades: BacktestTrade[] = [
  {
    run_id: 'r1', symbol: 'BTC/USDT', exchange: 'binance', side: 'BUY',
    entry_time: '2026-01-01T00:00:00Z', exit_time: '2026-01-01T01:00:00Z',
    entry_price: '50000.00', exit_price: '51000.00', quantity: '0.1', pnl: '100.00',
  },
];

function mountComponent(
  result: BacktestResult | null = fakeResult,
  equity: BacktestEquityPoint[] = fakeEquity,
  trades: BacktestTrade[] = fakeTrades,
) {
  return shallowMount(BacktestResultComponent, {
    props: { result, equity, trades },
  });
}

describe('BacktestResult', () => {
  it('shows empty-state when result is null', () => {
    const wrapper = mountComponent(null);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('No result to display');
  });

  it('renders detail-card when result is provided', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.detail-card').exists()).toBe(true);
  });

  it('shows group_id', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('grp-1');
  });

  it('shows total return with positive class', () => {
    const wrapper = mountComponent();
    const detailRows = wrapper.findAll('.detail-row');
    const returnRow = detailRows.find(r => r.text().includes('Total Return'));
    expect(returnRow).toBeDefined();
    const value = returnRow!.find('.detail-value');
    expect(value.classes()).toContain('text-success');
    expect(value.text()).toContain('12.50%');
  });

  it('shows total return with error class for negative returns', () => {
    const negative = { ...fakeResult, total_return_pct: '-5.3' };
    const wrapper = mountComponent(negative);
    const detailRows = wrapper.findAll('.detail-row');
    const returnRow = detailRows.find(r => r.text().includes('Total Return'));
    const value = returnRow!.find('.detail-value');
    expect(value.classes()).toContain('text-error');
  });

  it('shows Sharpe and Calmar ratios', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('1.85');
    expect(wrapper.text()).toContain('2.10');
  });

  it('shows max drawdown with text-error class', () => {
    const wrapper = mountComponent();
    const detailRows = wrapper.findAll('.detail-row');
    const ddRow = detailRows.find(r => r.text().includes('Max Drawdown'));
    expect(ddRow).toBeDefined();
    const value = ddRow!.findAll('.detail-value')[0];
    expect(value.classes()).toContain('text-error');
  });

  it('shows win rate and total trades', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('62.5%');
    expect(wrapper.text()).toContain('48');
  });
});

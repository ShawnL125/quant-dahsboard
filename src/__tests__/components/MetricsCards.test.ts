import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricsCards from '@/components/backtest/MetricsCards.vue';
import type { BacktestResult } from '@/types';

const positiveResult: BacktestResult = {
  group_id: 'g1',
  total_return_pct: '15.5',
  max_drawdown_pct: '-8.3',
  sharpe_ratio: '1.45',
  calmar_ratio: '2.1',
  win_rate: '62.5',
  total_trades: 42,
};

const negativeResult: BacktestResult = {
  group_id: 'g2',
  total_return_pct: '-12.3',
  max_drawdown_pct: '-25.1',
  sharpe_ratio: '-0.5',
  calmar_ratio: '-1.2',
  win_rate: '35.0',
  total_trades: 18,
};

function mountComponent(result: BacktestResult = positiveResult) {
  return mount(MetricsCards, { props: { result } });
}

describe('MetricsCards', () => {
  it('renders .metrics-grid container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.metrics-grid').exists()).toBe(true);
  });

  it('renders exactly 6 metric cards', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.metric-card');
    expect(cards).toHaveLength(6);
  });

  it('displays all 6 metric labels', () => {
    const wrapper = mountComponent();
    const labels = wrapper.findAll('.metric-label').map((el) => el.text());
    expect(labels).toEqual([
      'Total Return',
      'Max Drawdown',
      'Sharpe Ratio',
      'Win Rate',
      'Total Trades',
      'Calmar Ratio',
    ]);
  });

  it('applies success color for positive total return', () => {
    const wrapper = mountComponent(positiveResult);
    const values = wrapper.findAll('.metric-value');
    const totalReturnValue = values[0];
    expect(totalReturnValue.attributes('style')).toContain('var(--q-success)');
  });

  it('applies error color for negative total return', () => {
    const wrapper = mountComponent(negativeResult);
    const values = wrapper.findAll('.metric-value');
    const totalReturnValue = values[0];
    expect(totalReturnValue.attributes('style')).toContain('var(--q-error)');
  });

  it('applies error color for max drawdown', () => {
    const wrapper = mountComponent(positiveResult);
    const values = wrapper.findAll('.metric-value');
    const drawdownValue = values[1];
    expect(drawdownValue.attributes('style')).toContain('var(--q-error)');
  });

  it('displays metric values correctly', () => {
    const wrapper = mountComponent(positiveResult);
    const values = wrapper.findAll('.metric-value').map((el) => el.text());
    expect(values[0]).toBe('15.50%');
    expect(values[1]).toBe('-8.30%');
    expect(values[2]).toBe('1.45');
    expect(values[3]).toBe('62.5%');
    expect(values[4]).toBe('42');
    expect(values[5]).toBe('2.10');
  });
});

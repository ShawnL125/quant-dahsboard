import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

vi.mock('echarts/core', () => ({ use: vi.fn() }));
vi.mock('echarts/charts', () => ({ LineChart: {} }));
vi.mock('echarts/components', () => ({ GridComponent: {}, TooltipComponent: {} }));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: {} }));
vi.mock('vue-echarts', () => ({
  default: defineComponent({
    name: 'VChart',
    props: ['option'],
    render() { return h('div', { class: 'v-chart-stub' }); },
  }),
}));
vi.mock('@/utils/chart-theme', () => ({
  CHART_COLORS: {},
  LINE_SERIES_DEFAULTS: {},
  CHART_GRID: {},
  CHART_TOOLTIP: {},
}));

import EquityCurve from '@/components/backtest/EquityCurve.vue';
import type { BacktestEquityPoint } from '@/types';

function makePoint(overrides: Partial<BacktestEquityPoint> = {}): BacktestEquityPoint {
  return {
    run_id: 'run-1',
    timestamp: '2026-04-01T00:00:00Z',
    equity: '10000',
    ...overrides,
  };
}

const points: BacktestEquityPoint[] = [
  makePoint({ timestamp: '2026-04-01T00:00:00Z', equity: '10000' }),
  makePoint({ timestamp: '2026-04-02T00:00:00Z', equity: '10500' }),
  makePoint({ timestamp: '2026-04-03T00:00:00Z', equity: '10200' }),
];

function mountComponent(pts: BacktestEquityPoint[] = points) {
  return mount(EquityCurve, {
    props: { points: pts },
  });
}

describe('EquityCurve', () => {
  it('renders .chart-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.chart-card').exists()).toBe(true);
  });

  it('shows header with Equity Curve title and point count', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.chart-title').text()).toBe('Equity Curve');
    expect(wrapper.find('.chart-range').text()).toBe('3 points');
  });

  it('shows v-chart when more than one point', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.v-chart-stub').exists()).toBe(true);
    expect(wrapper.find('.chart-empty').exists()).toBe(false);
  });

  it('shows .chart-empty when no points', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.find('.chart-empty').exists()).toBe(true);
    expect(wrapper.find('.v-chart-stub').exists()).toBe(false);
    expect(wrapper.find('.chart-empty').text()).toBe('No equity data');
  });

  it('shows .chart-empty when exactly one point', () => {
    const wrapper = mountComponent([makePoint()]);
    expect(wrapper.find('.chart-empty').exists()).toBe(true);
    expect(wrapper.find('.chart-range').text()).toBe('1 points');
  });

  it('passes chart option with correct series data parsed from equity strings', () => {
    const wrapper = mountComponent();
    const chartStub = wrapper.findComponent({ name: 'VChart' });
    const option = chartStub.props('option') as any;
    expect(option.series[0].data).toEqual([10000, 10500, 10200]);
    expect(option.series[0].type).toBe('line');
    expect(option.series[0].name).toBe('Equity');
    expect(option.xAxis.type).toBe('category');
    expect(option.xAxis.data).toHaveLength(3);
  });
});

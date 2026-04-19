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

import EquityChart from '@/components/dashboard/EquityChart.vue';

const timestamps = ['2026-04-01', '2026-04-02', '2026-04-03'];
const values = [10000, 10500, 10200];

function mountComponent(ts: string[] = timestamps, vals: number[] = values) {
  return mount(EquityChart, {
    props: { timestamps: ts, values: vals },
  });
}

describe('EquityChart', () => {
  it('renders .chart-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.chart-card').exists()).toBe(true);
  });

  it('shows header with Equity title and Last 30 days range', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.chart-title').text()).toBe('Equity Curve');
    expect(wrapper.find('.chart-range').text()).toBe('Last 30 days');
  });

  it('shows v-chart when values exist', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.v-chart-stub').exists()).toBe(true);
    expect(wrapper.find('.chart-empty').exists()).toBe(false);
  });

  it('shows .chart-empty when values are empty', () => {
    const wrapper = mountComponent([], []);
    expect(wrapper.find('.chart-empty').exists()).toBe(true);
    expect(wrapper.find('.v-chart-stub').exists()).toBe(false);
    expect(wrapper.find('.chart-empty').text()).toBe('No equity data yet');
  });

  it('passes chart option to v-chart stub with correct series data', () => {
    const wrapper = mountComponent();
    const chartStub = wrapper.findComponent({ name: 'VChart' });
    const option = chartStub.props('option') as any;
    expect(option.series[0].data).toEqual(values);
    expect(option.series[0].type).toBe('line');
    expect(option.series[0].name).toBe('Equity');
    expect(option.xAxis.data).toEqual(timestamps);
    expect(option.xAxis.type).toBe('category');
  });
});

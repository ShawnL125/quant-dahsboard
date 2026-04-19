import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

// Mock echarts modules before importing the component to prevent canvas errors in happy-dom
vi.mock('echarts/core', () => ({ use: vi.fn() }));
vi.mock('echarts/charts', () => ({ LineChart: {} }));
vi.mock('echarts/components', () => ({ GridComponent: {}, TooltipComponent: {}, MarkLineComponent: {} }));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: {} }));
vi.mock('vue-echarts', () => ({
  default: defineComponent({
    name: 'VChart',
    props: ['option'],
    render() { return h('div', { class: 'v-chart-stub' }); },
  }),
}));
vi.mock('@/utils/chart-theme', () => ({
  CHART_GRID: {},
  CHART_TOOLTIP: {},
}));

import DrawdownChart from '@/components/risk/DrawdownChart.vue';
import type { DrawdownData, DrawdownPoint } from '@/types';

const fakeDrawdown: DrawdownData = {
  current_pct: 3.5, peak_equity: 100000, max_threshold: 15, reduce_threshold: 8, size_scale: 1.0,
};

const fakeHistory: DrawdownPoint[] = [
  { time: 1700000000, value: -2.1 },
  { time: 1700003600, value: -3.5 },
  { time: 1700007200, value: -1.8 },
];

function mountComponent(drawdown: DrawdownData | null = fakeDrawdown, history: DrawdownPoint[] = fakeHistory) {
  return mount(DrawdownChart, {
    props: { drawdown, history },
  });
}

describe('DrawdownChart', () => {
  it('renders .chart-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.chart-card').exists()).toBe(true);
  });

  it('shows .value-ok when drawdown is <= 5%', () => {
    const wrapper = mountComponent();
    const valueEl = wrapper.find('.chart-value');
    expect(valueEl.classes()).toContain('value-ok');
    expect(valueEl.text()).toContain('3.5%');
  });

  it('shows .value-warn when drawdown is > 5%', () => {
    const highDrawdown: DrawdownData = {
      ...fakeDrawdown, current_pct: 7.2,
    };
    const wrapper = mountComponent(highDrawdown);
    const valueEl = wrapper.find('.chart-value');
    expect(valueEl.classes()).toContain('value-warn');
    expect(valueEl.text()).toContain('7.2%');
  });

  it('shows chart when history has > 1 point', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.v-chart-stub').exists()).toBe(true);
    expect(wrapper.find('.chart-empty').exists()).toBe(false);
  });

  it('shows .chart-empty when history has <= 1 point', () => {
    const wrapper = mountComponent(fakeDrawdown, [{ time: 1700000000, value: -1.0 }]);
    expect(wrapper.find('.chart-empty').exists()).toBe(true);
    expect(wrapper.find('.v-chart-stub').exists()).toBe(false);
    expect(wrapper.text()).toContain('Collecting drawdown data');
  });

  it('shows .chart-empty when history is empty', () => {
    const wrapper = mountComponent(fakeDrawdown, []);
    expect(wrapper.find('.chart-empty').exists()).toBe(true);
  });

  it('handles null drawdown gracefully', () => {
    const wrapper = mountComponent(null, fakeHistory);
    const valueEl = wrapper.find('.chart-value');
    expect(valueEl.text()).toContain('0.0%');
    expect(valueEl.classes()).toContain('value-ok');
  });

  describe('chartOption computed', () => {
    it('generates series data with negated values', () => {
      const wrapper = mountComponent();
      const chartStub = wrapper.findComponent({ name: 'VChart' });
      const option = chartStub.props('option') as any;
      expect(option.series[0].data).toEqual([2.1, 3.5, 1.8]);
    });

    it('generates xAxis data from timestamps', () => {
      const wrapper = mountComponent();
      const chartStub = wrapper.findComponent({ name: 'VChart' });
      const option = chartStub.props('option') as any;
      expect(option.xAxis.data).toHaveLength(3);
      expect(option.xAxis.type).toBe('category');
    });

    it('includes markLines for HALT and REDUCE thresholds', () => {
      const wrapper = mountComponent();
      const chartStub = wrapper.findComponent({ name: 'VChart' });
      const option = chartStub.props('option') as any;
      const markLineData = option.series[0].markLine.data;
      expect(markLineData).toHaveLength(2);
      expect(markLineData[0].yAxis).toBe(-15);
      expect(markLineData[0].label.formatter).toBe('HALT');
      expect(markLineData[1].yAxis).toBe(-8);
      expect(markLineData[1].label.formatter).toBe('REDUCE');
    });

    it('omits markLines when thresholds are zero', () => {
      const noThresholdDrawdown: DrawdownData = {
        current_pct: 2, peak_equity: 100000, max_threshold: 0, reduce_threshold: 0, size_scale: 1,
      };
      const wrapper = mountComponent(noThresholdDrawdown);
      const chartStub = wrapper.findComponent({ name: 'VChart' });
      const option = chartStub.props('option') as any;
      expect(option.series[0].markLine.data).toHaveLength(0);
    });
  });
});

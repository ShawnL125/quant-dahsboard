import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('echarts/core', () => ({ use: vi.fn() }));
vi.mock('echarts/charts', () => ({ PieChart: {} }));
vi.mock('echarts/components', () => ({ TooltipComponent: {} }));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: {} }));
vi.mock('vue-echarts', () => ({
  default: defineComponent({
    name: 'VChart',
    props: ['option'],
    render() { return h('div', { class: 'v-chart-stub' }); },
  }),
}));

import PositionsDonut from '@/components/dashboard/PositionsDonut.vue';
import type { Position } from '@/types';

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    symbol: 'BTC/USDT',
    exchange: 'binance',
    side: 'long',
    quantity: '0.1',
    entry_price: '50000',
    unrealized_pnl: '0',
    ...overrides,
  };
}

function mountComponent(positions: Position[] = []) {
  return mount(PositionsDonut, {
    props: { positions },
  });
}

describe('PositionsDonut', () => {
  it('renders .donut-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.donut-card').exists()).toBe(true);
  });

  it('shows .donut-empty when no positions', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.donut-empty').exists()).toBe(true);
    expect(wrapper.find('.donut-empty').text()).toBe('No open positions');
    expect(wrapper.find('.v-chart-stub').exists()).toBe(false);
  });

  it('computes profit, loss, and neutral counts correctly', () => {
    const positions = [
      makePosition({ unrealized_pnl: '100' }),
      makePosition({ unrealized_pnl: '50' }),
      makePosition({ unrealized_pnl: '-30' }),
      makePosition({ unrealized_pnl: '0' }),
    ];
    const wrapper = mountComponent(positions);
    const legendItems = wrapper.findAll('.legend-item');
    const labels = legendItems.map((item) => item.find('.legend-label').text());
    const counts = legendItems.map((item) => item.find('.legend-count').text());
    expect(labels).toEqual(['Profit', 'Open', 'Loss']);
    expect(counts).toEqual(['2', '1', '1']);
  });

  it('shows v-chart donut when positions exist', () => {
    const positions = [makePosition({ unrealized_pnl: '10' })];
    const wrapper = mountComponent(positions);
    expect(wrapper.find('.v-chart-stub').exists()).toBe(true);
    expect(wrapper.find('.donut-empty').exists()).toBe(false);
  });

  it('renders legend items with correct labels', () => {
    const positions = [
      makePosition({ unrealized_pnl: '5' }),
      makePosition({ unrealized_pnl: '-3' }),
      makePosition({ unrealized_pnl: '0' }),
    ];
    const wrapper = mountComponent(positions);
    const legendLabels = wrapper.findAll('.legend-label').map((el) => el.text());
    expect(legendLabels).toEqual(['Profit', 'Open', 'Loss']);
  });

  it('passes chart option with pie series and correct data segments', () => {
    const positions = [
      makePosition({ unrealized_pnl: '200' }),
      makePosition({ unrealized_pnl: '-50' }),
      makePosition({ unrealized_pnl: '0' }),
    ];
    const wrapper = mountComponent(positions);
    const chartStub = wrapper.findComponent({ name: 'VChart' });
    const option = chartStub.props('option') as any;
    expect(option.series[0].type).toBe('pie');
    expect(option.series[0].radius).toEqual(['55%', '80%']);
    const dataNames = option.series[0].data.map((d: any) => d.name);
    expect(dataNames).toEqual(['Profit', 'Open', 'Loss']);
    const dataValues = option.series[0].data.map((d: any) => d.value);
    expect(dataValues).toEqual([1, 1, 1]);
  });

  it('navigates to /positions on card click', async () => {
    mockPush.mockClear();
    const wrapper = mountComponent();
    await wrapper.find('.donut-card').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/positions');
  });
});

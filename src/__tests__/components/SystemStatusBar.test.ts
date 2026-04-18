import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SystemStatusBar from '@/components/dashboard/SystemStatusBar.vue';

const defaultSlots = {
  exchanges: ['binance', 'kraken'],
  runningStrategies: 3,
  totalStrategies: 5,
  uptime: 90500, // ~1d 1h 8m
};

function mountComponent(propsOverrides: Record<string, unknown> = {}) {
  return mount(SystemStatusBar, {
    props: { ...defaultSlots, ...propsOverrides },
  });
}

describe('SystemStatusBar', () => {
  it('renders exchange count pill', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('2 Exchanges');
  });

  it('renders strategy count pill', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('3 / 5 Strategies');
  });

  it('renders uptime in formatted form', () => {
    const wrapper = mountComponent({ uptime: 90500 });
    // 90500s = 1d 1h 8m
    expect(wrapper.text()).toContain('1d 1h 8m');
  });

  it('formats uptime as hours and minutes when less than a day', () => {
    const wrapper = mountComponent({ uptime: 7500 });
    // 7500s = 2h 5m
    expect(wrapper.text()).toContain('2h 5m');
  });

  it('formats uptime as minutes only when less than an hour', () => {
    const wrapper = mountComponent({ uptime: 180 });
    // 180s = 3m
    expect(wrapper.text()).toContain('3m');
  });

  it('handles zero uptime', () => {
    const wrapper = mountComponent({ uptime: 0 });
    expect(wrapper.text()).toContain('0s');
  });

  it('handles negative uptime', () => {
    const wrapper = mountComponent({ uptime: -100 });
    expect(wrapper.text()).toContain('0s');
  });

  it('shows correct count with empty exchanges array', () => {
    const wrapper = mountComponent({ exchanges: [] });
    expect(wrapper.text()).toContain('0 Exchanges');
  });

  it('shows 0 running strategies correctly', () => {
    const wrapper = mountComponent({ runningStrategies: 0 });
    expect(wrapper.text()).toContain('0 / 5 Strategies');
  });

  it('renders three status pills', () => {
    const wrapper = mountComponent();
    const pills = wrapper.findAll('.status-pill');
    expect(pills).toHaveLength(3);
  });
});

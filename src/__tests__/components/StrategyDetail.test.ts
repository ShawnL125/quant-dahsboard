import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StrategyDetail from '@/components/strategies/StrategyDetail.vue';
import type { Strategy } from '@/types';

const fakeStrategy: Strategy = {
  strategy_id: 'strat-1',
  symbols: ['BTC/USDT', 'ETH/USDT'],
  exchanges: ['binance', 'okx'],
  timeframes: ['1h', '4h'],
  is_running: true,
  parameters: { rsi_period: 14, threshold: 70 },
};

const antStubs = {
  'a-drawer': {
    name: 'ADrawer',
    props: ['open', 'width'],
    emits: ['close'],
    template: '<div class="ant-drawer" v-if="open"><slot name="title" /><slot /></div>',
  },
};

function mountComponent(strategy: Strategy | null = fakeStrategy, open = true) {
  return mount(StrategyDetail, {
    props: { strategy, open },
    global: { stubs: antStubs },
  });
}

describe('StrategyDetail', () => {
  it('renders drawer when open', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.ant-drawer').exists()).toBe(true);
  });

  it('does not render drawer content when closed', () => {
    const wrapper = mountComponent(fakeStrategy, false);
    expect(wrapper.find('.ant-drawer').exists()).toBe(false);
  });

  it('shows strategy_id in title', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.drawer-title').text()).toContain('strat-1');
  });

  it('shows running status pill when strategy is running', () => {
    const wrapper = mountComponent();
    const pill = wrapper.find('.status-pill');
    expect(pill.classes()).toContain('status-running');
    expect(pill.text()).toBe('Running');
  });

  it('shows stopped status pill when strategy is stopped', () => {
    const stopped = { ...fakeStrategy, is_running: false };
    const wrapper = mountComponent(stopped);
    const pill = wrapper.find('.status-pill');
    expect(pill.classes()).toContain('status-stopped');
    expect(pill.text()).toBe('Stopped');
  });

  it('renders symbols as tag-blue elements', () => {
    const wrapper = mountComponent();
    const tags = wrapper.findAll('.tag-blue');
    expect(tags.length).toBe(2);
    expect(tags[0].text()).toBe('BTC/USDT');
    expect(tags[1].text()).toBe('ETH/USDT');
  });

  it('renders exchanges as tag-gray elements', () => {
    const wrapper = mountComponent();
    const tags = wrapper.findAll('.tag-gray');
    expect(tags.length).toBe(2);
  });

  it('shows timeframes joined by comma', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('1h, 4h');
  });

  it('renders parameter rows', () => {
    const wrapper = mountComponent();
    const rows = wrapper.findAll('.param-row');
    expect(rows.length).toBe(2);
  });

  it('shows empty-params when parameters is empty', () => {
    const noParams = { ...fakeStrategy, parameters: {} };
    const wrapper = mountComponent(noParams);
    expect(wrapper.find('.empty-params').exists()).toBe(true);
  });

  it('shows empty-state when strategy is null', () => {
    const wrapper = mountComponent(null);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('No strategy selected');
  });

  it('emits close when drawer close is triggered', async () => {
    const wrapper = mountComponent();
    const drawer = wrapper.findComponent({ name: 'ADrawer' });
    expect(drawer.exists()).toBe(true);
    await drawer.vm.$emit('close');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StrategyList from '@/components/strategies/StrategyList.vue';
import type { Strategy } from '@/types';

const strategies: Strategy[] = [
  {
    strategy_id: 'grid_btc',
    symbols: ['BTC/USDT'],
    exchanges: ['binance'],
    timeframes: ['1h', '4h'],
    is_running: true,
    parameters: {},
  },
  {
    strategy_id: 'dip_eth',
    symbols: ['ETH/USDT', 'ETH/BTC'],
    exchanges: ['kraken'],
    timeframes: ['15m'],
    is_running: false,
    parameters: {},
  },
];

const antStubs = {
  'a-switch': {
    template: '<button class="ant-switch" :data-checked="checked" @click="$emit(\'change\', !checked)"></button>',
    props: ['checked'],
    emits: ['change'],
  },
};

function mountComponent(strats: Strategy[] = strategies) {
  return mount(StrategyList, {
    props: { strategies: strats },
    global: { stubs: antStubs },
  });
}

describe('StrategyList', () => {
  it('renders strategy cards from strategies array', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.strategy-card');
    expect(cards).toHaveLength(2);
  });

  it('renders strategy names', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('grid_btc');
    expect(wrapper.text()).toContain('dip_eth');
  });

  it('renders symbol tags', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('BTC/USDT');
    expect(wrapper.text()).toContain('ETH/USDT');
  });

  it('renders exchange tags', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('binance');
    expect(wrapper.text()).toContain('kraken');
  });

  it('renders timeframe text', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('1h, 4h');
    expect(wrapper.text()).toContain('15m');
  });

  it('emits toggle event when switch is clicked', async () => {
    const wrapper = mountComponent();
    // The a-switch has @change="(checked) => emit('toggle', s.strategy_id, checked)"
    // The stub emits 'change' with !checked when clicked
    const switchBtn = wrapper.findAll('.ant-switch')[0];
    // grid_btc is_running=true, so checked=true, click emits change(false)
    await switchBtn.trigger('click');
    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')![0]).toEqual(['grid_btc', false]);
  });

  it('emits view event when View Details is clicked', async () => {
    const wrapper = mountComponent();
    const viewLinks = wrapper.findAll('.view-link');
    await viewLinks[0].trigger('click');
    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')![0]).toEqual(['grid_btc']);
  });

  it('shows empty state when no strategies', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.text()).toContain('No strategies found');
    expect(wrapper.findAll('.strategy-card')).toHaveLength(0);
  });

  it('does not show empty state when strategies exist', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).not.toContain('No strategies found');
  });

  it('shows running status dot for running strategy', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.strategy-card');
    const firstDot = cards[0].find('.status-dot');
    expect(firstDot.classes()).toContain('running');
  });

  it('shows stopped status dot for stopped strategy', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.strategy-card');
    const secondDot = cards[1].find('.status-dot');
    expect(secondDot.classes()).toContain('stopped');
  });

  it('renders View Details link for each strategy', () => {
    const wrapper = mountComponent();
    const viewLinks = wrapper.findAll('.view-link');
    expect(viewLinks).toHaveLength(2);
    viewLinks.forEach((link) => {
      expect(link.text()).toContain('View Details');
    });
  });
});

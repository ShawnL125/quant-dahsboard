import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ComponentStatus from '@/components/system/ComponentStatus.vue';

const defaultExchanges = ['binance', 'bybit'];
const defaultSubscriptions: Record<string, string[]> = {
  binance: ['BTC/USDT', 'ETH/USDT'],
  bybit: ['SOL/USDT'],
};

function mountComponent(
  exchanges: string[] = defaultExchanges,
  subscriptions: Record<string, string[]> = defaultSubscriptions,
) {
  return mount(ComponentStatus, { props: { exchanges, subscriptions } });
}

describe('ComponentStatus', () => {
  it('renders .component-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.component-card').exists()).toBe(true);
  });

  it('renders card title "Components"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.card-title').text()).toBe('Components');
  });

  it('displays exchange tags from props', () => {
    const wrapper = mountComponent();
    const tags = wrapper.findAll('.tag-blue');
    expect(tags).toHaveLength(2);
    expect(tags[0].text()).toBe('binance');
    expect(tags[1].text()).toBe('bybit');
  });

  it('displays subscriptions with exchange and symbols', () => {
    const wrapper = mountComponent();
    const subRows = wrapper.findAll('.sub-row');
    expect(subRows).toHaveLength(2);
    expect(subRows[0].find('.sub-exchange').text()).toBe('binance:');
    const symbols = subRows[0].findAll('.tag-gray');
    expect(symbols).toHaveLength(2);
    expect(symbols[0].text()).toBe('BTC/USDT');
    expect(symbols[1].text()).toBe('ETH/USDT');
  });

  it('shows "None" when exchanges is empty', () => {
    const wrapper = mountComponent([], {});
    const compItems = wrapper.findAll('.component-item');
    const exchangesItem = compItems[0];
    expect(exchangesItem.find('.text-muted').text()).toBe('None');
    expect(exchangesItem.findAll('.tag-blue')).toHaveLength(0);
  });

  it('shows "None" when subscriptions is empty', () => {
    const wrapper = mountComponent(['binance'], {});
    const compItems = wrapper.findAll('.component-item');
    const subsItem = compItems[1];
    expect(subsItem.find('.text-muted').text()).toBe('None');
    expect(subsItem.findAll('.sub-row')).toHaveLength(0);
  });

  it('renders both exchanges and subscriptions when populated', () => {
    const wrapper = mountComponent();
    expect(wrapper.findAll('.tag-blue')).toHaveLength(2);
    expect(wrapper.findAll('.sub-row')).toHaveLength(2);
  });
});

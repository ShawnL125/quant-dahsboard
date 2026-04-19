import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SignalFeed from '@/components/signals/SignalFeed.vue';
import type { SignalEvent } from '@/types';

function makeSignal(overrides: Partial<SignalEvent['signal']> & { direction?: string; strength?: string } = {}): SignalEvent {
  return {
    event_id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: '2026-04-19T14:30:45.000Z',
    event_type: 'signal',
    priority: 1,
    signal: {
      strategy_id: 'strat-1',
      symbol: 'BTC/USDT',
      exchange: 'binance',
      direction: 'LONG',
      strength: '0.75',
      reason: ' Momentum breakout',
      metadata: {},
      ...overrides,
    },
  };
}

function mountFeed(signals: SignalEvent[] = []) {
  return mount(SignalFeed, { props: { signals } });
}

describe('SignalFeed', () => {
  it('renders .signal-feed container with .feed-header', () => {
    const wrapper = mountFeed();
    expect(wrapper.find('.signal-feed').exists()).toBe(true);
    expect(wrapper.find('.feed-header').exists()).toBe(true);
  });

  it('displays Live Signals title in feed-header', () => {
    const wrapper = mountFeed();
    expect(wrapper.find('.feed-title').text()).toBe('Live Signals');
  });

  it('shows empty state when no signals', () => {
    const wrapper = mountFeed();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toBe('Waiting for signals...');
  });

  it('shows badge with signal count when signals present', () => {
    const signals = [makeSignal(), makeSignal()];
    const wrapper = mountFeed(signals);
    expect(wrapper.find('.feed-badge').exists()).toBe(true);
    expect(wrapper.find('.feed-badge').text()).toBe('2');
  });

  it('renders a .signal-row for each signal', () => {
    const signals = [makeSignal(), makeSignal(), makeSignal()];
    const wrapper = mountFeed(signals);
    expect(wrapper.findAll('.signal-row')).toHaveLength(3);
  });

  it('applies dir-long class for LONG direction', () => {
    const wrapper = mountFeed([makeSignal({ direction: 'LONG' })]);
    const dir = wrapper.find('.signal-direction');
    expect(dir.classes()).toContain('dir-long');
    expect(dir.text()).toBe('LONG');
  });

  it('applies dir-short class for SHORT direction', () => {
    const wrapper = mountFeed([makeSignal({ direction: 'SHORT' })]);
    const dir = wrapper.find('.signal-direction');
    expect(dir.classes()).toContain('dir-short');
    expect(dir.text()).toBe('SHORT');
  });

  it('applies dir-close class for CLOSE direction', () => {
    const wrapper = mountFeed([makeSignal({ direction: 'CLOSE' })]);
    const dir = wrapper.find('.signal-direction');
    expect(dir.classes()).toContain('dir-close');
    expect(dir.text()).toBe('CLOSE');
  });

  it('renders strength-fill bar with correct width', () => {
    const wrapper = mountFeed([makeSignal({ strength: '0.75' })]);
    const fill = wrapper.find('.strength-fill');
    expect(fill.exists()).toBe(true);
    expect(fill.attributes('style')).toContain('width: 75%');
  });

  it('renders signal time from timestamp via formatTime', () => {
    const wrapper = mountFeed([makeSignal()]);
    const time = wrapper.find('.signal-time');
    expect(time.exists()).toBe(true);
    expect(time.text()).toMatch(/\d/);
  });
});

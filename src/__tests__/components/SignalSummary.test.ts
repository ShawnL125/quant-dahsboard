import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SignalSummary from '@/components/signals/SignalSummary.vue';
import type { SignalEvent } from '@/types';

function makeSummaryEvent(overrides: Partial<SignalEvent['signal']> & { direction?: string; strength?: string } = {}): SignalEvent {
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
      strength: '0.60',
      reason: 'Breakout',
      metadata: {},
      ...overrides,
    },
  };
}

function mountSummary(latestByStrategy: Record<string, SignalEvent> = {}) {
  return mount(SignalSummary, { props: { latestByStrategy } });
}

describe('SignalSummary', () => {
  it('renders .signal-summary container with .summary-header', () => {
    const wrapper = mountSummary();
    expect(wrapper.find('.signal-summary').exists()).toBe(true);
    expect(wrapper.find('.summary-header').exists()).toBe(true);
  });

  it('shows empty state when no strategies', () => {
    const wrapper = mountSummary();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toContain('No signals yet');
  });

  it('renders a .strategy-card for each strategy', () => {
    const data: Record<string, SignalEvent> = {
      'strat-alpha': makeSummaryEvent({ strategy_id: 'strat-alpha', symbol: 'BTC/USDT' }),
      'strat-beta': makeSummaryEvent({ strategy_id: 'strat-beta', symbol: 'ETH/USDT' }),
    };
    const wrapper = mountSummary(data);
    expect(wrapper.findAll('.strategy-card')).toHaveLength(2);
  });

  it('applies direction class based on signal direction', () => {
    const data: Record<string, SignalEvent> = {
      'strat-short': makeSummaryEvent({ direction: 'SHORT' }),
    };
    const wrapper = mountSummary(data);
    const dir = wrapper.find('.signal-direction');
    expect(dir.classes()).toContain('dir-short');
    expect(dir.text()).toBe('SHORT');
  });

  it('displays signal symbol and strength in strategy card', () => {
    const data: Record<string, SignalEvent> = {
      'strat-1': makeSummaryEvent({ symbol: 'SOL/USDT', strength: '0.85' }),
    };
    const wrapper = mountSummary(data);
    expect(wrapper.find('.signal-symbol').text()).toBe('SOL/USDT');
    expect(wrapper.find('.strength-label').text()).toContain('0.85');
  });
});

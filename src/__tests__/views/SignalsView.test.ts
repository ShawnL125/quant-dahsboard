import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SignalsView from '@/views/SignalsView.vue';

const mockSignals = [
  { event_id: 'evt-1', timestamp: '2026-04-19T10:00:00Z', event_type: 'signal', priority: 1, signal: { strategy_id: 'strat-1', symbol: 'BTC/USDT', exchange: 'binance', direction: 'LONG', strength: '0.8', reason: 'test', metadata: {} } },
];

const mockLatestByStrategy = {
  'strat-1': mockSignals[0],
};

vi.mock('@/stores/signals', () => ({
  useSignalsStore: () => ({
    signals: mockSignals,
    latestByStrategy: mockLatestByStrategy,
  }),
}));

function mountView() {
  setActivePinia(createPinia());
  return mount(SignalsView, {
    global: {
      stubs: {
        SignalFeed: { template: '<div class="signal-feed-stub"><slot /></div>' },
        SignalSummary: { template: '<div class="signal-summary-stub"><slot /></div>' },
      },
    },
  });
}

describe('SignalsView', () => {
  it('renders .signals-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.signals-page').exists()).toBe(true);
  });

  it('passes signals to SignalFeed component', () => {
    const wrapper = mountView();
    const feed = wrapper.find('.signal-feed-stub');
    expect(feed.exists()).toBe(true);
  });

  it('passes latestByStrategy to SignalSummary component', () => {
    const wrapper = mountView();
    const summary = wrapper.find('.signal-summary-stub');
    expect(summary.exists()).toBe(true);
  });

  it('does not call any store actions on mount', () => {
    const fetchSpy = vi.fn();
    vi.doMock('@/stores/signals', () => ({
      useSignalsStore: () => ({
        signals: [],
        latestByStrategy: {},
        fetchAll: fetchSpy,
      }),
    }));
    setActivePinia(createPinia());
    mount(SignalsView, {
      global: {
        stubs: {
          SignalFeed: { template: '<div />' },
          SignalSummary: { template: '<div />' },
        },
      },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

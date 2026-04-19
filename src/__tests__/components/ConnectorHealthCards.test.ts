import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConnectorHealthCards from '@/components/quality/ConnectorHealthCards.vue';
import type { ConnectorStatus } from '@/types';

function makeConnector(overrides: Partial<ConnectorStatus> = {}): ConnectorStatus {
  return {
    ready: true,
    ws_connected: true,
    ws_running: true,
    reconnect_attempts: null,
    market_data: {
      last_event_at: '2026-04-19T14:00:00Z',
      last_received_at: '2026-04-19T14:00:00Z',
      last_event_age_s: 30,
      receiving: true,
      events_received: 1500,
    },
    ...overrides,
  };
}

function mountCards(connectors: Record<string, ConnectorStatus> | null = null) {
  return mount(ConnectorHealthCards, { props: { connectors } });
}

describe('ConnectorHealthCards', () => {
  it('renders .connector-health container with .section-header', () => {
    const wrapper = mountCards({ binance: makeConnector() });
    expect(wrapper.find('.connector-health').exists()).toBe(true);
    expect(wrapper.find('.section-header').exists()).toBe(true);
    expect(wrapper.find('.section-title').text()).toBe('Connector Health');
  });

  it('shows empty state when connectors is null', () => {
    const wrapper = mountCards(null);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toContain('No connector data');
  });

  it('shows empty state when connectors is empty object', () => {
    const wrapper = mountCards({});
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('renders a .connector-card for each connector', () => {
    const connectors = {
      binance: makeConnector(),
      okx: makeConnector(),
    };
    const wrapper = mountCards(connectors);
    expect(wrapper.findAll('.connector-card')).toHaveLength(2);
    expect(wrapper.findAll('.connector-name').map((n) => n.text())).toContain('binance');
    expect(wrapper.findAll('.connector-name').map((n) => n.text())).toContain('okx');
  });

  it('shows offline count badge when connectors are disconnected', () => {
    const connectors = {
      binance: makeConnector({ ws_connected: true }),
      okx: makeConnector({ ws_connected: false }),
    };
    const wrapper = mountCards(connectors);
    expect(wrapper.find('.alert-count').exists()).toBe(true);
    expect(wrapper.find('.alert-count').text()).toContain('1 offline');
  });

  it('does not show offline badge when all connected', () => {
    const connectors = {
      binance: makeConnector({ ws_connected: true }),
    };
    const wrapper = mountCards(connectors);
    expect(wrapper.find('.alert-count').exists()).toBe(false);
  });

  it('applies dot-green for connected and dot-red for disconnected', () => {
    const connectors = {
      binance: makeConnector({ ws_connected: true }),
      kraken: makeConnector({ ws_connected: false }),
    };
    const wrapper = mountCards(connectors);
    const dots = wrapper.findAll('.connector-dot');
    const names = wrapper.findAll('.connector-name').map((n) => n.text());
    const binanceIdx = names.indexOf('binance');
    const krakenIdx = names.indexOf('kraken');
    expect(dots[binanceIdx].classes()).toContain('dot-green');
    expect(dots[krakenIdx].classes()).toContain('dot-red');
  });

  it('shows formatted last event age', () => {
    const connectors = {
      binance: makeConnector({
        market_data: {
          last_event_at: null,
          last_received_at: null,
          last_event_age_s: 150,
          receiving: true,
          events_received: 100,
        },
      }),
    };
    const wrapper = mountCards(connectors);
    expect(wrapper.text()).toContain('3m ago');
  });
});

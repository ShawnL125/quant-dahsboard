import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatCards from '@/components/dashboard/StatCards.vue';

const defaultProps = {
  totalEquity: '15234.56',
  availableBalance: '8900.12',
  realizedPnl: '1234.50',
  unrealizedPnl: '-567.80',
};

function mountComponent(propsOverrides: Record<string, string> = {}) {
  return mount(StatCards, {
    props: { ...defaultProps, ...propsOverrides },
  });
}

describe('StatCards', () => {
  it('renders all four stat cards', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.stat-card');
    expect(cards).toHaveLength(4);
  });

  it('renders Net Equity card with formatted value', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.stat-card');
    const equityCard = cards[0];
    expect(equityCard.text()).toContain('Net Equity');
    expect(equityCard.text()).toContain('15,234.56');
  });

  it('renders Available Balance card with formatted value', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.stat-card');
    const balanceCard = cards[1];
    expect(balanceCard.text()).toContain('Available Balance');
    expect(balanceCard.text()).toContain('8,900.12');
  });

  it('renders Total P&L card', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.stat-card');
    const pnlCard = cards[2];
    expect(pnlCard.text()).toContain('Total P&L');
  });

  it('renders Unrealized P&L card', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.stat-card');
    const upnlCard = cards[3];
    expect(upnlCard.text()).toContain('Unrealized P&L');
  });

  it('prefixes dollar sign for equity and balance', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.stat-value');
    // Equity card
    expect(cards[0].text()).toContain('$');
    // Balance card
    expect(cards[1].text()).toContain('$');
  });

  it('shows profit trend for positive P&L', () => {
    const wrapper = mountComponent({
      realizedPnl: '500.00',
      unrealizedPnl: '200.00',
    });
    const cards = wrapper.findAll('.stat-card');
    const pnlCard = cards[2];
    expect(pnlCard.text()).toContain('Profit');
  });

  it('shows loss trend for negative P&L', () => {
    const wrapper = mountComponent({
      realizedPnl: '-500.00',
      unrealizedPnl: '-200.00',
    });
    const cards = wrapper.findAll('.stat-card');
    const pnlCard = cards[2];
    expect(pnlCard.text()).toContain('Loss');
  });

  it('handles zero values gracefully', () => {
    const wrapper = mountComponent({
      totalEquity: '0',
      availableBalance: '0',
      realizedPnl: '0',
      unrealizedPnl: '0',
    });
    const cards = wrapper.findAll('.stat-card');
    expect(cards).toHaveLength(4);
    expect(cards[0].text()).toContain('0.00');
  });

  it('handles empty string values gracefully', () => {
    const wrapper = mountComponent({
      totalEquity: '',
      availableBalance: '',
      realizedPnl: '',
      unrealizedPnl: '',
    });
    const cards = wrapper.findAll('.stat-card');
    expect(cards).toHaveLength(4);
    expect(cards[0].text()).toContain('0.00');
    expect(cards[1].text()).toContain('0.00');
  });

  it('renders Session pill on equity and balance cards', () => {
    const wrapper = mountComponent();
    const pills = wrapper.findAll('.stat-pill');
    expect(pills[0].text()).toBe('Session');
    expect(pills[1].text()).toBe('Session');
  });

  it('renders sparkline SVG elements', () => {
    const wrapper = mountComponent();
    const svgs = wrapper.findAll('svg.stat-sparkline');
    expect(svgs).toHaveLength(4);
  });
});

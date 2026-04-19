import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import StatCards from '@/components/dashboard/StatCards.vue';

function mountCards(props = {
  totalEquity: '10000',
  availableBalance: '5000',
  realizedPnl: '200',
  unrealizedPnl: '50',
}) {
  return mount(StatCards, { props });
}

describe('StatCards', () => {
  // ── Basic rendering ──────────────────────────────────────────────

  it('renders .stat-cards container', () => {
    const wrapper = mountCards();
    expect(wrapper.find('.stat-cards').exists()).toBe(true);
  });

  it('renders 4 stat cards', () => {
    const wrapper = mountCards();
    expect(wrapper.findAll('.stat-card')).toHaveLength(4);
  });

  // ── Card labels ──────────────────────────────────────────────────

  it('renders correct card labels', () => {
    const wrapper = mountCards();
    const labels = wrapper.findAll('.stat-label').map(el => el.text());
    expect(labels).toEqual(['Net Equity', 'Available Balance', 'Total P&L', 'Unrealized P&L']);
  });

  // ── formatMoney via display values ───────────────────────────────

  it('formats money value with comma separators', () => {
    const wrapper = mountCards();
    const values = wrapper.findAll('.stat-value');
    // Net Equity: formatMoney('10000') = '10,000.00', prefix = '$'
    expect(values[0].text()).toContain('10,000.00');
  });

  it('formats money with NaN fallback to 0.00', () => {
    const wrapper = mountCards({ totalEquity: 'abc', availableBalance: '0', realizedPnl: '0', unrealizedPnl: '0' });
    const values = wrapper.findAll('.stat-value');
    expect(values[0].text()).toContain('0.00');
  });

  // ── Positive P&L styling ─────────────────────────────────────────

  it('shows positive Total P&L with success colors and profit trend', () => {
    const wrapper = mountCards({ totalEquity: '0', availableBalance: '0', realizedPnl: '100', unrealizedPnl: '50' });
    const pnlCard = wrapper.findAll('.stat-card')[2];

    expect(pnlCard.find('.stat-value').attributes('style')).toContain('var(--q-success)');
    expect(pnlCard.find('.stat-value').text()).toContain('+$');
    expect(pnlCard.find('.stat-pill').classes()).toContain('pill-blue');
    expect(pnlCard.find('.stat-trend').classes()).toContain('trend-up');
    expect(pnlCard.find('.stat-trend').text()).toContain('Profit');
  });

  it('shows negative Total P&L with error colors and loss trend', () => {
    const wrapper = mountCards({ totalEquity: '0', availableBalance: '0', realizedPnl: '-80', unrealizedPnl: '-20' });
    const pnlCard = wrapper.findAll('.stat-card')[2];

    expect(pnlCard.find('.stat-value').attributes('style')).toContain('var(--q-error)');
    expect(pnlCard.find('.stat-value').text()).toContain('-$');
    expect(pnlCard.find('.stat-pill').classes()).toContain('pill-red');
    expect(pnlCard.find('.stat-trend').classes()).toContain('trend-down');
    expect(pnlCard.find('.stat-trend').text()).toContain('Loss');
  });

  // ── Positive/negative Unrealized P&L ─────────────────────────────

  it('shows positive Unrealized P&L with profit indicators', () => {
    const wrapper = mountCards({ totalEquity: '0', availableBalance: '0', realizedPnl: '0', unrealizedPnl: '30' });
    const urCard = wrapper.findAll('.stat-card')[3];

    expect(urCard.find('.stat-value').attributes('style')).toContain('var(--q-success)');
    expect(urCard.find('.stat-pill').classes()).toContain('pill-blue');
    expect(urCard.find('.stat-trend').classes()).toContain('trend-up');
  });

  it('shows negative Unrealized P&L with loss indicators', () => {
    const wrapper = mountCards({ totalEquity: '0', availableBalance: '0', realizedPnl: '0', unrealizedPnl: '-10' });
    const urCard = wrapper.findAll('.stat-card')[3];

    expect(urCard.find('.stat-value').attributes('style')).toContain('var(--q-error)');
    expect(urCard.find('.stat-pill').classes()).toContain('pill-red');
    expect(urCard.find('.stat-trend').classes()).toContain('trend-down');
  });

  // ── Pill text ────────────────────────────────────────────────────

  it('renders correct pill texts for each card', () => {
    const wrapper = mountCards();
    const pills = wrapper.findAll('.stat-pill').map(el => el.text());
    expect(pills).toEqual(['Session', 'Session', '30d', 'Open']);
  });

  // ── Trend direction via prop changes ─────────────────────────────
  // Note: watch doesn't fire on mount, so initial value is captured
  // on the FIRST prop change, then trend compares subsequent values.

  it('shows up trend when equity increases after first change', async () => {
    const wrapper = mountCards({
      totalEquity: '',
      availableBalance: '0',
      realizedPnl: '0',
      unrealizedPnl: '0',
    });

    // First change sets initial baseline
    await wrapper.setProps({ totalEquity: '10000' });
    await flushPromises();
    // Second change: trend compares 11000 vs initial 10000
    await wrapper.setProps({ totalEquity: '11000' });
    await flushPromises();

    const equityCard = wrapper.findAll('.stat-card')[0];
    expect(equityCard.find('.stat-trend').classes()).toContain('trend-up');
    expect(equityCard.find('.stat-trend').text()).toContain('↑');
    expect(equityCard.find('.stat-trend').text()).toContain('+10.0%');
  });

  it('shows down trend when equity decreases after first change', async () => {
    const wrapper = mountCards({
      totalEquity: '',
      availableBalance: '0',
      realizedPnl: '0',
      unrealizedPnl: '0',
    });

    await wrapper.setProps({ totalEquity: '10000' });
    await flushPromises();
    await wrapper.setProps({ totalEquity: '8000' });
    await flushPromises();

    const equityCard = wrapper.findAll('.stat-card')[0];
    expect(equityCard.find('.stat-trend').classes()).toContain('trend-down');
    expect(equityCard.find('.stat-trend').text()).toContain('↓');
    expect(equityCard.find('.stat-trend').text()).toContain('-20.0%');
  });

  it('shows flat trend when no prop changes happen', () => {
    // initialEquity is null, trendDir returns 'flat' → defaults to 'up' icon
    const wrapper = mountCards({
      totalEquity: '10000',
      availableBalance: '0',
      realizedPnl: '0',
      unrealizedPnl: '0',
    });
    const equityCard = wrapper.findAll('.stat-card')[0];
    // trendDir(10000, null) = 'flat', so icon is ↑ (not down)
    expect(equityCard.find('.stat-trend').text()).toContain('↑');
    expect(equityCard.find('.stat-trend').text()).toContain('0.0%');
  });

  // ── Balance trend ────────────────────────────────────────────────

  it('shows balance trend correctly after changes', async () => {
    const wrapper = mountCards({
      totalEquity: '0',
      availableBalance: '',
      realizedPnl: '0',
      unrealizedPnl: '0',
    });

    // First change sets initial baseline
    await wrapper.setProps({ availableBalance: '5000' });
    await flushPromises();
    // Second change: 6000 vs 5000 = +20%
    await wrapper.setProps({ availableBalance: '6000' });
    await flushPromises();

    const balanceCard = wrapper.findAll('.stat-card')[1];
    expect(balanceCard.find('.stat-trend').classes()).toContain('trend-up');
    expect(balanceCard.find('.stat-trend').text()).toContain('+20.0%');
  });

  // ── Sparkline SVG rendering ──────────────────────────────────────

  it('renders SVG sparkline for each card', () => {
    const wrapper = mountCards();
    const svgs = wrapper.findAll('.stat-sparkline');
    expect(svgs).toHaveLength(4);
    expect(svgs[0].attributes('viewBox')).toBe('0 0 120 40');
  });

  it('renders sparkline polyline with points after history builds', async () => {
    const wrapper = mountCards({
      totalEquity: '10000',
      availableBalance: '5000',
      realizedPnl: '100',
      unrealizedPnl: '50',
    });

    // Need at least 2 changes for buildSparklinePoints to produce output
    await wrapper.setProps({ totalEquity: '10100' });
    await wrapper.setProps({ totalEquity: '10200' });
    await flushPromises();

    const firstPolyline = wrapper.findAll('polyline')[0];
    expect(firstPolyline.attributes('points')).not.toBe('');
  });

  it('renders empty polyline when only one history point', async () => {
    const wrapper = mountCards({
      totalEquity: '10000',
      availableBalance: '0',
      realizedPnl: '0',
      unrealizedPnl: '0',
    });

    await wrapper.setProps({ totalEquity: '10100' });
    await flushPromises();

    const firstPolyline = wrapper.findAll('polyline')[0];
    // Only 1 point → buildSparklinePoints returns '' (needs >= 2)
    expect(firstPolyline.attributes('points')).toBe('');
  });

  it('renders empty polyline when props are zero/falsy', () => {
    const wrapper = mountCards({
      totalEquity: '',
      availableBalance: '',
      realizedPnl: '0',
      unrealizedPnl: '0',
    });
    const firstPolyline = wrapper.findAll('polyline')[0];
    expect(firstPolyline.attributes('points')).toBe('');
  });

  // ── Sparkline polyline stroke color ──────────────────────────────

  it('uses success color for positive P&L sparkline', () => {
    const wrapper = mountCards({ totalEquity: '0', availableBalance: '0', realizedPnl: '100', unrealizedPnl: '50' });
    const pnlPolyline = wrapper.findAll('polyline')[2];
    expect(pnlPolyline.attributes('stroke')).toBe('var(--q-success)');
  });

  it('uses error color for negative P&L sparkline', () => {
    const wrapper = mountCards({ totalEquity: '0', availableBalance: '0', realizedPnl: '-50', unrealizedPnl: '-20' });
    const pnlPolyline = wrapper.findAll('polyline')[2];
    expect(pnlPolyline.attributes('stroke')).toBe('var(--q-error)');
  });

  // ── PnL history watch (realizedPnl + unrealizedPnl) ──────────────

  it('builds PnL sparkline after multiple realizedPnl changes', async () => {
    const wrapper = mountCards({
      totalEquity: '0',
      availableBalance: '0',
      realizedPnl: '100',
      unrealizedPnl: '50',
    });

    await wrapper.setProps({ realizedPnl: '200' });
    await wrapper.setProps({ realizedPnl: '150' });
    await flushPromises();

    const pnlPolyline = wrapper.findAll('polyline')[2];
    expect(pnlPolyline.attributes('points')).not.toBe('');
  });

  it('updates the Total P&L sparkline when only unrealizedPnl changes', async () => {
    const wrapper = mountCards({
      totalEquity: '0',
      availableBalance: '0',
      realizedPnl: '100',
      unrealizedPnl: '50',
    });

    await wrapper.setProps({ unrealizedPnl: '75' });
    await wrapper.setProps({ unrealizedPnl: '25' });
    await flushPromises();

    const pnlPolyline = wrapper.findAll('polyline')[2];
    expect(pnlPolyline.attributes('points')).not.toBe('');
  });
});

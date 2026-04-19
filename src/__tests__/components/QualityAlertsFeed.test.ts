import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import QualityAlertsFeed from '@/components/quality/QualityAlertsFeed.vue';
import type { QualityAlert } from '@/types';

function makeAlert(overrides: Partial<QualityAlert> = {}): QualityAlert {
  return {
    alert_type: 'data_gap',
    symbol: 'BTC/USDT',
    exchange: 'binance',
    severity: 'warning',
    metric_value: '5.2',
    threshold: '3.0',
    detected_at: '2026-04-19T14:30:45.000Z',
    details: { gap_seconds: 120 },
    ...overrides,
  };
}

function mountFeed(alerts: QualityAlert[] = []) {
  return mount(QualityAlertsFeed, { props: { alerts } });
}

describe('QualityAlertsFeed', () => {
  it('renders .quality-alerts container with .section-header', () => {
    const wrapper = mountFeed();
    expect(wrapper.find('.quality-alerts').exists()).toBe(true);
    expect(wrapper.find('.section-header').exists()).toBe(true);
    expect(wrapper.find('.section-title').text()).toBe('Quality Alerts');
  });

  it('shows empty state when no alerts', () => {
    const wrapper = mountFeed();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toContain('No quality alerts');
  });

  it('shows badge with alert count', () => {
    const alerts = [makeAlert(), makeAlert({ symbol: 'ETH/USDT' })];
    const wrapper = mountFeed(alerts);
    expect(wrapper.find('.alert-badge').exists()).toBe(true);
    expect(wrapper.find('.alert-badge').text()).toBe('2');
  });

  it('does not show badge when alerts empty', () => {
    const wrapper = mountFeed();
    expect(wrapper.find('.alert-badge').exists()).toBe(false);
  });

  it('renders an .alert-row for each alert', () => {
    const alerts = [makeAlert(), makeAlert({ symbol: 'ETH/USDT' }), makeAlert({ symbol: 'SOL/USDT' })];
    const wrapper = mountFeed(alerts);
    expect(wrapper.findAll('.alert-row')).toHaveLength(3);
  });

  it('applies severity class to alert row', () => {
    const wrapper = mountFeed([makeAlert({ severity: 'critical' })]);
    const row = wrapper.find('.alert-row');
    expect(row.classes()).toContain('severity-critical');
  });

  it('applies warning severity class', () => {
    const wrapper = mountFeed([makeAlert({ severity: 'warning' })]);
    const row = wrapper.find('.alert-row');
    expect(row.classes()).toContain('severity-warning');
  });

  it('renders alert type badge with formatted label', () => {
    const wrapper = mountFeed([makeAlert({ alert_type: 'data_gap' })]);
    const badge = wrapper.find('.alert-type-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('GAP');
    expect(badge.classes()).toContain('type-data_gap');
  });

  it('renders different alert type badges', () => {
    const wrapper = mountFeed([makeAlert({ alert_type: 'price_anomaly' })]);
    const badge = wrapper.find('.alert-type-badge');
    expect(badge.text()).toBe('ANOMALY');
    expect(badge.classes()).toContain('type-price_anomaly');
  });

  it('renders detail chips from alert details', () => {
    const wrapper = mountFeed([makeAlert({ details: { gap_seconds: 120 } })]);
    const chips = wrapper.findAll('.detail-chip');
    expect(chips.length).toBeGreaterThanOrEqual(1);
    expect(wrapper.text()).toContain('gap_seconds');
    expect(wrapper.text()).toContain('120.00');
  });
});

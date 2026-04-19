import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RiskConfigCards from '@/components/risk/RiskConfigCards.vue';
import type { RiskConfig } from '@/types';

const fakeConfig: RiskConfig = {
  sizing_model: 'fixed',
  max_position_size_pct: 30,
  max_risk_per_trade_pct: 2,
  max_open_positions: 5,
  max_total_exposure_pct: 80,
  max_single_asset_pct: 40,
  position_reduce_at_pct: 70,
  max_drawdown_pct: 15,
  allow_pyramiding: false,
  kill_switch_enabled: true,
  max_correlated_exposure_pct: 60,
};

function mountComponent(config: RiskConfig | null = fakeConfig) {
  return mount(RiskConfigCards, { props: { config } });
}

describe('RiskConfigCards', () => {
  it('renders .config-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.config-card').exists()).toBe(true);
  });

  it('shows config-title', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.config-title').text()).toBe('Risk Configuration');
  });

  it('renders 10 config items', () => {
    const wrapper = mountComponent();
    const items = wrapper.findAll('.config-item');
    expect(items.length).toBe(10);
  });

  it('shows sizing model value', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('fixed');
  });

  it('shows max positions count', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('5');
  });

  it('shows percentage values with % suffix', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('80%');
    expect(wrapper.text()).toContain('2%');
    expect(wrapper.text()).toContain('15%');
  });

  it('marks drawdown and reduce items as config-warn', () => {
    const wrapper = mountComponent();
    const warnItems = wrapper.findAll('.config-warn');
    expect(warnItems.length).toBe(2);
  });

  it('shows Disabled for pyramiding when false', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Disabled');
  });

  it('shows Enabled for kill switch when true', () => {
    const wrapper = mountComponent();
    // kill_switch_enabled is true
    const items = wrapper.findAll('.config-item');
    const killSwitchItem = items.find(i => i.text().includes('Kill Switch'));
    expect(killSwitchItem).toBeDefined();
    expect(killSwitchItem!.text()).toContain('Enabled');
  });

  it('renders empty config-grid when config is null', () => {
    const wrapper = mountComponent(null);
    const items = wrapper.findAll('.config-item');
    expect(items.length).toBe(0);
  });
});

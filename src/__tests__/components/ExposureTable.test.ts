import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExposureTable from '@/components/risk/ExposureTable.vue';
import type { ExposureData, RiskConfig } from '@/types';

const fakeExposure: ExposureData = {
  total_exposure: 50000,
  total_pct: 45,
  max_total_pct: 80,
  by_symbol: {
    'BTC/USDT': { symbol: 'BTC/USDT', exchange: 'binance', side: 'LONG', quantity: 0.5, value: 25000, pct_of_equity: 25 },
  },
};

const fakeConfig: RiskConfig = {
  sizing_model: 'fixed', max_position_size_pct: 30, max_risk_per_trade_pct: 2,
  max_open_positions: 5, max_total_exposure_pct: 80, max_single_asset_pct: 40,
  position_reduce_at_pct: 70, max_drawdown_pct: 15, allow_pyramiding: false,
  kill_switch_enabled: true, max_correlated_exposure_pct: 60,
};

const antStubs = {
  'a-table': {
    name: 'a-table',
    props: ['columns', 'dataSource', 'pagination', 'size', 'rowKey'],
    template: '<div class="ant-table"></div>',
  },
};

function mountComponent(exposure: ExposureData | null = fakeExposure, config: RiskConfig | null = fakeConfig) {
  return mount(ExposureTable, {
    props: { exposure, config },
    global: { stubs: antStubs },
  });
}

describe('ExposureTable', () => {
  it('renders .exposure-card container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.exposure-card').exists()).toBe(true);
  });

  it('shows exposure bar with percentage', () => {
    const wrapper = mountComponent();
    const summary = wrapper.find('.exposure-summary');
    expect(summary.text()).toContain('45.0%');
    expect(summary.text()).toContain('80%');
  });

  it('shows table with symbol rows when by_symbol has data', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.ant-table').exists()).toBe(true);
    expect(wrapper.find('.exposure-empty').exists()).toBe(false);
  });

  it('shows .exposure-empty when no exposure data', () => {
    const wrapper = mountComponent(null, fakeConfig);
    expect(wrapper.find('.exposure-empty').exists()).toBe(true);
    expect(wrapper.text()).toContain('No open positions');
  });

  it('marks rows as overLimit when pct_of_equity exceeds max_single_asset_pct', () => {
    const overExposure: ExposureData = {
      ...fakeExposure,
      by_symbol: {
        'BTC/USDT': { symbol: 'BTC/USDT', exchange: 'binance', side: 'LONG', quantity: 0.5, value: 25000, pct_of_equity: 50 },
      },
    };
    const wrapper = mountComponent(overExposure, fakeConfig);
    const table = wrapper.getComponent({ name: 'a-table' });
    const rows = table.props('dataSource') as Array<{ overLimit: boolean }>;
    expect(rows[0].overLimit).toBe(true);
  });

  it('does not mark rows as overLimit when within limits', () => {
    const wrapper = mountComponent();
    const table = wrapper.getComponent({ name: 'a-table' });
    const rows = table.props('dataSource') as Array<{ overLimit: boolean }>;
    expect(rows[0].overLimit).toBe(false);
  });

  describe('barColor computed', () => {
    it('returns error var when barPct > 75', () => {
      const highExposure: ExposureData = { ...fakeExposure, total_pct: 78, max_total_pct: 80 };
      const wrapper = mountComponent(highExposure);
      const bar = wrapper.find('.exposure-bar-fill');
      expect(bar.element.style.background).toBe('var(--q-error)');
    });

    it('returns warning var when barPct > 50', () => {
      const medExposure: ExposureData = { ...fakeExposure, total_pct: 50, max_total_pct: 80 };
      const wrapper = mountComponent(medExposure);
      const bar = wrapper.find('.exposure-bar-fill');
      expect(bar.element.style.background).toBe('var(--q-warning)');
    });

    it('returns success var when barPct <= 50', () => {
      const lowExposure: ExposureData = {
        total_exposure: 10000, total_pct: 30, max_total_pct: 80,
        by_symbol: { 'BTC/USDT': { symbol: 'BTC/USDT', exchange: 'binance', side: 'LONG', quantity: 0.5, value: 10000, pct_of_equity: 30 } },
      };
      const wrapper = mountComponent(lowExposure);
      const bar = wrapper.find('.exposure-bar-fill');
      expect(bar.element.style.background).toBe('var(--q-success)');
    });
  });

  describe('rows computed', () => {
    it('transforms by_symbol into table rows with correct fields', () => {
      const wrapper = mountComponent();
      const table = wrapper.getComponent({ name: 'a-table' });
      const rows = table.props('dataSource') as any[];
      expect(rows).toHaveLength(1);
      expect(rows[0].symbol).toBe('BTC/USDT / binance');
      expect(rows[0].side).toBe('LONG');
      expect(rows[0].value).toBe(25000);
      expect(rows[0].pctOfEquity).toBe(25);
    });

    it('computes sharePct based on total exposure', () => {
      const wrapper = mountComponent();
      const table = wrapper.getComponent({ name: 'a-table' });
      const rows = table.props('dataSource') as any[];
      expect(rows[0].sharePct).toBe(50);
    });
  });
});

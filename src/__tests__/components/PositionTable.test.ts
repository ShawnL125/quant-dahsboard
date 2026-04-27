import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PositionTable from '@/components/dashboard/PositionTable.vue';
import type { Position } from '@/types';

const fakePositions: Position[] = [
  { symbol: 'BTC/USDT', exchange: 'binance', side: 'LONG', quantity: '0.5', entry_price: '50000', unrealized_pnl: '250.00' },
  { symbol: 'ETH/USDT', exchange: 'okx', side: 'SHORT', quantity: '2.0', entry_price: '3000', unrealized_pnl: '-80.50' },
  { symbol: 'SOL/USDT', exchange: 'binance', side: 'BUY', quantity: '10', entry_price: '150', unrealized_pnl: '0.00' },
];

// Stub that renders the bodyCell slot per column per row so template branches execute
const tableStub = {
  name: 'a-table',
  props: ['columns', 'dataSource', 'pagination', 'size', 'rowKey'],
  template: `
    <div class="ant-table">
      <div v-for="(record, idx) in dataSource" :key="record[rowKey]" class="table-row">
        <template v-for="col in columns" :key="col.key">
          <slot name="bodyCell" :column="col" :record="record" :index="idx" />
        </template>
      </div>
    </div>
  `,
};

const stubs = {
  'a-card': {
    props: ['title'],
    template: '<div class="ant-card"><div class="card-title">{{ title }}</div><slot /></div>',
  },
  'a-table': tableStub,
  'a-tag': {
    props: ['color'],
    template: '<span class="ant-tag" :data-color="color"><slot /></span>',
  },
  'a-popconfirm': {
    name: 'APopconfirm',
    props: ['title'],
    template: '<div class="ant-popconfirm" :data-title="title"><slot /></div>',
  },
  'a-button': {
    props: ['type', 'danger', 'size'],
    template: '<button class="ant-btn"><slot /></button>',
  },
};

function mountComponent(positions: Position[] = fakePositions) {
  return mount(PositionTable, {
    props: { positions },
    global: { stubs },
  });
}

describe('PositionTable', () => {
  // ── Basic rendering ──────────────────────────────────────────────

  it('renders card with title', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.ant-card').exists()).toBe(true);
    expect(wrapper.find('.card-title').text()).toBe('Open Positions');
  });

  it('renders a-table with positions as dataSource', () => {
    const wrapper = mountComponent();
    const table = wrapper.getComponent({ name: 'a-table' });
    expect(table.props('dataSource')).toEqual(fakePositions);
  });

  it('passes correct columns to table', () => {
    const wrapper = mountComponent();
    const table = wrapper.getComponent({ name: 'a-table' });
    const columns = table.props('columns') as Array<{ key: string }>;
    const keys = columns.map(c => c.key);
    expect(keys).toContain('symbol');
    expect(keys).toContain('side');
    expect(keys).toContain('unrealized_pnl');
    expect(keys).toContain('action');
  });

  it('disables pagination', () => {
    const wrapper = mountComponent();
    const table = wrapper.getComponent({ name: 'a-table' });
    expect(table.props('pagination')).toBe(false);
  });

  it('uses symbol as row key', () => {
    const wrapper = mountComponent();
    const table = wrapper.getComponent({ name: 'a-table' });
    expect(table.props('rowKey')).toBe('symbol');
  });

  it('renders with empty positions array', () => {
    const wrapper = mountComponent([]);
    const table = wrapper.getComponent({ name: 'a-table' });
    expect(table.props('dataSource')).toEqual([]);
  });

  // ── Side column template slot ────────────────────────────────────

  it('renders LONG side with green tag', () => {
    const wrapper = mountComponent();
    const tags = wrapper.findAll('.ant-tag');
    const longTag = tags[0]; // BTC/USDT is LONG
    expect(longTag.text()).toBe('LONG');
    expect(longTag.attributes('data-color')).toBe('green');
  });

  it('renders SHORT side with red tag', () => {
    const wrapper = mountComponent();
    const tags = wrapper.findAll('.ant-tag');
    const shortTag = tags[1]; // ETH/USDT is SHORT
    expect(shortTag.text()).toBe('SHORT');
    expect(shortTag.attributes('data-color')).toBe('red');
  });

  it('renders BUY side with green tag', () => {
    const wrapper = mountComponent();
    const tags = wrapper.findAll('.ant-tag');
    const buyTag = tags[2]; // SOL/USDT is BUY
    expect(buyTag.text()).toBe('BUY');
    expect(buyTag.attributes('data-color')).toBe('green');
  });

  // ── Unrealized P&L column template slot ──────────────────────────

  it('renders positive unrealized PnL with green style', () => {
    const wrapper = mountComponent();
    const rows = wrapper.findAll('.table-row');
    // Row 0 (BTC/USDT): unrealized_pnl = 250.00
    const pnlSpan = rows[0].find('span[style]');
    expect(pnlSpan.text()).toBe('250.00');
    expect(pnlSpan.attributes('style')).toContain('var(--q-success)');
  });

  it('renders negative unrealized PnL with red style', () => {
    const wrapper = mountComponent();
    const rows = wrapper.findAll('.table-row');
    // Row 1 (ETH/USDT): unrealized_pnl = -80.50
    const pnlSpan = rows[1].find('span[style]');
    expect(pnlSpan.text()).toBe('-80.50');
    expect(pnlSpan.attributes('style')).toContain('var(--q-error)');
  });

  // ── Action column template slot ──────────────────────────────────

  it('renders Close button in popconfirm for each position', () => {
    const wrapper = mountComponent();
    const popconfirms = wrapper.findAll('.ant-popconfirm');
    expect(popconfirms).toHaveLength(3);
    expect(popconfirms[0].attributes('data-title')).toBe('Close this position?');
    expect(popconfirms[0].find('.ant-btn').text()).toBe('Close');
  });

  it('emits close event when popconfirm confirms', async () => {
    const wrapper = mountComponent();
    const popconfirm = wrapper.findAllComponents({ name: 'APopconfirm' })[0];
    await popconfirm.vm.$emit('confirm');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')![0][0]).toEqual(fakePositions[0]);
  });
});

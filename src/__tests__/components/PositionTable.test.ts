import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PositionTable from '@/components/dashboard/PositionTable.vue';
import type { Position } from '@/types';

const fakePositions: Position[] = [
  { symbol: 'BTC/USDT', exchange: 'binance', side: 'LONG', quantity: '0.5', entry_price: '50000', unrealized_pnl: '250.00' },
  { symbol: 'ETH/USDT', exchange: 'okx', side: 'SHORT', quantity: '2.0', entry_price: '3000', unrealized_pnl: '-80.50' },
];

const antStubs = {
  'a-card': {
    props: ['title'],
    template: '<div class="ant-card"><div class="card-title">{{ title }}</div><slot /></div>',
  },
  'a-table': {
    name: 'a-table',
    props: ['columns', 'dataSource', 'pagination', 'size', 'rowKey'],
    template: '<div class="ant-table"></div>',
  },
};

function mountComponent(positions: Position[] = fakePositions) {
  return mount(PositionTable, {
    props: { positions },
    global: { stubs: antStubs },
  });
}

describe('PositionTable', () => {
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

  it('passes columns to table', () => {
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
});

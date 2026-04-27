import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import RiskEventsTable from '@/components/risk/RiskEventsTable.vue';
import type { RiskEvent } from '@/types';

const fakeEvents: RiskEvent[] = [
  { event_id: 'evt-1', time: '2026-01-01T00:00:00Z', event_type: 'HALT', level: 'critical', target: 'global', reason: 'max drawdown', metadata: { key: 'val' } },
  { event_id: 'evt-2', time: '2026-01-01T01:00:00Z', event_type: 'WARNING', level: 'warning', target: 'symbol:BTC', reason: 'high exposure', metadata: {} },
];

const antStubs = {
  'a-button': {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  'a-table': {
    props: ['columns', 'dataSource', 'pagination', 'size', 'rowKey', 'rowClassName'],
    setup(props: any, { slots }: any) {
      return () => h('div', { class: 'ant-table' },
        (props.dataSource || []).flatMap((record: any) =>
          (props.columns || []).map((col: any) => slots.bodyCell?.({ column: col, record }))
        )
      );
    },
  },
  'a-tag': {
    props: ['color'],
    template: '<span class="ant-tag" :data-color="color"><slot /></span>',
  },
};

function mountComponent(events: RiskEvent[], total = events.length, extra?: Record<string, unknown>) {
  return mount(RiskEventsTable, {
    props: { events, total, ...extra },
    global: { stubs: antStubs },
  });
}

describe('RiskEventsTable', () => {
  it('renders .events-card container', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.find('.events-card').exists()).toBe(true);
  });

  it('shows refresh button that emits refresh event', async () => {
    const wrapper = mountComponent(fakeEvents);
    const button = wrapper.find('button');
    expect(button.text()).toContain('Refresh');
    await button.trigger('click');
    expect(wrapper.emitted('refresh')).toBeTruthy();
  });

  it('shows events content when events exist', () => {
    const wrapper = mountComponent(fakeEvents);
    expect(wrapper.find('.ant-table').exists()).toBe(true);
    expect(wrapper.find('.events-empty').exists()).toBe(false);
  });

  it('shows .events-empty when no events', () => {
    const wrapper = mountComponent([]);
    expect(wrapper.find('.events-empty').exists()).toBe(true);
    expect(wrapper.find('.ant-table').exists()).toBe(false);
    expect(wrapper.text()).toContain('No risk events');
  });

  it('applies typeColor red for HALT and BLOCKED event types', () => {
    const wrapper = mountComponent(fakeEvents);
    const tags = wrapper.findAll('.ant-tag');
    const haltTag = tags.find((t) => t.text() === 'HALT');
    expect(haltTag).toBeDefined();
    expect(haltTag!.attributes('data-color')).toBe('red');
  });

  it('applies typeColor orange for WARNING and WARN event types', () => {
    const wrapper = mountComponent(fakeEvents);
    const tags = wrapper.findAll('.ant-tag');
    const warnTag = tags.find((t) => t.text() === 'WARNING');
    expect(warnTag).toBeDefined();
    expect(warnTag!.attributes('data-color')).toBe('orange');
  });

  it('applies typeColor blue for other event types', () => {
    const infoEvent: RiskEvent = {
      event_id: 'evt-3', time: '2026-01-01T02:00:00Z', event_type: 'INFO',
      level: 'info', target: 'global', reason: 'test', metadata: {},
    };
    const wrapper = mountComponent([infoEvent]);
    const tag = wrapper.find('.ant-tag');
    expect(tag.attributes('data-color')).toBe('blue');
  });

  it('pagination onChange emits page-change with page number', () => {
    const wrapper = mountComponent(fakeEvents, 50, { currentPage: 1, pageSize: 10 });
    const vm = wrapper.vm as any;
    const pagination = vm.pagination;
    pagination.onChange(3);
    expect(wrapper.emitted('page-change')).toBeTruthy();
    expect(wrapper.emitted('page-change')![0]).toEqual([3]);
  });

  it('rowClass returns row-critical for HALT and BLOCKED events', () => {
    const wrapper = mountComponent(fakeEvents);
    const vm = wrapper.vm as any;
    expect(vm.rowClass({ ...fakeEvents[0], event_type: 'HALT' })).toBe('row-critical');
    expect(vm.rowClass({ ...fakeEvents[0], event_type: 'BLOCKED' })).toBe('row-critical');
  });

  it('rowClass returns row-warning for WARNING and WARN events', () => {
    const wrapper = mountComponent(fakeEvents);
    const vm = wrapper.vm as any;
    expect(vm.rowClass({ ...fakeEvents[1], event_type: 'WARNING' })).toBe('row-warning');
    expect(vm.rowClass({ ...fakeEvents[0], event_type: 'WARN' })).toBe('row-warning');
  });

  it('rowClass returns empty string for other event types', () => {
    const wrapper = mountComponent(fakeEvents);
    const vm = wrapper.vm as any;
    expect(vm.rowClass({ ...fakeEvents[0], event_type: 'INFO' })).toBe('');
  });

  it('formats missing or invalid timestamps as a dash', () => {
    const wrapper = mountComponent(fakeEvents);
    const vm = wrapper.vm as any;
    expect(vm.formatTime('')).toBe('-');
    expect(vm.formatTime('not-a-date')).toBe('-');
  });

  it('renders received_at when event time is missing', () => {
    const wrapper = mountComponent([
      {
        event_id: 'evt-3',
        time: '',
        received_at: '2026-01-01T03:00:00Z',
        event_type: 'INFO',
        level: 'info',
        target: 'global',
        reason: 'fallback time',
        metadata: {},
      },
    ]);

    expect(wrapper.text()).not.toContain('-');
  });
});

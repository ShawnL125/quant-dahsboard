import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OrderEventTimeline from '@/components/orders/OrderEventTimeline.vue';
import type { OrderEvent } from '@/types';

const fakeEvents: OrderEvent[] = [
  {
    event_id: 'e1', order_id: 'o1', event_type: 'SUBMIT',
    timestamp: '2026-01-01T10:00:00Z',
  },
  {
    event_id: 'e2', order_id: 'o1', event_type: 'FILL',
    timestamp: '2026-01-01T12:00:00Z',
    data: { filled_qty: '1.0', fill_price: '50000' },
  },
  {
    event_id: 'e3', order_id: 'o2', event_type: 'CANCEL',
    timestamp: '2026-01-01T11:00:00Z',
  },
];

const antSpinStub = {
  template: '<div class="ant-spin"></div>',
};

function mountComponent(events: OrderEvent[] = fakeEvents, loading = false) {
  return mount(OrderEventTimeline, {
    props: { events, loading },
    global: { stubs: { 'a-spin': antSpinStub } },
  });
}

describe('OrderEventTimeline', () => {
  it('renders .event-timeline container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.event-timeline').exists()).toBe(true);
  });

  it('shows spinner when loading is true', () => {
    const wrapper = mountComponent([], true);
    expect(wrapper.find('.ant-spin').exists()).toBe(true);
    expect(wrapper.find('.timeline-empty').exists()).toBe(false);
    expect(wrapper.find('.timeline-items').exists()).toBe(false);
  });

  it('shows timeline-empty when no events and not loading', () => {
    const wrapper = mountComponent([], false);
    expect(wrapper.find('.timeline-empty').exists()).toBe(true);
    expect(wrapper.find('.timeline-empty').text()).toBe('No events found');
  });

  it('renders timeline items for each event', () => {
    const wrapper = mountComponent();
    const items = wrapper.findAll('.timeline-item');
    expect(items).toHaveLength(3);
  });

  it('sorts events by timestamp descending', () => {
    const wrapper = mountComponent();
    const types = wrapper.findAll('.timeline-type').map((el) => el.text());
    expect(types[0]).toBe('FILL');
    expect(types[1]).toBe('CANCEL');
    expect(types[2]).toBe('SUBMIT');
  });

  it('applies correct dot class based on event type', () => {
    const wrapper = mountComponent();
    const dots = wrapper.findAll('.timeline-dot');
    expect(dots[0].classes()).toContain('dot-success');
    expect(dots[1].classes()).toContain('dot-error');
    expect(dots[2].classes()).toContain('dot-primary');
  });

  it('displays event data as key-value pairs', () => {
    const wrapper = mountComponent();
    const details = wrapper.findAll('.timeline-detail');
    expect(details.length).toBe(2);
    const texts = details.map((d) => d.text());
    expect(texts).toContain('filled_qty: 1.0');
    expect(texts).toContain('fill_price: 50000');
  });

  it('does not render timeline-details when event has no data', () => {
    const events: OrderEvent[] = [
      {
        event_id: 'e1', order_id: 'o1', event_type: 'SUBMIT',
        timestamp: '2026-01-01T10:00:00Z',
      },
    ];
    const wrapper = mountComponent(events);
    expect(wrapper.find('.timeline-details').exists()).toBe(false);
  });
});

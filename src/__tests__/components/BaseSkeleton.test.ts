import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';

describe('BaseSkeleton', () => {
  it('renders stats variant with correct number of cards', () => {
    const wrapper = mount(BaseSkeleton, {
      props: { variant: 'stats', columns: 4 },
    });
    expect(wrapper.findAll('.skel-card')).toHaveLength(4);
    expect(wrapper.classes()).toContain('skeleton-stats');
  });

  it('renders table variant with header and rows', () => {
    const wrapper = mount(BaseSkeleton, {
      props: { variant: 'table', rows: 3, columns: 5 },
    });
    expect(wrapper.find('.skel-table-header').exists()).toBe(true);
    expect(wrapper.findAll('.skel-table-row')).toHaveLength(3);
    expect(wrapper.findAll('.skel-th')).toHaveLength(5);
  });

  it('renders card-grid variant with correct item count', () => {
    const wrapper = mount(BaseSkeleton, {
      props: { variant: 'card-grid', rows: 2, columns: 3 },
    });
    expect(wrapper.findAll('.skel-card')).toHaveLength(6);
    expect(wrapper.classes()).toContain('skeleton-card-grid');
  });

  it('renders detail variant with stacked rows', () => {
    const wrapper = mount(BaseSkeleton, {
      props: { variant: 'detail', rows: 5 },
    });
    expect(wrapper.findAll('.skel-detail-row')).toHaveLength(5);
    expect(wrapper.classes()).toContain('skeleton-detail');
  });

  it('uses default rows and columns when not provided', () => {
    const wrapper = mount(BaseSkeleton, {
      props: { variant: 'stats' },
    });
    expect(wrapper.findAll('.skel-card')).toHaveLength(4);
  });

  it('applies shimmer animation to skeleton lines', () => {
    const wrapper = mount(BaseSkeleton, {
      props: { variant: 'stats', columns: 1 },
    });
    const lines = wrapper.findAll('.skel-line');
    expect(lines.length).toBeGreaterThan(0);
  });
});

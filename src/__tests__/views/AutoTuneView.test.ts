import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AutoTuneView from '@/views/AutoTuneView.vue';

let mockFetchAll: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetchAll = vi.fn();
});

vi.mock('@/stores/auto_tune', () => ({
  useAutoTuneStore: () => ({
    loading: false,
    runs: [],
    schedules: [],
    fetchAll: mockFetchAll,
    triggerRun: vi.fn(),
    confirmRun: vi.fn(),
    rollbackRun: vi.fn(),
    deleteSchedule: vi.fn(),
  }),
}));

function mountView() {
  setActivePinia(createPinia());
  return mount(AutoTuneView, {
    global: {
      stubs: {
        'a-spin': { template: '<div class="a-spin-stub"><slot /></div>' },
        'a-button': {
          template: '<button class="a-button-stub" @click="$emit(\'click\')"><slot /></button>',
          emits: ['click'],
        },
        'a-modal': { template: '<div class="a-modal-stub"><slot /></div>' },
        'a-form': { template: '<div class="a-form-stub"><slot /></div>' },
        'a-form-item': { template: '<div class="a-form-item-stub"><slot /></div>' },
        'a-input': { template: '<input class="a-input-stub" />' },
        'a-select': { template: '<div class="a-select-stub"><slot /></div>' },
        'a-select-option': { template: '<div class="a-select-option-stub"><slot /></div>' },
      },
    },
  });
}

describe('AutoTuneView', () => {
  it('renders .autotune-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.autotune-page').exists()).toBe(true);
  });

  it('calls fetchAll on mount', () => {
    mountView();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it('renders trigger run button', () => {
    const wrapper = mountView();
    const buttons = wrapper.findAll('.a-button-stub');
    const triggerBtn = buttons.find((b) => b.text().includes('Trigger Run'));
    expect(triggerBtn).toBeTruthy();
  });

  it('renders table area for runs', () => {
    const wrapper = mountView();
    expect(wrapper.find('.runs-section').exists()).toBe(true);
    expect(wrapper.find('.data-table').exists()).toBe(false);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });
});

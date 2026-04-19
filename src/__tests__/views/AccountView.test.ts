import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AccountView from '@/views/AccountView.vue';

let mockFetchAll: ReturnType<typeof vi.fn>;
let mockSyncAll: ReturnType<typeof vi.fn>;
let mockReconcile: ReturnType<typeof vi.fn>;
let mockFetchReconciliations: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetchAll = vi.fn();
  mockSyncAll = vi.fn().mockResolvedValue(undefined);
  mockReconcile = vi.fn().mockResolvedValue(undefined);
  mockFetchReconciliations = vi.fn().mockResolvedValue(undefined);
});

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    loading: false,
    snapshots: [],
    margins: [],
    reconciliations: [],
    fetchAll: mockFetchAll,
    syncAll: mockSyncAll,
    reconcile: mockReconcile,
    fetchReconciliations: mockFetchReconciliations,
  }),
}));

function mountView() {
  setActivePinia(createPinia());
  return mount(AccountView, {
    global: {
      stubs: {
        'a-spin': { template: '<div class="a-spin-stub"><slot /></div>' },
        'a-button': {
          template: '<button class="a-button-stub" @click="$emit(\'click\')"><slot /></button>',
          emits: ['click'],
        },
      },
    },
  });
}

describe('AccountView', () => {
  it('renders .account-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.account-page').exists()).toBe(true);
  });

  it('calls fetchAll on mount', () => {
    mountView();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it('calls fetchAll when refresh button is clicked', async () => {
    const wrapper = mountView();
    mockFetchAll.mockClear();
    const buttons = wrapper.findAll('.a-button-stub');
    const refreshBtn = buttons.find((b) => b.text().includes('Refresh'));
    expect(refreshBtn).toBeTruthy();
    await refreshBtn!.trigger('click');
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it('calls syncAll then fetchAll when sync button is clicked', async () => {
    const wrapper = mountView();
    const buttons = wrapper.findAll('.a-button-stub');
    const syncBtn = buttons.find((b) => b.text().includes('Sync All'));
    expect(syncBtn).toBeTruthy();
    await syncBtn!.trigger('click');
    expect(mockSyncAll).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(mockFetchAll).toHaveBeenCalled();
    });
  });

  it('calls reconcile then fetchReconciliations when reconcile button is clicked', async () => {
    const wrapper = mountView();
    const buttons = wrapper.findAll('.a-button-stub');
    const reconcileBtn = buttons.find((b) => b.text().includes('Reconcile Now'));
    expect(reconcileBtn).toBeTruthy();
    await reconcileBtn!.trigger('click');
    expect(mockReconcile).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(mockFetchReconciliations).toHaveBeenCalled();
    });
  });
});

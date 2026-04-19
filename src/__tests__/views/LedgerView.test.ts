import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import LedgerView from '@/views/LedgerView.vue';

const mockFetchAll = vi.fn();
const mockFetchDailySummary = vi.fn();
const mockPostCashFlow = vi.fn();

vi.mock('@/stores/ledger', () => ({
  useLedgerStore: () => ({
    loading: false,
    balances: {},
    entries: [],
    entriesTotal: 0,
    dailySummary: [],
    config: null,
    error: null,
    fetchAll: mockFetchAll,
    fetchDailySummary: mockFetchDailySummary,
    postCashFlow: mockPostCashFlow,
  }),
}));

const childStubs = {
  'a-spin': { template: '<div><slot /></div>' },
  'a-button': { template: '<button><slot /></button>' },
  'a-date-picker': { template: '<input />' },
  'a-modal': { template: '<div><slot /></div>' },
  'a-form': { template: '<div><slot /></div>' },
  'a-form-item': { template: '<div><slot /></div>' },
  'a-select': { template: '<select><slot /></select>' },
  'a-select-option': { template: '<option><slot /></option>' },
  'a-input': { template: '<input />' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LedgerView', () => {
  it('renders .ledger-page container', () => {
    const wrapper = shallowMount(LedgerView, { global: { stubs: childStubs } });
    expect(wrapper.find('.ledger-page').exists()).toBe(true);
  });

  it('calls fetchAll and fetchDailySummary on mount', () => {
    shallowMount(LedgerView, { global: { stubs: childStubs } });
    expect(mockFetchAll).toHaveBeenCalledOnce();
    expect(mockFetchDailySummary).toHaveBeenCalledOnce();
  });

  it('renders balances section', () => {
    const wrapper = shallowMount(LedgerView, { global: { stubs: childStubs } });
    expect(wrapper.find('.balances-section').exists()).toBe(true);
    expect(wrapper.find('.balances-section .section-title').text()).toContain('Account Balances');
  });

  it('renders daily summary section', () => {
    const wrapper = shallowMount(LedgerView, { global: { stubs: childStubs } });
    expect(wrapper.find('.summary-section').exists()).toBe(true);
  });
});

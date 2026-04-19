import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import WalkforwardView from '@/views/WalkforwardView.vue';

const mockFetchRuns = vi.fn();

vi.mock('@/stores/walkforward', () => ({
  useWalkforwardStore: () => ({
    loading: false,
    runs: [],
    currentWindows: [],
    currentBestParams: [],
    error: null,
    fetchRuns: mockFetchRuns,
    fetchWindows: vi.fn(),
    submitRun: vi.fn(),
  }),
}));

vi.mock('@/api/walkforward', () => ({
  walkforwardApi: {
    getRuns: vi.fn().mockResolvedValue([]),
    getWindows: vi.fn().mockResolvedValue([]),
    getBestParams: vi.fn().mockResolvedValue([]),
    run: vi.fn().mockResolvedValue(undefined),
    compare: vi.fn().mockResolvedValue([]),
  },
}));

const childStubs = {
  'a-spin': { template: '<div><slot /></div>' },
  'a-button': { template: '<button><slot /></button>' },
  'a-alert': { template: '<div class="ant-alert" />' },
  'a-modal': { template: '<div class="ant-modal"><slot /></div>' },
  WindowsTable: { template: '<div class="child-stub" />' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WalkforwardView', () => {
  it('renders .walkforward-page container', () => {
    const wrapper = shallowMount(WalkforwardView, { global: { stubs: childStubs } });
    expect(wrapper.find('.walkforward-page').exists()).toBe(true);
  });

  it('calls store.fetchRuns on mount', () => {
    shallowMount(WalkforwardView, { global: { stubs: childStubs } });
    expect(mockFetchRuns).toHaveBeenCalledOnce();
  });

  it('renders run table area', () => {
    const wrapper = shallowMount(WalkforwardView, { global: { stubs: childStubs } });
    expect(wrapper.find('.runs-card').exists()).toBe(true);
  });

  it('renders compare section via modal', () => {
    const wrapper = shallowMount(WalkforwardView, { global: { stubs: childStubs } });
    expect(wrapper.find('.ant-modal').exists()).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SystemView from '@/views/SystemView.vue';

const mockSystemFetchAll = vi.fn().mockResolvedValue(undefined);
const mockQualityFetchAll = vi.fn().mockResolvedValue(undefined);
const mockReconFetchAll = vi.fn().mockResolvedValue(undefined);

vi.mock('@/stores/system', () => ({
  useSystemStore: () => ({
    loading: false,
    liveness: null,
    readiness: null,
    status: null,
    config: null,
    eventStats: null,
    fetchAll: mockSystemFetchAll,
    fetchStatus: vi.fn(),
    fetchConfig: vi.fn(),
    fetchEventStats: vi.fn(),
    reloadConfig: vi.fn(),
  }),
}));

vi.mock('@/stores/quality', () => ({
  useQualityStore: () => ({
    loading: false,
    alerts: [],
    healthReady: null,
    systemStatus: null,
    fetchAll: mockQualityFetchAll,
  }),
}));

vi.mock('@/stores/reconciliation', () => ({
  useReconciliationStore: () => ({
    alerts: [],
    reports: [],
    loading: false,
    fetchAll: mockReconFetchAll,
    fetchAlerts: vi.fn(),
    fetchReports: vi.fn(),
  }),
}));

vi.mock('@/components/system/HealthStatus.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

vi.mock('@/components/system/ComponentStatus.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

vi.mock('@/components/quality/ConnectorHealthCards.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

vi.mock('@/components/quality/QualityAlertsFeed.vue', () => ({
  default: { template: '<div class="child-stub" />' },
}));

describe('SystemView', () => {
  beforeEach(() => {
    mockSystemFetchAll.mockClear();
    mockQualityFetchAll.mockClear();
    mockReconFetchAll.mockClear();
  });

  function mountSystem() {
    return mount(SystemView, {
      global: {
        stubs: {
          ASpin: { template: '<div><slot /></div>' },
          ACollapse: { template: '<div><slot /></div>' },
          ACollapsePanel: { template: '<div><slot /></div>' },
          AButton: { template: '<button><slot /></button>' },
        },
      },
    });
  }

  it('renders the .system-page container', () => {
    const wrapper = mountSystem();
    expect(wrapper.find('.system-page').exists()).toBe(true);
  });

  it('calls all store fetch methods on mount', () => {
    mountSystem();
    expect(mockSystemFetchAll).toHaveBeenCalledTimes(1);
    expect(mockQualityFetchAll).toHaveBeenCalledTimes(1);
    expect(mockReconFetchAll).toHaveBeenCalledTimes(1);
  });

  it('renders HealthStatus component', () => {
    const wrapper = mountSystem();
    const stubs = wrapper.findAll('.child-stub');
    expect(stubs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders config section', () => {
    const wrapper = mountSystem();
    expect(wrapper.find('.config-card').exists()).toBe(true);
  });
});

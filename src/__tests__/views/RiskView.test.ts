import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import RiskView from '@/views/RiskView.vue';
import KillSwitchBar from '@/components/risk/KillSwitchBar.vue';
import DrawdownChart from '@/components/risk/DrawdownChart.vue';
import ExposureTable from '@/components/risk/ExposureTable.vue';
import RiskConfigCards from '@/components/risk/RiskConfigCards.vue';
import RiskEventsTable from '@/components/risk/RiskEventsTable.vue';

const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockSampleDrawdown = vi.fn().mockResolvedValue(undefined);
const mockFetchEvents = vi.fn().mockResolvedValue(undefined);
const mockPostKillSwitch = vi.fn().mockResolvedValue(undefined);

let mockStatus: Record<string, unknown> | null = {
  kill_switch: { global: { active: false }, symbols: {}, strategies: {} },
  drawdown: null,
};

const stub = { template: '<div class="child-stub" />' };

const childStubs = {
  KillSwitchBar: stub,
  DrawdownChart: stub,
  ExposureTable: stub,
  RiskConfigCards: stub,
  RiskEventsTable: stub,
  'a-spin': { template: '<div><slot /></div>' },
};

function mountView() {
  return mount(RiskView, { global: { stubs: childStubs } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStatus = {
    kill_switch: { global: { active: false }, symbols: {}, strategies: {} },
    drawdown: null,
  };
});

vi.mock('@/stores/risk', () => ({
  useRiskStore: () => ({
    get status() { return mockStatus; },
    exposure: null,
    config: null,
    events: [],
    currentEventsPage: 1,
    eventsPageSize: 20,
    eventsTotal: 0,
    drawdownHistory: [],
    loading: false,
    error: null,
    fetchAll: mockFetchAll,
    sampleDrawdown: mockSampleDrawdown,
    fetchEvents: mockFetchEvents,
    postKillSwitch: mockPostKillSwitch,
  }),
}));

describe('RiskView', () => {
  it('renders .risk-page container', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find('.risk-page').exists()).toBe(true);
  });

  it('calls riskStore.fetchAll on mount', async () => {
    mountView();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledOnce();
  });

  it('shows KillSwitchBar when status.kill_switch exists', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findComponent(KillSwitchBar).exists()).toBe(true);
  });

  it('renders all child components', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findComponent(KillSwitchBar).exists()).toBe(true);
    expect(wrapper.findComponent(DrawdownChart).exists()).toBe(true);
    expect(wrapper.findComponent(ExposureTable).exists()).toBe(true);
    expect(wrapper.findComponent(RiskConfigCards).exists()).toBe(true);
    expect(wrapper.findComponent(RiskEventsTable).exists()).toBe(true);
  });

  it('hides KillSwitchBar and shows placeholder when status is null', async () => {
    mockStatus = null;
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findComponent(KillSwitchBar).exists()).toBe(false);
    expect(wrapper.find('.ks-placeholder').exists()).toBe(true);
  });
});

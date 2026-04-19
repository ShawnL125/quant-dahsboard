import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  kill_switch: { global: { active: false, reason: '' }, symbols: {}, strategies: {} },
  drawdown: null,
};
let mockExposure: Record<string, unknown> | null = null;
let mockConfig: Record<string, unknown> | null = null;
let mockEvents: Record<string, unknown>[] = [];
let mockCurrentEventsPage = 1;
let mockEventsPageSize = 20;
let mockEventsTotal = 0;
let mockDrawdownHistory: Record<string, unknown>[] = [];

const childStubs = {
  KillSwitchBar: true,
  DrawdownChart: true,
  ExposureTable: true,
  RiskConfigCards: true,
  RiskEventsTable: true,
  'a-spin': { template: '<div class="a-spin-stub"><slot /></div>' },
};

function mountView() {
  return mount(RiskView, { global: { stubs: childStubs } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockStatus = {
    kill_switch: { global: { active: false, reason: '' }, symbols: {}, strategies: {} },
    drawdown: null,
  };
  mockExposure = null;
  mockConfig = null;
  mockEvents = [];
  mockCurrentEventsPage = 1;
  mockEventsPageSize = 20;
  mockEventsTotal = 0;
  mockDrawdownHistory = [];
});

afterEach(() => {
  vi.useRealTimers();
});

vi.mock('@/stores/risk', () => ({
  useRiskStore: () => ({
    get status() { return mockStatus; },
    get exposure() { return mockExposure; },
    get config() { return mockConfig; },
    get events() { return mockEvents; },
    get currentEventsPage() { return mockCurrentEventsPage; },
    get eventsPageSize() { return mockEventsPageSize; },
    get eventsTotal() { return mockEventsTotal; },
    get drawdownHistory() { return mockDrawdownHistory; },
    loading: false,
    error: null,
    fetchAll: mockFetchAll,
    sampleDrawdown: mockSampleDrawdown,
    fetchEvents: mockFetchEvents,
    postKillSwitch: mockPostKillSwitch,
  }),
}));

describe('RiskView', () => {
  // ── Rendering ────────────────────────────────────────────────────

  it('renders .risk-page container', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find('.risk-page').exists()).toBe(true);
  });

  it('renders the .risk-grid layout', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find('.risk-grid').exists()).toBe(true);
  });

  it('shows KillSwitchBar when status.kill_switch exists', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findComponent(KillSwitchBar).exists()).toBe(true);
  });

  it('shows .ks-placeholder when status is null', async () => {
    mockStatus = null;
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findComponent(KillSwitchBar).exists()).toBe(false);
    expect(wrapper.find('.ks-placeholder').exists()).toBe(true);
    expect(wrapper.find('.ks-placeholder').text()).toBe('Loading risk status...');
  });

  it('renders all child components in the grid', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findComponent(KillSwitchBar).exists()).toBe(true);
    expect(wrapper.findComponent(DrawdownChart).exists()).toBe(true);
    expect(wrapper.findComponent(ExposureTable).exists()).toBe(true);
    expect(wrapper.findComponent(RiskConfigCards).exists()).toBe(true);
    expect(wrapper.findComponent(RiskEventsTable).exists()).toBe(true);
  });

  // ── Props passed to children ──────────────────────────────────────

  it('passes drawdown and history props to DrawdownChart', async () => {
    mockStatus = {
      kill_switch: { global: { active: false, reason: '' }, symbols: {}, strategies: {} },
      drawdown: { current_pct: 5.2, peak_equity: 10000, max_threshold: 20 },
    };
    mockDrawdownHistory = [{ time: 1, value: 3.0 }, { time: 2, value: 5.2 }];
    const wrapper = mountView();
    await flushPromises();
    const chart = wrapper.findComponent(DrawdownChart);
    expect(chart.props('drawdown')).toEqual({ current_pct: 5.2, peak_equity: 10000, max_threshold: 20 });
    expect(chart.props('history')).toEqual([{ time: 1, value: 3.0 }, { time: 2, value: 5.2 }]);
  });

  it('passes exposure and config props to ExposureTable', async () => {
    mockExposure = { total_exposure: 5000, total_pct: 50 };
    mockConfig = { sizing_model: 'fixed', max_open_positions: 5 };
    const wrapper = mountView();
    await flushPromises();
    const table = wrapper.findComponent(ExposureTable);
    expect(table.props('exposure')).toEqual({ total_exposure: 5000, total_pct: 50 });
    expect(table.props('config')).toEqual({ sizing_model: 'fixed', max_open_positions: 5 });
  });

  it('passes config prop to RiskConfigCards', async () => {
    mockConfig = { sizing_model: 'risk_parity', max_open_positions: 3 };
    const wrapper = mountView();
    await flushPromises();
    const cards = wrapper.findComponent(RiskConfigCards);
    expect(cards.props('config')).toEqual({ sizing_model: 'risk_parity', max_open_positions: 3 });
  });

  it('passes events, pagination props to RiskEventsTable', async () => {
    mockEvents = [{ event_id: 'e1', event_type: 'kill_switch' }];
    mockCurrentEventsPage = 2;
    mockEventsPageSize = 10;
    mockEventsTotal = 42;
    const wrapper = mountView();
    await flushPromises();
    const table = wrapper.findComponent(RiskEventsTable);
    expect(table.props('events')).toEqual([{ event_id: 'e1', event_type: 'kill_switch' }]);
    expect(table.props('currentPage')).toBe(2);
    expect(table.props('pageSize')).toBe(10);
    expect(table.props('total')).toBe(42);
  });

  it('passes kill_switch prop to KillSwitchBar', async () => {
    mockStatus = {
      kill_switch: { global: { active: true, reason: 'test' }, symbols: {}, strategies: {} },
      drawdown: null,
    };
    const wrapper = mountView();
    await flushPromises();
    const bar = wrapper.findComponent(KillSwitchBar);
    expect(bar.props('killSwitch')).toEqual({
      global: { active: true, reason: 'test' },
      symbols: {},
      strategies: {},
    });
  });

  // ── onMounted lifecycle ───────────────────────────────────────────

  it('calls riskStore.fetchAll on mount', async () => {
    mountView();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledOnce();
  });

  // ── Drawdown sampler ──────────────────────────────────────────────

  it('starts the drawdown sampler on mount', async () => {
    mountView();
    await flushPromises();
    // Called once immediately on mount via startDrawdownSampler
    expect(mockSampleDrawdown).toHaveBeenCalledTimes(1);
  });

  it('calls sampleDrawdown every 5 seconds via setInterval', async () => {
    mountView();
    await flushPromises();
    mockSampleDrawdown.mockClear();

    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockSampleDrawdown).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockSampleDrawdown).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(10_000);
    await flushPromises();
    expect(mockSampleDrawdown).toHaveBeenCalledTimes(4);
  });

  it('stops the drawdown sampler on unmount', async () => {
    const wrapper = mountView();
    await flushPromises();
    mockSampleDrawdown.mockClear();

    wrapper.unmount();
    vi.advanceTimersByTime(15_000);
    await flushPromises();

    // After unmount, no more calls should happen
    expect(mockSampleDrawdown).not.toHaveBeenCalled();
  });

  // ── KillSwitchBar @toggle → onKillSwitchToggle ────────────────────

  it('calls postKillSwitch with activate=true when toggled on', async () => {
    const wrapper = mountView();
    await flushPromises();

    await wrapper.findComponent(KillSwitchBar).vm.$emit('toggle', true);
    await flushPromises();

    expect(mockPostKillSwitch).toHaveBeenCalledOnce();
    expect(mockPostKillSwitch).toHaveBeenCalledWith({
      level: 'GLOBAL',
      activate: true,
      reason: 'Manual activation via dashboard',
    });
  });

  it('calls postKillSwitch with activate=false when toggled off', async () => {
    const wrapper = mountView();
    await flushPromises();

    await wrapper.findComponent(KillSwitchBar).vm.$emit('toggle', false);
    await flushPromises();

    expect(mockPostKillSwitch).toHaveBeenCalledOnce();
    expect(mockPostKillSwitch).toHaveBeenCalledWith({
      level: 'GLOBAL',
      activate: false,
      reason: 'Manual deactivation via dashboard',
    });
  });

  // ── RiskEventsTable @refresh → onRefreshEvents ────────────────────

  it('calculates correct offset on refresh and calls fetchEvents', async () => {
    mockCurrentEventsPage = 3;
    mockEventsPageSize = 10;
    const wrapper = mountView();
    await flushPromises();
    mockFetchEvents.mockClear();

    await wrapper.findComponent(RiskEventsTable).vm.$emit('refresh');
    await flushPromises();

    // offset = (3 - 1) * 10 = 20
    expect(mockFetchEvents).toHaveBeenCalledWith(10, 20);
  });

  it('calculates offset of 0 when on page 1 refresh', async () => {
    mockCurrentEventsPage = 1;
    mockEventsPageSize = 20;
    const wrapper = mountView();
    await flushPromises();
    mockFetchEvents.mockClear();

    await wrapper.findComponent(RiskEventsTable).vm.$emit('refresh');
    await flushPromises();

    expect(mockFetchEvents).toHaveBeenCalledWith(20, 0);
  });

  // ── RiskEventsTable @page-change → onPageChange ───────────────────

  it('calculates correct offset on page change and calls fetchEvents', async () => {
    mockEventsPageSize = 25;
    const wrapper = mountView();
    await flushPromises();
    mockFetchEvents.mockClear();

    await wrapper.findComponent(RiskEventsTable).vm.$emit('page-change', 4);
    await flushPromises();

    // offset = (4 - 1) * 25 = 75
    expect(mockFetchEvents).toHaveBeenCalledWith(25, 75);
  });

  it('handles page 1 page-change correctly', async () => {
    mockEventsPageSize = 20;
    const wrapper = mountView();
    await flushPromises();
    mockFetchEvents.mockClear();

    await wrapper.findComponent(RiskEventsTable).vm.$emit('page-change', 1);
    await flushPromises();

    expect(mockFetchEvents).toHaveBeenCalledWith(20, 0);
  });
});

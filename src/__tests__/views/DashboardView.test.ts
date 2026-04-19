import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import DashboardView from '@/views/DashboardView.vue';

const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockFetchOrders = vi.fn().mockResolvedValue(undefined);
const mockSystemFetchAll = vi.fn().mockResolvedValue(undefined);

let mockPortfolio: Record<string, string> | null = {
  total_equity: '10000',
  available_balance: '5000',
  realized_pnl: '100',
  unrealized_pnl: '50',
};
let mockOrderHistory: Array<{ order_id: string; status: string }> = [];
const wsConnected = ref(false);

vi.mock('@/stores/trading', () => ({
  useTradingStore: () => ({
    loading: false,
    positions: [],
    get portfolio() { return mockPortfolio; },
    fetchAll: mockFetchAll,
  }),
}));

vi.mock('@/stores/orders', () => ({
  useOrdersStore: () => ({
    orders: [],
    get orderHistory() { return mockOrderHistory; },
    fetchOrders: mockFetchOrders,
  }),
}));

vi.mock('@/stores/system', () => ({
  useSystemStore: () => ({
    status: null,
    liveness: { uptime_seconds: 3600 },
    loading: false,
    fetchAll: mockSystemFetchAll,
  }),
}));

// Stub child components
vi.mock('@/components/dashboard/StatCards.vue', () => ({
  default: { template: '<div class="child-stub stat-cards" />' },
}));
vi.mock('@/components/dashboard/SystemStatusBar.vue', () => ({
  default: { template: '<div class="child-stub system-status-bar" />' },
}));
vi.mock('@/components/dashboard/EquityChart.vue', () => ({
  default: { template: '<div class="child-stub equity-chart" />' },
}));
vi.mock('@/components/dashboard/PositionsDonut.vue', () => ({
  default: { template: '<div class="child-stub positions-donut" />' },
}));
vi.mock('@/components/dashboard/RecentTrades.vue', () => ({
  default: { template: '<div class="child-stub recent-trades" />' },
}));

let wrapper: ReturnType<typeof mount>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockPortfolio = {
    total_equity: '10000',
    available_balance: '5000',
    realized_pnl: '100',
    unrealized_pnl: '50',
  };
  mockOrderHistory = [];
  wsConnected.value = false;
});

afterEach(() => {
  wrapper?.unmount();
  vi.useRealTimers();
});

function mountDashboard(wsVal = false) {
  wsConnected.value = wsVal;
  wrapper = mount(DashboardView, {
    global: {
      provide: { wsConnected },
      stubs: { ASpin: { template: '<div><slot /></div>' } },
    },
  });
  return wrapper;
}

describe('DashboardView', () => {
  // ── Basic rendering ──────────────────────────────────────────────

  it('renders the .dashboard container', async () => {
    mountDashboard();
    await flushPromises();
    expect(wrapper.find('.dashboard').exists()).toBe(true);
  });

  it('calls all three store fetch methods on mount', async () => {
    mountDashboard();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
    expect(mockSystemFetchAll).toHaveBeenCalledTimes(1);
  });

  it('renders all five child component stubs', async () => {
    mountDashboard();
    await flushPromises();
    expect(wrapper.findAll('.child-stub')).toHaveLength(5);
  });

  // ── recentTrades computed ────────────────────────────────────────

  it('filters FILLED and PARTIALLY_FILLED orders into recentTrades', async () => {
    mockOrderHistory = [
      { order_id: '1', status: 'FILLED' },
      { order_id: '2', status: 'PARTIALLY_FILLED' },
      { order_id: '3', status: 'CANCELED' },
      { order_id: '4', status: 'NEW' },
      { order_id: '5', status: 'FILLED' },
    ];
    mountDashboard();
    await flushPromises();
    const trades = wrapper.vm.recentTrades as Array<{ order_id: string }>;
    expect(trades).toHaveLength(3);
    mockOrderHistory = [];
  });

  it('limits recentTrades to 20 items', async () => {
    mockOrderHistory = Array.from({ length: 25 }, (_, i) => ({
      order_id: String(i),
      status: 'FILLED',
    }));
    mountDashboard();
    await flushPromises();
    expect(wrapper.vm.recentTrades).toHaveLength(20);
    mockOrderHistory = [];
  });

  // ── updateEquitySnapshot ─────────────────────────────────────────

  it('updates equity snapshot when portfolio has total_equity', async () => {
    mountDashboard();
    await flushPromises();
    const values = wrapper.vm.equityValues as number[];
    expect(values.length).toBeGreaterThan(0);
    expect(values[0]).toBe(10000);
  });

  it('does not update equity snapshot when portfolio is null', async () => {
    mockPortfolio = null;
    mountDashboard();
    await flushPromises();
    const values = wrapper.vm.equityValues as number[];
    expect(values).toHaveLength(0);
  });

  // ── Polling behavior ─────────────────────────────────────────────

  it('starts polling on mount when ws is not connected', async () => {
    mountDashboard();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
    expect(mockSystemFetchAll).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
    expect(mockFetchOrders).toHaveBeenCalledTimes(2);
    expect(mockSystemFetchAll).toHaveBeenCalledTimes(1);
  });

  it('does not start polling on mount when ws is connected', async () => {
    mountDashboard(true);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
    expect(mockSystemFetchAll).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
    expect(mockSystemFetchAll).toHaveBeenCalledTimes(1);
  });

  it('polls every 5 seconds', async () => {
    mountDashboard();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
    expect(mockFetchOrders).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(3);
    expect(mockFetchOrders).toHaveBeenCalledTimes(3);
  });

  // ── wsConnected watch ────────────────────────────────────────────

  it('stops polling when ws connects', async () => {
    mountDashboard();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);

    // Polling is running, advance to trigger one poll
    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
    expect(mockFetchOrders).toHaveBeenCalledTimes(2);

    // Connect WS — should stop polling
    wsConnected.value = true;
    await flushPromises();

    vi.advanceTimersByTime(15000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
    expect(mockFetchOrders).toHaveBeenCalledTimes(2);
  });

  it('starts polling when ws disconnects', async () => {
    mountDashboard(true);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);

    // No polling while connected
    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);

    // Disconnect WS — should start polling
    wsConnected.value = false;
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
    expect(mockFetchOrders).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(3);
    expect(mockFetchOrders).toHaveBeenCalledTimes(3);
  });

  // ── onUnmounted cleanup ──────────────────────────────────────────

  it('stops polling on unmount', async () => {
    mountDashboard();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    vi.advanceTimersByTime(15000);
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
  });
});

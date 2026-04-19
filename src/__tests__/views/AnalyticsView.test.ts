import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AnalyticsView from '@/views/AnalyticsView.vue';

const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockFetchRoundTrips = vi.fn().mockResolvedValue(undefined);
const mockFetchSignals = vi.fn().mockResolvedValue(undefined);
const mockFetchRoundTrip = vi.fn().mockResolvedValue(undefined);
const mockFetchStatsHistory = vi.fn().mockResolvedValue(undefined);

let mockStrategyStats: Record<string, unknown>[] = [];
let mockRoundTrips: Record<string, unknown>[] = [];
let mockRoundTripsTotal = 0;
let mockSignals: Record<string, unknown>[] = [];
let mockSignalsTotal = 0;
let mockConsecutiveLosses: Record<string, unknown> | null = null;
let mockSignalQuality: Record<string, unknown> | null = null;
let mockSelectedRoundTrip: Record<string, unknown> | null = null;
let mockStatsHistory: Record<string, unknown>[] = [];

const stubs = {
  'a-spin': { template: '<div class="a-spin-stub"><slot /></div>' },
  'a-modal': {
    template: '<div class="a-modal-stub" v-if="open"><slot /></div>',
    props: ['open', 'title', 'footer', 'width'],
    emits: ['ok', 'cancel', 'update:open'],
  },
  'a-button': {
    template: '<button class="a-button-stub" @click="$emit(\'click\')"><slot /></button>',
    props: ['size', 'type'],
    emits: ['click'],
  },
};

vi.mock('@/stores/analytics', () => ({
  useAnalyticsStore: () => ({
    loading: false,
    get strategyStats() { return mockStrategyStats; },
    get roundTrips() { return mockRoundTrips; },
    get roundTripsTotal() { return mockRoundTripsTotal; },
    get signals() { return mockSignals; },
    get signalsTotal() { return mockSignalsTotal; },
    get consecutiveLosses() { return mockConsecutiveLosses; },
    get signalQuality() { return mockSignalQuality; },
    get selectedRoundTrip() { return mockSelectedRoundTrip; },
    get statsHistory() { return mockStatsHistory; },
    error: null,
    fetchAll: mockFetchAll,
    fetchRoundTrips: mockFetchRoundTrips,
    fetchSignals: mockFetchSignals,
    fetchRoundTrip: mockFetchRoundTrip,
    fetchStatsHistory: mockFetchStatsHistory,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockStrategyStats = [];
  mockRoundTrips = [];
  mockRoundTripsTotal = 0;
  mockSignals = [];
  mockSignalsTotal = 0;
  mockConsecutiveLosses = null;
  mockSignalQuality = null;
  mockSelectedRoundTrip = null;
  mockStatsHistory = [];
});

function mountView() {
  return mount(AnalyticsView, { global: { stubs } });
}

describe('AnalyticsView', () => {
  // ── Basic rendering ──────────────────────────────────────────────

  it('renders the .analytics-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.analytics-page').exists()).toBe(true);
  });

  it('calls fetchAll on mount', async () => {
    mountView();
    await flushPromises();
    expect(mockFetchAll).toHaveBeenCalledOnce();
  });

  it('calls fetchRoundTrips and fetchSignals on mount', async () => {
    mountView();
    await flushPromises();
    expect(mockFetchRoundTrips).toHaveBeenCalledWith({ limit: 50 });
    expect(mockFetchSignals).toHaveBeenCalledWith({ limit: 50 });
  });

  // ── Strategy Stats section ────────────────────────────────────────

  it('renders empty state when no strategy stats', () => {
    const wrapper = mountView();
    expect(wrapper.find('.stats-section .empty-state').exists()).toBe(true);
    expect(wrapper.find('.stats-section .empty-state').text()).toBe('No strategy stats available');
  });

  it('renders strategy stats cards with data', () => {
    mockStrategyStats = [
      {
        snapshot_id: 'snap-1',
        strategy_id: 'momentum',
        total_pnl: '150.50',
        win_rate: '0.65',
        sharpe_ratio: '1.85',
        total_trades: 42,
        profit_factor: '2.10',
        max_drawdown_pct: '8.3',
      },
      {
        snapshot_id: 'snap-2',
        strategy_id: 'meanrev',
        total_pnl: '-30.20',
        win_rate: '0.48',
        sharpe_ratio: null,
        total_trades: 15,
        profit_factor: '0.90',
        max_drawdown_pct: '12.1',
      },
    ];
    const wrapper = mountView();
    const cards = wrapper.findAll('.stat-card');
    expect(cards.length).toBe(2);

    // First card
    expect(cards[0].find('.stat-strategy').text()).toBe('momentum');
    expect(cards[0].text()).toContain('150.50');
    expect(cards[0].text()).toContain('65.0%');
    expect(cards[0].text()).toContain('1.85');
    expect(cards[0].text()).toContain('42');
    expect(cards[0].text()).toContain('2.10');
    expect(cards[0].text()).toContain('8.3%');

    // Second card - negative P&L
    expect(cards[1].find('.stat-strategy').text()).toBe('meanrev');
    expect(cards[1].text()).toContain('-30.20');
    expect(cards[1].text()).toContain('-'); // dash for null sharpe
  });

  it('applies val-positive class for positive P&L and val-negative for negative', () => {
    mockStrategyStats = [
      { snapshot_id: 's1', strategy_id: 'a', total_pnl: '100', win_rate: '0.5', sharpe_ratio: null, total_trades: 1, profit_factor: '1', max_drawdown_pct: '0' },
      { snapshot_id: 's2', strategy_id: 'b', total_pnl: '-50', win_rate: '0.5', sharpe_ratio: null, total_trades: 1, profit_factor: '1', max_drawdown_pct: '0' },
    ];
    const wrapper = mountView();
    const cards = wrapper.findAll('.stat-card');
    const pnlValues = cards.map((c) => c.findAll('.metric-value')[0]);
    expect(pnlValues[0].classes()).toContain('val-positive');
    expect(pnlValues[1].classes()).toContain('val-negative');
  });

  it('calls onViewStatsHistory when clicking a stat card', async () => {
    mockStrategyStats = [
      {
        snapshot_id: 'snap-1',
        strategy_id: 'momentum',
        total_pnl: '100',
        win_rate: '0.6',
        sharpe_ratio: '1.0',
        total_trades: 10,
        profit_factor: '1.5',
        max_drawdown_pct: '5.0',
      },
    ];
    const wrapper = mountView();
    const card = wrapper.find('.stat-card');
    await card.trigger('click');
    await flushPromises();

    expect(mockFetchStatsHistory).toHaveBeenCalledWith('momentum');
  });

  // ── Quality cards ─────────────────────────────────────────────────

  it('does not render quality cards when data is null', () => {
    const wrapper = mountView();
    expect(wrapper.find('.quality-card').exists()).toBe(false);
  });

  it('renders consecutive losses quality card', () => {
    mockConsecutiveLosses = { consecutive_losses: 3, max_consecutive_losses: 7, strategy_id: null };
    const wrapper = mountView();
    const cards = wrapper.findAll('.quality-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(wrapper.text()).toContain('Consecutive Losses');
    expect(wrapper.find('.quality-big').text()).toBe('3');
    expect(wrapper.text()).toContain('max: 7');
  });

  it('renders signal quality card', () => {
    mockSignalQuality = { signal_count: 100, trade_count: 65, fill_rate: '0.65' };
    const wrapper = mountView();
    expect(wrapper.text()).toContain('Signal Quality');
    expect(wrapper.text()).toContain('65.0%');
    expect(wrapper.text()).toContain('65 trades / 100 signals');
  });

  it('renders both quality cards when both have data', () => {
    mockConsecutiveLosses = { consecutive_losses: 2, max_consecutive_losses: 5, strategy_id: null };
    mockSignalQuality = { signal_count: 50, trade_count: 30, fill_rate: '0.60' };
    const wrapper = mountView();
    const cards = wrapper.findAll('.quality-card');
    expect(cards.length).toBe(2);
  });

  // ── Round Trips section ───────────────────────────────────────────

  it('shows empty state when no round trips', () => {
    const wrapper = mountView();
    expect(wrapper.find('.trips-section .empty-state').exists()).toBe(true);
    expect(wrapper.find('.trips-section .empty-state').text()).toBe('No round-trip trades');
  });

  it('renders round trips table with data', () => {
    mockRoundTrips = [
      {
        trade_id: 'rt-1',
        symbol: 'BTC/USDT',
        side: 'long',
        entry_price: '40000.00',
        exit_price: '42000.00',
        net_pnl: '150.50',
        fee: '5.00',
        holding_duration_sec: 3600,
        strategy_id: 'momentum',
      },
      {
        trade_id: 'rt-2',
        symbol: 'ETH/USDT',
        side: 'short',
        entry_price: '3000.00',
        exit_price: '2900.00',
        net_pnl: '-25.30',
        fee: '3.00',
        holding_duration_sec: 45,
        strategy_id: 'meanrev',
      },
    ];
    mockRoundTripsTotal = 42;
    const wrapper = mountView();

    expect(wrapper.find('.trips-section .data-table').exists()).toBe(true);
    expect(wrapper.find('.section-badge').text()).toBe('42');

    const rows = wrapper.findAll('.trips-section tbody tr');
    expect(rows.length).toBe(2);

    // First row - long side, positive P&L
    expect(rows[0].text()).toContain('BTC/USDT');
    expect(rows[0].find('.side-long').exists()).toBe(true);
    expect(rows[0].text()).toContain('40000.00');
    expect(rows[0].text()).toContain('42000.00');
    expect(rows[0].text()).toContain('+150.50');
    expect(rows[0].text()).toContain('1.0h'); // formatDuration(3600)
    expect(rows[0].text()).toContain('momentum');
  });

  it('renders short side with side-short class', () => {
    mockRoundTrips = [
      {
        trade_id: 'rt-short',
        symbol: 'ETH/USDT',
        side: 'short',
        entry_price: '3000.00',
        exit_price: '2900.00',
        net_pnl: '-25.30',
        fee: '3.00',
        holding_duration_sec: 45,
        strategy_id: 'meanrev',
      },
    ];
    const wrapper = mountView();
    const row = wrapper.find('.trips-section tbody tr');
    expect(row.find('.side-short').exists()).toBe(true);
  });

  it('applies val-negative class for negative P&L in round trips', () => {
    mockRoundTrips = [
      {
        trade_id: 'rt-neg',
        symbol: 'BTC/USDT',
        side: 'long',
        entry_price: '42000.00',
        exit_price: '40000.00',
        net_pnl: '-100.00',
        fee: '5.00',
        holding_duration_sec: 1800,
        strategy_id: 's1',
      },
    ];
    const wrapper = mountView();
    const pnlCell = wrapper.findAll('.trips-section tbody td')[4];
    expect(pnlCell.classes()).toContain('val-negative');
  });

  // ── formatDuration via round trips rendering ──────────────────────

  it('formats duration as seconds when < 60', () => {
    mockRoundTrips = [
      {
        trade_id: 'rt-dur1',
        symbol: 'BTC/USDT',
        side: 'long',
        entry_price: '100',
        exit_price: '110',
        net_pnl: '10',
        fee: '1',
        holding_duration_sec: 30,
        strategy_id: 's1',
      },
    ];
    const wrapper = mountView();
    // Duration cell is the 7th cell (index 6): Symbol, Side, Entry, Exit, P&L, Fee, Duration, Strategy
    const cells = wrapper.findAll('.trips-section tbody tr:first-child td');
    expect(cells[6].text()).toBe('30s');
  });

  it('formats duration as minutes when >= 60 and < 3600', () => {
    mockRoundTrips = [
      {
        trade_id: 'rt-dur2',
        symbol: 'BTC/USDT',
        side: 'long',
        entry_price: '100',
        exit_price: '110',
        net_pnl: '10',
        fee: '1',
        holding_duration_sec: 180,
        strategy_id: 's1',
      },
    ];
    const wrapper = mountView();
    const cells = wrapper.findAll('.trips-section tbody tr:first-child td');
    expect(cells[6].text()).toBe('3m');
  });

  it('formats duration as hours when >= 3600', () => {
    mockRoundTrips = [
      {
        trade_id: 'rt-dur3',
        symbol: 'BTC/USDT',
        side: 'long',
        entry_price: '100',
        exit_price: '110',
        net_pnl: '10',
        fee: '1',
        holding_duration_sec: 7200,
        strategy_id: 's1',
      },
    ];
    const wrapper = mountView();
    const cells = wrapper.findAll('.trips-section tbody tr:first-child td');
    expect(cells[6].text()).toBe('2.0h');
  });

  // ── onViewRoundTrip via row click ─────────────────────────────────

  it('calls fetchRoundTrip and opens modal when a round-trip row is clicked', async () => {
    mockRoundTrips = [
      {
        trade_id: 'rt-click',
        symbol: 'BTC/USDT',
        side: 'long',
        entry_price: '40000',
        exit_price: '42000',
        net_pnl: '100',
        fee: '5',
        holding_duration_sec: 3600,
        strategy_id: 's1',
      },
    ];
    const wrapper = mountView();
    const row = wrapper.find('.trips-section .clickable-row');
    await row.trigger('click');
    await flushPromises();

    expect(mockFetchRoundTrip).toHaveBeenCalledWith('rt-click');
    // Modal should be visible after fetchRoundTrip completes
    expect(wrapper.find('.a-modal-stub').exists()).toBe(true);
  });

  // ── Round-Trip Detail Modal ───────────────────────────────────────

  it('renders round-trip detail modal with selected round trip data', async () => {
    mockSelectedRoundTrip = {
      trade_id: 'rt-detail',
      strategy_id: 'strat_a',
      symbol: 'BTC/USDT',
      side: 'long',
      entry_price: '40000.50',
      exit_price: '42000.75',
      quantity: '0.5',
      gross_pnl: '1000.12',
      fee: '10.50',
      net_pnl: '989.62',
      holding_duration_sec: 1800,
      stop_triggered: false,
      entry_time: '2025-01-15T08:00:00Z',
      exit_time: '2025-01-15T08:30:00Z',
    };
    // Need a round trip to click to open modal
    mockRoundTrips = [
      {
        trade_id: 'rt-detail',
        symbol: 'BTC/USDT',
        side: 'long',
        entry_price: '40000.50',
        exit_price: '42000.75',
        net_pnl: '989.62',
        fee: '10.50',
        holding_duration_sec: 1800,
        strategy_id: 'strat_a',
      },
    ];
    const wrapper = mountView();
    // Click the row to open modal
    await wrapper.find('.clickable-row').trigger('click');
    await flushPromises();

    // Check modal content
    expect(wrapper.find('.a-modal-stub').exists()).toBe(true);
    expect(wrapper.text()).toContain('rt-detail');
    expect(wrapper.text()).toContain('strat_a');
    expect(wrapper.text()).toContain('BTC/USDT');
    expect(wrapper.text()).toContain('40000.50');
    expect(wrapper.text()).toContain('42000.75');
    expect(wrapper.text()).toContain('0.5');
    expect(wrapper.text()).toContain('1000.12');
    expect(wrapper.text()).toContain('10.50');
    expect(wrapper.text()).toContain('989.62');
    expect(wrapper.text()).toContain('No'); // stop_triggered: false
    expect(wrapper.text()).toContain('30m'); // formatDuration(1800)
  });

  // ── Signals section ───────────────────────────────────────────────

  it('shows empty state when no signals', () => {
    const wrapper = mountView();
    expect(wrapper.find('.signals-section .empty-state').exists()).toBe(true);
    expect(wrapper.find('.signals-section .empty-state').text()).toBe('No signal history');
  });

  it('renders signals table with data', () => {
    mockSignals = [
      {
        signal_id: 'sig-1',
        time: '2025-01-15T10:00:00Z',
        symbol: 'BTC/USDT',
        direction: 'long',
        strength: '0.85',
        strategy_id: 'momentum',
        reason: 'Golden cross detected',
      },
      {
        signal_id: 'sig-2',
        time: '2025-01-15T11:00:00Z',
        symbol: 'ETH/USDT',
        direction: 'short',
        strength: '0.60',
        strategy_id: 'meanrev',
        reason: 'Overbought RSI',
      },
    ];
    mockSignalsTotal = 99;
    const wrapper = mountView();

    expect(wrapper.find('.signals-section .data-table').exists()).toBe(true);
    // Check badge
    const badges = wrapper.findAll('.section-badge');
    const signalBadge = badges.find((b) => b.text() === '99');
    expect(signalBadge).toBeTruthy();

    const rows = wrapper.findAll('.signals-section tbody tr');
    expect(rows.length).toBe(2);

    // First signal
    expect(rows[0].text()).toContain('BTC/USDT');
    expect(rows[0].text()).toContain('long');
    expect(rows[0].text()).toContain('0.85');
    expect(rows[0].text()).toContain('momentum');
    expect(rows[0].text()).toContain('Golden cross detected');

    // Second signal - short direction
    expect(rows[1].text()).toContain('short');
    expect(rows[1].find('.side-short').exists()).toBe(true);
  });

  it('applies side-long and side-short classes for signal directions', () => {
    mockSignals = [
      { signal_id: 's1', time: '2025-01-01T00:00:00Z', symbol: 'BTC/USDT', direction: 'long', strength: '0.5', strategy_id: 's1', reason: 'test' },
      { signal_id: 's2', time: '2025-01-01T00:00:00Z', symbol: 'ETH/USDT', direction: 'short', strength: '0.5', strategy_id: 's1', reason: 'test' },
    ];
    const wrapper = mountView();
    const rows = wrapper.findAll('.signals-section tbody tr');
    expect(rows[0].find('.side-long').exists()).toBe(true);
    expect(rows[1].find('.side-short').exists()).toBe(true);
  });

  it('renders signal reason with title attribute for tooltip', () => {
    mockSignals = [
      { signal_id: 's1', time: '2025-01-01T00:00:00Z', symbol: 'BTC/USDT', direction: 'long', strength: '0.5', strategy_id: 's1', reason: 'A very long reason text' },
    ];
    const wrapper = mountView();
    const reasonCell = wrapper.find('.signals-section .text-ellipsis');
    expect(reasonCell.exists()).toBe(true);
    expect(reasonCell.attributes('title')).toBe('A very long reason text');
  });

  // ── Stats History section ─────────────────────────────────────────

  it('does not render stats history section when statsHistoryStrategy is null', () => {
    const wrapper = mountView();
    // The stats history section is conditionally rendered with v-if="statsHistoryStrategy"
    // It does NOT have a specific class since it's inline-styled; check for "Stats History" text
    const text = wrapper.text();
    expect(text).not.toContain('Stats History:');
  });

  it('renders stats history section after clicking a stat card', async () => {
    mockStrategyStats = [
      {
        snapshot_id: 'snap-1',
        strategy_id: 'momentum',
        total_pnl: '100',
        win_rate: '0.6',
        sharpe_ratio: '1.0',
        total_trades: 10,
        profit_factor: '1.5',
        max_drawdown_pct: '5.0',
      },
    ];
    mockStatsHistory = [
      {
        snapshot_id: 'hist-1',
        time: '2025-01-14T00:00:00Z',
        total_pnl: '50.00',
        win_rate: '0.55',
        sharpe_ratio: '0.8',
        max_drawdown_pct: '3.2',
        total_trades: 5,
      },
    ];
    const wrapper = mountView();

    // Click the stat card to trigger onViewStatsHistory
    await wrapper.find('.stat-card').trigger('click');
    await flushPromises();

    // Now the stats history section should be visible
    expect(wrapper.text()).toContain('Stats History: momentum');
    expect(wrapper.text()).toContain('50.00');
    expect(wrapper.text()).toContain('55.0%');
    expect(wrapper.text()).toContain('5');
    expect(mockFetchStatsHistory).toHaveBeenCalledWith('momentum');
  });

  it('renders stats history empty state when history is empty', async () => {
    mockStrategyStats = [
      {
        snapshot_id: 'snap-1',
        strategy_id: 'test_strat',
        total_pnl: '100',
        win_rate: '0.6',
        sharpe_ratio: null,
        total_trades: 10,
        profit_factor: '1.0',
        max_drawdown_pct: '0',
      },
    ];
    mockStatsHistory = [];
    const wrapper = mountView();
    await wrapper.find('.stat-card').trigger('click');
    await flushPromises();

    // Look for "No history data" text in the stats history section
    expect(wrapper.text()).toContain('No history data');
  });

  it('closes stats history when Close button is clicked', async () => {
    mockStrategyStats = [
      {
        snapshot_id: 'snap-1',
        strategy_id: 'momentum',
        total_pnl: '100',
        win_rate: '0.6',
        sharpe_ratio: null,
        total_trades: 10,
        profit_factor: '1.0',
        max_drawdown_pct: '0',
      },
    ];
    mockStatsHistory = [
      {
        snapshot_id: 'hist-1',
        time: '2025-01-14T00:00:00Z',
        total_pnl: '50.00',
        win_rate: '0.55',
        sharpe_ratio: '0.8',
        max_drawdown_pct: '3.2',
        total_trades: 5,
      },
    ];
    const wrapper = mountView();
    await wrapper.find('.stat-card').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Stats History: momentum');

    // Find and click the Close button in the stats history section
    const closeBtn = wrapper.findAll('.a-button-stub').find((b) => b.text().includes('Close'));
    expect(closeBtn).toBeTruthy();
    await closeBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('Stats History:');
  });

  // ── Section presence checks ───────────────────────────────────────

  it('renders all four sections', () => {
    const wrapper = mountView();
    expect(wrapper.find('.stats-section').exists()).toBe(true);
    expect(wrapper.find('.quality-section').exists()).toBe(true);
    expect(wrapper.find('.trips-section').exists()).toBe(true);
    expect(wrapper.find('.signals-section').exists()).toBe(true);
  });
});

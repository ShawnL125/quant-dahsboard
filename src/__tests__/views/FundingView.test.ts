import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import FundingView from '@/views/FundingView.vue';

const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockFetchHistory = vi.fn().mockResolvedValue(undefined);
const mockFetchCost = vi.fn().mockResolvedValue(undefined);
const mockBackfill = vi.fn().mockResolvedValue({ records_fetched: 42 });

let mockCurrentRates: Record<string, unknown> = {};
let mockHistoryRates: Record<string, unknown>[] = [];
let mockCostSummary: Record<string, unknown> | null = null;

let mockStrategies: Record<string, unknown>[] = [];
const mockFetchStrategies = vi.fn().mockResolvedValue(undefined);

vi.mock('ant-design-vue', () => ({
  message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/stores/funding', () => ({
  useFundingStore: () => ({
    loading: false,
    get currentRates() { return mockCurrentRates; },
    get historyRates() { return mockHistoryRates; },
    get costSummary() { return mockCostSummary; },
    set costSummary(val: unknown) { mockCostSummary = val as Record<string, unknown> | null; },
    error: null,
    fetchAll: mockFetchAll,
    fetchHistory: mockFetchHistory,
    fetchCost: mockFetchCost,
  }),
}));

vi.mock('@/stores/strategies', () => ({
  useStrategiesStore: () => ({
    get strategies() { return mockStrategies; },
    loading: false,
    error: null,
    fetchStrategies: mockFetchStrategies,
  }),
}));

vi.mock('@/api/funding', () => ({
  fundingApi: {
    backfill: (...args: unknown[]) => mockBackfill(...args),
  },
}));

const ASelectStub = {
  name: 'ASelect',
  template: '<div class="a-select-stub" role="select"><slot /></div>',
  props: ['value', 'placeholder', 'size', 'allowClear'],
  emits: ['change', 'update:value'],
};

const stubs = {
  'a-spin': { template: '<div class="a-spin-stub"><slot /></div>' },
  'a-button': {
    template: '<button class="a-button-stub" @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'type', 'size', 'danger'],
    emits: ['click'],
  },
  'a-select': ASelectStub,
  'a-select-option': {
    template: '<div class="a-select-option-stub"><slot /></div>',
    props: ['value'],
  },
  'a-input': {
    template: '<input class="a-input-stub" :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
    props: ['value', 'placeholder', 'size'],
    emits: ['update:value'],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentRates = {};
  mockHistoryRates = [];
  mockCostSummary = null;
  mockStrategies = [];
});

function mountView() {
  return mount(FundingView, { global: { stubs } });
}

describe('FundingView', () => {
  // ── Basic rendering ──────────────────────────────────────────────

  it('renders .funding-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.funding-page').exists()).toBe(true);
  });

  it('calls fetchAll and fetchStrategies on mount', () => {
    mountView();
    expect(mockFetchAll).toHaveBeenCalledOnce();
    expect(mockFetchStrategies).toHaveBeenCalledOnce();
  });

  it('renders all four card sections', () => {
    const wrapper = mountView();
    const titles = wrapper.findAll('.section-title');
    const titleTexts = titles.map((el) => el.text());
    expect(titleTexts).toContain('Current Funding Rates');
    expect(titleTexts).toContain('Historical Rates');
    expect(titleTexts).toContain('Funding Cost Summary');
    expect(titleTexts).toContain('Backfill');
  });

  // ── Current Rates section ─────────────────────────────────────────

  it('shows empty state when no current rates', () => {
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const rateCard = cards[0];
    expect(rateCard.find('.empty-state').exists()).toBe(true);
    expect(rateCard.find('.empty-state').text()).toBe('No funding rate data');
  });

  it('renders rate cards when currentRates has data', () => {
    mockCurrentRates = {
      'BTC/USDT': { symbol: 'BTC/USDT', funding_rate: '0.0001', funding_time: '2025-01-15T08:00:00Z', mark_price: '42000.50' },
      'ETH/USDT': { symbol: 'ETH/USDT', funding_rate: '-0.0002', funding_time: '2025-01-15T08:00:00Z' },
    };
    const wrapper = mountView();
    const rateCards = wrapper.findAll('.rate-card');
    expect(rateCards.length).toBe(2);

    // BTC should show positive rate
    expect(rateCards[0].find('.rate-symbol').text()).toBe('BTC/USDT');
    expect(rateCards[0].find('.rate-value').classes()).toContain('val-positive');
    expect(rateCards[0].find('.rate-value').text()).toContain('0.0100%');
    expect(rateCards[0].find('.rate-mono').text()).toBe('42000.50');

    // ETH should show negative rate
    expect(rateCards[1].find('.rate-symbol').text()).toBe('ETH/USDT');
    expect(rateCards[1].find('.rate-value').classes()).toContain('val-negative');
  });

  it('does not render mark price row when rate.mark_price is falsy', () => {
    mockCurrentRates = {
      'BTC/USDT': { symbol: 'BTC/USDT', funding_rate: '0.0001', funding_time: '2025-01-15T08:00:00Z' },
    };
    const wrapper = mountView();
    const card = wrapper.find('.rate-card');
    expect(card.find('.rate-row').exists()).toBe(false);
  });

  // ── Historical Rates section ──────────────────────────────────────

  it('shows empty state for history when no symbol selected', () => {
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const historyCard = cards[1];
    expect(historyCard.find('.empty-state').text()).toBe('Select a symbol to view history');
  });

  it('renders history table with data', () => {
    mockHistoryRates = [
      { symbol: 'BTC/USDT', funding_rate: '0.0003', funding_time: '2025-01-15T08:00:00Z', mark_price: '42000' },
      { symbol: 'BTC/USDT', funding_rate: '-0.0001', funding_time: '2025-01-14T08:00:00Z', mark_price: '41500' },
    ];
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const historyCard = cards[1];
    const rows = historyCard.findAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('renders empty state for history when selected but no data', async () => {
    mockCurrentRates = { 'BTC/USDT': {} };
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const historyCard = cards[1];
    expect(historyCard.find('.empty-state').exists()).toBe(true);
  });

  // ── Cost Summary section ──────────────────────────────────────────

  it('shows empty state for cost when no strategy selected', () => {
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const costCard = cards[2];
    expect(costCard.find('.empty-state').text()).toBe('Select a strategy to view cost');
  });

  it('renders cost summary with data', () => {
    mockCostSummary = { strategy_id: 'my_strat', total_cost: '-12.50', record_count: 30 };
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const costCard = cards[2];
    expect(costCard.find('.cost-summary').exists()).toBe(true);

    const rows = costCard.findAll('.cost-row');
    expect(rows.length).toBe(3);
    expect(rows[0].text()).toContain('my_strat');
    expect(rows[1].text()).toContain('-12.50');
    expect(rows[1].find('.cost-value').classes()).toContain('val-negative');
    expect(rows[2].text()).toContain('30');
  });

  it('shows val-positive class for positive total cost', () => {
    mockCostSummary = { strategy_id: 's1', total_cost: '5.00', record_count: 10 };
    const wrapper = mountView();
    const costValue = wrapper.findAll('.cost-row')[1].find('.cost-value');
    expect(costValue.classes()).toContain('val-positive');
  });

  it('shows "No cost data" when strategy selected but no data', async () => {
    // When onCostStrategyChange is called with undefined, it clears costSummary
    const wrapper = mountView();
    // Find all select stubs and emit change on the second one (cost strategy)
    const selects = wrapper.findAllComponents({ name: 'ASelect' });
    const costSelect = selects[1];
    await costSelect.vm.$emit('change', undefined);
    await flushPromises();

    const cards = wrapper.findAll('.card');
    const costCard = cards[2];
    expect(costCard.find('.empty-state').exists()).toBe(true);
  });

  // ── Backfill section ──────────────────────────────────────────────

  it('renders backfill form with input fields and button', () => {
    const wrapper = mountView();
    const backfillCard = wrapper.findAll('.card')[3];
    expect(backfillCard.find('.backfill-form').exists()).toBe(true);
    const inputs = backfillCard.findAll('.a-input-stub');
    expect(inputs.length).toBe(2);
    const btn = backfillCard.find('.a-button-stub');
    expect(btn.text()).toBe('Backfill');
  });

  it('shows warning when backfill is called with empty inputs', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountView();
    const btn = wrapper.findAll('.card')[3].find('.a-button-stub');
    await btn.trigger('click');
    await flushPromises();
    expect(message.warning).toHaveBeenCalledWith('Symbol and exchange are required');
    expect(mockBackfill).not.toHaveBeenCalled();
  });

  it('calls fundingApi.backfill with correct params and shows success', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountView();
    const backfillCard = wrapper.findAll('.card')[3];
    const inputs = backfillCard.findAll('.a-input-stub');

    await inputs[0].setValue('BTC/USDT');
    await inputs[1].setValue('binance');

    const btn = backfillCard.find('.a-button-stub');
    await btn.trigger('click');
    await flushPromises();

    expect(mockBackfill).toHaveBeenCalledWith({ symbol: 'BTC/USDT', exchange: 'binance' });
    expect(message.success).toHaveBeenCalledWith('Backfilled 42 records');
  });

  it('shows error message when backfill fails', async () => {
    const { message } = await import('ant-design-vue');
    mockBackfill.mockRejectedValueOnce(new Error('Server error'));
    const wrapper = mountView();
    const backfillCard = wrapper.findAll('.card')[3];
    const inputs = backfillCard.findAll('.a-input-stub');

    await inputs[0].setValue('ETH/USDT');
    await inputs[1].setValue('okx');

    const btn = backfillCard.find('.a-button-stub');
    await btn.trigger('click');
    await flushPromises();

    expect(message.error).toHaveBeenCalledWith('Backfill failed');
  });

  // ── onRefresh ─────────────────────────────────────────────────────

  it('calls store.fetchAll when Refresh button is clicked', async () => {
    const wrapper = mountView();
    mockFetchAll.mockClear();
    const refreshBtn = wrapper.findAll('.a-button-stub').find((b) => b.text().includes('Refresh'));
    expect(refreshBtn).toBeTruthy();
    await refreshBtn!.trigger('click');
    expect(mockFetchAll).toHaveBeenCalledOnce();
  });

  // ── onSymbolChange ────────────────────────────────────────────────

  it('calls store.fetchHistory when symbol select changes', async () => {
    const wrapper = mountView();
    const selects = wrapper.findAllComponents({ name: 'ASelect' });
    const symbolSelect = selects[0];
    await symbolSelect.vm.$emit('change', 'BTC/USDT');
    await flushPromises();
    expect(mockFetchHistory).toHaveBeenCalledWith('BTC/USDT', { limit: 50 });
  });

  // ── onCostStrategyChange ──────────────────────────────────────────

  it('calls store.fetchCost when cost strategy select changes with valid id', async () => {
    const wrapper = mountView();
    const selects = wrapper.findAllComponents({ name: 'ASelect' });
    const costSelect = selects[1];
    await costSelect.vm.$emit('change', 'strat_abc');
    await flushPromises();
    expect(mockFetchCost).toHaveBeenCalledWith('strat_abc');
  });

  // ── symbolList computed ───────────────────────────────────────────

  it('populates symbol options from currentRates keys', () => {
    mockCurrentRates = {
      'BTC/USDT': { symbol: 'BTC/USDT', funding_rate: '0.0001', funding_time: '2025-01-15T08:00:00Z' },
      'ETH/USDT': { symbol: 'ETH/USDT', funding_rate: '0.0002', funding_time: '2025-01-15T08:00:00Z' },
    };
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const historyCard = cards[1];
    const options = historyCard.findAll('.a-select-option-stub');
    expect(options.length).toBe(2);
  });

  // ── strategyIds computed ──────────────────────────────────────────

  it('populates strategy options from strategies store', () => {
    mockStrategies = [
      { strategy_id: 'strat_a', symbols: [], exchanges: [], timeframes: [], is_running: true, parameters: {} },
      { strategy_id: 'strat_b', symbols: [], exchanges: [], timeframes: [], is_running: false, parameters: {} },
    ];
    const wrapper = mountView();
    const cards = wrapper.findAll('.card');
    const costCard = cards[2];
    const options = costCard.findAll('.a-select-option-stub');
    expect(options.length).toBe(2);
  });
});

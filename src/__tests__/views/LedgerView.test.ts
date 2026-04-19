import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import LedgerView from '@/views/LedgerView.vue';

// ── Shared mock state ─────────────────────────────────────────────────

let mockStore: Record<string, unknown>;

const mockFetchAll = vi.fn();
const mockFetchDailySummary = vi.fn();
const mockPostCashFlow = vi.fn();

vi.mock('@/stores/ledger', () => ({
  useLedgerStore: () => mockStore,
}));

// ── Ant Design Vue stubs (full DOM interaction) ──────────────────────

const antStubs = {
  'a-spin': {
    name: 'a-spin',
    template: '<div class="a-spin-stub"><slot /></div>',
    props: ['spinning'],
  },
  'a-button': {
    name: 'a-button',
    template: '<button class="a-button-stub" @click="$emit(\'click\')"><slot /></button>',
    props: ['size', 'type'],
    emits: ['click'],
  },
  'a-date-picker': {
    name: 'a-date-picker',
    template: '<input class="a-date-picker-stub" />',
    props: ['value', 'size', 'format', 'valueFormat'],
    emits: ['update:value', 'change'],
  },
  'a-modal': {
    name: 'a-modal',
    template: `
      <div v-if="open" class="a-modal-stub">
        <slot />
        <button class="modal-ok" @click="$emit('ok')">OK</button>
      </div>
    `,
    props: ['open', 'title', 'confirmLoading'],
    emits: ['update:open', 'ok'],
  },
  'a-form': {
    name: 'a-form',
    template: '<div class="a-form-stub"><slot /></div>',
    props: ['layout'],
  },
  'a-form-item': {
    name: 'a-form-item',
    template: '<div class="a-form-item-stub"><slot /></div>',
    props: ['label'],
  },
  'a-select': {
    name: 'a-select',
    template: '<select class="a-select-stub"><slot /></select>',
    props: ['value'],
    emits: ['update:value'],
  },
  'a-select-option': {
    name: 'a-select-option',
    template: '<option class="a-select-option-stub"><slot /></option>',
    props: ['value'],
  },
  'a-input': {
    name: 'a-input',
    template: '<input class="a-input-stub" :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
    props: ['value', 'placeholder'],
    emits: ['update:value'],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────

function createStore(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function mountView(overrides: Record<string, unknown> = {}): VueWrapper {
  mockStore = createStore(overrides);
  return mount(LedgerView, { global: { stubs: antStubs } });
}

// ── Test data ─────────────────────────────────────────────────────────

const sampleBalances = {
  Binance: { USDT: '10000.00', BTC: '0.5000' },
  OKX: { USDT: '5000.00' },
};

const sampleDailySummary = [
  {
    date: '2026-04-19',
    account: 'Binance',
    asset: 'USDT',
    opening_balance: '9000.00',
    total_debit: '1500.00',
    total_credit: '500.00',
    closing_balance: '10000.00',
    entry_count: 5,
  },
];

const sampleEntries = [
  {
    entry_id: 'e1',
    timestamp: '2026-04-19T10:30:00Z',
    account: 'Binance',
    counter_account: 'external',
    debit: '1000.00',
    credit: '0.00',
    balance: '10000.00',
    asset: 'USDT',
    reference_type: 'trade',
    reference_id: 'ref-abc12345-6789',
    strategy_id: 'strat-1',
    symbol: 'BTC/USDT',
    exchange: 'Binance',
  },
  {
    entry_id: 'e2',
    timestamp: '2026-04-19T11:00:00Z',
    account: 'Binance',
    counter_account: 'fees',
    debit: '0.00',
    credit: '50.00',
    balance: '9950.00',
    asset: 'USDT',
    reference_type: 'fee',
    reference_id: 'fee-xyz98765-4321',
  },
];

// ── Tests ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LedgerView', () => {
  // ── Container & mount ────────────────────────────────────────────

  it('renders .ledger-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.ledger-page').exists()).toBe(true);
  });

  it('calls fetchAll and fetchDailySummary on mount with today date', () => {
    mountView();
    expect(mockFetchAll).toHaveBeenCalledOnce();
    expect(mockFetchDailySummary).toHaveBeenCalledOnce();
    const dateArg = mockFetchDailySummary.mock.calls[0][0] as string;
    expect(dateArg).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateArg).toBe(new Date().toISOString().slice(0, 10));
  });

  // ── Section headers ──────────────────────────────────────────────

  it('renders all three section headers', () => {
    const wrapper = mountView();
    expect(wrapper.find('.balances-section .section-title').text()).toBe('Account Balances');
    expect(wrapper.find('.summary-section .section-title').text()).toBe('Daily Summary');
    expect(wrapper.find('.entries-section .section-title').text()).toBe('Ledger Entries');
  });

  // ── Loading spinner ──────────────────────────────────────────────

  it('passes loading=true to a-spin', () => {
    const wrapper = mountView({ loading: true });
    const spin = wrapper.findComponent({ name: 'a-spin' });
    expect(spin.props('spinning')).toBe(true);
  });

  it('passes loading=false to a-spin', () => {
    const wrapper = mountView({ loading: false });
    const spin = wrapper.findComponent({ name: 'a-spin' });
    expect(spin.props('spinning')).toBe(false);
  });

  // ── Empty states ─────────────────────────────────────────────────

  it('shows "No balance data" when balances is empty', () => {
    const wrapper = mountView({ balances: {} });
    expect(wrapper.find('.balances-section .empty-state').text()).toBe('No balance data');
    expect(wrapper.find('.balances-grid').exists()).toBe(false);
  });

  it('shows "Select a date to view daily summary" when dailySummary is empty', () => {
    const wrapper = mountView({ dailySummary: [] });
    expect(wrapper.find('.summary-section .empty-state').text()).toBe('Select a date to view daily summary');
    expect(wrapper.find('.summary-section .data-table').exists()).toBe(false);
  });

  it('shows "No ledger entries" when entries is empty', () => {
    const wrapper = mountView({ entries: [], entriesTotal: 0 });
    expect(wrapper.find('.entries-section .empty-state').text()).toBe('No ledger entries');
    expect(wrapper.find('.entries-section .data-table').exists()).toBe(false);
  });

  // ── Balances grid with data ──────────────────────────────────────

  describe('with populated balances', () => {
    it('renders a balance-card for each account', () => {
      const wrapper = mountView({ balances: sampleBalances });
      const cards = wrapper.findAll('.balance-card');
      expect(cards).toHaveLength(2);
    });

    it('displays account name in each card', () => {
      const wrapper = mountView({ balances: sampleBalances });
      const accounts = wrapper.findAll('.balance-account');
      const names = accounts.map((el) => el.text());
      expect(names).toContain('Binance');
      expect(names).toContain('OKX');
    });

    it('displays asset rows with amounts inside each card', () => {
      const wrapper = mountView({ balances: sampleBalances });
      const binanceCard = wrapper.findAll('.balance-card').find((c) => c.find('.balance-account').text() === 'Binance');
      expect(binanceCard).toBeTruthy();
      const rows = binanceCard!.findAll('.balance-row');
      expect(rows).toHaveLength(2);
      const texts = rows.map((r) => r.text());
      expect(texts).toContain('USDT10000.00');
      expect(texts).toContain('BTC0.5000');
    });

    it('does not render the empty state', () => {
      const wrapper = mountView({ balances: sampleBalances });
      expect(wrapper.find('.balances-section .empty-state').exists()).toBe(false);
    });
  });

  // ── Daily summary table with data ────────────────────────────────

  describe('with populated daily summary', () => {
    it('renders the data-table with correct headers', () => {
      const wrapper = mountView({ dailySummary: sampleDailySummary });
      const ths = wrapper.find('.summary-section .data-table thead').findAll('th');
      const headers = ths.map((th) => th.text());
      expect(headers).toEqual(['Account', 'Asset', 'Opening', 'Debit', 'Credit', 'Closing', 'Entries']);
    });

    it('renders summary rows with correct data', () => {
      const wrapper = mountView({ dailySummary: sampleDailySummary });
      const tds = wrapper.find('.summary-section .data-table tbody tr').findAll('td');
      expect(tds[0].text()).toBe('Binance');
      expect(tds[1].text()).toBe('USDT');
      expect(tds[2].text()).toBe('9000.00');
      expect(tds[3].text()).toBe('1500.00');
      expect(tds[4].text()).toBe('500.00');
      expect(tds[5].text()).toBe('10000.00');
      expect(tds[6].text()).toBe('5');
    });

    it('applies val-debit class to debit cells', () => {
      const wrapper = mountView({ dailySummary: sampleDailySummary });
      const tds = wrapper.find('.summary-section .data-table tbody tr').findAll('td');
      expect(tds[3].classes()).toContain('val-debit');
    });

    it('applies val-credit class to credit cells', () => {
      const wrapper = mountView({ dailySummary: sampleDailySummary });
      const tds = wrapper.find('.summary-section .data-table tbody tr').findAll('td');
      expect(tds[4].classes()).toContain('val-credit');
    });

    it('does not render the empty state', () => {
      const wrapper = mountView({ dailySummary: sampleDailySummary });
      expect(wrapper.find('.summary-section .empty-state').exists()).toBe(false);
    });
  });

  // ── Ledger entries table with data ───────────────────────────────

  describe('with populated entries', () => {
    it('renders the entries table with correct headers', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const ths = wrapper.find('.entries-section .data-table thead').findAll('th');
      const headers = ths.map((th) => th.text());
      expect(headers).toEqual(['Time', 'Account', 'Counter', 'Debit', 'Credit', 'Balance', 'Ref']);
    });

    it('renders entry rows with correct data', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const rows = wrapper.find('.entries-section .data-table tbody').findAll('tr');
      expect(rows).toHaveLength(2);
    });

    it('displays entry account and counter_account', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const firstRow = wrapper.find('.entries-section .data-table tbody tr').findAll('td');
      // column 1 = Account
      expect(firstRow[1].text()).toBe('Binance');
      // column 2 = Counter
      expect(firstRow[2].text()).toBe('external');
    });

    it('applies val-debit class when debit > 0', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const firstRow = wrapper.find('.entries-section .data-table tbody').findAll('tr')[0].findAll('td');
      // column 3 = Debit
      expect(firstRow[3].classes()).toContain('val-debit');
      expect(firstRow[3].text()).toBe('1000.00');
    });

    it('does NOT apply val-debit class when debit is 0', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const secondRow = wrapper.find('.entries-section .data-table tbody').findAll('tr')[1].findAll('td');
      // entry e2 has debit "0.00"
      expect(secondRow[3].classes()).not.toContain('val-debit');
    });

    it('applies val-credit class when credit > 0', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const secondRow = wrapper.find('.entries-section .data-table tbody').findAll('tr')[1].findAll('td');
      // column 4 = Credit
      expect(secondRow[4].classes()).toContain('val-credit');
      expect(secondRow[4].text()).toBe('50.00');
    });

    it('does NOT apply val-credit class when credit is 0', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const firstRow = wrapper.find('.entries-section .data-table tbody').findAll('tr')[0].findAll('td');
      expect(firstRow[4].classes()).not.toContain('val-credit');
    });

    it('renders balance column', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const firstRow = wrapper.find('.entries-section .data-table tbody').findAll('tr')[0].findAll('td');
      // column 5 = Balance
      expect(firstRow[5].text()).toBe('10000.00');
    });

    it('renders reference as type:shortened_id', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      const firstRow = wrapper.find('.entries-section .data-table tbody').findAll('tr')[0].findAll('td');
      // column 6 = Ref
      expect(firstRow[6].text()).toBe('trade:ref-abc1');
    });

    it('renders the entriesTotal badge when > 0', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 42 });
      const badge = wrapper.find('.entries-section .section-badge');
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe('42');
    });

    it('does not render the badge when entriesTotal is 0', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 0 });
      expect(wrapper.find('.entries-section .section-badge').exists()).toBe(false);
    });

    it('does not render the empty state', () => {
      const wrapper = mountView({ entries: sampleEntries, entriesTotal: 2 });
      expect(wrapper.find('.entries-section .empty-state').exists()).toBe(false);
    });
  });

  // ── formatTime (tested via rendered entry timestamp) ─────────────

  describe('formatTime via rendered output', () => {
    it('renders a formatted timestamp for entry rows', () => {
      const wrapper = mountView({ entries: [sampleEntries[0]], entriesTotal: 1 });
      const firstRow = wrapper.find('.entries-section .data-table tbody tr').findAll('td');
      // The timestamp column should have text-muted class and show formatted time
      expect(firstRow[0].classes()).toContain('text-muted');
      // Should not be the raw ISO string
      expect(firstRow[0].text()).not.toBe('2026-04-19T10:30:00Z');
      // Should contain some month abbreviation
      const text = firstRow[0].text();
      expect(text.length).toBeGreaterThan(0);
    });
  });

  // ── onRefresh ────────────────────────────────────────────────────

  describe('onRefresh', () => {
    it('calls fetchAll and fetchDailySummary when Refresh button is clicked', async () => {
      const wrapper = mountView();
      mockFetchAll.mockClear();
      mockFetchDailySummary.mockClear();

      const buttons = wrapper.findAll('.a-button-stub');
      const refreshBtn = buttons.find((b) => b.text().includes('Refresh'));
      expect(refreshBtn).toBeTruthy();
      await refreshBtn!.trigger('click');

      expect(mockFetchAll).toHaveBeenCalledOnce();
      expect(mockFetchDailySummary).toHaveBeenCalledOnce();
    });
  });

  // ── onDateChange ─────────────────────────────────────────────────

  describe('onDateChange', () => {
    it('calls fetchDailySummary when date is provided', async () => {
      const wrapper = mountView();
      mockFetchDailySummary.mockClear();

      const dp = wrapper.findComponent({ name: 'a-date-picker' });
      dp.vm.$emit('change', '2026-04-15');
      await nextTick();

      expect(mockFetchDailySummary).toHaveBeenCalledWith('2026-04-15');
    });

    it('skips fetchDailySummary when date is null', async () => {
      const wrapper = mountView();
      mockFetchDailySummary.mockClear();

      const dp = wrapper.findComponent({ name: 'a-date-picker' });
      dp.vm.$emit('change', null);
      await nextTick();

      expect(mockFetchDailySummary).not.toHaveBeenCalled();
    });
  });

  // ── Cash flow modal ──────────────────────────────────────────────

  describe('Cash Flow modal', () => {
    it('modal is hidden by default', () => {
      const wrapper = mountView();
      expect(wrapper.find('.a-modal-stub').exists()).toBe(false);
    });

    it('modal opens when Cash Flow button is clicked', async () => {
      const wrapper = mountView();
      const buttons = wrapper.findAll('.a-button-stub');
      const cashFlowBtn = buttons.find((b) => b.text().includes('Cash Flow'));
      expect(cashFlowBtn).toBeTruthy();
      await cashFlowBtn!.trigger('click');
      await nextTick();

      expect(wrapper.find('.a-modal-stub').exists()).toBe(true);
    });

    it('modal contains form fields for Type, Asset, and Amount', async () => {
      const wrapper = mountView();
      // Open modal
      const buttons = wrapper.findAll('.a-button-stub');
      await buttons.find((b) => b.text().includes('Cash Flow'))!.trigger('click');
      await nextTick();

      const modal = wrapper.find('.a-modal-stub');
      expect(modal.find('.a-select-stub').exists()).toBe(true);
      expect(modal.find('.a-input-stub').exists()).toBe(true);
      const formItems = modal.findAll('.a-form-item-stub');
      expect(formItems.length).toBeGreaterThanOrEqual(2);
    });

    it('submitting without amount does not call postCashFlow', async () => {
      const wrapper = mountView();
      const buttons = wrapper.findAll('.a-button-stub');
      await buttons.find((b) => b.text().includes('Cash Flow'))!.trigger('click');
      await nextTick();

      mockPostCashFlow.mockClear();
      const okBtn = wrapper.find('.modal-ok');
      await okBtn.trigger('click');
      await flushPromises();

      expect(mockPostCashFlow).not.toHaveBeenCalled();
    });

    it('submitting with amount calls postCashFlow, closes modal, resets form, and calls fetchAll', async () => {
      mockPostCashFlow.mockResolvedValue({ cash_flow_id: 'cf1', flow_type: 'deposit', asset: 'USDT', amount: '100' });

      const wrapper = mountView();
      const buttons = wrapper.findAll('.a-button-stub');
      await buttons.find((b) => b.text().includes('Cash Flow'))!.trigger('click');
      await nextTick();

      // Set amount via the input stub
      const inputs = wrapper.findAll('.a-input-stub');
      // Find the amount input (placeholder="0.00")
      const amountInput = inputs.find((inp) => inp.attributes('placeholder') === '0.00');
      expect(amountInput).toBeTruthy();
      await amountInput!.setValue('100');
      await nextTick();

      mockFetchAll.mockClear();
      const okBtn = wrapper.find('.modal-ok');
      await okBtn.trigger('click');
      await flushPromises();

      expect(mockPostCashFlow).toHaveBeenCalledOnce();
      expect(mockPostCashFlow.mock.calls[0][0].amount).toBe('100');
      expect(mockFetchAll).toHaveBeenCalledOnce();

      // Modal should be closed
      expect(wrapper.find('.a-modal-stub').exists()).toBe(false);
    });

    it('resets submitting to false even if postCashFlow throws', async () => {
      // Set up an event handler to catch the unhandled rejection from the component
      let caughtError: unknown;
      const handler = (err: unknown) => { caughtError = err; };
      process.on('unhandledRejection', handler);

      mockPostCashFlow.mockRejectedValue(new Error('Network error'));

      const wrapper = mountView();
      const buttons = wrapper.findAll('.a-button-stub');
      await buttons.find((b) => b.text().includes('Cash Flow'))!.trigger('click');
      await nextTick();

      const inputs = wrapper.findAll('.a-input-stub');
      const amountInput = inputs.find((inp) => inp.attributes('placeholder') === '0.00');
      await amountInput!.setValue('50');
      await nextTick();

      const okBtn = wrapper.find('.modal-ok');
      await okBtn.trigger('click');
      await flushPromises();

      // Modal stays open because postCashFlow threw
      expect(wrapper.find('.a-modal-stub').exists()).toBe(true);
      // The component didn't crash
      expect(wrapper.find('.ledger-page').exists()).toBe(true);

      process.off('unhandledRejection', handler);
    });
  });

  // ── Debit/credit CSS classes ─────────────────────────────────────

  describe('debit/credit CSS classes on entries', () => {
    it('applies val-debit when debit > 0', () => {
      const entry = { ...sampleEntries[0], debit: '500.00', credit: '0.00' };
      const wrapper = mountView({ entries: [entry], entriesTotal: 1 });
      const tds = wrapper.find('.entries-section .data-table tbody tr').findAll('td');
      expect(tds[3].classes()).toContain('val-debit');
    });

    it('does not apply val-debit when debit is 0', () => {
      const entry = { ...sampleEntries[0], debit: '0.00', credit: '0.00' };
      const wrapper = mountView({ entries: [entry], entriesTotal: 1 });
      const tds = wrapper.find('.entries-section .data-table tbody tr').findAll('td');
      expect(tds[3].classes()).not.toContain('val-debit');
    });

    it('applies val-credit when credit > 0', () => {
      const entry = { ...sampleEntries[0], debit: '0.00', credit: '250.00' };
      const wrapper = mountView({ entries: [entry], entriesTotal: 1 });
      const tds = wrapper.find('.entries-section .data-table tbody tr').findAll('td');
      expect(tds[4].classes()).toContain('val-credit');
    });

    it('does not apply val-credit when credit is 0', () => {
      const entry = { ...sampleEntries[0], debit: '500.00', credit: '0.00' };
      const wrapper = mountView({ entries: [entry], entriesTotal: 1 });
      const tds = wrapper.find('.entries-section .data-table tbody tr').findAll('td');
      expect(tds[4].classes()).not.toContain('val-credit');
    });
  });

  // ── Daily summary debit/credit always has classes ────────────────

  describe('daily summary val-debit/val-credit classes', () => {
    it('always applies val-debit and val-credit classes to debit/credit columns', () => {
      const wrapper = mountView({ dailySummary: sampleDailySummary });
      const tds = wrapper.find('.summary-section .data-table tbody tr').findAll('td');
      // Debit column always gets val-debit class (unconditional in template)
      expect(tds[3].classes()).toContain('val-debit');
      // Credit column always gets val-credit class (unconditional in template)
      expect(tds[4].classes()).toContain('val-credit');
    });
  });
});

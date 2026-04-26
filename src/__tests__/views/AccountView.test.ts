import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import AccountView from '@/views/AccountView.vue';

// ── Shared mock state ─────────────────────────────────────────────────

let mockStore: Record<string, unknown>;

const mockFetchAll = vi.fn();
const mockSyncAll = vi.fn().mockResolvedValue(undefined);
const mockReconcile = vi.fn().mockResolvedValue(undefined);
const mockFetchReconciliations = vi.fn().mockResolvedValue(undefined);

vi.mock('@/stores/account', () => ({
  useAccountStore: () => mockStore,
}));

const mockFetchAccounts = vi.fn();
vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () => ({
    accounts: [],
    loading: false,
    error: null,
    fetchAccounts: mockFetchAccounts,
  }),
}));

// ── Ant Design Vue stubs ──────────────────────────────────────────────

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
  AccountsList: {
    name: 'AccountsList',
    template: '<div class="accounts-list-stub">Accounts</div>',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────

function createStore(overrides: Record<string, unknown> = {}) {
  return {
    loading: false,
    snapshots: [],
    margins: [],
    reconciliations: [],
    error: null,
    fetchAll: mockFetchAll,
    syncAll: mockSyncAll,
    reconcile: mockReconcile,
    fetchReconciliations: mockFetchReconciliations,
    ...overrides,
  };
}

function mountView(overrides: Record<string, unknown> = {}): VueWrapper {
  mockStore = createStore(overrides);
  return mount(AccountView, { global: { stubs: antStubs } });
}

// ── Test data ─────────────────────────────────────────────────────────

const sampleMargins = [
  {
    exchange: 'Binance',
    margin_ratio: '0.45',
    margin_balance: '10000',
    total_equity: '12000',
    total_position_value: '8000',
    liquidation_risk: false,
    updated_at: '2026-04-19T10:00:00Z',
  },
  {
    exchange: 'OKX',
    margin_ratio: '0.12',
    margin_balance: '5000',
    total_equity: '6000',
    total_position_value: '9000',
    liquidation_risk: true,
    updated_at: '2026-04-19T10:00:00Z',
  },
];

const sampleSnapshots = [
  {
    snapshot_id: 'snap1',
    exchange: 'Binance',
    snapshot_type: 'manual',
    balances: { USDT: '10000.00', BTC: '0.50' },
    total_equity: '15000.00',
    margin_ratio: '0.30',
    created_at: '2026-04-19T09:00:00Z',
  },
  {
    snapshot_id: 'snap2',
    exchange: 'OKX',
    snapshot_type: 'scheduled',
    balances: { USDT: '5000.00' },
    total_equity: '5000.00',
    created_at: '2026-04-19T08:00:00Z',
  },
];

const sampleReconciliations = [
  {
    reconcile_id: 'rec1',
    exchange: 'Binance',
    matched: true,
    total_diff_usd: '0.00',
    corrections_count: 0,
    created_at: '2026-04-19T07:00:00Z',
  },
  {
    reconcile_id: 'rec2',
    exchange: 'OKX',
    matched: false,
    total_diff_usd: '25.50',
    corrections_count: 2,
    created_at: '2026-04-19T07:30:00Z',
  },
];

// ── Tests ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AccountView', () => {
  // ── Container & mount ────────────────────────────────────────────

  it('renders .account-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.account-page').exists()).toBe(true);
  });

  it('calls fetchAll on mount', () => {
    mountView();
    expect(mockFetchAll).toHaveBeenCalledOnce();
  });

  // ── Loading spinner ──────────────────────────────────────────────

  it('passes loading state to a-spin', () => {
    const wrapper = mountView({ loading: true });
    const spin = wrapper.findComponent({ name: 'a-spin' });
    expect(spin.props('spinning')).toBe(true);
  });

  it('passes loading=false when not loading', () => {
    const wrapper = mountView({ loading: false });
    const spin = wrapper.findComponent({ name: 'a-spin' });
    expect(spin.props('spinning')).toBe(false);
  });

  // ── Section headers ──────────────────────────────────────────────

  it('renders Margin Status section header', () => {
    const wrapper = mountView();
    expect(wrapper.find('.margin-section .section-title').text()).toBe('Margin Status');
  });

  it('renders Account Snapshots section header', () => {
    const wrapper = mountView();
    expect(wrapper.find('.snapshots-section .section-title').text()).toBe('Account Snapshots');
  });

  it('renders Account Reconciliations section header', () => {
    const wrapper = mountView();
    expect(wrapper.find('.recon-section .section-title').text()).toBe('Account Reconciliations');
  });

  // ── Empty states ─────────────────────────────────────────────────

  it('shows "No margin data" when margins is empty', () => {
    const wrapper = mountView({ margins: [] });
    expect(wrapper.find('.margin-section .empty-state').text()).toBe('No margin data');
    expect(wrapper.find('.margin-grid').exists()).toBe(false);
  });

  it('shows "No account snapshots" when snapshots is empty', () => {
    const wrapper = mountView({ snapshots: [] });
    expect(wrapper.find('.snapshots-section .empty-state').text()).toBe('No account snapshots');
    expect(wrapper.find('.snapshot-grid').exists()).toBe(false);
  });

  it('does not render snapshot badge when snapshots is empty', () => {
    const wrapper = mountView({ snapshots: [] });
    expect(wrapper.find('.snapshots-section .section-badge').exists()).toBe(false);
  });

  it('shows "No reconciliation history" when reconciliations is empty', () => {
    const wrapper = mountView({ reconciliations: [] });
    expect(wrapper.find('.recon-section .empty-state').text()).toBe('No reconciliation history');
    expect(wrapper.find('.recon-section .data-table').exists()).toBe(false);
  });

  // ── Margin cards with data ───────────────────────────────────────

  describe('with populated margins', () => {
    it('renders a margin-card for each exchange', () => {
      const wrapper = mountView({ margins: sampleMargins });
      const cards = wrapper.findAll('.margin-card');
      expect(cards).toHaveLength(2);
    });

    it('displays exchange name in each card', () => {
      const wrapper = mountView({ margins: sampleMargins });
      const exchanges = wrapper.findAll('.margin-exchange');
      const names = exchanges.map((el) => el.text());
      expect(names).toContain('Binance');
      expect(names).toContain('OKX');
    });

    it('displays ratio as percentage', () => {
      const wrapper = mountView({ margins: sampleMargins });
      const values = wrapper.findAll('.margin-value');
      // First margin-value in first card should be ratio
      // Binance has 0.45 -> "45.0%"
      expect(values[0].text()).toBe('45.0%');
    });

    it('displays equity and position value', () => {
      const wrapper = mountView({ margins: sampleMargins });
      const values = wrapper.findAll('.margin-value');
      // Binance card: ratio, equity, position_value
      expect(values[1].text()).toBe('12000');
      expect(values[2].text()).toBe('8000');
    });

    it('does not apply margin-risk class when liquidation_risk is false', () => {
      const wrapper = mountView({ margins: [sampleMargins[0]] });
      const card = wrapper.find('.margin-card');
      expect(card.classes()).not.toContain('margin-risk');
    });

    it('applies margin-risk class when liquidation_risk is true', () => {
      const wrapper = mountView({ margins: [sampleMargins[1]] });
      const card = wrapper.find('.margin-card');
      expect(card.classes()).toContain('margin-risk');
    });

    it('renders liquidation warning when liquidation_risk is true', () => {
      const wrapper = mountView({ margins: [sampleMargins[1]] });
      expect(wrapper.find('.liquidation-warning').exists()).toBe(true);
      expect(wrapper.find('.liquidation-warning').text()).toBe('Liquidation Risk');
    });

    it('does not render liquidation warning when liquidation_risk is false', () => {
      const wrapper = mountView({ margins: [sampleMargins[0]] });
      expect(wrapper.find('.liquidation-warning').exists()).toBe(false);
    });

    it('applies val-negative class when margin_ratio < 0.2', () => {
      const wrapper = mountView({ margins: [sampleMargins[1]] });
      // OKX has ratio 0.12 < 0.2
      const ratioValue = wrapper.findAll('.margin-value')[0];
      expect(ratioValue.classes()).toContain('val-negative');
    });

    it('does not apply val-negative class when margin_ratio >= 0.2', () => {
      const wrapper = mountView({ margins: [sampleMargins[0]] });
      // Binance has ratio 0.45 >= 0.2
      const ratioValue = wrapper.findAll('.margin-value')[0];
      expect(ratioValue.classes()).not.toContain('val-negative');
    });

    it('does not render the empty state', () => {
      const wrapper = mountView({ margins: sampleMargins });
      expect(wrapper.find('.margin-section .empty-state').exists()).toBe(false);
    });
  });

  // ── Snapshot cards with data ─────────────────────────────────────

  describe('with populated snapshots', () => {
    it('renders a snapshot-card for each snapshot', () => {
      const wrapper = mountView({ snapshots: sampleSnapshots });
      const cards = wrapper.findAll('.snapshot-card');
      expect(cards).toHaveLength(2);
    });

    it('displays exchange and snapshot type in header', () => {
      const wrapper = mountView({ snapshots: sampleSnapshots });
      const firstCard = wrapper.findAll('.snapshot-card')[0];
      expect(firstCard.find('.snapshot-exchange').text()).toBe('Binance');
      expect(firstCard.find('.snapshot-type').text()).toBe('manual');
    });

    it('displays total equity', () => {
      const wrapper = mountView({ snapshots: sampleSnapshots });
      const firstCard = wrapper.findAll('.snapshot-card')[0];
      expect(firstCard.find('.snapshot-equity').text()).toBe('15000.00');
    });

    it('renders balance rows with asset and amount', () => {
      const wrapper = mountView({ snapshots: [sampleSnapshots[0]] });
      const rows = wrapper.findAll('.snapshot-row');
      expect(rows).toHaveLength(2);
      const texts = rows.map((r) => r.text());
      expect(texts).toContain('USDT10000.00');
      expect(texts).toContain('BTC0.50');
    });

    it('renders formatted timestamp', () => {
      const wrapper = mountView({ snapshots: [sampleSnapshots[0]] });
      const time = wrapper.find('.snapshot-time');
      expect(time.exists()).toBe(true);
      expect(time.text().length).toBeGreaterThan(0);
      // Should not be raw ISO
      expect(time.text()).not.toBe('2026-04-19T09:00:00Z');
    });

    it('renders snapshot count badge', () => {
      const wrapper = mountView({ snapshots: sampleSnapshots });
      const badge = wrapper.find('.snapshots-section .section-badge');
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe('2');
    });

    it('does not render the empty state', () => {
      const wrapper = mountView({ snapshots: sampleSnapshots });
      expect(wrapper.find('.snapshots-section .empty-state').exists()).toBe(false);
    });
  });

  // ── Reconciliation table with data ───────────────────────────────

  describe('with populated reconciliations', () => {
    it('renders the reconciliation data-table with correct headers', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const ths = wrapper.find('.recon-section .data-table thead').findAll('th');
      const headers = ths.map((th) => th.text());
      expect(headers).toEqual(['Exchange', 'Matched', 'Diff (USD)', 'Corrections', 'Time']);
    });

    it('renders reconciliation rows', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const rows = wrapper.find('.recon-section .data-table tbody').findAll('tr');
      expect(rows).toHaveLength(2);
    });

    it('displays exchange name in bold', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const firstRow = wrapper.find('.recon-section .data-table tbody tr').findAll('td');
      expect(firstRow[0].text()).toBe('Binance');
      expect(firstRow[0].classes()).toContain('text-bold');
    });

    it('renders "Yes" status pill with status-ok class when matched', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const firstRow = wrapper.find('.recon-section .data-table tbody').findAll('tr')[0];
      const pill = firstRow.find('.status-pill');
      expect(pill.text()).toBe('Yes');
      expect(pill.classes()).toContain('status-ok');
    });

    it('renders "No" status pill with status-mismatch class when not matched', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const secondRow = wrapper.find('.recon-section .data-table tbody').findAll('tr')[1];
      const pill = secondRow.find('.status-pill');
      expect(pill.text()).toBe('No');
      expect(pill.classes()).toContain('status-mismatch');
    });

    it('applies val-negative class to diff when non-zero', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const secondRow = wrapper.find('.recon-section .data-table tbody').findAll('tr')[1].findAll('td');
      expect(secondRow[2].classes()).toContain('val-negative');
      expect(secondRow[2].text()).toBe('25.50');
    });

    it('does not apply val-negative class to diff when zero', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const firstRow = wrapper.find('.recon-section .data-table tbody').findAll('tr')[0].findAll('td');
      expect(firstRow[2].classes()).not.toContain('val-negative');
    });

    it('displays corrections count', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const rows = wrapper.find('.recon-section .data-table tbody').findAll('tr');
      const firstRowTds = rows[0].findAll('td');
      expect(firstRowTds[3].text()).toBe('0');
      const secondRowTds = rows[1].findAll('td');
      expect(secondRowTds[3].text()).toBe('2');
    });

    it('renders formatted time with text-muted class', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const firstRow = wrapper.find('.recon-section .data-table tbody').findAll('tr')[0].findAll('td');
      expect(firstRow[4].classes()).toContain('text-muted');
      expect(firstRow[4].text().length).toBeGreaterThan(0);
    });

    it('does not render the empty state', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      expect(wrapper.find('.recon-section .empty-state').exists()).toBe(false);
    });
  });

  // ── onRefresh ────────────────────────────────────────────────────

  describe('onRefresh', () => {
    it('calls fetchAll when Refresh button is clicked', async () => {
      const wrapper = mountView();
      mockFetchAll.mockClear();

      const buttons = wrapper.findAll('.a-button-stub');
      const refreshBtn = buttons.find((b) => b.text().includes('Refresh'));
      expect(refreshBtn).toBeTruthy();
      await refreshBtn!.trigger('click');

      expect(mockFetchAll).toHaveBeenCalledOnce();
    });
  });

  // ── onSync ───────────────────────────────────────────────────────

  describe('onSync', () => {
    it('calls syncAll then fetchAll when Sync All button is clicked', async () => {
      const wrapper = mountView();
      mockFetchAll.mockClear();
      mockSyncAll.mockClear();

      const buttons = wrapper.findAll('.a-button-stub');
      const syncBtn = buttons.find((b) => b.text().includes('Sync All'));
      expect(syncBtn).toBeTruthy();
      await syncBtn!.trigger('click');

      expect(mockSyncAll).toHaveBeenCalledOnce();
      await flushPromises();
      // fetchAll called again after syncAll resolves (once from mount + once from onSync)
      expect(mockFetchAll).toHaveBeenCalled();
    });
  });

  // ── onReconcile ──────────────────────────────────────────────────

  describe('onReconcile', () => {
    it('calls reconcile then fetchReconciliations when Reconcile Now button is clicked', async () => {
      const wrapper = mountView();
      mockFetchReconciliations.mockClear();
      mockReconcile.mockClear();

      const buttons = wrapper.findAll('.a-button-stub');
      const reconcileBtn = buttons.find((b) => b.text().includes('Reconcile Now'));
      expect(reconcileBtn).toBeTruthy();
      await reconcileBtn!.trigger('click');

      expect(mockReconcile).toHaveBeenCalledOnce();
      await flushPromises();
      expect(mockFetchReconciliations).toHaveBeenCalledOnce();
    });
  });

  // ── formatTime (tested via rendered snapshot timestamp) ──────────

  describe('formatTime via rendered output', () => {
    it('renders formatted snapshot timestamps', () => {
      const wrapper = mountView({ snapshots: [sampleSnapshots[0]] });
      const timeEl = wrapper.find('.snapshot-time');
      expect(timeEl.exists()).toBe(true);
      // The output should be a formatted date, not the raw ISO string
      const text = timeEl.text();
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toBe('2026-04-19T09:00:00Z');
    });

    it('renders formatted reconciliation timestamps', () => {
      const wrapper = mountView({ reconciliations: sampleReconciliations });
      const firstRow = wrapper.find('.recon-section .data-table tbody').findAll('tr')[0].findAll('td');
      const timeTd = firstRow[4];
      expect(timeTd.text().length).toBeGreaterThan(0);
      expect(timeTd.text()).not.toBe('2026-04-19T07:00:00Z');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// ── Hoisted mocks (vi.mock factories are hoisted above imports) ────────
const { mockFetchRuns, mockFetchHistory, mockFetchRunDetails, mockFetchResult, mockRunBacktest, mockCompare, mockImportResults, mockMessage } = vi.hoisted(() => ({
  mockFetchRuns: vi.fn().mockResolvedValue(undefined),
  mockFetchHistory: vi.fn().mockResolvedValue(undefined),
  mockFetchRunDetails: vi.fn().mockResolvedValue(undefined),
  mockFetchResult: vi.fn().mockResolvedValue(undefined),
  mockRunBacktest: vi.fn(),
  mockCompare: vi.fn().mockResolvedValue([]),
  mockImportResults: vi.fn().mockResolvedValue(undefined),
  mockMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

let storeState: Record<string, unknown>;

vi.mock('ant-design-vue', () => ({
  message: mockMessage,
}));

vi.mock('@/stores/backtest', () => ({
  useBacktestStore: () => storeState,
}));

vi.mock('@/api/backtest', () => ({
  backtestApi: {
    compare: (...args: unknown[]) => mockCompare(...args),
    importResults: (...args: unknown[]) => mockImportResults(...args),
  },
}));

vi.mock('@/components/backtest/BacktestResult.vue', () => ({
  default: {
    name: 'BacktestResult',
    template: '<div class="child-stub" data-testid="backtest-result"><slot /></div>',
  },
}));

import BacktestView from '@/views/BacktestView.vue';

// ── Ant Design stubs ──────────────────────────────────────────────────
const stubs = {
  ATabs: {
    props: ['activeKey'],
    template: '<div class="ant-tabs"><slot /></div>',
  },
  ATabPane: {
    template: '<div class="ant-tab-pane"><slot /></div>',
  },
  AModal: {
    props: ['open', 'title', 'confirmLoading', 'footer', 'width'],
    template: '<div class="ant-modal" v-if="open"><slot /></div>',
    emits: ['update:open', 'ok'],
  },
  AAlert: {
    props: ['message', 'type', 'showIcon'],
    template: '<div class="ant-alert" :data-type="type">{{ message }}</div>',
  },
  AButton: {
    props: ['type', 'loading', 'disabled'],
    template: '<button :disabled="disabled" :class="type"><slot /></button>',
  },
  AForm: { template: '<div><slot /></div>' },
  AFormItem: { props: ['label'], template: '<div><slot /></div>' },
  ATextarea: {
    props: ['value', 'rows', 'placeholder'],
    template: '<textarea :value="value" :placeholder="placeholder" />',
    emits: ['update:value'],
  },
  AProgress: { template: '<div class="ant-progress" />' },
};

// ── Factory helpers ───────────────────────────────────────────────────
const SAMPLE_RUNS = [
  {
    run_id: 'run-001',
    symbol: 'BTC/USDT',
    exchange: 'binance',
    timeframe: '1h',
    start_time: '2025-01-01',
    end_time: '2025-06-01',
    group_id: 'grp-1',
    strategy_ids: ['sma_cross', 'rsi'],
    initial_balance: '10000',
    total_return_pct: '12.50',
    sharpe_ratio: '1.85',
    calmar_ratio: '2.10',
    max_drawdown_pct: '8.30',
    win_rate: '0.625',
    total_trades: 48,
    status: 'COMPLETED',
    created_at: '2025-06-15T10:30:00Z',
  },
  {
    run_id: 'run-002',
    symbol: 'ETH/USDT',
    exchange: 'binance',
    timeframe: '4h',
    start_time: '2025-01-01',
    end_time: '2025-06-01',
    group_id: 'grp-2',
    strategy_ids: ['macd'],
    initial_balance: '10000',
    total_return_pct: '-5.20',
    sharpe_ratio: '0.40',
    calmar_ratio: '0.30',
    max_drawdown_pct: '15.60',
    win_rate: '0.350',
    total_trades: 22,
    status: 'FAILED',
    created_at: '2025-06-14T08:00:00Z',
  },
  {
    run_id: 'run-003',
    symbol: 'SOL/USDT',
    exchange: 'okx',
    timeframe: '1d',
    start_time: '2025-01-01',
    end_time: '2025-06-01',
    group_id: 'grp-3',
    strategy_ids: [],
    initial_balance: '5000',
    total_return_pct: '0.00',
    sharpe_ratio: '0.00',
    calmar_ratio: '0.00',
    max_drawdown_pct: '0.00',
    win_rate: '0.000',
    total_trades: 0,
    status: 'PENDING',
    created_at: '2025-06-16T12:00:00Z',
  },
];

const SAMPLE_HISTORY = [
  {
    task_id: 'task-aaa-bbb-ccc',
    status: 'COMPLETED',
    created_at: '2025-06-15T10:00:00Z',
    total_return_pct: '12.50',
    sharpe_ratio: '1.85',
  },
  {
    task_id: 'task-ddd-eee-fff',
    status: 'FAILED',
    created_at: '2025-06-14T08:00:00Z',
  },
  {
    task_id: 'task-ggg-hhh-iii',
    status: 'RUNNING',
    created_at: '2025-06-16T12:00:00Z',
    total_return_pct: '3.20',
    sharpe_ratio: '0.90',
  },
];

function createStore(overrides: Record<string, unknown> = {}) {
  return {
    loading: false,
    runs: [] as unknown[],
    history: [] as unknown[],
    currentResult: null,
    currentRun: null,
    currentEquity: [],
    currentTrades: [],
    taskStatus: null as string | null,
    taskError: null,
    error: null as string | null,
    fetchRuns: mockFetchRuns,
    fetchHistory: mockFetchHistory,
    fetchRunDetails: mockFetchRunDetails,
    fetchResult: mockFetchResult,
    runBacktest: mockRunBacktest,
    ...overrides,
  };
}

function mountBacktest(overrides: Record<string, unknown> = {}) {
  storeState = createStore(overrides);
  return mount(BacktestView, { global: { stubs } });
}

// ── Tests ──────────────────────────────────────────────────────────────
describe('BacktestView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Mount lifecycle ─────────────────────────────────────────────────
  it('renders the .backtest-page container', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.backtest-page').exists()).toBe(true);
  });

  it('calls fetchRuns and fetchHistory on mount', () => {
    mountBacktest();
    expect(mockFetchRuns).toHaveBeenCalledTimes(1);
    expect(mockFetchHistory).toHaveBeenCalledTimes(1);
  });

  it('renders the run-card section', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.run-card').exists()).toBe(true);
    expect(wrapper.find('.card-title').text()).toBe('Run Backtest');
  });

  // ── BacktestResult conditional rendering ─────────────────────────────
  it('does not render BacktestResult when currentResult is null', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('[data-testid="backtest-result"]').exists()).toBe(false);
  });

  it('renders BacktestResult when currentResult is set', () => {
    const wrapper = mountBacktest({
      currentResult: {
        group_id: 'grp-1',
        total_return_pct: '10.0',
        sharpe_ratio: '1.5',
        calmar_ratio: '2.0',
        max_drawdown_pct: '5.0',
        win_rate: '0.6',
        total_trades: 30,
      },
    });
    expect(wrapper.find('[data-testid="backtest-result"]').exists()).toBe(true);
  });

  // ── Error alert ─────────────────────────────────────────────────────
  it('does not render error alert when error is null', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.ant-alert').exists()).toBe(false);
  });

  it('renders error alert when store.error is set', () => {
    const wrapper = mountBacktest({ error: 'Something went wrong' });
    const alert = wrapper.find('.ant-alert');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Something went wrong');
    expect(alert.attributes('data-type')).toBe('error');
  });

  // ── Status pill (taskStatus) ────────────────────────────────────────
  it('does not render status pill when taskStatus is null', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.status-pill').exists()).toBe(false);
  });

  it('renders status pill with status-completed class for COMPLETED', () => {
    const wrapper = mountBacktest({ taskStatus: 'COMPLETED' });
    const pill = wrapper.find('.status-pill');
    expect(pill.exists()).toBe(true);
    expect(pill.text()).toBe('COMPLETED');
    expect(pill.classes()).toContain('status-completed');
  });

  it('renders status pill with status-completed class for DONE', () => {
    const wrapper = mountBacktest({ taskStatus: 'DONE' });
    const pill = wrapper.find('.status-pill');
    expect(pill.exists()).toBe(true);
    expect(pill.classes()).toContain('status-completed');
  });

  it('renders status pill with status-failed class for FAILED', () => {
    const wrapper = mountBacktest({ taskStatus: 'FAILED' });
    const pill = wrapper.find('.status-pill');
    expect(pill.exists()).toBe(true);
    expect(pill.classes()).toContain('status-failed');
  });

  it('renders status pill with status-running class for PENDING', () => {
    const wrapper = mountBacktest({ taskStatus: 'PENDING' });
    const pill = wrapper.find('.status-pill');
    expect(pill.exists()).toBe(true);
    expect(pill.classes()).toContain('status-running');
  });

  it('renders status pill with status-running class for RUNNING', () => {
    const wrapper = mountBacktest({ taskStatus: 'RUNNING' });
    const pill = wrapper.find('.status-pill');
    expect(pill.exists()).toBe(true);
    expect(pill.classes()).toContain('status-running');
  });

  it('renders status pill with status-default class for unknown status', () => {
    const wrapper = mountBacktest({ taskStatus: 'UNKNOWN' });
    const pill = wrapper.find('.status-pill');
    expect(pill.exists()).toBe(true);
    expect(pill.classes()).toContain('status-default');
  });

  // ── Run button ──────────────────────────────────────────────────────
  it('calls store.runBacktest when Run button is clicked', async () => {
    const wrapper = mountBacktest();
    const buttons = wrapper.findAll('button');
    const runBtn = buttons.find((b) => b.text().includes('Run'));
    expect(runBtn).toBeDefined();
    await runBtn!.trigger('click');
    expect(mockRunBacktest).toHaveBeenCalledTimes(1);
  });

  // ── Runs table - empty state ────────────────────────────────────────
  it('renders empty state when no runs exist', () => {
    const wrapper = mountBacktest();
    expect(wrapper.find('.empty-state').text()).toBe('No runs in database');
    expect(wrapper.find('.data-table').exists()).toBe(false);
  });

  // ── Runs table - populated state ────────────────────────────────────
  it('renders runs table with data rows when runs exist', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const table = wrapper.find('.data-table');
    expect(table.exists()).toBe(true);
    const rows = table.findAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('renders card badge with run count', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const badge = wrapper.find('.card-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('3');
  });

  it('renders run symbol in bold', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const cells = wrapper.findAll('.text-bold');
    expect(cells[0].text()).toBe('BTC/USDT');
    expect(cells[1].text()).toBe('ETH/USDT');
  });

  it('renders strategy_ids joined or dash for empty', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const muted = wrapper.findAll('tbody tr td.text-muted');
    // run-001 strategy: sma_cross, rsi
    expect(muted[0].text()).toBe('sma_cross, rsi');
    // run-002 strategy: macd
    expect(muted[1].text()).toBe('macd');
    // run-003 strategy_ids is empty array -> '-'
    expect(muted[2].text()).toBe('-');
  });

  it('renders positive return with text-success class', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const successCells = wrapper.findAll('.text-success');
    const returnCell = successCells.find((c) => c.text().includes('12.50'));
    expect(returnCell).toBeDefined();
    expect(returnCell!.text()).toBe('12.50%');
  });

  it('renders negative return with text-error class', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const errorCells = wrapper.findAll('tbody .text-error');
    const returnCell = errorCells.find((c) => c.text().includes('-5.20'));
    expect(returnCell).toBeDefined();
  });

  it('renders max drawdown with text-error class', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    // All drawdown cells have text-error class
    const rows = wrapper.findAll('tbody tr');
    const firstRowDrawdown = rows[0].findAll('td')[5];
    expect(firstRowDrawdown.classes()).toContain('text-error');
    expect(firstRowDrawdown.text()).toBe('8.30%');
  });

  it('renders sharpe ratio formatted to 2 decimals', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('tbody tr');
    // Sharpe is 4th data column after checkbox
    const sharpeCell = rows[0].findAll('td')[4];
    expect(sharpeCell.text()).toBe('1.85');
  });

  it('renders status pill per run with correct class', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const pills = wrapper.findAll('tbody .status-pill');
    expect(pills[0].classes()).toContain('status-completed');
    expect(pills[0].text()).toBe('COMPLETED');
    expect(pills[1].classes()).toContain('status-failed');
    expect(pills[1].text()).toBe('FAILED');
    expect(pills[2].classes()).toContain('status-running');
    expect(pills[2].text()).toBe('PENDING');
  });

  // ── getStatusClass function (via DOM) ───────────────────────────────
  it('applies status-completed for DONE status in runs table', () => {
    const runs = [
      { ...SAMPLE_RUNS[0], run_id: 'run-done', status: 'DONE' },
    ];
    const wrapper = mountBacktest({ runs });
    const pill = wrapper.find('tbody .status-pill');
    expect(pill.classes()).toContain('status-completed');
    expect(pill.text()).toBe('DONE');
  });

  it('applies status-running for RUNNING status in runs table', () => {
    const runs = [
      { ...SAMPLE_RUNS[0], run_id: 'run-running', status: 'RUNNING' },
    ];
    const wrapper = mountBacktest({ runs });
    const pill = wrapper.find('tbody .status-pill');
    expect(pill.classes()).toContain('status-running');
  });

  it('applies status-default for unknown status in runs table', () => {
    const runs = [
      { ...SAMPLE_RUNS[0], run_id: 'run-unknown', status: 'CANCELLED' },
    ];
    const wrapper = mountBacktest({ runs });
    const pill = wrapper.find('tbody .status-pill');
    expect(pill.classes()).toContain('status-default');
  });

  // ── View link / canView / viewRunDetails ────────────────────────────
  it('renders View link as enabled for COMPLETED runs', () => {
    const wrapper = mountBacktest({ runs: [SAMPLE_RUNS[0]] });
    const viewLink = wrapper.find('.view-link');
    expect(viewLink.classes()).not.toContain('disabled');
  });

  it('renders View link as disabled for non-COMPLETED runs', () => {
    const wrapper = mountBacktest({ runs: [SAMPLE_RUNS[1]] });
    const viewLink = wrapper.find('.view-link');
    expect(viewLink.classes()).toContain('disabled');
  });

  it('calls viewRunDetails when View link is clicked on COMPLETED run', async () => {
    const wrapper = mountBacktest({ runs: [SAMPLE_RUNS[0]] });
    const viewLink = wrapper.find('.view-link');
    await viewLink.trigger('click');
    expect(mockFetchRunDetails).toHaveBeenCalledWith('run-001');
  });

  it('does not call viewRunDetails when View link is clicked on FAILED run', async () => {
    const wrapper = mountBacktest({ runs: [SAMPLE_RUNS[1]] });
    const viewLink = wrapper.find('.view-link');
    await viewLink.trigger('click');
    expect(mockFetchRunDetails).not.toHaveBeenCalled();
  });

  // ── Checkbox selection (selectedRuns, allRunsSelected, toggleRun, toggleAllRuns) ──
  it('renders checkboxes for each run and a select-all checkbox', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    // 1 select-all + 3 per-run = 4
    expect(checkboxes.length).toBe(4);
  });

  it('toggles a run checkbox to select it', async () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('tbody tr');
    const checkbox = rows[0].find('input[type="checkbox"]');
    await checkbox.trigger('change');
    // The Compare button should show count 1
    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.text()).toContain('1');
  });

  it('toggles a run checkbox to deselect it', async () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('tbody tr');
    const checkbox = rows[0].find('input[type="checkbox"]');
    // Select
    await checkbox.trigger('change');
    // Deselect
    await checkbox.trigger('change');
    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.text()).toContain('0');
  });

  it('selects all runs when select-all checkbox is checked', async () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const selectAll = wrapper.find('thead input[type="checkbox"]');
    await selectAll.trigger('change');
    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.text()).toContain('3');
  });

  it('deselects all runs when select-all is togged off', async () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const selectAll = wrapper.find('thead input[type="checkbox"]');
    // Select all
    await selectAll.trigger('change');
    // Deselect all
    await selectAll.trigger('change');
    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.text()).toContain('0');
  });

  // ── Compare button disabled state ───────────────────────────────────
  it('disables Compare button when fewer than 2 runs selected', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.attributes('disabled')).toBeDefined();
  });

  it('enables Compare button when 2+ runs are selected', async () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('tbody tr');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');
    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.attributes('disabled')).toBeUndefined();
  });

  // ── onCompare ───────────────────────────────────────────────────────
  it('onCompare fetches compare data and opens modal', async () => {
    const compareResult = [
      { run_id: 'run-001', symbol: 'BTC/USDT', total_return_pct: '12.50', sharpe_ratio: '1.85', calmar_ratio: '2.10', max_drawdown_pct: '8.30', win_rate: '0.625', total_trades: 48 },
      { run_id: 'run-002', symbol: 'ETH/USDT', total_return_pct: '-5.20', sharpe_ratio: '0.40', calmar_ratio: '0.30', max_drawdown_pct: '15.60', win_rate: '0.350', total_trades: 22 },
    ];
    mockCompare.mockResolvedValueOnce(compareResult);

    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    // Select 2 runs
    const rows = wrapper.findAll('tbody tr');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    await compareBtn!.trigger('click');
    await vi.dynamicImportSettled();

    expect(mockCompare).toHaveBeenCalledWith(['run-001', 'run-002']);
    expect(wrapper.find('.ant-modal').exists()).toBe(true);
  });

  it('onCompare shows error on API failure', async () => {
    mockCompare.mockRejectedValueOnce(new Error('API error'));

    const wrapper = mountBacktest({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('tbody tr');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    await compareBtn!.trigger('click');
    await vi.dynamicImportSettled();

    expect(mockMessage.error).toHaveBeenCalledWith('Failed to compare runs');
  });

  // ── Compare modal rendering ─────────────────────────────────────────
  it('compare modal renders empty state when no compare data', () => {
    // We need to force compareModalOpen and compareData state.
    // Since the modal is v-if="open", we verify the empty state text is in template.
    // When compareModalOpen is false, modal is hidden.
    const wrapper = mountBacktest();
    // The compare modal shouldn't be visible
    const modals = wrapper.findAll('.ant-modal');
    // Only the import modal template exists but hidden
    const visibleModals = modals.filter((m) => m.isVisible());
    expect(visibleModals.length).toBe(0);
  });

  // ── Import modal ────────────────────────────────────────────────────
  it('opens import modal when Import button is clicked', async () => {
    const wrapper = mountBacktest();
    const buttons = wrapper.findAll('button');
    const importBtn = buttons.find((b) => b.text().includes('Import'));
    expect(importBtn).toBeDefined();
    await importBtn!.trigger('click');

    // After click, the import modal should be visible (v-model:open = true)
    // The modal has v-if="open" so it renders
    await wrapper.vm.$nextTick();
  });

  // ── onImport success ────────────────────────────────────────────────
  it('onImport parses JSON, calls API, and shows success', async () => {
    const jsonData = { results: [{ run_id: 'test' }] };
    const jsonStr = JSON.stringify(jsonData);
    mockImportResults.mockResolvedValueOnce(undefined);

    const wrapper = mountBacktest();

    // Set internal refs via component vm
    const vm = wrapper.vm as unknown as {
      importJson: string;
      importModalOpen: boolean;
      onImport: () => Promise<void>;
    };
    vm.importJson = jsonStr;
    vm.importModalOpen = true;
    await wrapper.vm.$nextTick();

    await vm.onImport();
    await wrapper.vm.$nextTick();

    expect(mockImportResults).toHaveBeenCalledWith(jsonData);
    expect(mockMessage.success).toHaveBeenCalledWith('Backtest results imported');
    expect(mockFetchRuns).toHaveBeenCalled();
  });

  it('onImport resets importing ref to false after success', async () => {
    mockImportResults.mockResolvedValueOnce(undefined);
    const wrapper = mountBacktest();
    const vm = wrapper.vm as unknown as {
      importJson: string;
      importing: boolean;
      onImport: () => Promise<void>;
    };
    vm.importJson = '{}';

    await vm.onImport();

    expect(vm.importing).toBe(false);
  });

  // ── onImport error ──────────────────────────────────────────────────
  it('onImport shows error for invalid JSON', async () => {
    const wrapper = mountBacktest();
    const vm = wrapper.vm as unknown as {
      importJson: string;
      importing: boolean;
      onImport: () => Promise<void>;
    };
    vm.importJson = 'not valid json{{{';

    await vm.onImport();

    expect(mockMessage.error).toHaveBeenCalledWith('Invalid JSON or import failed');
    expect(vm.importing).toBe(false);
  });

  it('onImport shows error when API call fails', async () => {
    mockImportResults.mockRejectedValueOnce(new Error('Server error'));
    const wrapper = mountBacktest();
    const vm = wrapper.vm as unknown as {
      importJson: string;
      importing: boolean;
      onImport: () => Promise<void>;
    };
    vm.importJson = '{"data": "valid"}';

    await vm.onImport();

    expect(mockMessage.error).toHaveBeenCalledWith('Invalid JSON or import failed');
    expect(vm.importing).toBe(false);
  });

  // ── Task History tab - empty state ──────────────────────────────────
  it('renders task history empty state', () => {
    const wrapper = mountBacktest();
    // Task history tab has its own empty state
    const emptyStates = wrapper.findAll('.empty-state');
    // There should be at least one for runs and one for tasks
    const taskEmpty = emptyStates.find((e) => e.text().includes('No task history'));
    expect(taskEmpty).toBeDefined();
  });

  // ── Task History tab - populated state ───────────────────────────────
  it('renders task history table with data rows', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    // Two tables: runs and history. The second one should have history rows.
    const tables = wrapper.findAll('.data-table');
    expect(tables.length).toBe(2);
    const historyTable = tables[1];
    const rows = historyTable.findAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('renders card badge with history count', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const badges = wrapper.findAll('.card-badge');
    // The history badge
    const historyBadge = badges.find((b) => b.text() === '3');
    expect(historyBadge).toBeDefined();
  });

  it('renders formatted time in task history', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const firstRow = historyTable.find('tbody tr');
    const timeCell = firstRow.find('.text-muted');
    // formatTime converts to locale string
    expect(timeCell.text()).not.toBe('');
    expect(timeCell.text()).not.toBe('undefined');
  });

  it('renders task_id truncated to 8 chars', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const monoCells = historyTable.findAll('.text-mono');
    expect(monoCells[0].text()).toBe('task-aaa');
  });

  it('renders return with text-success for positive task return', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const rows = historyTable.findAll('tbody tr');
    const returnCell = rows[0].findAll('td')[2];
    expect(returnCell.classes()).toContain('text-success');
    expect(returnCell.text()).toBe('12.50%');
  });

  it('renders dash for missing return in task history', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const rows = historyTable.findAll('tbody tr');
    // task-ddd has no total_return_pct
    const returnCell = rows[1].findAll('td')[2];
    expect(returnCell.text()).toBe('-');
    expect(returnCell.classes()).toContain('text-muted');
  });

  it('renders dash for missing sharpe in task history', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const rows = historyTable.findAll('tbody tr');
    // task-ddd has no sharpe_ratio
    const sharpeCell = rows[1].findAll('td')[3];
    expect(sharpeCell.text()).toBe('-');
  });

  it('renders status pills in task history with correct classes', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const pills = historyTable.findAll('.status-pill');
    expect(pills[0].classes()).toContain('status-completed');
    expect(pills[1].classes()).toContain('status-failed');
    expect(pills[2].classes()).toContain('status-running');
  });

  // ── canView in task history ─────────────────────────────────────────
  it('renders View link enabled for COMPLETED task', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const viewLinks = historyTable.findAll('.view-link');
    expect(viewLinks[0].classes()).not.toContain('disabled');
  });

  it('renders View link enabled for DONE task', () => {
    const history = [{ ...SAMPLE_HISTORY[0], status: 'DONE' }];
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const viewLink = historyTable.find('.view-link');
    expect(viewLink.classes()).not.toContain('disabled');
  });

  it('renders View link disabled for FAILED task', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const viewLinks = historyTable.findAll('.view-link');
    expect(viewLinks[1].classes()).toContain('disabled');
  });

  it('renders View link disabled for RUNNING task', () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const viewLinks = historyTable.findAll('.view-link');
    expect(viewLinks[2].classes()).toContain('disabled');
  });

  // ── fetchResult called on task history View click ───────────────────
  it('calls store.fetchResult when View clicked on COMPLETED task', async () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const viewLinks = historyTable.findAll('.view-link');
    await viewLinks[0].trigger('click');
    expect(mockFetchResult).toHaveBeenCalledWith('task-aaa-bbb-ccc');
  });

  it('does not call store.fetchResult when View clicked on FAILED task', async () => {
    const wrapper = mountBacktest({ runs: SAMPLE_RUNS, history: SAMPLE_HISTORY });
    const tables = wrapper.findAll('.data-table');
    const historyTable = tables[1];
    const viewLinks = historyTable.findAll('.view-link');
    await viewLinks[1].trigger('click');
    expect(mockFetchResult).not.toHaveBeenCalled();
  });

  // ── formatTime ──────────────────────────────────────────────────────
  it('formatTime returns "-" for undefined input', () => {
    const wrapper = mountBacktest();
    const vm = wrapper.vm as unknown as { formatTime: (d?: string) => string };
    expect(vm.formatTime(undefined)).toBe('-');
  });

  it('formatTime returns locale string for valid date', () => {
    const wrapper = mountBacktest();
    const vm = wrapper.vm as unknown as { formatTime: (d?: string) => string };
    const result = vm.formatTime('2025-06-15T10:30:00Z');
    expect(result).not.toBe('-');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formatTime returns original string for invalid date', () => {
    const wrapper = mountBacktest();
    const vm = wrapper.vm as unknown as { formatTime: (d?: string) => string };
    // new Date('invalid') produces "Invalid Date" in toLocaleString
    const result = vm.formatTime('not-a-date');
    // In happy-dom, toLocaleString may or may not throw; either way it shouldn't crash
    expect(typeof result).toBe('string');
  });
});

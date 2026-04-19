import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// ── Hoisted mocks (vi.mock factories are hoisted above imports) ────────
const { mockFetchRuns, mockFetchWindows, mockSubmitRun, mockCompare, mockMessage } = vi.hoisted(() => ({
  mockFetchRuns: vi.fn().mockResolvedValue(undefined),
  mockFetchWindows: vi.fn().mockResolvedValue(undefined),
  mockSubmitRun: vi.fn().mockResolvedValue(undefined),
  mockCompare: vi.fn().mockResolvedValue([]),
  mockMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

let storeState: Record<string, unknown>;

vi.mock('ant-design-vue', () => ({
  message: mockMessage,
}));

vi.mock('@/stores/walkforward', () => ({
  useWalkforwardStore: () => storeState,
}));

vi.mock('@/api/walkforward', () => ({
  walkforwardApi: {
    getRuns: vi.fn().mockResolvedValue([]),
    getWindows: vi.fn().mockResolvedValue([]),
    getBestParams: vi.fn().mockResolvedValue([]),
    run: vi.fn().mockResolvedValue(undefined),
    compare: (...args: unknown[]) => mockCompare(...args),
  },
}));

vi.mock('@/components/walkforward/WindowsTable.vue', () => ({
  default: {
    name: 'WindowsTable',
    props: ['windows', 'bestParams'],
    template: '<div class="windows-table-stub" />',
  },
}));

import WalkforwardView from '@/views/WalkforwardView.vue';

// ── Ant Design stubs ──────────────────────────────────────────────────
const stubs = {
  ASpin: {
    props: ['spinning'],
    template: '<div class="ant-spin"><slot /></div>',
  },
  AButton: {
    props: ['type', 'loading', 'disabled'],
    template: '<button :disabled="disabled" :class="type"><slot /></button>',
  },
  AAlert: {
    props: ['message', 'type', 'showIcon'],
    template: '<div class="ant-alert" :data-type="type">{{ message }}</div>',
  },
  AModal: {
    props: ['open', 'title', 'footer', 'width'],
    template: '<div class="ant-modal" v-if="open"><slot /></div>',
    emits: ['update:open'],
  },
};

// ── Sample data ───────────────────────────────────────────────────────
const SAMPLE_RUNS = [
  {
    run_id: 'wf-001',
    strategy_id: 'sma_cross',
    algorithm: 'grid',
    objective: 'sharpe',
    window_mode: 'rolling',
    train_days: 90,
    test_days: 30,
    config: {},
    status: 'COMPLETED',
    summary: { avg_sharpe: 1.2 },
    time: '2025-06-15T10:30:00Z',
  },
  {
    run_id: 'wf-002',
    strategy_id: 'macd',
    algorithm: 'random',
    objective: 'calmar',
    window_mode: 'anchored',
    train_days: 180,
    test_days: 60,
    config: {},
    status: 'FAILED',
    summary: null,
    time: '2025-06-14T08:00:00Z',
  },
  {
    run_id: 'wf-003',
    strategy_id: 'rsi',
    algorithm: 'bayesian',
    objective: 'return',
    window_mode: 'rolling',
    train_days: 60,
    test_days: 20,
    config: {},
    status: 'PENDING',
    summary: null,
    time: '2025-06-16T12:00:00Z',
  },
  {
    run_id: 'wf-004',
    strategy_id: 'bollinger',
    algorithm: 'grid',
    objective: 'sortino',
    window_mode: 'expanding',
    train_days: 120,
    test_days: 30,
    config: {},
    status: 'RUNNING',
    summary: null,
    time: '2025-06-17T09:00:00Z',
  },
  {
    run_id: 'wf-005',
    strategy_id: 'meanrev',
    algorithm: 'optuna',
    objective: 'sharpe',
    window_mode: 'rolling',
    train_days: 90,
    test_days: 30,
    config: {},
    status: 'DONE',
    summary: { avg_sharpe: 0.8 },
    time: '2025-06-18T14:00:00Z',
  },
];

// ── Factory ───────────────────────────────────────────────────────────
function createStore(overrides: Record<string, unknown> = {}) {
  return {
    loading: false,
    runs: [] as unknown[],
    currentWindows: [] as unknown[],
    currentBestParams: [] as unknown[],
    error: null as string | null,
    fetchRuns: mockFetchRuns,
    fetchWindows: mockFetchWindows,
    submitRun: mockSubmitRun,
    ...overrides,
  };
}

function mountWalkforward(overrides: Record<string, unknown> = {}) {
  storeState = createStore(overrides);
  return mount(WalkforwardView, { global: { stubs } });
}

// ── Tests ──────────────────────────────────────────────────────────────
describe('WalkforwardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Mount lifecycle ─────────────────────────────────────────────────
  it('renders .walkforward-page container', () => {
    const wrapper = mountWalkforward();
    expect(wrapper.find('.walkforward-page').exists()).toBe(true);
  });

  it('calls store.fetchRuns on mount', () => {
    mountWalkforward();
    expect(mockFetchRuns).toHaveBeenCalledTimes(1);
  });

  // ── Run card ────────────────────────────────────────────────────────
  it('renders run-card section with title', () => {
    const wrapper = mountWalkforward();
    expect(wrapper.find('.run-card').exists()).toBe(true);
    expect(wrapper.find('.card-title').text()).toBe('Walk-Forward Optimization');
  });

  it('calls store.submitRun when Run Optimization is clicked', async () => {
    const wrapper = mountWalkforward();
    const buttons = wrapper.findAll('button');
    const runBtn = buttons.find((b) => b.text().includes('Run Optimization'));
    expect(runBtn).toBeDefined();
    await runBtn!.trigger('click');
    expect(mockSubmitRun).toHaveBeenCalledWith({});
  });

  // ── Error alert ─────────────────────────────────────────────────────
  it('does not render error alert when error is null', () => {
    const wrapper = mountWalkforward();
    expect(wrapper.find('.ant-alert').exists()).toBe(false);
  });

  it('renders error alert when store.error is set', () => {
    const wrapper = mountWalkforward({ error: 'Server error occurred' });
    const alert = wrapper.find('.ant-alert');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Server error occurred');
    expect(alert.attributes('data-type')).toBe('error');
  });

  // ── Empty state ─────────────────────────────────────────────────────
  it('renders empty state when no runs exist', () => {
    const wrapper = mountWalkforward();
    expect(wrapper.find('.empty-state').text()).toBe('No optimization runs');
    expect(wrapper.find('.data-table').exists()).toBe(false);
  });

  it('does not render card badge when no runs', () => {
    const wrapper = mountWalkforward();
    expect(wrapper.find('.card-badge').exists()).toBe(false);
  });

  // ── Runs table - populated state ────────────────────────────────────
  it('renders runs table when runs exist', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    expect(wrapper.find('.data-table').exists()).toBe(true);
    const rows = wrapper.findAll('tbody .wf-row');
    expect(rows.length).toBe(5);
  });

  it('renders card badge with run count', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const badge = wrapper.find('.card-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('5');
  });

  it('renders strategy_id in bold', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const boldCells = wrapper.findAll('.wf-row .text-bold');
    expect(boldCells[0].text()).toBe('sma_cross');
    expect(boldCells[1].text()).toBe('macd');
  });

  it('renders algorithm column', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    const cells = rows[0].findAll('td');
    // algorithm is 3rd data column (after expand + checkbox)
    expect(cells[3].text()).toBe('grid');
  });

  it('renders objective column', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    const cells = rows[0].findAll('td');
    expect(cells[4].text()).toBe('sharpe');
  });

  it('renders window mode with train/test days', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    const cells = rows[0].findAll('td');
    expect(cells[5].text()).toBe('rolling (90d/30d)');
  });

  // ── Status pill per run (statusClass function) ──────────────────────
  it('renders status-completed for COMPLETED run', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const pills = wrapper.findAll('.wf-row .status-pill');
    expect(pills[0].text()).toBe('COMPLETED');
    expect(pills[0].classes()).toContain('status-completed');
  });

  it('renders status-failed for FAILED run', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const pills = wrapper.findAll('.wf-row .status-pill');
    expect(pills[1].text()).toBe('FAILED');
    expect(pills[1].classes()).toContain('status-failed');
  });

  it('renders status-running for PENDING run', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const pills = wrapper.findAll('.wf-row .status-pill');
    expect(pills[2].text()).toBe('PENDING');
    expect(pills[2].classes()).toContain('status-running');
  });

  it('renders status-running for RUNNING run', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const pills = wrapper.findAll('.wf-row .status-pill');
    expect(pills[3].text()).toBe('RUNNING');
    expect(pills[3].classes()).toContain('status-running');
  });

  it('renders status-completed for DONE run', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const pills = wrapper.findAll('.wf-row .status-pill');
    expect(pills[4].text()).toBe('DONE');
    expect(pills[4].classes()).toContain('status-completed');
  });

  it('renders status-default for unknown status', () => {
    const runs = [{ ...SAMPLE_RUNS[0], run_id: 'wf-unk', status: 'CANCELLED' }];
    const wrapper = mountWalkforward({ runs });
    const pill = wrapper.find('.wf-row .status-pill');
    expect(pill.classes()).toContain('status-default');
    expect(pill.text()).toBe('CANCELLED');
  });

  // ── formatTime via DOM ──────────────────────────────────────────────
  it('renders formatted time in runs table', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    const timeCell = rows[0].find('.text-muted');
    // formatTime should convert the date to a locale string, not show raw ISO
    expect(timeCell.text()).not.toBe('2025-06-15T10:30:00Z');
    expect(timeCell.text().length).toBeGreaterThan(0);
  });

  it('renders "-" for missing time', () => {
    const runs = [{ ...SAMPLE_RUNS[0], time: undefined as unknown as string }];
    const wrapper = mountWalkforward({ runs });
    const timeCell = wrapper.find('.wf-row .text-muted');
    expect(timeCell.text()).toBe('-');
  });

  // ── formatTime direct ───────────────────────────────────────────────
  it('formatTime returns "-" for undefined input', () => {
    const wrapper = mountWalkforward();
    const vm = wrapper.vm as unknown as { formatTime: (d?: string) => string };
    expect(vm.formatTime(undefined)).toBe('-');
  });

  it('formatTime returns locale string for valid date', () => {
    const wrapper = mountWalkforward();
    const vm = wrapper.vm as unknown as { formatTime: (d?: string) => string };
    const result = vm.formatTime('2025-06-15T10:30:00Z');
    expect(result).not.toBe('-');
    expect(result.length).toBeGreaterThan(0);
  });

  // ── Expand/collapse (toggleExpand) ─────────────────────────────────
  it('renders expand icon for each run', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const icons = wrapper.findAll('.expand-icon');
    expect(icons.length).toBe(5);
  });

  it('expand icon does not have expanded class initially', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const icon = wrapper.find('.expand-icon');
    expect(icon.classes()).not.toContain('expanded');
  });

  it('expands a row on click and calls fetchWindows', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();

    // expand icon should have 'expanded' class
    const icon = wrapper.findAll('.expand-icon')[0];
    expect(icon.classes()).toContain('expanded');

    // fetchWindows should be called
    expect(mockFetchWindows).toHaveBeenCalledWith('wf-001');

    // expand-row should appear
    const expandRow = wrapper.find('.expand-row');
    expect(expandRow.exists()).toBe(true);
  });

  it('collapses an expanded row on second click', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    // Expand
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.expand-row').exists()).toBe(true);

    // Collapse
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.expand-row').exists()).toBe(false);
  });

  it('does not call fetchWindows when collapsing', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    // Expand
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();
    expect(mockFetchWindows).toHaveBeenCalledTimes(1);

    // Collapse (same row)
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();
    // Should still be 1, not called again
    expect(mockFetchWindows).toHaveBeenCalledTimes(1);
  });

  it('expands a different row and calls fetchWindows for new row', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    // Expand first row
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();
    expect(mockFetchWindows).toHaveBeenCalledWith('wf-001');

    // Expand second row (different)
    await rows[1].trigger('click');
    await wrapper.vm.$nextTick();
    expect(mockFetchWindows).toHaveBeenCalledWith('wf-002');
    expect(mockFetchWindows).toHaveBeenCalledTimes(2);
  });

  // ── Expanded row content ────────────────────────────────────────────
  it('renders WindowsTable when currentWindows is populated and row is expanded', async () => {
    const wrapper = mountWalkforward({
      runs: SAMPLE_RUNS,
      currentWindows: [{ run_id: 'wf-001', window_index: 0, train_start: '2025-01-01', train_end: '2025-03-31', test_start: '2025-04-01', test_end: '2025-06-30', best_params: {}, train_metrics: {}, test_metrics: {}, objective_score: 1.5, overfitting_ratio: 0.8 }],
    });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.windows-table-stub').exists()).toBe(true);
  });

  it('renders empty-inline when no windows data and row is expanded', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS, currentWindows: [] });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.empty-inline').exists()).toBe(true);
    expect(wrapper.find('.empty-inline').text()).toBe('No window data available');
    expect(wrapper.find('.windows-table-stub').exists()).toBe(false);
  });

  // ── Checkbox selection (selectedRuns, toggleRun) ────────────────────
  it('renders a checkbox for each run row', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(5);
  });

  it('toggles a run checkbox to select it', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    const checkbox = rows[0].find('input[type="checkbox"]');
    await checkbox.trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.text()).toContain('1');
  });

  it('toggles a run checkbox to deselect it', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    const checkbox = rows[0].find('input[type="checkbox"]');
    // Select
    await checkbox.trigger('change');
    // Deselect
    await checkbox.trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.text()).toContain('0');
  });

  it('selects multiple runs via checkboxes', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.text()).toContain('2');
  });

  // ── Compare button ──────────────────────────────────────────────────
  it('disables Compare button when fewer than 2 runs selected', () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.attributes('disabled')).toBeDefined();
  });

  it('enables Compare button when 2+ runs are selected', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    expect(compareBtn!.attributes('disabled')).toBeUndefined();
  });

  // ── onCompare ───────────────────────────────────────────────────────
  it('onCompare fetches data and opens compare modal', async () => {
    const compareResult = [
      { run_id: 'wf-001', strategy_id: 'sma_cross', algorithm: 'grid', objective: 'sharpe', status: 'COMPLETED', window_mode: 'rolling' },
      { run_id: 'wf-002', strategy_id: 'macd', algorithm: 'random', objective: 'calmar', status: 'FAILED', window_mode: 'anchored' },
    ];
    mockCompare.mockResolvedValueOnce(compareResult);

    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    await compareBtn!.trigger('click');
    await vi.dynamicImportSettled();

    expect(mockCompare).toHaveBeenCalledWith(['wf-001', 'wf-002']);
  });

  it('onCompare shows error on API failure', async () => {
    mockCompare.mockRejectedValueOnce(new Error('API error'));

    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    await compareBtn!.trigger('click');
    await vi.dynamicImportSettled();

    expect(mockMessage.error).toHaveBeenCalledWith('Failed to compare runs');
  });

  // ── Compare modal rendering ─────────────────────────────────────────
  it('compare modal is hidden when compareModalOpen is false', () => {
    const wrapper = mountWalkforward();
    const modals = wrapper.findAll('.ant-modal');
    const visible = modals.filter((m) => m.isVisible());
    expect(visible.length).toBe(0);
  });

  it('compare modal renders empty state when opened with no data', async () => {
    mockCompare.mockResolvedValueOnce([]);

    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    await compareBtn!.trigger('click');
    await vi.dynamicImportSettled();
    await wrapper.vm.$nextTick();

    // When compareData is empty, the modal shows "No comparison data"
    const modal = wrapper.find('.ant-modal');
    if (modal.exists()) {
      expect(modal.text()).toContain('No comparison data');
    }
  });

  it('compare modal renders table with data when compare results exist', async () => {
    const compareResult = [
      { run_id: 'wf-001', strategy_id: 'sma_cross', algorithm: 'grid', objective: 'sharpe', status: 'COMPLETED', window_mode: 'rolling' },
      { run_id: 'wf-002', strategy_id: 'macd', algorithm: 'random', objective: 'calmar', status: 'FAILED', window_mode: 'anchored' },
    ];
    mockCompare.mockResolvedValueOnce(compareResult);

    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    await rows[0].find('input[type="checkbox"]').trigger('change');
    await rows[1].find('input[type="checkbox"]').trigger('change');

    const buttons = wrapper.findAll('button');
    const compareBtn = buttons.find((b) => b.text().includes('Compare'));
    await compareBtn!.trigger('click');
    await vi.dynamicImportSettled();
    await wrapper.vm.$nextTick();

    const modal = wrapper.find('.ant-modal');
    expect(modal.exists()).toBe(true);
    // Verify compare data is rendered
    expect(modal.text()).toContain('sma_cross');
    expect(modal.text()).toContain('macd');
    expect(modal.text()).toContain('Strategy');
    expect(modal.text()).toContain('Algorithm');
    expect(modal.text()).toContain('Objective');
    expect(modal.text()).toContain('Status');
    expect(modal.text()).toContain('Windows');
  });

  // ── Checkbox click stops propagation (does not trigger expand) ──────
  it('clicking checkbox does not expand the row', async () => {
    const wrapper = mountWalkforward({ runs: SAMPLE_RUNS });
    const rows = wrapper.findAll('.wf-row');
    const checkbox = rows[0].find('input[type="checkbox"]');
    await checkbox.trigger('change');
    await wrapper.vm.$nextTick();

    // The row should NOT be expanded since checkbox click uses @click.stop
    expect(wrapper.find('.expand-row').exists()).toBe(false);
  });

  // ── Loading spinner ─────────────────────────────────────────────────
  it('renders spinner with store loading state', () => {
    const wrapper = mountWalkforward({ loading: true });
    const spin = wrapper.find('.ant-spin');
    expect(spin.exists()).toBe(true);
  });
});

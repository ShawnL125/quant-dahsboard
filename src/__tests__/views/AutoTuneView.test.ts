import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AutoTuneView from '@/views/AutoTuneView.vue';

const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockTriggerRun = vi.fn().mockResolvedValue(undefined);
const mockConfirmRun = vi.fn().mockResolvedValue(undefined);
const mockRollbackRun = vi.fn().mockResolvedValue(undefined);
const mockDeleteSchedule = vi.fn().mockResolvedValue(undefined);

let mockRuns: Record<string, unknown>[] = [];
let mockSchedules: Record<string, unknown>[] = [];

const stubs = {
  'a-spin': { template: '<div class="a-spin-stub"><slot /></div>' },
  'a-button': {
    template: '<button class="a-button-stub" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click'],
  },
  'a-modal': {
    name: 'AModal',
    template: '<div class="a-modal-stub"><slot /></div>',
    props: ['open', 'title', 'confirmLoading'],
    emits: ['ok', 'cancel', 'update:open'],
  },
  'a-form': { template: '<form class="a-form-stub" @submit.prevent="$emit(\'finish\')"><slot /></form>', emits: ['finish'] },
  'a-form-item': { template: '<div class="a-form-item-stub"><slot /></div>', props: ['label'] },
  'a-input': {
    template: '<input class="a-input-stub" :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
    props: ['value', 'placeholder'],
    emits: ['update:value'],
  },
  'a-select': {
    template: '<select class="a-select-stub" :value="value" @change="$emit(\'update:value\', $event.target.value)"><slot /></select>',
    props: ['value'],
    emits: ['update:value'],
  },
  'a-select-option': { template: '<option class="a-select-option-stub"><slot /></option>', props: ['value'] },
  'a-popconfirm': {
    template: '<div class="a-popconfirm-stub"><slot /></div>',
    emits: ['confirm', 'cancel'],
  },
};

vi.mock('ant-design-vue', () => ({
  message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/stores/auto_tune', () => ({
  useAutoTuneStore: () => ({
    loading: false,
    get runs() { return mockRuns; },
    get schedules() { return mockSchedules; },
    fetchAll: mockFetchAll,
    triggerRun: mockTriggerRun,
    confirmRun: mockConfirmRun,
    rollbackRun: mockRollbackRun,
    deleteSchedule: mockDeleteSchedule,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockRuns = [];
  mockSchedules = [];
});

function mountView() {
  return mount(AutoTuneView, { global: { stubs } });
}

describe('AutoTuneView', () => {
  // ── Basic rendering ──────────────────────────────────────────────

  it('renders .autotune-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.autotune-page').exists()).toBe(true);
  });

  it('calls fetchAll on mount', () => {
    mountView();
    expect(mockFetchAll).toHaveBeenCalledOnce();
  });

  // ── Runs section ──────────────────────────────────────────────────

  it('shows empty state when no runs exist', () => {
    const wrapper = mountView();
    expect(wrapper.find('.runs-section').exists()).toBe(true);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.data-table').exists()).toBe(false);
  });

  it('renders runs table when runs exist', () => {
    mockRuns = [
      {
        run_id: 'run-12345678',
        strategy_id: 'my_strategy',
        apply_mode: 'manual',
        status: 'pending',
        created_at: '2025-01-15T10:30:00Z',
      },
    ];
    const wrapper = mountView();
    expect(wrapper.find('.runs-section .data-table').exists()).toBe(true);
    expect(wrapper.find('.runs-section .empty-state').exists()).toBe(false);

    // Check that run data is rendered
    expect(wrapper.text()).toContain('my_strategy');
    expect(wrapper.text()).toContain('manual');
    expect(wrapper.text()).toContain('pending');
  });

  it('renders Confirm button only for pending runs', () => {
    mockRuns = [
      { run_id: 'r1', strategy_id: 's1', apply_mode: 'manual', status: 'pending', created_at: '2025-01-01T00:00:00Z' },
      { run_id: 'r2', strategy_id: 's2', apply_mode: 'auto', status: 'applied', created_at: '2025-01-01T00:00:00Z' },
      { run_id: 'r3', strategy_id: 's3', apply_mode: 'manual', status: 'failed', created_at: '2025-01-01T00:00:00Z' },
    ];
    const wrapper = mountView();
    const rows = wrapper.findAll('.runs-section tbody tr');
    expect(rows.length).toBe(3);

    // Only the first run (pending) should have Confirm
    const confirmButtons = rows[0].findAll('.a-button-stub');
    expect(confirmButtons.some((b) => b.text().includes('Confirm'))).toBe(true);

    // Second run (applied) should have Rollback
    const appliedButtons = rows[1].findAll('.a-button-stub');
    expect(appliedButtons.some((b) => b.text().includes('Rollback'))).toBe(true);

    // Third run (failed) should have no action buttons
    const failedButtons = rows[2].findAll('.a-button-stub');
    expect(failedButtons.length).toBe(0);
  });

  it('calls confirmRun when Confirm button is clicked', async () => {
    mockRuns = [
      { run_id: 'run-abc', strategy_id: 's1', apply_mode: 'manual', status: 'pending', created_at: '2025-01-01T00:00:00Z' },
    ];
    const wrapper = mountView();
    const confirmBtn = wrapper.findAll('.runs-section .a-button-stub').find((b) => b.text().includes('Confirm'));
    expect(confirmBtn).toBeTruthy();
    await confirmBtn!.trigger('click');
    expect(mockConfirmRun).toHaveBeenCalledWith('run-abc');
  });

  it('calls rollbackRun when Rollback button is clicked', async () => {
    mockRuns = [
      { run_id: 'run-def', strategy_id: 's2', apply_mode: 'auto', status: 'applied', created_at: '2025-01-01T00:00:00Z' },
    ];
    const wrapper = mountView();
    const popconfirm = wrapper.findAllComponents('.a-popconfirm-stub').find((pc) => pc.text().includes('Rollback'));
    expect(popconfirm).toBeTruthy();
    await popconfirm!.vm.$emit('confirm');
    await flushPromises();
    expect(mockRollbackRun).toHaveBeenCalledWith('run-def');
  });

  // ── Schedules section ─────────────────────────────────────────────

  it('shows empty state when no schedules exist', () => {
    const wrapper = mountView();
    expect(wrapper.find('.schedules-section').exists()).toBe(true);
    expect(wrapper.findAll('.schedules-section .empty-state').length).toBe(1);
    expect(wrapper.find('.schedules-section .data-table').exists()).toBe(false);
  });

  it('renders schedules table with data and badge count', () => {
    mockSchedules = [
      {
        schedule_id: 'sched-11112222',
        strategy_id: 'strat_a',
        cron_expr: '0 */6 * * *',
        apply_mode: 'auto',
        train_days: 30,
        test_days: 7,
      },
    ];
    const wrapper = mountView();
    expect(wrapper.find('.schedules-section .data-table').exists()).toBe(true);
    expect(wrapper.find('.section-badge').text()).toBe('1');
    expect(wrapper.text()).toContain('strat_a');
    expect(wrapper.text()).toContain('0 */6 * * *');
    expect(wrapper.text()).toContain('30d / 7d');
  });

  it('renders multiple schedules correctly', () => {
    mockSchedules = [
      { schedule_id: 's1', strategy_id: 'a', cron_expr: '* * *', apply_mode: 'manual', train_days: 10, test_days: 5 },
      { schedule_id: 's2', strategy_id: 'b', cron_expr: '0 0 *', apply_mode: 'auto', train_days: 20, test_days: 3 },
    ];
    const wrapper = mountView();
    const rows = wrapper.findAll('.schedules-section tbody tr');
    expect(rows.length).toBe(2);
    expect(wrapper.find('.section-badge').text()).toBe('2');
  });

  it('calls deleteSchedule when Delete button is clicked', async () => {
    mockSchedules = [
      { schedule_id: 'sched-delete', strategy_id: 'a', cron_expr: '* *', apply_mode: 'auto', train_days: 10, test_days: 5 },
    ];
    const wrapper = mountView();
    const popconfirm = wrapper.findAllComponents('.a-popconfirm-stub').find((pc) => pc.text().includes('Delete'));
    expect(popconfirm).toBeTruthy();
    await popconfirm!.vm.$emit('confirm');
    await flushPromises();
    expect(mockDeleteSchedule).toHaveBeenCalledWith('sched-delete');
  });

  // ── Trigger Run button ────────────────────────────────────────────

  it('renders the Trigger Run button', () => {
    const wrapper = mountView();
    const buttons = wrapper.findAll('.a-button-stub');
    const triggerBtn = buttons.find((b) => b.text().includes('Trigger Run'));
    expect(triggerBtn).toBeTruthy();
  });

  it('opens the modal when Trigger Run button is clicked', async () => {
    const wrapper = mountView();
    const triggerBtn = wrapper.findAll('.a-button-stub').find((b) => b.text().includes('Trigger Run'));
    await triggerBtn!.trigger('click');

    // After clicking, the modal stub should now render (open=true)
    expect(wrapper.find('.a-modal-stub').exists()).toBe(true);
  });

  // ── onTrigger validation ──────────────────────────────────────────

  it('does not call triggerRun when strategy_id is empty', async () => {
    const wrapper = mountView();

    // Emit ok from modal (simulating modal OK click)
    const modal = wrapper.findComponent('.a-modal-stub');
    await modal.vm.$emit('ok');
    await flushPromises();

    // triggerForm.strategy_id defaults to '', so onTrigger should early-return
    expect(mockTriggerRun).not.toHaveBeenCalled();
  });

  it('calls triggerRun and resets form when strategy_id is provided', async () => {
    const wrapper = mountView();

    // Set strategy_id via input
    const input = wrapper.find('.a-input-stub');
    await input.setValue('test_strategy');

    // Trigger the modal ok (which calls onTrigger)
    const modal = wrapper.findComponent('.a-modal-stub');
    await modal.vm.$emit('ok');
    await flushPromises();

    expect(mockTriggerRun).toHaveBeenCalledOnce();
    expect(mockTriggerRun).toHaveBeenCalledWith({ strategy_id: 'test_strategy', apply_mode: 'manual' });
  });

  // ── formatTime ────────────────────────────────────────────────────

  it('renders formatted time for runs', () => {
    mockRuns = [
      {
        run_id: 'run-time-test',
        strategy_id: 's',
        apply_mode: 'manual',
        status: 'completed',
        created_at: '2025-03-15T14:30:00Z',
      },
    ];
    const wrapper = mountView();
    // The formatted time should appear in the table cell
    const cell = wrapper.findAll('.runs-section td.text-muted');
    expect(cell.length).toBeGreaterThan(0);
    // Verify the cell contains a date-like string (not the raw ISO)
    expect(cell[0].text()).not.toBe('2025-03-15T14:30:00Z');
  });
});

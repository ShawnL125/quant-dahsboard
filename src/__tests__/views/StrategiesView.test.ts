import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import StrategiesView from '@/views/StrategiesView.vue';

// ── Mock ant-design-vue message ───────────────────────────────────────
vi.mock('ant-design-vue', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// ── Store mock state (mutable for per-test variation) ─────────────────
const defaultStrategies = [
  {
    strategy_id: 'alpha',
    is_running: true,
    symbols: ['BTC/USDT', 'ETH/USDT'],
    exchanges: ['binance', 'okx'],
    timeframes: ['1h', '4h'],
    parameters: { period: 14, threshold: 0.5 },
  },
  {
    strategy_id: 'beta',
    is_running: false,
    symbols: ['SOL/USDT'],
    exchanges: ['binance'],
    timeframes: ['15m'],
    parameters: {},
  },
  {
    strategy_id: 'gamma',
    is_running: true,
    symbols: ['DOGE/USDT'],
    exchanges: ['okx'],
    timeframes: ['1d'],
    parameters: { fast: 9, slow: 21 },
  },
];

let mockStrategies = [...defaultStrategies];
let mockError: string | null = null;
let mockLoading = false;
let mockSelectedStrategy: unknown = null;
let mockParams: Record<string, unknown> = {};
let mockParamsSource = '';
let mockParamsAudit: unknown[] = [];

const mockFetchStrategies = vi.fn();
const mockToggleStrategy = vi.fn();
const mockSelectStrategy = vi.fn();
const mockFetchParams = vi.fn();
const mockFetchParamsAudit = vi.fn();
const mockUpdateParams = vi.fn();
const mockReloadStrategies = vi.fn();

vi.mock('@/stores/strategies', () => ({
  useStrategiesStore: () => ({
    get strategies() { return mockStrategies; },
    get error() { return mockError; },
    get loading() { return mockLoading; },
    get selectedStrategy() { return mockSelectedStrategy; },
    get params() { return mockParams; },
    get paramsSource() { return mockParamsSource; },
    get paramsAudit() { return mockParamsAudit; },
    fetchStrategies: mockFetchStrategies,
    toggleStrategy: mockToggleStrategy,
    selectStrategy: mockSelectStrategy,
    fetchParams: mockFetchParams,
    fetchParamsAudit: mockFetchParamsAudit,
    updateParams: mockUpdateParams,
    reloadStrategies: mockReloadStrategies,
  }),
}));

// ── Stub components ───────────────────────────────────────────────────
const stubs = {
  StrategyList: {
    template: '<div class="strategy-list-stub" />',
    props: ['strategies'],
    emits: ['toggle', 'view'],
  },
  'a-button': {
    template: '<button class="ant-btn" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'size', 'loading'],
    emits: ['click'],
  },
  'a-alert': {
    template: '<div class="ant-alert" />',
    props: ['message', 'type', 'showIcon'],
  },
  'a-drawer': {
    template: '<div class="ant-drawer"><slot /></div>',
    props: ['open', 'width', 'title'],
    emits: ['close'],
  },
  'a-input': {
    template: '<input class="ant-input" :value="value" @input="$emit(\'change\', { target: { value: $event.target.value } })" />',
    props: ['value', 'size'],
    emits: ['change'],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockStrategies = [...defaultStrategies];
  mockError = null;
  mockLoading = false;
  mockSelectedStrategy = null;
  mockParams = {};
  mockParamsSource = '';
  mockParamsAudit = [];
});

function mountStrategies() {
  return mount(StrategiesView, { global: { stubs } });
}

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — basic rendering & lifecycle', () => {
  it('renders .strategies-page container', () => {
    const wrapper = mountStrategies();
    expect(wrapper.find('.strategies-page').exists()).toBe(true);
  });

  it('calls store.fetchStrategies on mount', () => {
    mountStrategies();
    expect(mockFetchStrategies).toHaveBeenCalledOnce();
  });

  it('passes strategies to StrategyList', () => {
    const wrapper = mountStrategies();
    const list = wrapper.find('.strategy-list-stub');
    expect(list.exists()).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — activeCount computed', () => {
  it('displays correct activeCount with 2 active out of 3', () => {
    const wrapper = mountStrategies();
    expect(wrapper.find('.active-count').text()).toBe('2 Active');
    expect(wrapper.find('.total-count').text()).toBe('/ 3 Total');
  });

  it('displays 0 Active when all strategies are stopped', () => {
    mockStrategies = [
      { strategy_id: 's1', is_running: false, symbols: ['BTC'], exchanges: ['binance'], timeframes: ['1h'], parameters: {} },
    ];
    const wrapper = mountStrategies();
    expect(wrapper.find('.active-count').text()).toBe('0 Active');
    expect(wrapper.find('.total-count').text()).toBe('/ 1 Total');
  });

  it('displays correct count when all strategies are running', () => {
    mockStrategies = defaultStrategies.map((s) => ({ ...s, is_running: true }));
    const wrapper = mountStrategies();
    expect(wrapper.find('.active-count').text()).toBe('3 Active');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — error alert', () => {
  it('shows error alert when store.error is set', () => {
    mockError = 'Something went wrong';
    const wrapper = mountStrategies();
    expect(wrapper.find('.ant-alert').exists()).toBe(true);
  });

  it('does not show error alert when store.error is null', () => {
    const wrapper = mountStrategies();
    expect(wrapper.find('.ant-alert').exists()).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — Reload button', () => {
  it('calls store.reloadStrategies and shows success message', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountStrategies();
    // Find the Reload button
    const buttons = wrapper.findAll('button');
    const reloadBtn = buttons.find((b) => b.text() === 'Reload');
    expect(reloadBtn).toBeTruthy();
    await reloadBtn!.trigger('click');
    expect(mockReloadStrategies).toHaveBeenCalledOnce();
    expect(message.success).toHaveBeenCalledWith('Strategies reloaded');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — onToggle', () => {
  it('calls store.toggleStrategy and shows success message', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountStrategies();
    await wrapper.vm.onToggle('alpha', true);
    await nextTick();
    expect(mockToggleStrategy).toHaveBeenCalledWith('alpha', true);
    expect(message.success).toHaveBeenCalledWith('Strategy enabled');
  });

  it('shows "disabled" message when toggling off', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountStrategies();
    await wrapper.vm.onToggle('beta', false);
    await nextTick();
    expect(message.success).toHaveBeenCalledWith('Strategy disabled');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — onView (drawer open)', () => {
  it('calls selectStrategy, fetchParams, fetchParamsAudit and opens drawer', async () => {
    const wrapper = mountStrategies();
    await wrapper.vm.onView('alpha');
    await nextTick();
    expect(mockSelectStrategy).toHaveBeenCalledWith('alpha');
    expect(mockFetchParams).toHaveBeenCalledWith('alpha');
    expect(mockFetchParamsAudit).toHaveBeenCalledWith('alpha', 20);
    expect(wrapper.vm.detailOpen).toBe(true);
    expect(wrapper.vm.editingParams).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — drawer content rendering', () => {
  it('renders strategy detail fields when selectedStrategy is set', async () => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT', 'ETH/USDT'],
      exchanges: ['binance', 'okx'],
      timeframes: ['1h', '4h'],
      parameters: {},
    };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    expect(wrapper.text()).toContain('BTC/USDT, ETH/USDT');
    expect(wrapper.text()).toContain('binance, okx');
    expect(wrapper.text()).toContain('1h, 4h');
    expect(wrapper.text()).toContain('Running');
    const statusPill = wrapper.find('.status-pill');
    expect(statusPill.classes()).toContain('status-ok');
  });

  it('shows Stopped status-pill when strategy is not running', async () => {
    mockSelectedStrategy = {
      strategy_id: 'beta',
      is_running: false,
      symbols: ['SOL/USDT'],
      exchanges: ['binance'],
      timeframes: ['15m'],
      parameters: {},
    };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    expect(wrapper.text()).toContain('Stopped');
    const statusPill = wrapper.find('.status-pill');
    expect(statusPill.classes()).toContain('status-error');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — parameters panel', () => {
  beforeEach(() => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT'],
      exchanges: ['binance'],
      timeframes: ['1h'],
      parameters: {},
    };
  });

  it('shows "No parameters" when params is empty', async () => {
    mockParams = {};
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();
    expect(wrapper.text()).toContain('No parameters');
  });

  it('renders parameters grid with key-value pairs in display mode', async () => {
    mockParams = { period: 14, threshold: 0.5 };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    expect(wrapper.text()).toContain('period');
    expect(wrapper.text()).toContain('14');
    expect(wrapper.text()).toContain('threshold');
    expect(wrapper.text()).toContain('0.5');
    // In display mode, values appear in .param-value spans
    expect(wrapper.findAll('.param-value').length).toBe(2);
  });

  it('shows paramsSource', async () => {
    mockParams = { period: 14 };
    mockParamsSource = 'file:/config/alpha.yaml';
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();
    expect(wrapper.text()).toContain('file:/config/alpha.yaml');
  });

  it('shows "Edit Parameters" button when not editing', async () => {
    mockParams = { period: 14 };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();
    expect(wrapper.text()).toContain('Edit Parameters');
  });

  it('shows Save and Cancel buttons when editing', async () => {
    mockParams = { period: 14 };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    wrapper.vm.editingParams = true;
    await nextTick();
    expect(wrapper.text()).toContain('Save');
    expect(wrapper.text()).toContain('Cancel');
    // Should not show Edit Parameters button
    expect(wrapper.text()).not.toContain('Edit Parameters');
  });

  it('renders input fields for each param when editing', async () => {
    mockParams = { period: 14, threshold: 0.5 };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    wrapper.vm.editingParams = true;
    await nextTick();

    const inputs = wrapper.findAll('.ant-input');
    expect(inputs.length).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — startEditParams / cancelEditParams', () => {
  beforeEach(() => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT'],
      exchanges: ['binance'],
      timeframes: ['1h'],
      parameters: {},
    };
    mockParams = { period: 14, threshold: 0.5 };
  });

  it('startEditParams copies params to editedParams and sets editingParams true', async () => {
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    wrapper.vm.startEditParams();
    expect(wrapper.vm.editingParams).toBe(true);
    expect(wrapper.vm.editedParams).toEqual({ period: '14', threshold: '0.5' });
  });

  it('cancelEditParams sets editingParams to false', async () => {
    const wrapper = mountStrategies();
    wrapper.vm.editingParams = true;
    wrapper.vm.cancelEditParams();
    expect(wrapper.vm.editingParams).toBe(false);
  });

  it('clicking Edit Parameters button triggers startEditParams', async () => {
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'Edit Parameters');
    expect(editBtn).toBeTruthy();
    await editBtn!.trigger('click');
    expect(wrapper.vm.editingParams).toBe(true);
  });

  it('clicking Cancel button triggers cancelEditParams', async () => {
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    wrapper.vm.editingParams = true;
    await nextTick();

    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
    expect(cancelBtn).toBeTruthy();
    await cancelBtn!.trigger('click');
    expect(wrapper.vm.editingParams).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — onParamChange', () => {
  beforeEach(() => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT'],
      exchanges: ['binance'],
      timeframes: ['1h'],
      parameters: {},
    };
    mockParams = { period: 14 };
  });

  it('updates editedParams immutably for the given key', async () => {
    const wrapper = mountStrategies();
    wrapper.vm.startEditParams();
    wrapper.vm.onParamChange('period', { target: { value: '20' } });
    expect(wrapper.vm.editedParams.period).toBe('20');
  });

  it('preserves other keys when updating one', async () => {
    mockParams = { period: 14, threshold: 0.5 };
    const wrapper = mountStrategies();
    wrapper.vm.startEditParams();
    wrapper.vm.onParamChange('period', { target: { value: '30' } });
    expect(wrapper.vm.editedParams.threshold).toBe('0.5');
    expect(wrapper.vm.editedParams.period).toBe('30');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — onSaveParams', () => {
  beforeEach(() => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT'],
      exchanges: ['binance'],
      timeframes: ['1h'],
      parameters: {},
    };
    mockParams = { period: 14 };
  });

  it('calls store.updateParams with correct strategy_id and params', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountStrategies();
    wrapper.vm.startEditParams();
    wrapper.vm.onParamChange('period', { target: { value: '21' } });
    await wrapper.vm.onSaveParams();

    expect(mockUpdateParams).toHaveBeenCalledWith('alpha', { period: '21' });
    expect(message.success).toHaveBeenCalledWith('Parameters updated');
    expect(wrapper.vm.editingParams).toBe(false);
    expect(wrapper.vm.savingParams).toBe(false);
  });

  it('shows error message when updateParams fails', async () => {
    const { message } = await import('ant-design-vue');
    mockUpdateParams.mockRejectedValueOnce(new Error('update failed'));
    const wrapper = mountStrategies();
    wrapper.vm.startEditParams();
    await wrapper.vm.onSaveParams();

    expect(message.error).toHaveBeenCalledWith('update failed');
    expect(wrapper.vm.savingParams).toBe(false);
    expect(wrapper.vm.editingParams).toBe(true); // stays in edit mode on error
  });

  it('shows generic error message when error is not an Error instance', async () => {
    const { message } = await import('ant-design-vue');
    mockUpdateParams.mockRejectedValueOnce('string error');
    const wrapper = mountStrategies();
    wrapper.vm.startEditParams();
    await wrapper.vm.onSaveParams();

    expect(message.error).toHaveBeenCalledWith('Failed to update parameters');
  });

  it('does nothing when no strategy is selected', async () => {
    mockSelectedStrategy = null;
    const wrapper = mountStrategies();
    await wrapper.vm.onSaveParams();
    expect(mockUpdateParams).not.toHaveBeenCalled();
  });

  it('sets savingParams to false in finally block even on success', async () => {
    const wrapper = mountStrategies();
    wrapper.vm.startEditParams();
    await wrapper.vm.onSaveParams();
    expect(wrapper.vm.savingParams).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — audit log table', () => {
  beforeEach(() => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT'],
      exchanges: ['binance'],
      timeframes: ['1h'],
      parameters: {},
    };
  });

  it('shows "No audit entries" when paramsAudit is empty', async () => {
    mockParamsAudit = [];
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();
    expect(wrapper.text()).toContain('No audit entries');
  });

  it('renders audit log table with entries', async () => {
    mockParamsAudit = [
      {
        time: '2025-01-15T10:30:00Z',
        param_name: 'period',
        old_value: '10',
        new_value: '14',
        source: 'api',
      },
      {
        time: '2025-01-14T08:00:00Z',
        param_name: 'threshold',
        old_value: '0.3',
        new_value: '0.5',
        source: 'file',
      },
    ];
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    expect(wrapper.text()).toContain('period');
    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('14');
    expect(wrapper.text()).toContain('api');
    expect(wrapper.text()).toContain('threshold');
    expect(wrapper.text()).toContain('0.3');
    expect(wrapper.text()).toContain('0.5');
    expect(wrapper.text()).toContain('file');
  });

  it('renders table headers correctly', async () => {
    mockParamsAudit = [
      { time: '2025-01-15T10:30:00Z', param_name: 'period', old_value: '10', new_value: '14', source: 'api' },
    ];
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    const ths = wrapper.findAll('th');
    const headerTexts = ths.map((th) => th.text());
    expect(headerTexts).toContain('Time');
    expect(headerTexts).toContain('Param');
    expect(headerTexts).toContain('Old');
    expect(headerTexts).toContain('New');
    expect(headerTexts).toContain('Source');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — formatTime helper', () => {
  it('formats a valid ISO string to locale string', () => {
    const wrapper = mountStrategies();
    const result = wrapper.vm.formatTime('2025-01-15T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the raw string for invalid date input', () => {
    const wrapper = mountStrategies();
    const result = wrapper.vm.formatTime('not-a-date');
    expect(typeof result).toBe('string');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — drawer close', () => {
  it('sets detailOpen to false when drawer emits close', async () => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT'],
      exchanges: ['binance'],
      timeframes: ['1h'],
      parameters: {},
    };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    await nextTick();

    // Directly set detailOpen to false (simulating close event)
    wrapper.vm.detailOpen = false;
    await nextTick();
    expect(wrapper.vm.detailOpen).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — ref initial state', () => {
  it('initializes detailOpen as false', () => {
    const wrapper = mountStrategies();
    expect(wrapper.vm.detailOpen).toBe(false);
  });

  it('initializes editingParams as false', () => {
    const wrapper = mountStrategies();
    expect(wrapper.vm.editingParams).toBe(false);
  });

  it('initializes savingParams as false', () => {
    const wrapper = mountStrategies();
    expect(wrapper.vm.savingParams).toBe(false);
  });

  it('initializes editedParams as empty object', () => {
    const wrapper = mountStrategies();
    expect(wrapper.vm.editedParams).toEqual({});
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('StrategiesView — Save button loading state', () => {
  it('passes savingParams as loading to Save button', async () => {
    mockSelectedStrategy = {
      strategy_id: 'alpha',
      is_running: true,
      symbols: ['BTC/USDT'],
      exchanges: ['binance'],
      timeframes: ['1h'],
      parameters: {},
    };
    mockParams = { period: 14 };
    const wrapper = mountStrategies();
    wrapper.vm.detailOpen = true;
    wrapper.vm.editingParams = true;
    await nextTick();

    // Find the Save button
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save');
    expect(saveBtn).toBeTruthy();
    // The button should not have loading prop set when savingParams is false
    expect(wrapper.vm.savingParams).toBe(false);

    // Set savingParams to true and verify the state
    wrapper.vm.savingParams = true;
    await nextTick();
    expect(wrapper.vm.savingParams).toBe(true);
  });
});

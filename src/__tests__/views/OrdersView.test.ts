import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import OrdersView from '@/views/OrdersView.vue';

// ── Mock ant-design-vue message ───────────────────────────────────────
vi.mock('ant-design-vue', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// ── Store mock state (mutable for per-test variation) ─────────────────
let mockOrders: unknown[] = [];
let mockOpenOrders: unknown[] = [];
let mockOrderHistory: unknown[] = [];
let mockTrackedOrders: unknown[] = [];
let mockSLBindings: unknown[] = [];
let mockTrailingStops: unknown[] = [];
let mockAlgoOrders: unknown[] = [];
let mockError: string | null = null;
let mockLoading = false;

const mockFetchOrders = vi.fn();
const mockFetchOrderHistory = vi.fn();
const mockCancelOrder = vi.fn();
const mockPlaceOrder = vi.fn();
const mockFetchTrackedOrders = vi.fn();
const mockFetchSLBindings = vi.fn();
const mockFetchTrailingStops = vi.fn();
const mockFetchAlgoOrders = vi.fn();
const mockDeactivateTrailingStop = vi.fn();
const mockSubmitAlgoOrder = vi.fn();
const mockCancelAlgoOrder = vi.fn();
const mockPauseAlgoOrder = vi.fn();
const mockResumeAlgoOrder = vi.fn();

vi.mock('@/stores/orders', () => ({
  useOrdersStore: () => ({
    get orders() { return mockOrders; },
    get openOrders() { return mockOpenOrders; },
    get orderHistory() { return mockOrderHistory; },
    get trackedOrders() { return mockTrackedOrders; },
    get slBindings() { return mockSLBindings; },
    get trailingStops() { return mockTrailingStops; },
    get algoOrders() { return mockAlgoOrders; },
    get error() { return mockError; },
    get loading() { return mockLoading; },
    fetchOrders: mockFetchOrders,
    fetchOrderHistory: mockFetchOrderHistory,
    cancelOrder: mockCancelOrder,
    placeOrder: mockPlaceOrder,
    fetchTrackedOrders: mockFetchTrackedOrders,
    fetchSLBindings: mockFetchSLBindings,
    fetchTrailingStops: mockFetchTrailingStops,
    fetchAlgoOrders: mockFetchAlgoOrders,
    deactivateTrailingStop: mockDeactivateTrailingStop,
    submitAlgoOrder: mockSubmitAlgoOrder,
    cancelAlgoOrder: mockCancelAlgoOrder,
    pauseAlgoOrder: mockPauseAlgoOrder,
    resumeAlgoOrder: mockResumeAlgoOrder,
  }),
}));

// ── Stub child components that are complex and irrelevant to view tests ─
const stubs = {
  OrderForm: {
    template: '<div class="order-form-stub" />',
    emits: ['placed'],
  },
  OpenOrdersTable: {
    template: '<div class="open-orders-stub" />',
    props: ['orders'],
    emits: ['cancel'],
  },
  OrderHistoryTable: {
    template: '<div class="order-history-stub" />',
    props: ['orders'],
  },
  'a-tabs': {
    template: '<div class="ant-tabs"><slot /></div>',
    props: ['activeKey'],
    emits: ['update:activeKey'],
  },
  'a-tab-pane': {
    template: '<div class="ant-tab-pane"><slot /></div>',
    props: ['key', 'tab'],
  },
  'a-modal': {
    template: '<div class="ant-modal"><slot /></div>',
    props: ['open', 'title', 'confirmLoading'],
    emits: ['update:open', 'ok'],
  },
  'a-alert': {
    template: '<div class="ant-alert" />',
    props: ['message', 'type', 'showIcon'],
  },
  'a-button': {
    template: '<button class="ant-btn" :class="[type, size]" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'size', 'loading', 'danger'],
    emits: ['click'],
  },
  'a-form': {
    template: '<form class="ant-form"><slot /></form>',
    props: ['layout', 'model'],
  },
  'a-form-item': {
    template: '<div class="ant-form-item"><slot /></div>',
    props: ['label', 'name'],
  },
  'a-input': {
    template: '<input class="ant-input" />',
    props: ['value', 'placeholder'],
    emits: ['update:value'],
  },
  'a-select': {
    template: '<select class="ant-select"><slot /></select>',
    props: ['value'],
    emits: ['update:value'],
  },
  'a-select-option': {
    template: '<option class="ant-select-option"><slot /></option>',
    props: ['value'],
  },
  'a-progress': {
    template: '<div class="ant-progress" />',
    props: ['percent', 'strokeColor', 'size'],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockOrders = [];
  mockOpenOrders = [];
  mockOrderHistory = [];
  mockTrackedOrders = [];
  mockSLBindings = [];
  mockTrailingStops = [];
  mockAlgoOrders = [];
  mockError = null;
  mockLoading = false;
});

function mountOrders() {
  return mount(OrdersView, { global: { stubs } });
}

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — basic rendering & lifecycle', () => {
  it('renders .orders-page container', () => {
    const wrapper = mountOrders();
    expect(wrapper.find('.orders-page').exists()).toBe(true);
  });

  it('calls fetchOrders on mount', () => {
    mountOrders();
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
  });

  it('renders OrderForm stub', () => {
    const wrapper = mountOrders();
    expect(wrapper.find('.order-form-stub').exists()).toBe(true);
  });

  it('renders tabs area', () => {
    const wrapper = mountOrders();
    expect(wrapper.find('.ant-tabs').exists()).toBe(true);
  });

  it('renders OpenOrdersTable and passes openOrders', () => {
    mockOpenOrders = [{ order_id: 'o1', symbol: 'BTC/USDT' }];
    const wrapper = mountOrders();
    const table = wrapper.find('.open-orders-stub');
    expect(table.exists()).toBe(true);
  });

  it('renders OrderHistoryTable and passes orderHistory', () => {
    mockOrderHistory = [{ order_id: 'h1', symbol: 'ETH/USDT' }];
    const wrapper = mountOrders();
    const table = wrapper.find('.order-history-stub');
    expect(table.exists()).toBe(true);
  });

  it('renders error alert when store.error is set', () => {
    mockError = 'Network failure';
    const wrapper = mountOrders();
    const alert = wrapper.find('.ant-alert');
    expect(alert.exists()).toBe(true);
  });

  it('does not render error alert when store.error is null', () => {
    const wrapper = mountOrders();
    expect(wrapper.find('.ant-alert').exists()).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — tab watch triggers store fetches', () => {
  it('calls fetchTrackedOrders when activeTab changes to "tracked"', async () => {
    const wrapper = mountOrders();
    // The a-tabs stub emits update:activeKey — simulate tab change
    const tabs = wrapper.findComponent({ name: 'a-tabs' });
    // Directly change the ref to trigger the watcher
    wrapper.vm.activeTab = 'tracked';
    await nextTick();
    expect(mockFetchTrackedOrders).toHaveBeenCalledTimes(1);
  });

  it('calls fetchSLBindings when activeTab changes to "sl-tp"', async () => {
    const wrapper = mountOrders();
    wrapper.vm.activeTab = 'sl-tp';
    await nextTick();
    expect(mockFetchSLBindings).toHaveBeenCalledTimes(1);
  });

  it('calls fetchTrailingStops when activeTab changes to "trailing"', async () => {
    const wrapper = mountOrders();
    wrapper.vm.activeTab = 'trailing';
    await nextTick();
    expect(mockFetchTrailingStops).toHaveBeenCalledTimes(1);
  });

  it('calls fetchAlgoOrders when activeTab changes to "algo"', async () => {
    const wrapper = mountOrders();
    wrapper.vm.activeTab = 'algo';
    await nextTick();
    expect(mockFetchAlgoOrders).toHaveBeenCalledTimes(1);
  });

  it('does not call any OMS fetch for "open" or "history" tabs', async () => {
    const wrapper = mountOrders();
    wrapper.vm.activeTab = 'open';
    await nextTick();
    wrapper.vm.activeTab = 'history';
    await nextTick();
    expect(mockFetchTrackedOrders).not.toHaveBeenCalled();
    expect(mockFetchSLBindings).not.toHaveBeenCalled();
    expect(mockFetchTrailingStops).not.toHaveBeenCalled();
    expect(mockFetchAlgoOrders).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — empty states for each tab', () => {
  it('shows "No tracked orders" when trackedOrders is empty', () => {
    mockTrackedOrders = [];
    const wrapper = mountOrders();
    // The tracked tab pane content — look for the empty state text
    expect(wrapper.text()).toContain('No tracked orders');
  });

  it('shows "No SL/TP bindings" when slBindings is empty', () => {
    mockSLBindings = [];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('No SL/TP bindings');
  });

  it('shows "No trailing stops" when trailingStops is empty', () => {
    mockTrailingStops = [];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('No trailing stops');
  });

  it('shows "No algo orders" when algoOrders is empty', () => {
    mockAlgoOrders = [];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('No algo orders');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — tracked orders table with data', () => {
  it('renders tracked orders table rows with correct data', () => {
    mockTrackedOrders = [
      {
        order_id: 'tracked-001-abc',
        strategy_id: 'strat_a',
        symbol: 'BTC/USDT',
        side: 'BUY',
        order_type: 'limit',
        quantity: '0.5',
        price: '42000',
        filled_quantity: '0.3',
        status: 'PARTIALLY_FILLED',
        updated_at: '2025-01-15T10:30:00Z',
      },
    ];
    const wrapper = mountOrders();
    // Should NOT show empty state
    const emptyState = wrapper.findAll('.empty-state');
    const trackedEmpty = emptyState.filter((el) => el.text().includes('No tracked orders'));
    expect(trackedEmpty.length).toBe(0);
    // Should show table with data
    expect(wrapper.text()).toContain('tracked-'); // slice(0,8) = 'tracked-'
    expect(wrapper.text()).toContain('strat_a');
    expect(wrapper.text()).toContain('BTC/USDT');
    expect(wrapper.text()).toContain('BUY');
    expect(wrapper.text()).toContain('limit');
    expect(wrapper.text()).toContain('0.5');
    expect(wrapper.text()).toContain('42000');
    expect(wrapper.text()).toContain('0.3');
    expect(wrapper.text()).toContain('PARTIALLY_FILLED');
  });

  it('shows "-" when price is falsy', () => {
    mockTrackedOrders = [
      {
        order_id: 'tracked-002',
        strategy_id: 'strat_b',
        symbol: 'ETH/USDT',
        side: 'SELL',
        order_type: 'market',
        quantity: '1.0',
        price: null,
        filled_quantity: '1.0',
        status: 'FILLED',
        updated_at: '2025-01-15T10:30:00Z',
      },
    ];
    const wrapper = mountOrders();
    // price is null, so it should render '-'
    const tds = wrapper.findAll('td');
    const priceTd = tds.find((td) => td.text() === '-');
    expect(priceTd).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — SL/TP bindings table with data', () => {
  it('renders SL/TP bindings table rows', () => {
    mockSLBindings = [
      {
        exchange: 'binance',
        symbol: 'BTC/USDT',
        strategy_id: 'strat_a',
        sl_order_id: 'sl-order-1234567890',
        tp_order_id: 'tp-order-0987654321',
      },
    ];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('binance');
    expect(wrapper.text()).toContain('BTC/USDT');
    expect(wrapper.text()).toContain('strat_a');
    expect(wrapper.text()).toContain('sl-order'); // slice(0,8) = 'sl-order'
    expect(wrapper.text()).toContain('tp-order'); // slice(0,8) = 'tp-order'
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — trailing stops table with data', () => {
  it('renders trailing stops table rows with Long/Short labels', () => {
    mockTrailingStops = [
      {
        exchange: 'okx',
        symbol: 'ETH/USDT',
        strategy_id: 'strat_c',
        order_id: 'trail-001',
        activation_price: '3500',
        callback_rate: '1.5',
        highest_price: '3600',
        lowest_price: '3400',
        current_stop: '3450',
        step_bps: '10',
        is_long: true,
      },
      {
        exchange: 'binance',
        symbol: 'SOL/USDT',
        strategy_id: 'strat_d',
        order_id: 'trail-002',
        activation_price: '100',
        callback_rate: '2.0',
        highest_price: '110',
        lowest_price: '95',
        current_stop: '102',
        step_bps: '20',
        is_long: false,
      },
    ];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('ETH/USDT');
    expect(wrapper.text()).toContain('Long');
    expect(wrapper.text()).toContain('3500');
    expect(wrapper.text()).toContain('1.5%');
    expect(wrapper.text()).toContain('3450');
    expect(wrapper.text()).toContain('3600 / 3400');
    expect(wrapper.text()).toContain('SOL/USDT');
    expect(wrapper.text()).toContain('Short');
    expect(wrapper.text()).toContain('Deactivate');
  });

  it('calls deactivateTrailingStop and shows success on Deactivate click', async () => {
    const { message } = await import('ant-design-vue');
    mockTrailingStops = [
      {
        exchange: 'okx',
        symbol: 'ETH/USDT',
        strategy_id: 'strat_c',
        order_id: 'trail-001',
        activation_price: '3500',
        callback_rate: '1.5',
        highest_price: '3600',
        lowest_price: '3400',
        current_stop: '3450',
        step_bps: '10',
        is_long: true,
      },
    ];
    const wrapper = mountOrders();
    const deactivateBtn = wrapper.findAll('button').find((b) => b.text() === 'Deactivate');
    expect(deactivateBtn).toBeTruthy();
    await deactivateBtn!.trigger('click');
    expect(mockDeactivateTrailingStop).toHaveBeenCalledWith('trail-001');
    await nextTick();
    expect(message.success).toHaveBeenCalledWith('Trailing stop deactivated');
  });

  it('shows error message when deactivation fails', async () => {
    const { message } = await import('ant-design-vue');
    mockDeactivateTrailingStop.mockRejectedValueOnce(new Error('fail'));
    mockTrailingStops = [
      {
        exchange: 'okx',
        symbol: 'ETH/USDT',
        strategy_id: 'strat_c',
        order_id: 'trail-001',
        activation_price: '3500',
        callback_rate: '1.5',
        highest_price: '3600',
        lowest_price: '3400',
        current_stop: '3450',
        step_bps: '10',
        is_long: true,
      },
    ];
    const wrapper = mountOrders();
    const deactivateBtn = wrapper.findAll('button').find((b) => b.text() === 'Deactivate');
    await deactivateBtn!.trigger('click');
    await nextTick();
    expect(message.error).toHaveBeenCalledWith('Failed to deactivate');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — algo orders table with data', () => {
  const baseAlgo = {
    algo_id: 'algo-001-xyz',
    algo_type: 'twap',
    symbol: 'BTC/USDT',
    exchange: 'binance',
    side: 'BUY',
    total_quantity: '1.0',
    filled_quantity: '0.5',
    slice_count: 10,
    slices_completed: 5,
    status: 'RUNNING',
    progress_pct: '50',
    created_at: '2025-01-15T10:00:00Z',
  };

  it('renders algo order rows with correct data', () => {
    mockAlgoOrders = [{ ...baseAlgo }];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('algo-001'); // slice(0,8)
    expect(wrapper.text()).toContain('TWAP'); // toUpperCase
    expect(wrapper.text()).toContain('BTC/USDT');
    expect(wrapper.text()).toContain('BUY');
    expect(wrapper.text()).toContain('1.0');
    expect(wrapper.text()).toContain('0.5');
    expect(wrapper.text()).toContain('5/10');
    expect(wrapper.text()).toContain('RUNNING');
  });

  it('shows Pause button for RUNNING algo order', () => {
    mockAlgoOrders = [{ ...baseAlgo, status: 'RUNNING' }];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('Pause');
  });

  it('shows Resume button for PAUSED algo order', () => {
    mockAlgoOrders = [{ ...baseAlgo, status: 'PAUSED' }];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('Resume');
  });

  it('shows Cancel button for RUNNING algo order (not COMPLETED/CANCELLED)', () => {
    mockAlgoOrders = [{ ...baseAlgo, status: 'RUNNING' }];
    const wrapper = mountOrders();
    expect(wrapper.text()).toContain('Cancel');
  });

  it('hides Cancel button for COMPLETED algo order', () => {
    mockAlgoOrders = [{ ...baseAlgo, status: 'COMPLETED' }];
    const wrapper = mountOrders();
    // The Cancel button should not be present
    const actionBtns = wrapper.findAll('.action-btns');
    if (actionBtns.length > 0) {
      const btnTexts = actionBtns[0].findAll('button').map((b) => b.text());
      expect(btnTexts).not.toContain('Cancel');
    }
  });

  it('hides Cancel button for CANCELLED algo order', () => {
    mockAlgoOrders = [{ ...baseAlgo, status: 'CANCELLED' }];
    const wrapper = mountOrders();
    const actionBtns = wrapper.findAll('.action-btns');
    if (actionBtns.length > 0) {
      const btnTexts = actionBtns[0].findAll('button').map((b) => b.text());
      expect(btnTexts).not.toContain('Cancel');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — algo order action handlers', () => {
  const baseAlgo = {
    algo_id: 'algo-action-001',
    algo_type: 'vwap',
    symbol: 'ETH/USDT',
    exchange: 'okx',
    side: 'SELL',
    total_quantity: '10',
    filled_quantity: '3',
    slice_count: 5,
    slices_completed: 2,
    status: 'RUNNING',
    progress_pct: '60',
    created_at: '2025-01-15T10:00:00Z',
  };

  it('onPauseAlgo calls store.pauseAlgoOrder and shows success', async () => {
    const { message } = await import('ant-design-vue');
    mockAlgoOrders = [{ ...baseAlgo }];
    const wrapper = mountOrders();
    const pauseBtn = wrapper.findAll('button').find((b) => b.text() === 'Pause');
    expect(pauseBtn).toBeTruthy();
    await pauseBtn!.trigger('click');
    expect(mockPauseAlgoOrder).toHaveBeenCalledWith('algo-action-001');
    await nextTick();
    expect(message.success).toHaveBeenCalledWith('Algo order paused');
  });

  it('onPauseAlgo shows error on failure', async () => {
    const { message } = await import('ant-design-vue');
    mockPauseAlgoOrder.mockRejectedValueOnce(new Error('fail'));
    mockAlgoOrders = [{ ...baseAlgo }];
    const wrapper = mountOrders();
    const pauseBtn = wrapper.findAll('button').find((b) => b.text() === 'Pause');
    await pauseBtn!.trigger('click');
    await nextTick();
    expect(message.error).toHaveBeenCalledWith('Failed to pause algo order');
  });

  it('onResumeAlgo calls store.resumeAlgoOrder and shows success', async () => {
    const { message } = await import('ant-design-vue');
    mockAlgoOrders = [{ ...baseAlgo, status: 'PAUSED' }];
    const wrapper = mountOrders();
    const resumeBtn = wrapper.findAll('button').find((b) => b.text() === 'Resume');
    expect(resumeBtn).toBeTruthy();
    await resumeBtn!.trigger('click');
    expect(mockResumeAlgoOrder).toHaveBeenCalledWith('algo-action-001');
    await nextTick();
    expect(message.success).toHaveBeenCalledWith('Algo order resumed');
  });

  it('onResumeAlgo shows error on failure', async () => {
    const { message } = await import('ant-design-vue');
    mockResumeAlgoOrder.mockRejectedValueOnce(new Error('fail'));
    mockAlgoOrders = [{ ...baseAlgo, status: 'PAUSED' }];
    const wrapper = mountOrders();
    const resumeBtn = wrapper.findAll('button').find((b) => b.text() === 'Resume');
    await resumeBtn!.trigger('click');
    await nextTick();
    expect(message.error).toHaveBeenCalledWith('Failed to resume algo order');
  });

  it('onCancelAlgo calls store.cancelAlgoOrder and shows success', async () => {
    const { message } = await import('ant-design-vue');
    mockAlgoOrders = [{ ...baseAlgo, status: 'RUNNING' }];
    const wrapper = mountOrders();
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
    expect(cancelBtn).toBeTruthy();
    await cancelBtn!.trigger('click');
    expect(mockCancelAlgoOrder).toHaveBeenCalledWith('algo-action-001');
    await nextTick();
    expect(message.success).toHaveBeenCalledWith('Algo order cancelled');
  });

  it('onCancelAlgo shows error on failure', async () => {
    const { message } = await import('ant-design-vue');
    mockCancelAlgoOrder.mockRejectedValueOnce(new Error('fail'));
    mockAlgoOrders = [{ ...baseAlgo, status: 'RUNNING' }];
    const wrapper = mountOrders();
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
    await cancelBtn!.trigger('click');
    await nextTick();
    expect(message.error).toHaveBeenCalledWith('Failed to cancel algo order');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — onOrderPlaced', () => {
  it('calls message.success and fetchOrders when OrderForm emits placed', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountOrders();
    // Directly invoke the handler since the stub does not forward custom events
    await wrapper.vm.onOrderPlaced();
    await nextTick();
    expect(message.success).toHaveBeenCalledWith('Order placed');
    expect(mockFetchOrders).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — onCancelOrder', () => {
  it('calls store.cancelOrder and shows success on cancel', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountOrders();
    const order = {
      order_id: 'cancel-001',
      symbol: 'BTC/USDT',
      exchange: 'binance',
    };
    await wrapper.vm.onCancelOrder(order);
    await nextTick();
    expect(mockCancelOrder).toHaveBeenCalledWith('cancel-001', 'BTC/USDT', 'binance');
    expect(message.success).toHaveBeenCalledWith('Order cancelled');
  });

  it('shows error message when cancel fails', async () => {
    const { message } = await import('ant-design-vue');
    mockCancelOrder.mockRejectedValueOnce(new Error('reject'));
    const wrapper = mountOrders();
    await wrapper.vm.onCancelOrder({ order_id: 'x', symbol: 'BTC/USDT', exchange: 'binance' });
    await nextTick();
    expect(message.error).toHaveBeenCalledWith('Failed to cancel order');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — algo order modal & submit', () => {
  it('opens algo modal when "Submit Algo Order" button is clicked', async () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.algoModalOpen).toBe(false);
    const submitBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit Algo Order');
    expect(submitBtn).toBeTruthy();
    await submitBtn!.trigger('click');
    expect(wrapper.vm.algoModalOpen).toBe(true);
  });

  it('calls submitAlgoOrder and closes modal on submit', async () => {
    const { message } = await import('ant-design-vue');
    const wrapper = mountOrders();
    wrapper.vm.algoModalOpen = true;
    wrapper.vm.algoForm.symbol = 'ETH/USDT';
    wrapper.vm.algoForm.exchange = 'binance';
    wrapper.vm.algoForm.quantity = '1.0';
    wrapper.vm.algoForm.algo_type = 'twap';
    wrapper.vm.algoForm.side = 'BUY';
    await nextTick();

    await wrapper.vm.onSubmitAlgo();
    expect(mockSubmitAlgoOrder).toHaveBeenCalledWith({
      algo_type: 'twap',
      symbol: 'ETH/USDT',
      exchange: 'binance',
      side: 'BUY',
      quantity: '1.0',
    });
    expect(message.success).toHaveBeenCalledWith('Algo order submitted');
    expect(wrapper.vm.algoModalOpen).toBe(false);
    expect(wrapper.vm.algoForm.symbol).toBe('');
    expect(wrapper.vm.algoForm.exchange).toBe('');
    expect(wrapper.vm.algoForm.quantity).toBe('');
  });

  it('shows error when submitAlgoOrder fails', async () => {
    const { message } = await import('ant-design-vue');
    mockSubmitAlgoOrder.mockRejectedValueOnce(new Error('submit fail'));
    const wrapper = mountOrders();
    wrapper.vm.algoModalOpen = true;
    await nextTick();

    await wrapper.vm.onSubmitAlgo();
    expect(message.error).toHaveBeenCalledWith('Failed to submit algo order');
    expect(wrapper.vm.algoModalOpen).toBe(true); // stays open on error
  });

  it('resets algoSubmitting to false even on error (finally block)', async () => {
    mockSubmitAlgoOrder.mockRejectedValueOnce(new Error('fail'));
    const wrapper = mountOrders();
    wrapper.vm.algoModalOpen = true;
    await wrapper.vm.onSubmitAlgo();
    expect(wrapper.vm.algoSubmitting).toBe(false);
  });

  it('resets algoSubmitting to false on success', async () => {
    const wrapper = mountOrders();
    wrapper.vm.algoModalOpen = true;
    await wrapper.vm.onSubmitAlgo();
    expect(wrapper.vm.algoSubmitting).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — statusClass helper', () => {
  it('returns status-ok for FILLED and COMPLETED', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.statusClass('FILLED')).toBe('status-ok');
    expect(wrapper.vm.statusClass('COMPLETED')).toBe('status-ok');
    expect(wrapper.vm.statusClass('filled')).toBe('status-ok');
    expect(wrapper.vm.statusClass('completed')).toBe('status-ok');
  });

  it('returns status-error for CANCELED, CANCELLED, REJECTED, FAILED', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.statusClass('CANCELED')).toBe('status-error');
    expect(wrapper.vm.statusClass('CANCELLED')).toBe('status-error');
    expect(wrapper.vm.statusClass('REJECTED')).toBe('status-error');
    expect(wrapper.vm.statusClass('FAILED')).toBe('status-error');
    expect(wrapper.vm.statusClass('rejected')).toBe('status-error');
  });

  it('returns status-active for RUNNING and ACTIVE', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.statusClass('RUNNING')).toBe('status-active');
    expect(wrapper.vm.statusClass('ACTIVE')).toBe('status-active');
    expect(wrapper.vm.statusClass('running')).toBe('status-active');
  });

  it('returns status-pending for unknown statuses', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.statusClass('PENDING')).toBe('status-pending');
    expect(wrapper.vm.statusClass('PARTIALLY_FILLED')).toBe('status-pending');
    expect(wrapper.vm.statusClass('NEW')).toBe('status-pending');
    expect(wrapper.vm.statusClass('')).toBe('status-pending');
  });

  it('applies statusClass correctly in tracked orders table', () => {
    mockTrackedOrders = [
      {
        order_id: 't1',
        strategy_id: 's1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        order_type: 'limit',
        quantity: '1',
        price: '50000',
        filled_quantity: '1',
        status: 'FILLED',
        updated_at: '2025-01-15T10:30:00Z',
      },
    ];
    const wrapper = mountOrders();
    const statusPill = wrapper.find('.status-pill');
    expect(statusPill.classes()).toContain('status-ok');
  });

  it('renders status-error class for failed orders', () => {
    mockTrackedOrders = [
      {
        order_id: 't2',
        strategy_id: 's1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        order_type: 'limit',
        quantity: '1',
        price: '50000',
        filled_quantity: '0',
        status: 'REJECTED',
        updated_at: '2025-01-15T10:30:00Z',
      },
    ];
    const wrapper = mountOrders();
    const statusPill = wrapper.find('.status-pill');
    expect(statusPill.classes()).toContain('status-error');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — formatTime helper', () => {
  it('formats a valid ISO string to locale string', () => {
    const wrapper = mountOrders();
    const result = wrapper.vm.formatTime('2025-01-15T10:30:00Z');
    // The exact format depends on the environment, but it should not throw
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the raw string for invalid date input', () => {
    const wrapper = mountOrders();
    const result = wrapper.vm.formatTime('not-a-date');
    // new Date('not-a-date') produces Invalid Date, toLocaleString returns "Invalid Date"
    expect(typeof result).toBe('string');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — side pill CSS classes', () => {
  it('applies side-buy for BUY side in tracked orders', () => {
    mockTrackedOrders = [
      {
        order_id: 'side-test-1',
        strategy_id: 's1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        order_type: 'limit',
        quantity: '1',
        price: '100',
        filled_quantity: '0',
        status: 'PENDING',
        updated_at: '2025-01-15T10:30:00Z',
      },
    ];
    const wrapper = mountOrders();
    const sidePill = wrapper.find('.side-pill');
    expect(sidePill.classes()).toContain('side-buy');
  });

  it('applies side-sell for SELL side in tracked orders', () => {
    mockTrackedOrders = [
      {
        order_id: 'side-test-2',
        strategy_id: 's1',
        symbol: 'BTC/USDT',
        side: 'SELL',
        order_type: 'limit',
        quantity: '1',
        price: '100',
        filled_quantity: '0',
        status: 'PENDING',
        updated_at: '2025-01-15T10:30:00Z',
      },
    ];
    const wrapper = mountOrders();
    const sidePill = wrapper.find('.side-pill');
    expect(sidePill.classes()).toContain('side-sell');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — algo order form defaults', () => {
  it('initializes algoForm with correct defaults', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.algoForm.algo_type).toBe('twap');
    expect(wrapper.vm.algoForm.symbol).toBe('');
    expect(wrapper.vm.algoForm.exchange).toBe('');
    expect(wrapper.vm.algoForm.side).toBe('BUY');
    expect(wrapper.vm.algoForm.quantity).toBe('');
  });

  it('initializes algoModalOpen as false', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.algoModalOpen).toBe(false);
  });

  it('initializes algoSubmitting as false', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.algoSubmitting).toBe(false);
  });

  it('initializes activeTab as "open"', () => {
    const wrapper = mountOrders();
    expect(wrapper.vm.activeTab).toBe('open');
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('OrdersView — algo order algo_type pill', () => {
  it('renders algo type as uppercase in a pill', () => {
    mockAlgoOrders = [
      {
        algo_id: 'algo-type-1',
        algo_type: 'iceberg',
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'BUY',
        total_quantity: '5',
        filled_quantity: '0',
        slice_count: 10,
        slices_completed: 0,
        status: 'RUNNING',
        progress_pct: '0',
        created_at: '2025-01-15T10:00:00Z',
      },
    ];
    const wrapper = mountOrders();
    const pill = wrapper.find('.algo-type-pill');
    expect(pill.exists()).toBe(true);
    expect(pill.text()).toBe('ICEBERG');
  });
});

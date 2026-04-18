import { beforeEach, describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import OrderForm from '@/components/orders/OrderForm.vue';

const antStubs = {
  'a-form': {
    template: '<form @submit.prevent="$emit(\'finish\')"><slot /></form>',
  },
  'a-form-item': {
    template: '<div class="ant-form-item"><span class="form-label">{{ label }}</span><slot /></div>',
    props: ['label', 'name', 'rules'],
  },
  'a-input': {
    template: '<input class="ant-input" />',
    props: ['value', 'placeholder'],
  },
  'a-input-group': {
    template: '<div class="ant-input-group"><slot /></div>',
  },
  'a-input-number': {
    template: '<input class="ant-input-number" type="number" />',
    props: ['value', 'min', 'step'],
  },
  'a-select': {
    template: '<select class="ant-select"><slot /></select>',
  },
  'a-select-option': {
    template: '<option><slot /></option>',
    props: ['value'],
  },
  'a-button': {
    template: '<button class="ant-btn" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'loading', 'htmlType'],
  },
  'a-alert': {
    template: '<div class="ant-alert">{{ message }}<slot /></div>',
    props: ['message', 'type'],
  },
};

function mountComponent() {
  return mount(OrderForm, {
    global: { stubs: antStubs },
  });
}

describe('OrderForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('renders Place Order title', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Place Order');
  });

  it('renders Symbol field', () => {
    const wrapper = mountComponent();
    const labels = wrapper.findAll('.ant-form-item');
    const symbolLabel = labels.find((el) => el.text().includes('Symbol'));
    expect(symbolLabel).toBeTruthy();
  });

  it('renders Side field with BUY and SELL buttons', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('BUY');
    expect(wrapper.text()).toContain('SELL');
  });

  it('renders Type field with MARKET and LIMIT options', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('MARKET');
    expect(wrapper.text()).toContain('LIMIT');
  });

  it('renders Quantity field', () => {
    const wrapper = mountComponent();
    const labels = wrapper.findAll('.ant-form-item');
    const quantityLabel = labels.find((el) => el.text().includes('Quantity'));
    expect(quantityLabel).toBeTruthy();
  });

  it('renders Submit button', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Submit');
  });

  it('renders form fields for Symbol, Side, Type, Quantity', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Symbol');
    expect(wrapper.text()).toContain('Side');
    expect(wrapper.text()).toContain('Type');
    expect(wrapper.text()).toContain('Quantity');
  });

  it('does not show error alert initially', () => {
    const wrapper = mountComponent();
    expect(wrapper.findAll('.ant-alert')).toHaveLength(0);
  });

  it('emits placed event on successful form submission', async () => {
    setActivePinia(createPinia());

    // Mock the orders store's placeOrder to resolve successfully
    const { useOrdersStore } = await import('@/stores/orders');
    const store = useOrdersStore();
    vi.spyOn(store, 'placeOrder').mockResolvedValue({
      order_id: 'test-123',
      symbol: 'BTC/USDT',
      exchange: 'binance',
      side: 'BUY',
      status: 'NEW',
      order_type: 'MARKET',
      quantity: '0.1',
    });

    const wrapper = mount(OrderForm, {
      global: { stubs: antStubs },
    });

    // Trigger form finish (submit)
    const form = wrapper.find('form');
    await form.trigger('submit');

    // Wait for async handler to complete
    await vi.waitFor(() => {
      expect(wrapper.emitted('placed')).toBeTruthy();
    });

    expect(store.placeOrder).toHaveBeenCalled();
  });

  it('shows error alert when order placement fails', async () => {
    const { useOrdersStore } = await import('@/stores/orders');
    const store = useOrdersStore();
    vi.spyOn(store, 'placeOrder').mockRejectedValue(new Error('Insufficient balance'));

    const wrapper = mount(OrderForm, {
      global: { stubs: antStubs },
    });

    const form = wrapper.find('form');
    await form.trigger('submit');

    // Wait for the async handleSubmit to complete and re-render
    await vi.waitFor(() => {
      expect(wrapper.get('.ant-alert').text()).toContain('Insufficient balance');
    }, { timeout: 3000 });

    expect(store.placeOrder).toHaveBeenCalled();
  });
});

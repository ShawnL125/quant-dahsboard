import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LoginView from '@/views/LoginView.vue';

const mockPush = vi.fn();
let mockLogin: ReturnType<typeof vi.fn>;
let mockError: string | null = null;

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    loading: false,
    get error() { return mockError; },
    login: mockLogin,
  }),
}));

const stubs = {
  'a-form': {
    template: '<form class="a-form-stub" @submit.prevent="$emit(\'finish\')"><slot /></form>',
    emits: ['finish'],
  },
  'a-form-item': { template: '<div class="a-form-item-stub"><slot /></div>' },
  'a-input': { template: '<input class="a-input-stub" />' },
  'a-input-password': { template: '<input class="a-input-password-stub" type="password" />' },
  'a-button': {
    template: '<button class="a-button-stub" type="submit"><slot /></button>',
  },
  'a-alert': {
    props: ['message'],
    template: '<div class="a-alert-stub">{{ message }}</div>',
  },
};

beforeEach(() => {
  mockLogin = vi.fn().mockResolvedValue(undefined);
  mockPush.mockClear();
  mockError = null;
});

function mountView() {
  setActivePinia(createPinia());
  return mount(LoginView, { global: { stubs } });
}

describe('LoginView', () => {
  it('renders .login-page container', () => {
    const wrapper = mountView();
    expect(wrapper.find('.login-page').exists()).toBe(true);
  });

  it('renders form inputs and submit button', () => {
    const wrapper = mountView();
    expect(wrapper.find('.a-input-stub').exists()).toBe(true);
    expect(wrapper.find('.a-input-password-stub').exists()).toBe(true);
    expect(wrapper.find('.a-button-stub').exists()).toBe(true);
    expect(wrapper.find('.a-button-stub').text()).toContain('Sign In');
  });

  it('calls authStore.login on form submit', async () => {
    const wrapper = mountView();
    const form = wrapper.find('.a-form-stub');
    await form.trigger('submit');
    expect(mockLogin).toHaveBeenCalled();
  });

  it('navigates to / on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    const wrapper = mountView();
    const form = wrapper.find('.a-form-stub');
    await form.trigger('submit');
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error alert when authStore.error is set', async () => {
    mockError = 'Invalid credentials';
    const wrapper = mountView();
    const alert = wrapper.find('.a-alert-stub');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Invalid credentials');
  });
});

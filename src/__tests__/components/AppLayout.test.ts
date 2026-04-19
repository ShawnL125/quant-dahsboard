import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'Dashboard', path: '/' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@ant-design/icons-vue', () => ({
  SearchOutlined: { template: '<span class="icon-search" />' },
  BellOutlined: { template: '<span class="icon-bell" />' },
  UserOutlined: { template: '<span class="icon-user" />' },
  LogoutOutlined: { template: '<span class="icon-logout" />' },
}));

import AppLayout from '@/components/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';

const antStubs = {
  'a-input': { template: '<div class="ant-input"><slot name="prefix" /></div>' },
  'a-badge': { template: '<span class="ant-badge"><slot /></span>' },
  'a-tag': {
    props: ['color'],
    template: '<span class="ant-tag" :data-color="color"><slot /></span>',
  },
  'a-button': {
    props: ['type', 'size'],
    template: '<button class="ant-button" @click="$emit(\'click\')"><slot /></button>',
  },
  'router-view': { template: '<div class="router-view" />' },
  SideMenu: { template: '<nav class="side-menu" />' },
};

function mountComponent(tradingMode = 'paper', isAuthenticated = true) {
  localStorage.clear();
  if (isAuthenticated) {
    localStorage.setItem('access_token', 'fake-token');
  }
  setActivePinia(createPinia());

  const authStore = useAuthStore();
  if (isAuthenticated) {
    authStore.$patch({ user: { username: 'admin', role: 'admin' } as any });
  }

  return mount(AppLayout, {
    global: {
      stubs: antStubs,
      provide: {
        tradingMode: ref(tradingMode),
      },
    },
  });
}

describe('AppLayout', () => {
  it('renders app-shell container', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.app-shell').exists()).toBe(true);
  });

  it('renders sidebar with SideMenu', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.app-sidebar').exists()).toBe(true);
    expect(wrapper.find('.side-menu').exists()).toBe(true);
  });

  it('renders header with title from route', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.header-title').text()).toBe('Dashboard');
  });

  it('shows subtitle from pageTitle map', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.header-subtitle').text()).toBe('Overview of key metrics');
  });

  it('shows PAPER tag when tradingMode is paper', () => {
    const wrapper = mountComponent('paper');
    const tags = wrapper.findAll('.ant-tag');
    const paperTag = tags.find(t => t.text() === 'PAPER');
    expect(paperTag).toBeDefined();
    expect(paperTag!.attributes('data-color')).toBe('orange');
  });

  it('shows LIVE tag when tradingMode is live', () => {
    const wrapper = mountComponent('live');
    const tags = wrapper.findAll('.ant-tag');
    const liveTag = tags.find(t => t.text() === 'LIVE');
    expect(liveTag).toBeDefined();
    expect(liveTag!.attributes('data-color')).toBe('red');
  });

  it('shows TESTNET tag when tradingMode is testnet', () => {
    const wrapper = mountComponent('testnet');
    const tags = wrapper.findAll('.ant-tag');
    const testnetTag = tags.find(t => t.text() === 'TESTNET');
    expect(testnetTag).toBeDefined();
    expect(testnetTag!.attributes('data-color')).toBe('blue');
  });

  it('shows user info when authenticated', () => {
    const wrapper = mountComponent('paper', true);
    expect(wrapper.find('.header-user').exists()).toBe(true);
    expect(wrapper.find('.user-name').text()).toBe('admin');
  });

  it('hides user info when not authenticated', () => {
    const wrapper = mountComponent('paper', false);
    expect(wrapper.find('.header-user').exists()).toBe(false);
  });

  it('renders router-view in main content', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.router-view').exists()).toBe(true);
  });

  it('renders search input', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.ant-input').exists()).toBe(true);
  });
});

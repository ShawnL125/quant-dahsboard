import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, type Ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import SideMenu from '@/components/layout/SideMenu.vue';
import { useAuthStore } from '@/stores/auth';

// Stub all @ant-design/icons-vue components
const iconStubs = {
  DashboardOutlined: { template: '<span class="icon">dashboard</span>' },
  SwapOutlined: { template: '<span class="icon">swap</span>' },
  ThunderboltOutlined: { template: '<span class="icon">thunderbolt</span>' },
  LineChartOutlined: { template: '<span class="icon">linechart</span>' },
  SettingOutlined: { template: '<span class="icon">setting</span>' },
  PieChartOutlined: { template: '<span class="icon">piechart</span>' },
  SafetyOutlined: { template: '<span class="icon">safety</span>' },
  ExperimentOutlined: { template: '<span class="icon">experiment</span>' },
  RadarChartOutlined: { template: '<span class="icon">radar</span>' },
  BarChartOutlined: { template: '<span class="icon">bar</span>' },
  WalletOutlined: { template: '<span class="icon">wallet</span>' },
  BankOutlined: { template: '<span class="icon">bank</span>' },
  DollarOutlined: { template: '<span class="icon">dollar</span>' },
  ThunderboltFilled: { template: '<span class="icon">thunderbolt-filled</span>' },
  EditOutlined: { template: '<span class="icon">edit</span>' },
  PlayCircleOutlined: { template: '<span class="icon">play-circle</span>' },
  AuditOutlined: { template: '<span class="icon">audit</span>' },
  AppstoreOutlined: { template: '<span class="icon">appstore</span>' },
};

function createTestRouter(initialPath: string = '/') {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/risk', component: { template: '<div>Risk</div>' } },
      { path: '/positions', component: { template: '<div>Positions</div>' } },
      { path: '/orders', component: { template: '<div>Orders</div>' } },
      { path: '/strategies', component: { template: '<div>Strategies</div>' } },
      { path: '/signals', component: { template: '<div>Signals</div>' } },
      { path: '/analytics', component: { template: '<div>Analytics</div>' } },
      { path: '/ledger', component: { template: '<div>Ledger</div>' } },
      { path: '/funding', component: { template: '<div>Funding</div>' } },
      { path: '/account', component: { template: '<div>Account</div>' } },
      { path: '/auto-tune', component: { template: '<div>Auto-Tune</div>' } },
      { path: '/backtest', component: { template: '<div>Backtest</div>' } },
      { path: '/walkforward', component: { template: '<div>Walk-Forward</div>' } },
      { path: '/journal', component: { template: '<div>Journal</div>' } },
      { path: '/replay', component: { template: '<div>Replay</div>' } },
      { path: '/governance', component: { template: '<div>Governance</div>' } },
      { path: '/features', component: { template: '<div>Features</div>' } },
      { path: '/system', component: { template: '<div>System</div>' } },
    ],
  });
}

async function mountComponent(
  wsConnected: Ref<boolean> = ref(false),
  initialPath: string = '/',
  role: 'admin' | 'user' = 'user',
) {
  const router = createTestRouter(initialPath);
  const authStore = useAuthStore();
  authStore.$patch({
    user: { username: role, role } as any,
  });
  router.push(initialPath);
  await router.isReady();

  const wrapper = mount(SideMenu, {
    global: {
      stubs: iconStubs,
      provide: {
        wsConnected,
      },
      plugins: [router],
    },
  });

  return { wrapper, router };
}

describe('SideMenu', () => {
  it('renders all navigation items for admins', async () => {
    const { wrapper } = await mountComponent(ref(false), '/', 'admin');
    const items = wrapper.findAll('.sidebar-item');
    expect(items).toHaveLength(18);
  });

  it('hides operational pages for non-admin users', async () => {
    const { wrapper } = await mountComponent();
    expect(wrapper.text()).not.toContain('Journal');
    expect(wrapper.text()).not.toContain('Replay');
    expect(wrapper.text()).not.toContain('Governance');
    expect(wrapper.text()).not.toContain('Features');
  });

  it('renders Dashboard label', async () => {
    const { wrapper } = await mountComponent();
    expect(wrapper.text()).toContain('Dashboard');
  });

  it('renders System label', async () => {
    const { wrapper } = await mountComponent();
    expect(wrapper.text()).toContain('System');
  });

  it('renders all expected navigation labels', async () => {
    const { wrapper } = await mountComponent(ref(false), '/', 'admin');
    const expectedLabels = [
      'Dashboard', 'Risk', 'Positions', 'Orders', 'Strategies',
      'Signals', 'Analytics', 'Journal', 'Ledger', 'Funding', 'Account',
      'Auto-Tune', 'Backtest', 'Replay', 'Walk-Forward', 'Governance',
      'Features', 'System',
    ];
    expectedLabels.forEach((label) => {
      expect(wrapper.text()).toContain(label);
    });
  });

  it('highlights active route', async () => {
    const { wrapper } = await mountComponent();
    const items = wrapper.findAll('.sidebar-item');
    // First item is Dashboard, path '/'
    expect(items[0].classes()).toContain('active');
  });

  it('does not highlight inactive routes', async () => {
    const { wrapper } = await mountComponent();
    const items = wrapper.findAll('.sidebar-item');
    // Second item is Risk, path '/risk' -- not active since route.path = '/'
    expect(items[1].classes()).not.toContain('active');
  });

  it('navigates when clicking a menu item', async () => {
    const { wrapper, router } = await mountComponent();
    const pushSpy = vi.spyOn(router, 'push');
    const items = wrapper.findAll('.sidebar-item');
    await items[1].trigger('click'); // Click Risk
    expect(pushSpy).toHaveBeenCalledWith('/risk');
  });

  it('shows Live when WS connected', async () => {
    const wsConnected = ref(true);
    const { wrapper } = await mountComponent(wsConnected);
    expect(wrapper.text()).toContain('Live');
    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('connected');
  });

  it('shows Offline when WS disconnected', async () => {
    const wsConnected = ref(false);
    const { wrapper } = await mountComponent(wsConnected);
    expect(wrapper.text()).toContain('Offline');
    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('disconnected');
  });

  it('renders the Quant logo', async () => {
    const { wrapper } = await mountComponent();
    expect(wrapper.text()).toContain('Q');
    expect(wrapper.text()).toContain('Quant');
  });

  it('renders sidebar footer with status', async () => {
    const { wrapper } = await mountComponent();
    expect(wrapper.get('.sidebar-footer').text()).toContain('Offline');
  });
});

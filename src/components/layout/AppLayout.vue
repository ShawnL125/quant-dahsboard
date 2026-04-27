<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <SideMenu />
    </aside>
    <div class="app-main">
      <header class="app-header">
        <div class="header-left">
          <h1 class="header-title">{{ route.name }}</h1>
          <span class="header-subtitle">{{ pageTitle[route.name as string] }}</span>
        </div>
        <div class="header-right">
          <div class="header-search">
            <a-input placeholder="Search..." allow-clear>
              <template #prefix>
                <SearchOutlined style="color: var(--q-text-muted)" />
              </template>
            </a-input>
          </div>
          <BellOutlined style="font-size: 16px; color: var(--q-text-secondary); cursor: pointer;" />
          <a-tag v-if="tradingMode === 'paper'" color="orange" style="margin: 0; font-size: 11px;">PAPER</a-tag>
          <a-tag v-else-if="tradingMode === 'testnet'" color="blue" style="margin: 0; font-size: 11px;">TESTNET</a-tag>
          <a-tag v-else-if="tradingMode === 'live'" color="red" style="margin: 0; font-size: 11px;">LIVE</a-tag>
          <div v-if="authStore.isAuthenticated" class="header-user">
            <UserOutlined style="font-size: 14px; color: var(--q-text-secondary);" />
            <span class="user-name">{{ authStore.user?.username || 'User' }}</span>
            <a-button type="text" size="small" @click="onLogout">
              <LogoutOutlined style="font-size: 14px; color: var(--q-text-muted);" />
            </a-button>
          </div>
        </div>
      </header>
      <WsDisconnectBanner />
      <main class="app-content">
        <div v-if="pageError" class="error-boundary">
          <div class="error-card">
            <div class="error-icon">!</div>
            <h3 class="error-title">Something went wrong</h3>
            <p class="error-message">{{ pageError }}</p>
            <a-button type="primary" @click="reloadPage">Reload</a-button>
          </div>
        </div>
        <router-view v-else />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onErrorCaptured, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { SearchOutlined, BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons-vue';
import SideMenu from './SideMenu.vue';
import WsDisconnectBanner from '@/components/common/WsDisconnectBanner.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const tradingMode = inject<Ref<import('@/types').TradingMode>>('tradingMode', { value: 'live' } as Ref<import('@/types').TradingMode>);

const pageError = ref<string | null>(null);

onErrorCaptured((err) => {
  pageError.value = err instanceof Error ? err.message : String(err);
  return false;
});

function reloadPage() {
  pageError.value = null;
}

function onLogout() {
  authStore.logout();
  router.push('/login');
}

const pageTitle: Record<string, string> = {
  Dashboard: 'Overview of key metrics',
  Risk: 'Real-time risk monitoring and control',
  Positions: 'Open positions and P&L',
  Orders: 'Place and manage orders',
  Strategies: 'Manage trading strategies',
  Signals: 'Live strategy signal feed',
  Analytics: 'Strategy performance and trade analytics',
  Ledger: 'Account balances and ledger entries',
  Funding: 'Current and historical funding rates',
  Account: 'Exchange account sync, snapshots, and margin',
  'Auto-Tune': 'Automated strategy parameter optimization',
  Backtest: 'Run and review backtests',
  'Walk-Forward': 'Walk-Forward optimization analysis',
  System: 'System health and configuration',
};
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.app-sidebar {
  width: var(--q-sidebar-width);
  background: var(--q-sidebar-bg);
  border-right: 1px solid var(--q-sidebar-border);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 10;
  overflow-y: auto;
}

.app-main {
  flex: 1;
  margin-left: var(--q-sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  height: var(--q-header-height);
  background: var(--q-header-bg);
  border-bottom: 1px solid var(--q-header-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-text);
  margin: 0;
}

.header-subtitle {
  font-size: 12px;
  color: var(--q-text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-search {
  width: 180px;
}

.header-search :deep(.ant-input) {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  font-size: 12px;
  color: var(--q-text);
}

.header-search :deep(.ant-input)::placeholder {
  color: var(--q-text-muted);
}

.header-user {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-name {
  font-size: 12px;
  color: var(--q-text-secondary);
}

.app-content {
  flex: 1;
  background: var(--q-bg);
  padding: var(--q-content-padding);
  overflow-y: auto;
}

.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.error-card {
  text-align: center;
  padding: 40px;
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  box-shadow: var(--q-card-shadow);
}

.error-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--q-error);
  color: white;
  font-size: 24px;
  font-weight: 700;
  line-height: 48px;
  margin: 0 auto 16px;
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--q-text);
  margin: 0 0 8px;
}

.error-message {
  font-size: 13px;
  color: var(--q-text-muted);
  margin: 0 0 20px;
}
</style>

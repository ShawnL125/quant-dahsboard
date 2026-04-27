<template>
  <div class="sidebar-menu">
    <div class="sidebar-logo">
      <span class="logo-text">Quant</span>
    </div>
    <nav class="sidebar-nav">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="sidebar-item"
        :class="{ active: route.path === item.path }"
        @click="router.push(item.path)"
      >
        <component :is="item.icon" class="sidebar-icon" />
        <span>{{ item.label }}</span>
      </div>
    </nav>
    <div class="sidebar-footer">
      <span class="status-dot" :class="wsConnected ? 'connected' : 'disconnected'"></span>
      <span class="status-text">{{ wsConnected ? 'Live' : 'Offline' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Component, type Ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  DashboardOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  SettingOutlined,
  PieChartOutlined,
  SafetyOutlined,
  ExperimentOutlined,
  RadarChartOutlined,
  BarChartOutlined,
  WalletOutlined,
  BankOutlined,
  DollarOutlined,
  ThunderboltFilled,
  EditOutlined,
  PlayCircleOutlined,
  AuditOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const wsConnected = inject<Ref<boolean>>('wsConnected', { value: false } as Ref<boolean>);
const authStore = useAuthStore();

type MenuItem = {
  path: string;
  label: string;
  icon: Component;
  adminOnly?: boolean;
};

const allMenuItems: MenuItem[] = [
  { path: '/', label: 'Dashboard', icon: DashboardOutlined },
  { path: '/risk', label: 'Risk', icon: SafetyOutlined },
  { path: '/positions', label: 'Positions', icon: PieChartOutlined },
  { path: '/orders', label: 'Orders', icon: SwapOutlined },
  { path: '/strategies', label: 'Strategies', icon: ThunderboltOutlined },
  { path: '/signals', label: 'Signals', icon: RadarChartOutlined },
  { path: '/analytics', label: 'Analytics', icon: BarChartOutlined },
  { path: '/journal', label: 'Journal', icon: EditOutlined, adminOnly: true },
  { path: '/ledger', label: 'Ledger', icon: WalletOutlined },
  { path: '/funding', label: 'Funding', icon: DollarOutlined },
  { path: '/account', label: 'Account', icon: BankOutlined },
  { path: '/auto-tune', label: 'Auto-Tune', icon: ThunderboltFilled },
  { path: '/backtest', label: 'Backtest', icon: LineChartOutlined },
  { path: '/replay', label: 'Replay', icon: PlayCircleOutlined, adminOnly: true },
  { path: '/walkforward', label: 'Walk-Forward', icon: ExperimentOutlined },
  { path: '/governance', label: 'Governance', icon: AuditOutlined, adminOnly: true },
  { path: '/features', label: 'Features', icon: AppstoreOutlined, adminOnly: true },
  { path: '/system', label: 'System', icon: SettingOutlined },
];

const canViewOperationalPages = computed(() => authStore.isAdmin);
const menuItems = computed(() => allMenuItems.filter((item) => !item.adminOnly || canViewOperationalPages.value));
</script>

<style scoped>
.sidebar-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  padding: 16px 16px 24px;
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  color: var(--q-primary);
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--q-sidebar-item-text);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.sidebar-item:hover {
  background: var(--q-sidebar-item-hover);
  color: var(--q-text);
}

.sidebar-item.active {
  background: var(--q-sidebar-active-bg);
  color: var(--q-sidebar-active-text);
}

.sidebar-icon {
  font-size: 15px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--q-sidebar-border);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.connected {
  background: var(--q-success);
}

.status-dot.disconnected {
  background: var(--q-error);
}

.status-text {
  font-size: 11px;
  color: var(--q-text-muted);
}
</style>

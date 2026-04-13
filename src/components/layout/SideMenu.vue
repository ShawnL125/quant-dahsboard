<template>
  <div class="sidebar-menu">
    <div class="sidebar-logo">
      <div class="logo-icon">Q</div>
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
import { inject, type Ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  DashboardOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  SettingOutlined,
  PieChartOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const wsConnected = inject<Ref<boolean>>('wsConnected', { value: false } as Ref<boolean>);

const menuItems = [
  { path: '/', label: 'Dashboard', icon: DashboardOutlined },
  { path: '/risk', label: 'Risk', icon: SafetyOutlined },
  { path: '/positions', label: 'Positions', icon: PieChartOutlined },
  { path: '/orders', label: 'Orders', icon: SwapOutlined },
  { path: '/strategies', label: 'Strategies', icon: ThunderboltOutlined },
  { path: '/backtest', label: 'Backtest', icon: LineChartOutlined },
  { path: '/system', label: 'System', icon: SettingOutlined },
];
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
  gap: 10px;
  padding: 20px 20px 28px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1e3a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  color: var(--q-primary-dark);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--q-sidebar-item-text);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.sidebar-item:hover {
  background: var(--q-sidebar-item-hover);
}

.sidebar-item.active {
  background: var(--q-sidebar-active-bg);
  color: var(--q-sidebar-active-text);
}

.sidebar-icon {
  font-size: 16px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--q-border);
}

.status-dot {
  width: 8px;
  height: 8px;
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
  font-size: 12px;
  color: var(--q-text-muted);
}
</style>

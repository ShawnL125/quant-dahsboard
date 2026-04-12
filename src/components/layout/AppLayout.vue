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
          <a-badge :dot="false">
            <BellOutlined style="font-size: 18px; color: var(--q-text-secondary); cursor: pointer;" />
          </a-badge>
          <a-tag v-if="paperTrading" color="orange" style="margin: 0; font-size: 11px;">PAPER</a-tag>
        </div>
      </header>
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { SearchOutlined, BellOutlined } from '@ant-design/icons-vue';
import SideMenu from './SideMenu.vue';

const route = useRoute();
const paperTrading = inject<Ref<boolean>>('paperTrading', { value: false } as Ref<boolean>);

const pageTitle: Record<string, string> = {
  Dashboard: 'Overview of key metrics',
  Positions: 'Open positions and P&L',
  Orders: 'Place and manage orders',
  Strategies: 'Manage trading strategies',
  Backtest: 'Run and review backtests',
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
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
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
  gap: 16px;
}

.header-search {
  width: 200px;
}

.header-search .ant-input {
  background: var(--q-bg);
  border: none;
  font-size: 13px;
}

.app-content {
  flex: 1;
  background: var(--q-bg);
  padding: var(--q-content-padding);
  overflow-y: auto;
}
</style>

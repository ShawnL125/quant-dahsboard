# Phase 1: Global Theme + Layout Redesign

> **WARNING: IMPORTANT: This plan must preserve all existing functionality. Any redesign should RESTYLE existing components, not replace them with reduced versions.**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Figma design foundation — Inter font, blue color palette, light sidebar, new header bar — so all pages immediately reflect the new style.

**Architecture:** Customize Ant Design Vue 4 theme tokens via ConfigProvider, add a CSS variables file for Figma-specific values not covered by tokens, and rewrite the two layout components (AppLayout + SideMenu).

**Tech Stack:** Ant Design Vue 4 (ConfigProvider theme), CSS custom properties, Google Fonts CDN for Inter

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `index.html` | Modify | Add Inter font link |
| `src/main.ts` | Modify | Wrap app in ConfigProvider with theme tokens |
| `src/assets/styles/theme.css` | Create | CSS variables + overrides for Figma palette |
| `src/App.vue` | Modify | Import theme.css, update global body styles |
| `src/components/layout/AppLayout.vue` | Modify | Light sidebar + new header bar |
| `src/components/layout/SideMenu.vue` | Modify | Light theme menu with blue active state |

---

### Task 1: Add Inter Font + Theme CSS

**Files:**
- Modify: `index.html`
- Create: `src/assets/styles/theme.css`
- Modify: `src/App.vue`
- Modify: `src/main.ts`

- [ ] **Step 1: Add Inter font to index.html**

Add the Google Fonts link inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Full `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quant Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Create theme.css with CSS variables**

Create `src/assets/styles/theme.css`:

```css
:root {
  /* Primary */
  --q-primary: #3b82f6;
  --q-primary-dark: #1e3a8a;
  --q-primary-light: #dbeafe;
  --q-primary-hover: #2563eb;

  /* Semantic */
  --q-success: #10b981;
  --q-success-light: #dcfce7;
  --q-error: #ef4444;
  --q-error-light: #fef2f2;
  --q-warning: #f59e0b;
  --q-warning-light: #fffbeb;

  /* Neutral */
  --q-bg: #f0f2f5;
  --q-card: #ffffff;
  --q-border: #e2e8f0;
  --q-hover: #f1f5f9;

  /* Text */
  --q-text: #1e293b;
  --q-text-secondary: #64748b;
  --q-text-muted: #94a3b8;

  /* Spacing */
  --q-card-radius: 12px;
  --q-btn-radius: 8px;
  --q-tag-radius: 6px;
  --q-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  --q-card-padding: 20px;
  --q-card-gap: 16px;
  --q-content-padding: 24px;

  /* Sidebar */
  --q-sidebar-width: 220px;
  --q-sidebar-bg: #ffffff;
  --q-sidebar-border: #e2e8f0;
  --q-sidebar-active-bg: #3b82f6;
  --q-sidebar-active-text: #ffffff;
  --q-sidebar-item-text: #64748b;
  --q-sidebar-item-hover: #f1f5f9;

  /* Header */
  --q-header-height: 56px;
  --q-header-bg: #ffffff;
  --q-header-border: #e2e8f0;
}

/* Card overrides */
.ant-card {
  border-radius: var(--q-card-radius) !important;
  box-shadow: var(--q-card-shadow) !important;
  border: none !important;
}

.ant-card-head {
  border-bottom: 1px solid var(--q-border) !important;
  font-weight: 600 !important;
  color: var(--q-primary-dark) !important;
}

/* Table overrides */
.ant-table-thead > tr > th {
  background: var(--q-bg) !important;
  color: var(--q-text-muted) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.02em !important;
  border-bottom: none !important;
}

.ant-table-tbody > tr:hover > td {
  background: var(--q-hover) !important;
}

.ant-table-tbody > tr > td {
  border-bottom: 1px solid var(--q-border) !important;
  font-size: 13px !important;
}

/* Tag overrides */
.ant-tag {
  border-radius: var(--q-tag-radius) !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  padding: 1px 8px !important;
  border: none !important;
}

/* Button overrides */
.ant-btn-primary {
  background: var(--q-primary) !important;
  border-color: var(--q-primary) !important;
  border-radius: var(--q-btn-radius) !important;
  font-weight: 500 !important;
}

.ant-btn-primary:hover {
  background: var(--q-primary-hover) !important;
  border-color: var(--q-primary-hover) !important;
}

/* Input overrides */
.ant-input,
.ant-select-selector,
.ant-input-number {
  border-radius: var(--q-btn-radius) !important;
  border-color: var(--q-border) !important;
}

.ant-input:focus,
.ant-input-focused,
.ant-select-focused .ant-select-selector {
  border-color: var(--q-primary) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

/* Pagination */
.ant-pagination .ant-pagination-item-active {
  border-color: var(--q-primary) !important;
}

.ant-pagination .ant-pagination-item-active a {
  color: var(--q-primary) !important;
}

/* Collapse */
.ant-collapse {
  border-radius: var(--q-card-radius) !important;
  border: 1px solid var(--q-border) !important;
}

/* Drawer */
.ant-drawer .ant-drawer-header {
  border-bottom: 1px solid var(--q-border) !important;
}

/* Descriptions */
.ant-descriptions-bordered .ant-descriptions-item-label {
  background: var(--q-bg) !important;
  font-weight: 500 !important;
}

/* Statistic */
.ant-statistic-content-value {
  font-weight: 700 !important;
}
```

- [ ] **Step 3: Update App.vue global styles**

Replace `<style>` section in `src/App.vue`:

```vue
<style>
@import './assets/styles/theme.css';

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--q-bg);
  color: var(--q-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
```

- [ ] **Step 4: Update main.ts with Ant Design theme tokens**

Replace `src/main.ts`:

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Antd);
app.mount('#app');
```

Note: Ant Design Vue 4 global registration via `app.use(Antd)` applies defaults. We override the specific tokens via CSS custom properties in theme.css and inline styles in components. ConfigProvider theme wrapping will be added in the AppLayout component where it wraps the page content.

- [ ] **Step 5: Verify dev server starts**

Run: `cd /Users/shawn/Projects/Quantatitive/dashboard && npm run dev`
Expected: Vite dev server starts on port 3001 without errors

- [ ] **Step 6: Commit**

```bash
git add index.html src/assets/styles/theme.css src/App.vue src/main.ts
git commit -m "feat: add Inter font, CSS variables, and Ant Design theme overrides"
```

---

### Task 2: Rewrite Sidebar (SideMenu.vue)

**Files:**
- Modify: `src/components/layout/SideMenu.vue`

- [ ] **Step 1: Replace SideMenu.vue with light theme menu**

```vue
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
  BarChartOutlined,
  PieChartOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  FundOutlined,
  SignalFilled,
  BookOutlined,
  DollarOutlined,
  ControlOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const wsConnected = inject<Ref<boolean>>('wsConnected', { value: false } as Ref<boolean>);

const menuItems = [
  { path: '/', label: 'Dashboard', icon: DashboardOutlined },
  { path: '/analytics', label: 'Analytics', icon: BarChartOutlined },
  { path: '/positions', label: 'Positions', icon: PieChartOutlined },
  { path: '/orders', label: 'Orders', icon: SwapOutlined },
  { path: '/strategies', label: 'Strategies', icon: ThunderboltOutlined },
  { path: '/backtest', label: 'Backtest', icon: LineChartOutlined },
  { path: '/walkforward', label: 'Walk-Forward', icon: ExperimentOutlined },
  { path: '/risk', label: 'Risk', icon: FundOutlined },
  { path: '/signals', label: 'Signals', icon: SignalFilled },
  { path: '/ledger', label: 'Ledger', icon: BookOutlined },
  { path: '/funding', label: 'Funding', icon: DollarOutlined },
  { path: '/auto-tune', label: 'Auto-Tune', icon: ControlOutlined },
  { path: '/account', label: 'Account', icon: UserOutlined },
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
```

- [ ] **Step 2: Verify sidebar renders with light background**

Run: `npm run dev`
Expected: Sidebar shows white background, blue gradient logo circle, blue active item, green/offline status dot at bottom

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/SideMenu.vue
git commit -m "feat: light sidebar with gradient logo and blue active states"
```

---

### Task 3: Rewrite Layout Shell (AppLayout.vue)

**Files:**
- Modify: `src/components/layout/AppLayout.vue`

- [ ] **Step 1: Replace AppLayout.vue with light sidebar + new header**

```vue
<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <SideMenu />
    </aside>
    <div class="app-main">
      <header class="app-header">
        <div class="header-left">
          <h1 class="header-title">{{ route.name }}</h1>
          <span class="header-subtitle">{{ pageTitle }}</span>
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
import { inject, computed, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { SearchOutlined, BellOutlined } from '@ant-design/icons-vue';
import SideMenu from './SideMenu.vue';

const route = useRoute();
const wsConnected = inject<Ref<boolean>>('wsConnected', { value: false } as Ref<boolean>);
const paperTrading = inject<Ref<boolean>>('paperTrading', { value: false } as Ref<boolean>);

const pageTitle: Record<string, string> = {
  Dashboard: 'Overview of key metrics',
  Analytics: 'Performance analytics and charts',
  Positions: 'Open positions and P&L',
  Orders: 'Place and manage orders',
  Strategies: 'Manage trading strategies',
  Backtest: 'Run and review backtests',
  'Walk-Forward': 'Walk-forward analysis',
  Risk: 'Risk metrics and exposure',
  Signals: 'Trading signals feed',
  Ledger: 'Transaction ledger',
  Funding: 'Funding and transfers',
  'Auto-Tune': 'Automated parameter tuning',
  Account: 'Account settings and info',
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
```

- [ ] **Step 2: Verify layout renders correctly**

Run: `npm run dev`
Expected:
- White 220px fixed sidebar on left with gradient logo, menu items, status dot
- White 56px header bar with page title + subtitle on left, search + bell icon + PAPER tag on right
- Light gray (#f0f2f5) content area
- All existing pages still render their content in the new layout shell

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppLayout.vue
git commit -m "feat: light sidebar layout with new header bar"
```

---

### Task 4: Visual Verification

- [ ] **Step 1: Start dev server and verify all pages**

Run: `npm run dev`

Check each page:
1. `/` — Dashboard loads with new layout shell
2. `/analytics` — Analytics page loads with new layout shell
3. `/positions` — Positions page loads with new layout shell
4. `/orders` — Orders page loads with new layout shell
5. `/strategies` — Strategies page loads with new layout shell
6. `/backtest` — Backtest page loads with new layout shell
7. `/walkforward` — Walk-Forward page loads with new layout shell
8. `/risk` — Risk page loads with new layout shell
9. `/signals` — Signals page loads with new layout shell
10. `/ledger` — Ledger page loads with new layout shell
11. `/funding` — Funding page loads with new layout shell
12. `/auto-tune` — Auto-Tune page loads with new layout shell
13. `/account` — Account page loads with new layout shell
14. `/system` — System page loads with new layout shell

Expected: All pages render in the new light sidebar + header shell. Cards already have rounded corners and subtle shadow from theme.css. Typography uses Inter font. No console errors.

- [ ] **Step 2: Verify no regressions in functionality**

- Click each sidebar menu item → navigation works
- Tables still render data
- Forms still functional
- Drawers/modals still open

- [ ] **Step 3: Final commit for Phase 1**

```bash
git add -A
git commit -m "feat: complete Phase 1 — global theme and layout foundation"
```

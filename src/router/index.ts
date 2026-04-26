import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/risk', name: 'Risk', component: () => import('@/views/RiskView.vue') },
    { path: '/positions', name: 'Positions', component: () => import('@/views/PositionsView.vue') },
    { path: '/orders', name: 'Orders', component: () => import('@/views/OrdersView.vue') },
    { path: '/strategies', name: 'Strategies', component: () => import('@/views/StrategiesView.vue') },
    { path: '/signals', name: 'Signals', component: () => import('@/views/SignalsView.vue') },
    { path: '/backtest', name: 'Backtest', component: () => import('@/views/BacktestView.vue') },
    { path: '/walkforward', name: 'Walk-Forward', component: () => import('@/views/WalkforwardView.vue') },
    { path: '/analytics', name: 'Analytics', component: () => import('@/views/AnalyticsView.vue') },
    { path: '/ledger', name: 'Ledger', component: () => import('@/views/LedgerView.vue') },
    { path: '/funding', name: 'Funding', component: () => import('@/views/FundingView.vue') },
    { path: '/account', name: 'Account', component: () => import('@/views/AccountView.vue') },
    { path: '/journal', name: 'Journal', component: () => import('@/views/JournalView.vue') },
    { path: '/replay', name: 'Replay', component: () => import('@/views/ReplayView.vue') },
    { path: '/governance', name: 'Governance', component: () => import('@/views/GovernanceView.vue') },
    { path: '/features', name: 'Features', component: () => import('@/views/FeaturesView.vue') },
    { path: '/auto-tune', name: 'Auto-Tune', component: () => import('@/views/AutoTuneView.vue') },
    { path: '/system', name: 'System', component: () => import('@/views/SystemView.vue') },
  ],
});

export default router;

import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/risk', name: 'Risk', component: () => import('@/views/RiskView.vue') },
    { path: '/positions', name: 'Positions', component: () => import('@/views/PositionsView.vue') },
    { path: '/orders', name: 'Orders', component: () => import('@/views/OrdersView.vue') },
    { path: '/strategies', name: 'Strategies', component: () => import('@/views/StrategiesView.vue') },
    { path: '/signals', name: 'Signals', component: () => import('@/views/SignalsView.vue') },
    { path: '/backtest', name: 'Backtest', component: () => import('@/views/BacktestView.vue') },
    { path: '/walkforward', name: 'Walk-Forward', component: () => import('@/views/WalkforwardView.vue') },
    { path: '/system', name: 'System', component: () => import('@/views/SystemView.vue') },
  ],
});

export default router;

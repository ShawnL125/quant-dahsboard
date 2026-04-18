import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Route definitions matching the sidebar menu items from SideMenu.vue.
 * Each entry maps a label to its path and a selector that confirms the page loaded.
 */
const routes = [
  { label: 'Dashboard', path: '/', selector: '.dashboard' },
  { label: 'Risk', path: '/risk', selector: '.risk-page' },
  { label: 'Positions', path: '/positions', selector: '.positions-page' },
  { label: 'Orders', path: '/orders', selector: '.orders-page' },
  { label: 'Strategies', path: '/strategies', selector: '.strategies-page' },
  { label: 'Signals', path: '/signals', selector: '.signals-page' },
  { label: 'Analytics', path: '/analytics', selector: '.analytics-page' },
  { label: 'Ledger', path: '/ledger', selector: '.ledger-page' },
  { label: 'Funding', path: '/funding', selector: '.funding-page' },
  { label: 'Account', path: '/account', selector: '.account-page' },
  { label: 'Auto-Tune', path: '/auto-tune', selector: '.autotune-page' },
  { label: 'Backtest', path: '/backtest', selector: '.backtest-page' },
  { label: 'Walk-Forward', path: '/walkforward', selector: '.walkforward-page' },
  { label: 'System', path: '/system', selector: '.system-page' },
] as const;

test.describe('Navigation', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  for (const route of routes) {
    test(`navigate to ${route.label} via sidebar`, async ({ page }) => {
      await dashboardPage.navigateTo(route.label);

      // Verify URL changed
      await expect(page).toHaveURL(new RegExp(route.path === '/' ? '/$' : route.path));

      // Verify the page container is visible
      await expect(page.locator(route.selector)).toBeVisible({ timeout: 10000 });

      // Verify the sidebar item is marked active
      const activeItem = dashboardPage.getActiveSidebarItem();
      await expect(activeItem).toContainText(route.label);
    });
  }

  test('sidebar shows all 14 menu items', async () => {
    const count = await dashboardPage.sidebarItems.count();
    expect(count).toBe(14);
  });

  test('Dashboard is active by default', async () => {
    const activeItem = dashboardPage.getActiveSidebarItem();
    await expect(activeItem).toContainText('Dashboard');
  });

  test('header displays current page title', async ({ page }) => {
    await expect(dashboardPage.headerTitle).toHaveText('Dashboard');

    // Navigate to Risk and verify header updates
    await dashboardPage.navigateTo('Risk');
    await expect(page.locator('.header-title')).toHaveText('Risk');
  });

  test('WS status indicator is visible in sidebar', async () => {
    await expect(dashboardPage.wsStatusDot).toBeVisible();
    await expect(dashboardPage.wsStatusText).toBeVisible();
  });
});

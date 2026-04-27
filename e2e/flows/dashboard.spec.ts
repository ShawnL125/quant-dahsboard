import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('page loads with stat cards', async () => {
    await expect(dashboardPage.statCards).toBeVisible();
    const count = await dashboardPage.statCardItems.count();
    expect(count).toBe(4);
  });

  test('stat cards display expected labels', async () => {
    const labels = ['Net Equity', 'Available Balance', 'Total P&L', 'Unrealized P&L'];
    for (const label of labels) {
      const card = dashboardPage.statCardItems.filter({ hasText: label });
      await expect(card).toBeVisible();
    }
  });

  test('stat cards display numeric values', async () => {
    const count = await dashboardPage.statCardItems.count();
    for (let i = 0; i < count; i++) {
      const value = dashboardPage.statCardItems.nth(i).locator('.stat-value');
      await expect(value).toBeVisible();
      const text = await value.innerText();
      expect(text).toMatch(/[\d,.]+/);
    }
  });

  test('system status bar is visible', async () => {
    await expect(dashboardPage.systemStatusBar).toBeVisible({ timeout: 10000 });
  });

  test('status bar shows exchange info', async () => {
    await expect(dashboardPage.systemStatusBar).toBeVisible();
    const text = await dashboardPage.systemStatusBar.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('equity chart section renders', async () => {
    await expect(dashboardPage.equityChart).toBeVisible({ timeout: 10000 });
  });

  test('positions donut section renders', async () => {
    await expect(dashboardPage.positionsDonut).toBeVisible({ timeout: 10000 });
  });

  test('recent trades section renders', async () => {
    await expect(dashboardPage.tradesCard).toBeVisible({ timeout: 10000 });
  });

  test('recent trades table or empty state', async () => {
    await expect(
      dashboardPage.tradesTable.or(dashboardPage.tradesEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('recent trades shows data or empty state', async () => {
    const tradesCard = dashboardPage.tradesCard;
    const rows = tradesCard.locator('tbody tr');
    const emptyState = dashboardPage.tradesEmpty;
    const hasRows = (await rows.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;
    expect(hasRows || hasEmpty).toBe(true);
  });
});

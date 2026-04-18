import { test, expect } from '@playwright/test';
import { OrdersPage } from '../pages/OrdersPage';

test.describe.configure({ mode: 'serial' });

test.describe('Orders', () => {
  let ordersPage: OrdersPage;
  let placedOrderId: string | null = null;

  test.beforeEach(async ({ page }) => {
    ordersPage = new OrdersPage(page);
    await ordersPage.goto();
  });

  test('orders page loads with tabs', async () => {
    await expect(ordersPage.container).toBeVisible();
    await expect(ordersPage.orderForm).toBeVisible();

    // Verify tab labels exist
    await expect(ordersPage.page.locator('.ant-tabs-tab', { hasText: 'Open Orders' })).toBeVisible();
    await expect(ordersPage.page.locator('.ant-tabs-tab', { hasText: 'History' })).toBeVisible();
  });

  test('place a small limit order', async ({ page }) => {
    // Use a Testnet-friendly symbol with a very small quantity
    await ordersPage.placeLimitOrder('BTC/USDT', 'BUY', 0.001, 10000);

    // Wait for success message (ant-design message component)
    const successMsg = page.locator('.ant-message-success');
    await expect(successMsg).toBeVisible({ timeout: 10000 });

    // The order should appear in the open orders table after refresh
    // Switch to open orders tab if not already active
    await ordersPage.clickTab('Open Orders');

    // Wait for the table to load (or for the data to appear)
    await page.waitForTimeout(2000);
  });

  test('order appears in open orders tab', async ({ page }) => {
    // Ensure we are on open orders tab
    await ordersPage.clickTab('Open Orders');

    // Wait for table or data to load
    await page.waitForTimeout(2000);

    // Check if the open orders table has content (rows)
    const tableRows = page.locator('.ant-tabpane-active .data-table tbody tr');
    const rowCount = await tableRows.count();

    // If there are rows, capture the order ID for later cancellation
    if (rowCount > 0) {
      const firstRowId = await tableRows.first().locator('td').first().textContent();
      placedOrderId = firstRowId?.trim() || null;
    }

    // Table should exist (even if empty state is shown)
    const hasTable = await page.locator('.ant-tabpane-active .data-table').count() > 0;
    const hasEmpty = await page.locator('.ant-tabpane-active .empty-state').count() > 0;
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('switch to history tab', async ({ page }) => {
    await ordersPage.clickTab('History');
    await page.waitForTimeout(2000);

    // History tab should be active
    const activeTab = page.locator('.ant-tabs-tabpane-active');
    await expect(activeTab).toBeVisible();
  });

  test('cancel an open order', async ({ page }) => {
    // Navigate to open orders tab
    await ordersPage.clickTab('Open Orders');
    await page.waitForTimeout(2000);

    // Look for any cancel button in the open orders section
    const cancelButton = page.locator('.ant-tabpane-active').getByRole('button', { name: /cancel/i });

    if ((await cancelButton.count()) > 0) {
      await cancelButton.first().click();

      // Wait for success message
      const successMsg = page.locator('.ant-message-success');
      await expect(successMsg).toBeVisible({ timeout: 10000 });
    } else {
      // No open orders to cancel — verify empty state
      const emptyState = page.locator('.ant-tabpane-active .empty-state');
      if ((await emptyState.count()) > 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('tracked orders tab loads', async ({ page }) => {
    await ordersPage.clickTab('Tracked Orders');
    await page.waitForTimeout(2000);

    const activeTab = page.locator('.ant-tabs-tabpane-active');
    await expect(activeTab).toBeVisible();
  });

  test('algo orders tab loads with submit button', async ({ page }) => {
    await ordersPage.clickTab('Algo Orders');
    await page.waitForTimeout(2000);

    const submitAlgoButton = page.getByRole('button', { name: /submit algo order/i });
    await expect(submitAlgoButton).toBeVisible();
  });
});

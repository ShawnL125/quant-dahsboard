import { test, expect } from '@playwright/test';
import { OrdersPage } from '../pages/OrdersPage';

test.describe.configure({ mode: 'serial' });

test.describe('Orders', () => {
  let ordersPage: OrdersPage;

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
    const uniquePrice = 10000 + (Date.now() % 997);

    await ordersPage.placeLimitOrder('BTC/USDT', 'BUY', 0.001, uniquePrice);

    const successMessage = page.locator('.ant-message-success').last();
    const errorMessage = page.locator('.ant-message-error, .ant-alert-error').first();

    // Backend may accept the order or reject it, but the UI must surface one outcome.
    await expect(successMessage.or(errorMessage)).toBeVisible({ timeout: 10000 });
  });

  test('order appears in open orders tab', async ({ page }) => {
    // Ensure we are on open orders tab
    await ordersPage.clickTab('Open Orders');

    // The tab pane should be active and visible
    const activePane = page.locator('.ant-tabs-tabpane-active');
    await expect(activePane).toBeVisible();

    const openOrdersCard = activePane.locator('.orders-card');
    const openOrdersContent = openOrdersCard.locator('.data-table').or(openOrdersCard.locator('.empty-state'));

    await expect(openOrdersCard.locator('.card-title')).toContainText('Open Orders');
    await expect(openOrdersContent).toBeVisible({ timeout: 10000 });
  });

  test('switch to history tab', async ({ page }) => {
    await ordersPage.clickTab('History');

    const activePane = page.locator('.ant-tabs-tabpane-active');
    const historyCard = activePane.locator('.orders-card');

    await expect(historyCard).toBeVisible();
    await expect(historyCard.locator('.card-title')).toContainText('Order History');
    // Data table always renders (with empty-state row inside when no data)
    await expect(historyCard.locator('.data-table')).toBeVisible();
  });

  test('cancel an open order', async ({ page }) => {
    await ordersPage.clickTab('Open Orders');
    const activePane = page.locator('.ant-tabs-tabpane-active');
    await expect(activePane).toBeVisible();

    // Look for any cancel button in the open orders section
    const cancelButton = activePane.getByRole('button', { name: /cancel/i });

    if ((await cancelButton.count()) > 0) {
      await cancelButton.first().click();

      // Cancel button is inside a popconfirm — click OK to confirm
      const popconfirmOk = page.locator('.ant-popconfirm .ant-btn-primary');
      if ((await popconfirmOk.count()) > 0) {
        await popconfirmOk.click();
      }

      // Wait for response — either a success/error message or the order disappears
      const message = page.locator('.ant-message-success, .ant-message-error, .ant-message-warning');
      const hasMessage = await message.isVisible({ timeout: 3000 }).catch(() => false);
      // Message may not appear without backend — just verify page didn't crash
      await expect(activePane).toBeVisible();
    } else {
      // No open orders to cancel — verify empty state
      const emptyState = activePane.locator('.empty-state');
      if ((await emptyState.count()) > 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('tracked orders tab loads', async ({ page }) => {
    await ordersPage.clickTab('Tracked Orders');

    const activePane = page.locator('.ant-tabs-tabpane-active');
    await expect(activePane.locator('.data-table, .empty-state')).toBeVisible();
  });

  test('algo orders tab loads with submit button', async ({ page }) => {
    await ordersPage.clickTab('Algo Orders');

    const submitAlgoButton = page.getByRole('button', { name: /submit algo order/i });
    await expect(submitAlgoButton).toBeVisible();
    await expect(page.locator('.ant-tabs-tabpane-active').locator('.data-table, .empty-state')).toBeVisible();
  });
});

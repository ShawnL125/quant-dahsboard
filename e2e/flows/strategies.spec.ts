import { test, expect } from '@playwright/test';
import { StrategiesPage } from '../pages/StrategiesPage';

test.describe('Strategies', () => {
  let strategiesPage: StrategiesPage;

  test.beforeEach(async ({ page }) => {
    strategiesPage = new StrategiesPage(page);
    await strategiesPage.goto();
  });

  test('strategy list loads with action bar', async () => {
    await expect(strategiesPage.container).toBeVisible();
    await expect(strategiesPage.actionBar).toBeVisible();
    await expect(strategiesPage.reloadButton).toBeVisible();
  });

  test('strategy cards or empty state is visible', async () => {
    await expect(
      strategiesPage.strategyCards.first().or(strategiesPage.emptyState),
    ).toBeVisible();
  });

  test('reload strategies', async ({ page }) => {
    await strategiesPage.reload();

    // Success message should appear
    const successMsg = page.locator('.ant-message-success');
    await expect(successMsg).toBeVisible({ timeout: 10000 });
  });

  test('open strategy detail drawer', async ({ page }) => {
    const cardCount = await strategiesPage.strategyCards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Get the name of the first strategy card
    const firstStrategy = strategiesPage.strategyCards.first();
    const strategyName = await firstStrategy.locator('.strategy-name').textContent();

    // Click "View Details" on the first strategy
    await strategiesPage.openStrategyDetails(strategyName || '');

    // Drawer should be open
    await expect(strategiesPage.drawer).toBeVisible();
    await expect(strategiesPage.drawerTitle).toContainText(strategyName || '');
  });

  test('view parameters in drawer', async () => {
    const cardCount = await strategiesPage.strategyCards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    const firstStrategy = await strategiesPage.strategyCards.first().locator('.strategy-name').textContent();
    await strategiesPage.openStrategyDetails(firstStrategy || '');

    // Parameters section should be visible
    await expect(strategiesPage.paramsSection).toBeVisible();

    // Edit parameters button should be available
    await expect(strategiesPage.editParamsButton).toBeVisible();
  });

  test('view audit log in drawer', async ({ page }) => {
    const cardCount = await strategiesPage.strategyCards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    const firstStrategy = await strategiesPage.strategyCards.first().locator('.strategy-name').textContent();
    await strategiesPage.openStrategyDetails(firstStrategy || '');

    // The drawer should have content sections — audit may or may not have entries
    const drawerContent = page.locator('.ant-drawer-body');
    await expect(drawerContent).toBeVisible();

    const auditEmptyState = strategiesPage.auditSection.locator('.empty-sm, .empty-state');

    await expect(strategiesPage.auditSection).toBeVisible();
    await expect(strategiesPage.auditTable.or(auditEmptyState)).toBeVisible({ timeout: 10000 });
  });
});

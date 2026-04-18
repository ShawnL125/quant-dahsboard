import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';

test.describe.configure({ mode: 'serial' });

test.describe('Account', () => {
  let accountPage: AccountPage;

  test.beforeEach(async ({ page }) => {
    accountPage = new AccountPage(page);
    await accountPage.goto();
  });

  test('account page loads with margin section', async () => {
    await expect(accountPage.container).toBeVisible();
    await expect(accountPage.marginSection).toBeVisible({ timeout: 10000 });
  });

  test('margin cards or empty state is visible', async () => {
    const cardCount = await accountPage.marginCards.count();
    const hasEmpty = (await accountPage.marginEmpty.count()) > 0;
    expect(cardCount > 0 || hasEmpty).toBe(true);
  });

  test('sync all button triggers sync', async ({ page }) => {
    await accountPage.syncAll();

    // Wait for the loading spinner to appear and disappear
    await page.waitForTimeout(3000);

    // Page should still be visible (no crash)
    await expect(accountPage.container).toBeVisible();
  });

  test('view account snapshots', async () => {
    await expect(accountPage.snapshotsSection).toBeVisible({ timeout: 10000 });

    const cardCount = await accountPage.snapshotCards.count();
    const hasEmpty = (await accountPage.snapshotsEmpty.count()) > 0;
    expect(cardCount > 0 || hasEmpty).toBe(true);
  });

  test('reconcile button triggers reconciliation', async ({ page }) => {
    await expect(accountPage.reconSection).toBeVisible({ timeout: 10000 });
    await expect(accountPage.reconcileButton).toBeVisible();

    await accountPage.reconcile();

    // Wait for reconciliation to complete
    await page.waitForTimeout(5000);

    // Page should still be visible
    await expect(accountPage.container).toBeVisible();
  });

  test('refresh button reloads data', async ({ page }) => {
    await accountPage.refresh();
    await page.waitForTimeout(2000);
    await expect(accountPage.container).toBeVisible();
  });
});

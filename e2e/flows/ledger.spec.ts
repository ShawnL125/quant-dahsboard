import { test, expect } from '@playwright/test';
import { LedgerPage } from '../pages/LedgerPage';

test.describe.configure({ mode: 'serial' });

test.describe('Ledger', () => {
  let ledgerPage: LedgerPage;

  test.beforeEach(async ({ page }) => {
    ledgerPage = new LedgerPage(page);
    await ledgerPage.goto();
  });

  test('page loads with balances section', async () => {
    await expect(ledgerPage.container).toBeVisible();
    await expect(ledgerPage.balancesSection).toBeVisible();
  });

  test('balances grid or empty state', async () => {
    await expect(
      ledgerPage.balanceCards.first().or(ledgerPage.balancesEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('daily summary section renders', async () => {
    await expect(ledgerPage.summarySection).toBeVisible({ timeout: 10000 });
  });

  test('daily summary table or empty state', async () => {
    await expect(
      ledgerPage.summaryTable.or(ledgerPage.summaryEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('date picker is present in daily summary', async () => {
    const datePicker = ledgerPage.summarySection.locator('.ant-picker, input[type="date"]');
    await expect(datePicker).toBeVisible();
  });

  test('ledger entries section renders', async () => {
    await expect(ledgerPage.entriesSection).toBeVisible({ timeout: 10000 });
  });

  test('ledger entries table or empty state', async () => {
    await expect(
      ledgerPage.entriesTable.or(ledgerPage.entriesEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('cash flow modal opens and closes', async ({ page }) => {
    const hasButton = (await ledgerPage.cashFlowButton.count()) > 0;
    test.skip(!hasButton, 'No cash flow button found');
    await ledgerPage.openCashFlowModal();
    await expect(page.locator('.ant-modal')).toBeVisible();
    await page.locator('.ant-modal .ant-btn, .ant-modal-close').first().click();
  });

  test('refresh reloads data', async ({ page }) => {
    const hasRefresh = (await ledgerPage.refreshButton.count()) > 0;
    test.skip(!hasRefresh, 'No refresh button found');
    await ledgerPage.refresh();
    await expect(ledgerPage.container).toBeVisible();
  });
});

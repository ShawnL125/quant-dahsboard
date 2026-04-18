import { test, expect } from '@playwright/test';
import { BacktestPage } from '../pages/BacktestPage';

test.describe.configure({ mode: 'serial' });

test.describe('Backtest', () => {
  let backtestPage: BacktestPage;

  test.beforeEach(async ({ page }) => {
    backtestPage = new BacktestPage(page);
    await backtestPage.goto();
  });

  test('backtest page loads with run card', async () => {
    await expect(backtestPage.container).toBeVisible();
    await expect(backtestPage.runCard).toBeVisible();
    await expect(backtestPage.runButton).toBeVisible();
  });

  test('import button is visible', async () => {
    await expect(backtestPage.importButton).toBeVisible();
  });

  test('compare button shows selection count', async () => {
    // Compare button should show "(0)" when nothing is selected
    await expect(backtestPage.compareButton).toContainText('0');
  });

  test('run history tab is active by default', async () => {
    const activeTab = backtestPage.page.locator('.ant-tabs-tab.ant-tabs-tab-active');
    await expect(activeTab).toContainText('Run History');
  });

  test('run a backtest', async ({ page }) => {
    await backtestPage.runBacktest();

    // A status pill should appear indicating the task was submitted
    // (could be PENDING, RUNNING, or COMPLETED depending on backend speed)
    await page.waitForTimeout(3000);

    // Either a status pill appears or an error alert
    const hasStatus = (await backtestPage.taskStatusPill.count()) > 0;
    const hasError = (await backtestPage.errorAlert.count()) > 0;
    expect(hasStatus || hasError).toBe(true);
  });

  test('view run history', async ({ page }) => {
    await backtestPage.clickTab('Run History');
    await page.waitForTimeout(2000);

    // Run history table or empty state should be visible
    const hasTable = (await page.locator('.ant-tabpane-active .data-table').count()) > 0;
    const hasEmpty = (await page.locator('.ant-tabpane-active .empty-state').count()) > 0;
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('view task history tab', async ({ page }) => {
    await backtestPage.clickTab('Task History');
    await page.waitForTimeout(2000);

    const activeTab = page.locator('.ant-tabs-tabpane-active');
    await expect(activeTab).toBeVisible();

    // Task history table or empty state
    const hasTable = (await page.locator('.ant-tabpane-active .data-table').count()) > 0;
    const hasEmpty = (await page.locator('.ant-tabpane-active .empty-state').count()) > 0;
    expect(hasTable || hasEmpty).toBe(true);
  });
});

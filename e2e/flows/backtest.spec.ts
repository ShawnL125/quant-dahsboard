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

    await expect(backtestPage.taskStatusPill.or(backtestPage.errorAlert)).toBeVisible({
      timeout: 10000,
    });
  });

  test('view run history', async ({ page }) => {
    const activePane = page.locator('.ant-tabs-tabpane-active');
    const historyCard = activePane.locator('.history-card');

    await expect(historyCard).toBeVisible();
    await expect(historyCard.locator('.card-title')).toContainText('DB Runs');
    await expect(historyCard.locator('.data-table, .empty-state')).toBeVisible();
  });

  test('view task history tab', async ({ page }) => {
    await backtestPage.clickTab('Task History');

    const activePane = page.locator('.ant-tabs-tabpane-active');
    const historyCard = activePane.locator('.history-card');

    await expect(historyCard).toBeVisible();
    await expect(historyCard.locator('.card-title')).toContainText('Task History');
    await expect(historyCard.locator('.data-table, .empty-state')).toBeVisible();
  });
});

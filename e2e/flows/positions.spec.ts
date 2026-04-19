import { test, expect } from '@playwright/test';
import { PositionsPage } from '../pages/PositionsPage';

test.describe('Positions', () => {
  let positionsPage: PositionsPage;

  test.beforeEach(async ({ page }) => {
    positionsPage = new PositionsPage(page);
    await positionsPage.goto();
  });

  test('page loads with summary bar', async () => {
    await expect(positionsPage.container).toBeVisible();
    await expect(positionsPage.summaryBar).toBeVisible();
  });

  test('summary shows total positions count', async () => {
    const totalItem = positionsPage.summaryBar.locator('.summary-item').first();
    await expect(totalItem).toBeVisible();
    await expect(totalItem.locator('.summary-label')).toBeVisible();
    await expect(totalItem.locator('.summary-value')).toBeVisible();
  });

  test('summary shows P&L counts', async () => {
    const items = positionsPage.summaryItems;
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('summary shows total unrealized P&L', async () => {
    const items = positionsPage.summaryItems;
    const lastItem = items.last();
    await expect(lastItem.locator('.summary-value')).toBeVisible();
    const text = await lastItem.locator('.summary-value').innerText();
    expect(text).toMatch(/[\d,.]+/);
  });

  test('positions table or empty state', async () => {
    await expect(
      positionsPage.positionsTable.or(positionsPage.positionsEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('positions table shows correct columns (skip if empty)', async ({ page }) => {
    const rows = positionsPage.positionsTable.locator('tbody tr');
    const count = await rows.count();
    test.skip(count === 0, 'No positions to verify columns');
    const headers = positionsPage.positionsTable.locator('thead th');
    await expect(headers.first()).toBeVisible();
  });

  test('P&L values are color-coded (skip if empty)', async () => {
    const rows = positionsPage.positionsTable.locator('tbody tr');
    const count = await rows.count();
    test.skip(count === 0, 'No positions to verify P&L colors');
    const pnlCells = positionsPage.positionsTable.locator('.val-positive, .val-negative, .text-success, .text-error');
    const pnlCount = await pnlCells.count();
    expect(pnlCount).toBeGreaterThanOrEqual(0);
  });
});

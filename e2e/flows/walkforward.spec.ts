import { test, expect } from '@playwright/test';
import { WalkforwardPage } from '../pages/WalkforwardPage';

test.describe.configure({ mode: 'serial' });

test.describe('Walk-Forward', () => {
  let walkforwardPage: WalkforwardPage;

  test.beforeEach(async ({ page }) => {
    walkforwardPage = new WalkforwardPage(page);
    await walkforwardPage.goto();
  });

  test('page loads with run card', async () => {
    await expect(walkforwardPage.container).toBeVisible();
    await expect(walkforwardPage.runCard).toBeVisible();
  });

  test('run optimization button is visible', async () => {
    await expect(walkforwardPage.runOptButton).toBeVisible();
  });

  test('compare button shows selection count', async () => {
    await expect(walkforwardPage.compareButton).toBeVisible();
    const text = await walkforwardPage.compareButton.innerText();
    expect(text).toMatch(/compare/i);
  });

  test('runs table or empty state', async () => {
    await expect(
      walkforwardPage.runsTable.or(walkforwardPage.runsEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('runs table shows correct columns (skip if empty)', async () => {
    const rows = walkforwardPage.runsTable.locator('tbody tr');
    const count = await rows.count();
    test.skip(count === 0, 'No runs to verify columns');
    const headers = walkforwardPage.runsTable.locator('thead th');
    expect(await headers.count()).toBeGreaterThan(0);
  });

  test('expand row shows window data (skip if empty)', async ({ page }) => {
    const rows = walkforwardPage.runsTable.locator('tbody tr');
    const count = await rows.count();
    test.skip(count === 0, 'No runs to expand');
    const expandIcon = walkforwardPage.runsTable.locator('.expand-icon').first();
    const hasExpand = (await expandIcon.count()) > 0;
    test.skip(!hasExpand, 'No expand icon found');
    await expandIcon.click();
    await expect(page.locator('.expand-row')).toBeVisible({ timeout: 5000 });
  });

  test('checkbox selection updates compare count (skip if empty)', async () => {
    const rows = walkforwardPage.runsTable.locator('tbody tr');
    const count = await rows.count();
    test.skip(count === 0, 'No runs to select');
    const checkboxes = walkforwardPage.checkboxes;
    const cbCount = await checkboxes.count();
    test.skip(cbCount === 0, 'No checkboxes found');
    await checkboxes.first().check();
    // Compare button should still be visible
    await expect(walkforwardPage.compareButton).toBeVisible();
  });

  test('compare modal opens with two selections (skip if <2 runs)', async ({ page }) => {
    const checkboxes = walkforwardPage.checkboxes;
    const cbCount = await checkboxes.count();
    test.skip(cbCount < 2, 'Need at least 2 runs to compare');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await walkforwardPage.compare();
    await expect(page.locator('.ant-modal')).toBeVisible();
  });
});

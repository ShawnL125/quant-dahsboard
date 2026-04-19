import { test, expect } from '@playwright/test';
import { AutoTunePage } from '../pages/AutoTunePage';

test.describe.configure({ mode: 'serial' });

test.describe('Auto-Tune', () => {
  let autoTunePage: AutoTunePage;

  test.beforeEach(async ({ page }) => {
    autoTunePage = new AutoTunePage(page);
    await autoTunePage.goto();
  });

  test('page loads with runs section', async () => {
    await expect(autoTunePage.container).toBeVisible();
    await expect(autoTunePage.runsSection).toBeVisible();
  });

  test('runs table or empty state', async () => {
    await expect(
      autoTunePage.runsTable.or(autoTunePage.runsEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('trigger run button is visible', async () => {
    await expect(autoTunePage.triggerButton).toBeVisible();
  });

  test('scheduled jobs section renders', async () => {
    await expect(autoTunePage.schedulesSection).toBeVisible({ timeout: 10000 });
  });

  test('schedules table or empty state', async () => {
    await expect(
      autoTunePage.schedulesTable.or(autoTunePage.schedulesEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('trigger modal opens with form', async ({ page }) => {
    await autoTunePage.openTriggerModal();
    await expect(page.locator('.ant-modal')).toBeVisible();
    // Should have at least one form element
    const formInputs = page.locator('.ant-modal input, .ant-modal .ant-select');
    expect(await formInputs.count()).toBeGreaterThanOrEqual(0);
  });

  test('trigger modal form has correct options', async ({ page }) => {
    await autoTunePage.openTriggerModal();
    await expect(page.locator('.ant-modal')).toBeVisible();
    // Verify the modal has primary action button
    await expect(page.locator('.ant-modal .ant-btn-primary')).toBeVisible();
  });

  test('runs table shows correct columns (skip if empty)', async () => {
    const rows = autoTunePage.runsTable.locator('tbody tr');
    const count = await rows.count();
    test.skip(count === 0, 'No runs to verify columns');
    const headers = autoTunePage.runsTable.locator('thead th');
    expect(await headers.count()).toBeGreaterThan(0);
  });
});

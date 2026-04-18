import { test, expect } from '@playwright/test';
import { RiskPage } from '../pages/RiskPage';

const allowDestructive = process.env.E2E_ALLOW_DESTRUCTIVE === 'true';

test.describe.configure({ mode: 'serial' });
test.skip(!allowDestructive, 'Set E2E_ALLOW_DESTRUCTIVE=true to run the destructive kill-switch flow.');

test.describe('Kill Switch', () => {
  let riskPage: RiskPage;

  test.beforeAll(async ({ browser }) => {
    // Verify backend connectivity by creating a fresh context
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await page.goto('/risk');
    // Wait for risk page to load
    await page.locator('.risk-page').waitFor({ state: 'visible', timeout: 15000 });
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    riskPage = new RiskPage(page);
    await riskPage.goto();
  });

  test('risk page shows kill switch bar', async () => {
    await expect(riskPage.killSwitchBar).toBeVisible({ timeout: 10000 });
    await expect(riskPage.killSwitchLabel).toBeVisible();
  });

  test('risk page shows risk grid sections', async () => {
    await expect(riskPage.riskGrid).toBeVisible({ timeout: 10000 });
  });

  test('activate kill switch with confirmation', async () => {
    // Check initial state — might already be active from a previous test run
    const wasActive = await riskPage.isKillSwitchActive();

    if (!wasActive) {
      await riskPage.activateKillSwitch();
    }

    // Verify the kill switch is now active
    const isActive = await riskPage.isKillSwitchActive();
    expect(isActive).toBe(true);

    // Verify the label shows active state
    await expect(riskPage.killSwitchLabel).toContainText(/active/i);
  });

  test('verify kill switch status persists after page reload', async () => {
    await riskPage.page.reload();
    await riskPage.container.waitFor({ state: 'visible' });
    await expect(riskPage.killSwitchBar).toBeVisible({ timeout: 10000 });

    const isActive = await riskPage.isKillSwitchActive();
    expect(isActive).toBe(true);
  });

  test('deactivate kill switch', async () => {
    const isActive = await riskPage.isKillSwitchActive();

    if (isActive) {
      await riskPage.deactivateKillSwitch();
    }

    // Verify it is now inactive
    const stillActive = await riskPage.isKillSwitchActive();
    expect(stillActive).toBe(false);

    // Label should show inactive state
    await expect(riskPage.killSwitchLabel).toContainText(/inactive/i);
  });
});

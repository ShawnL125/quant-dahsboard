import { test, expect } from '@playwright/test';
import { RiskPage } from '../pages/RiskPage';

test.describe('Risk Page (Read-Only)', () => {
  let riskPage: RiskPage;

  test.beforeEach(async ({ page }) => {
    riskPage = new RiskPage(page);
    await riskPage.goto();
  });

  test('risk page loads with risk grid', async () => {
    await expect(riskPage.container).toBeVisible();
    await expect(riskPage.riskGrid).toBeVisible({ timeout: 10000 });
  });

  test('drawdown chart section renders', async () => {
    await expect(riskPage.drawdownChart).toBeVisible({ timeout: 10000 });
  });

  test('exposure table section renders', async () => {
    await expect(riskPage.exposureCard).toBeVisible({ timeout: 10000 });
  });

  test('risk config cards render', async () => {
    await expect(riskPage.configCard).toBeVisible({ timeout: 10000 });
  });

  test('risk events table section renders', async () => {
    await expect(riskPage.eventsCard).toBeVisible({ timeout: 10000 });
  });

  test('risk events table or empty state', async () => {
    await expect(
      riskPage.eventsTable.or(riskPage.eventsEmpty)
    ).toBeVisible({ timeout: 10000 });
  });
});

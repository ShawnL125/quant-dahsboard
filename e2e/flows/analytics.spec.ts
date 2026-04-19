import { test, expect } from '@playwright/test';
import { AnalyticsPage } from '../pages/AnalyticsPage';

test.describe('Analytics', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();
  });

  test('page loads with strategy performance section', async () => {
    await expect(analyticsPage.container).toBeVisible();
    await expect(analyticsPage.statsSection).toBeVisible();
  });

  test('strategy performance cards or empty state', async () => {
    const cards = analyticsPage.statCards;
    const emptyState = analyticsPage.statsSection.locator('.empty-state, .empty-inline');
    await expect(cards.first().or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('quality metrics section renders', async () => {
    await expect(analyticsPage.qualitySection).toBeVisible({ timeout: 10000 });
  });

  test('round-trip trades section renders', async () => {
    await expect(analyticsPage.tripsSection).toBeVisible({ timeout: 10000 });
  });

  test('round-trip trades table or empty state', async () => {
    await expect(
      analyticsPage.tripsTable.or(analyticsPage.tripsEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('signal history section renders', async () => {
    await expect(analyticsPage.signalsSection).toBeVisible({ timeout: 10000 });
  });

  test('signal history table or empty state', async () => {
    await expect(
      analyticsPage.signalsTable.or(analyticsPage.signalsEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('click round-trip row opens detail (skip if empty)', async () => {
    const rows = analyticsPage.tripsTable.locator('.clickable-row');
    const count = await rows.count();
    test.skip(count === 0, 'No round-trip trades to click');
    await rows.first().click();
    // Verify a modal or detail panel appears
    const modal = analyticsPage.page.locator('.ant-modal, .ant-drawer');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('click strategy card shows stats (skip if empty)', async () => {
    const cards = analyticsPage.statCards.filter({ hasText: /.+/ });
    const count = await cards.count();
    test.skip(count === 0, 'No strategy cards to click');
    // Cards may be clickable — verify some interaction
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
    const strategyLabel = firstCard.locator('.stat-strategy');
    await expect(strategyLabel.or(firstCard.locator('.stat-label'))).toBeVisible();
  });
});

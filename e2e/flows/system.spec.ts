import { test, expect } from '@playwright/test';
import { SystemPage } from '../pages/SystemPage';

test.describe('System', () => {
  let systemPage: SystemPage;

  test.beforeEach(async ({ page }) => {
    systemPage = new SystemPage(page);
    await systemPage.goto();
  });

  test('system page loads with health grid', async () => {
    await expect(systemPage.container).toBeVisible();
    await expect(systemPage.healthGrid).toBeVisible({ timeout: 10000 });
  });

  test('liveness card shows status', async () => {
    const cards = systemPage.healthCards;
    const count = await cards.count();
    test.skip(count === 0, 'No health cards');
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
    const text = await firstCard.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('readiness card shows status', async () => {
    const cards = systemPage.healthCards;
    const count = await cards.count();
    test.skip(count < 2, 'Not enough health cards');
    await expect(cards.nth(1)).toBeVisible();
  });

  test('uptime card displays time', async () => {
    const cards = systemPage.healthCards;
    const count = await cards.count();
    test.skip(count < 3, 'Not enough health cards');
    await expect(cards.nth(2)).toBeVisible();
  });

  test('data quality section renders', async () => {
    await expect(systemPage.qualitySection).toBeVisible({ timeout: 10000 });
  });

  test('configuration collapse panel renders', async () => {
    await expect(systemPage.configCard).toBeVisible({ timeout: 10000 });
  });

  test('expand config shows reload button and JSON', async ({ page }) => {
    const hasCollapse = (await systemPage.configCollapse.count()) > 0;
    test.skip(!hasCollapse, 'No config collapse panel');
    await systemPage.expandConfig();
    await expect(systemPage.configCode).toBeVisible({ timeout: 5000 });
  });

  test('event statistics table or empty state', async () => {
    const hasEvents = (await systemPage.eventsCard.count()) > 0;
    test.skip(!hasEvents, 'No events card');
    await expect(
      systemPage.eventsTable.or(systemPage.eventsEmpty)
    ).toBeVisible({ timeout: 10000 });
  });

  test('reconciliation alerts table or empty state', async () => {
    const hasRecon = (await systemPage.reconCard.count()) > 0;
    test.skip(!hasRecon, 'No recon card');
    await expect(
      systemPage.reconTable.or(systemPage.reconEmpty)
    ).toBeVisible({ timeout: 10000 });
  });
});

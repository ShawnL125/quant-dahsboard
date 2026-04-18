import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/admin.json';

setup('authenticate', async ({ page }) => {
  // ── Environment safety check ────────────────────────────────────
  // Backend GET /health now returns { trading_mode: "live" | "testnet" | "paper" }
  // E2E tests must NOT run against a live trading backend.
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
  const healthResp = await fetch(`${baseURL}/api/v1/health/live`);
  if (healthResp.ok) {
    const health = await healthResp.json() as { trading_mode?: string };
    const mode = health.trading_mode ?? 'live';
    if (mode === 'live') {
      throw new Error(
        `E2E aborted: backend trading_mode is "${mode}". ` +
        `E2E tests must run against paper or testnet. ` +
        `Start the backend with paper_trading=true or a testnet config.`,
      );
    }
  }

  // ── Login ────────────────────────────────────────────────────────
  await page.goto('/login');

  await expect(page.locator('.login-page')).toBeVisible();

  const username = process.env.E2E_USERNAME || 'admin';
  const password = process.env.E2E_PASSWORD || 'admin';

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);

  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('/', { timeout: 15000 });
  await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: authFile });
});

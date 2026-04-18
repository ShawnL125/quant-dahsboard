import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/admin.json';

setup('authenticate', async ({ page }) => {
  // ── Environment safety check ────────────────────────────────────
  // Backend GET /health returns { trading_mode: "live" | "testnet" | "paper" }
  // E2E tests must NOT run against a live trading backend.
  // If the backend does not yet support trading_mode, skip the check.
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
  const allowDestructive = process.env.E2E_ALLOW_DESTRUCTIVE === 'true';
  let verifiedSafeBackend = false;
  try {
    const healthResp = await fetch(`${baseURL}/api/v1/health/live`);
    if (healthResp.ok) {
      const health = await healthResp.json() as { trading_mode?: string };
      if (health.trading_mode === 'live') {
        throw new Error(
          `E2E aborted: backend trading_mode is "live". ` +
          `E2E tests must run against paper or testnet. ` +
          `Start the backend with paper_trading=true or a testnet config.`,
        );
      }
      verifiedSafeBackend = health.trading_mode === 'paper' || health.trading_mode === 'testnet';
      if (!verifiedSafeBackend) {
        console.warn(
          `[e2e] Backend safety check did not confirm a safe trading_mode at ${baseURL}/api/v1/health/live. ` +
          `Received trading_mode=${String(health.trading_mode)}.`,
        );
      }
    } else {
      console.warn(
        `[e2e] Backend safety check returned HTTP ${healthResp.status} from ${baseURL}/api/v1/health/live. ` +
        `Continuing without a verified trading_mode.`,
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('E2E aborted')) throw e;
    console.warn(
      `[e2e] Backend safety check failed for ${baseURL}/api/v1/health/live: ` +
      `${e instanceof Error ? e.message : String(e)}. ` +
      `Continuing without a verified trading_mode.`,
    );
  }

  if (!verifiedSafeBackend) {
    if (allowDestructive) {
      throw new Error(
        `E2E aborted: unable to verify backend safety while E2E_ALLOW_DESTRUCTIVE=true. ` +
        `Refusing to run destructive E2E flows against an unverified backend.`,
      );
    }

    console.warn(
      `[e2e] Backend safety could not be verified. Proceeding with non-destructive E2E flows only because ` +
      `E2E_ALLOW_DESTRUCTIVE is not set.`,
    );
  }

  // ── Auth detection ───────────────────────────────────────────────
  // Navigate to root — if the app has no route guards (backend has no auth),
  // we land directly on the dashboard. If auth is required, we get redirected
  // to /login. We detect which scenario we're in and handle accordingly.
  await page.goto('/');

  const currentUrl = page.url();
  const onLoginPage = currentUrl.includes('/login');

  if (onLoginPage) {
    // Backend has auth — attempt login
    await expect(page.locator('.login-page')).toBeVisible();

    const username = process.env.E2E_USERNAME || 'admin';
    const password = process.env.E2E_PASSWORD || 'admin';

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);

    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });
  } else {
    // No auth required — verify the app shell rendered successfully.
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });
  }

  await page.context().storageState({ path: authFile });
});

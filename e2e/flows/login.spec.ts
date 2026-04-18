import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    const username = process.env.E2E_USERNAME || 'admin';
    const password = process.env.E2E_PASSWORD || 'admin';

    await loginPage.login(username, password);

    // Should redirect to the dashboard
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

    // Sidebar should be present after login
    await expect(page.locator('.sidebar-menu')).toBeVisible();
  });

  test('wrong password shows error alert', async ({ page }) => {
    await loginPage.login('admin', 'wrong-password');

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);

    // Error alert should appear
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('empty fields show validation messages', async ({ page }) => {
    // Click submit with empty fields
    await loginPage.submit();

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);

    // Ant Design validation messages should appear
    await expect(loginPage.validationMessages.first()).toBeVisible();
  });

  test('login page is accessible without authentication', async ({ page }) => {
    // Verify we can load the login page without being redirected
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.container).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });
});

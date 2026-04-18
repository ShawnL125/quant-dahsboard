import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Container
  readonly container: Locator;

  // Form elements
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Feedback
  readonly errorAlert: Locator;
  readonly validationMessages: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.locator('.login-page');
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorAlert = page.locator('.ant-alert-error');
    this.validationMessages = page.locator('.ant-form-item-explain-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.container.waitFor({ state: 'visible' });
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }
}

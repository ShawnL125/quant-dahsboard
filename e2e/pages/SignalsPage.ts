import type { Page, Locator } from '@playwright/test';

export class SignalsPage {
  readonly page: Page;
  readonly container: Locator;
  readonly signalsLayout: Locator;
  readonly signalsMain: Locator;
  readonly signalsSide: Locator;
  readonly feedCard: Locator;
  readonly signalFeed: Locator;
  readonly summaryCard: Locator;
  readonly signalSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.signals-page');
    this.signalsLayout = page.locator('.signals-layout');
    this.signalsMain = page.locator('.signals-main');
    this.signalsSide = page.locator('.signals-side');
    this.feedCard = page.locator('.feed-card');
    this.signalFeed = page.locator('.signal-feed');
    this.summaryCard = page.locator('.summary-card');
    this.signalSummary = page.locator('.signal-summary');
  }

  async goto(): Promise<void> {
    await this.page.goto('/signals');
    await this.container.waitFor({ state: 'visible' });
  }
}

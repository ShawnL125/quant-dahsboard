import type { Page, Locator } from '@playwright/test';

export class PositionsPage {
  readonly page: Page;
  readonly container: Locator;
  readonly summaryBar: Locator;
  readonly summaryItems: Locator;
  readonly positionsCard: Locator;
  readonly positionsTable: Locator;
  readonly positionsEmpty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.positions-page');
    this.summaryBar = page.locator('.summary-bar');
    this.summaryItems = page.locator('.summary-item');
    this.positionsCard = page.locator('.positions-card');
    this.positionsTable = this.positionsCard.locator('.data-table');
    this.positionsEmpty = this.positionsCard.locator('.empty-state, .empty-inline');
  }

  async goto(): Promise<void> {
    await this.page.goto('/positions');
    await this.container.waitFor({ state: 'visible' });
  }
}

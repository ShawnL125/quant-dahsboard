import type { Page, Locator } from '@playwright/test';

export class AnalyticsPage {
  readonly page: Page;
  readonly container: Locator;
  readonly statsSection: Locator;
  readonly statCards: Locator;
  readonly qualitySection: Locator;
  readonly qualityCards: Locator;
  readonly tripsSection: Locator;
  readonly tripsTable: Locator;
  readonly tripsEmpty: Locator;
  readonly signalsSection: Locator;
  readonly signalsTable: Locator;
  readonly signalsEmpty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.analytics-page');
    this.statsSection = page.locator('.stats-section');
    this.statCards = page.locator('.stats-section .stat-card');
    this.qualitySection = page.locator('.quality-section');
    this.qualityCards = page.locator('.quality-card');
    this.tripsSection = page.locator('.trips-section');
    this.tripsTable = this.tripsSection.locator('.data-table');
    this.tripsEmpty = this.tripsSection.locator('.empty-state, .empty-inline');
    this.signalsSection = page.locator('.signals-section');
    this.signalsTable = this.signalsSection.locator('.data-table');
    this.signalsEmpty = this.signalsSection.locator('.empty-state, .empty-inline');
  }

  async goto(): Promise<void> {
    await this.page.goto('/analytics');
    await this.container.waitFor({ state: 'visible' });
  }
}

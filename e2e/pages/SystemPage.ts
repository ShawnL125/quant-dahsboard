import type { Page, Locator } from '@playwright/test';

export class SystemPage {
  readonly page: Page;
  readonly container: Locator;
  readonly healthGrid: Locator;
  readonly healthCards: Locator;
  readonly qualitySection: Locator;
  readonly qualityBlocks: Locator;
  readonly qualityAlertsCard: Locator;
  readonly configCard: Locator;
  readonly configCollapse: Locator;
  readonly configCode: Locator;
  readonly reloadConfigButton: Locator;
  readonly eventsCard: Locator;
  readonly eventsTable: Locator;
  readonly eventsEmpty: Locator;
  readonly reconCard: Locator;
  readonly reconTable: Locator;
  readonly reconEmpty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.system-page');
    this.healthGrid = page.locator('.health-grid');
    this.healthCards = page.locator('.health-card');
    this.qualitySection = page.locator('.quality-section');
    this.qualityBlocks = page.locator('.quality-block');
    this.qualityAlertsCard = page.locator('.quality-alerts-card');
    this.configCard = page.locator('.config-card');
    this.configCollapse = page.locator('.ant-collapse');
    this.configCode = page.locator('.config-code');
    this.reloadConfigButton = page.getByRole('button', { name: /reload config/i });
    this.eventsCard = page.locator('.events-card');
    this.eventsTable = this.eventsCard.locator('.data-table');
    this.eventsEmpty = this.eventsCard.locator('.empty-state, .empty-inline');
    this.reconCard = page.locator('.recon-card');
    this.reconTable = this.reconCard.locator('.data-table');
    this.reconEmpty = this.reconCard.locator('.empty-state, .empty-inline');
  }

  async goto(): Promise<void> {
    await this.page.goto('/system');
    await this.container.waitFor({ state: 'visible' });
  }

  async expandConfig(): Promise<void> {
    await this.configCollapse.locator('.ant-collapse-header').first().click();
  }

  async reloadConfig(): Promise<void> {
    await this.reloadConfigButton.click();
  }
}

import type { Page, Locator } from '@playwright/test';

export class BacktestPage {
  readonly page: Page;

  // Page container
  readonly container: Locator;

  // Run card
  readonly runCard: Locator;
  readonly runButton: Locator;
  readonly importButton: Locator;
  readonly compareButton: Locator;
  readonly taskStatusPill: Locator;

  // Error
  readonly errorAlert: Locator;

  // Tabs
  readonly tabs: Locator;

  // Run history tab
  readonly runHistoryTable: Locator;
  readonly runHistoryEmpty: Locator;

  // Task history tab
  readonly taskHistoryTable: Locator;
  readonly taskHistoryEmpty: Locator;

  // Result display
  readonly backtestResult: Locator;

  // Compare modal
  readonly compareModal: Locator;

  // Import modal
  readonly importModal: Locator;
  readonly importTextarea: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.locator('.backtest-page');
    this.runCard = page.locator('.run-card');
    this.runButton = page.getByRole('button', { name: /^run$/i });
    this.importButton = page.getByRole('button', { name: /import/i });
    this.compareButton = page.getByRole('button', { name: /compare/i });
    this.taskStatusPill = this.runCard.locator('.status-pill');

    this.errorAlert = page.locator('.backtest-page .ant-alert-error');

    // Tabs
    this.tabs = page.locator('.ant-tabs');

    // Run history
    this.runHistoryTable = page.locator('.ant-tabs-tabpane-active .data-table').first();
    this.runHistoryEmpty = page.locator('.ant-tabs-tabpane-active .empty-state').first();

    // Task history (second tab pane)
    this.taskHistoryTable = page.locator('.ant-tabs-tabpane-active .data-table').nth(1);
    this.taskHistoryEmpty = page.locator('.ant-tabs-tabpane-active .empty-state').nth(1);

    // Result component
    this.backtestResult = page.locator('.backtest-result');

    // Compare modal
    this.compareModal = page.locator('.ant-modal');

    // Import modal
    this.importModal = page.locator('.ant-modal');
    this.importTextarea = page.locator('.ant-modal textarea');
  }

  async goto(): Promise<void> {
    await this.page.goto('/backtest');
    await this.container.waitFor({ state: 'visible' });
  }

  async runBacktest(): Promise<void> {
    await this.runButton.click();
  }

  async clickTab(tabLabel: string): Promise<void> {
    const tab = this.page.locator('.ant-tabs-tab', { hasText: tabLabel });
    await tab.click();
  }

  async selectRun(runId: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${runId}")`);
    await row.locator('input[type="checkbox"]').check();
  }

  async viewRunDetails(runId: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${runId}")`);
    await row.locator('.view-link').click();
  }

  async compare(): Promise<void> {
    await this.compareButton.click();
    await this.compareModal.waitFor({ state: 'visible' });
  }

  async importResults(json: string): Promise<void> {
    await this.importButton.click();
    await this.importModal.waitFor({ state: 'visible' });
    await this.importTextarea.fill(json);
    await this.page.locator('.ant-modal .ant-btn-primary').click();
  }
}

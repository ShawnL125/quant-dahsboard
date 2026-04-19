import type { Page, Locator } from '@playwright/test';

export class LedgerPage {
  readonly page: Page;
  readonly container: Locator;
  readonly balancesSection: Locator;
  readonly balancesGrid: Locator;
  readonly balanceCards: Locator;
  readonly balancesEmpty: Locator;
  readonly summarySection: Locator;
  readonly summaryTable: Locator;
  readonly summaryEmpty: Locator;
  readonly entriesSection: Locator;
  readonly entriesTable: Locator;
  readonly entriesEmpty: Locator;
  readonly cashFlowButton: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.ledger-page');
    this.balancesSection = page.locator('.balances-section');
    this.balancesGrid = page.locator('.balances-grid');
    this.balanceCards = page.locator('.balance-card');
    this.balancesEmpty = this.balancesSection.locator('.empty-state, .empty-inline');
    this.summarySection = page.locator('.summary-section');
    this.summaryTable = this.summarySection.locator('.data-table');
    this.summaryEmpty = this.summarySection.locator('.empty-state, .empty-inline');
    this.entriesSection = page.locator('.entries-section');
    this.entriesTable = this.entriesSection.locator('.data-table');
    this.entriesEmpty = this.entriesSection.locator('.empty-state, .empty-inline');
    this.cashFlowButton = page.getByRole('button', { name: /cash flow/i });
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/ledger');
    await this.container.waitFor({ state: 'visible' });
  }

  async refresh(): Promise<void> {
    await this.refreshButton.click();
  }

  async openCashFlowModal(): Promise<void> {
    await this.cashFlowButton.click();
    await this.page.locator('.ant-modal').waitFor({ state: 'visible' });
  }

  async submitCashFlow(type: string, asset: string, amount: string): Promise<void> {
    await this.openCashFlowModal();
    const modal = this.page.locator('.ant-modal');
    // Fill type select
    const typeSelect = modal.locator('.ant-select').first();
    await typeSelect.click();
    await this.page.locator('.ant-select-item', { hasText: type }).click();
    // Fill asset
    if ((await modal.locator('.ant-select').count()) > 1) {
      const assetSelect = modal.locator('.ant-select').nth(1);
      await assetSelect.click();
      await this.page.locator('.ant-select-item', { hasText: asset }).click();
    }
    // Fill amount
    const amountInput = modal.locator('input[type="number"], input[placeholder*="amount" i]');
    if ((await amountInput.count()) > 0) {
      await amountInput.fill(amount);
    }
    // Submit
    await modal.locator('.ant-btn-primary').click();
  }
}

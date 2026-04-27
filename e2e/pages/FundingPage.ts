import type { Page, Locator } from '@playwright/test';

export class FundingPage {
  readonly page: Page;
  readonly container: Locator;
  readonly rateCards: Locator;
  readonly rateGrid: Locator;
  readonly rateEmpty: Locator;
  readonly historicalSection: Locator;
  readonly historicalTable: Locator;
  readonly costSection: Locator;
  readonly costSummary: Locator;
  readonly backfillForm: Locator;
  readonly backfillSubmitButton: Locator;
  readonly symbolSelect: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.funding-page');
    this.rateGrid = page.locator('.rate-grid');
    this.rateCards = page.locator('.rate-card');
    this.rateEmpty = page.locator('.funding-page .card').first().locator('.empty-state, .empty-inline');
    this.historicalSection = page.locator('.card', { hasText: /historical rates/i });
    this.historicalTable = this.historicalSection.locator('.data-table');
    this.costSection = page.locator('.card', { hasText: /funding cost summary/i });
    this.costSummary = page.locator('.cost-summary');
    this.backfillForm = page.locator('.backfill-form');
    this.backfillSubmitButton = this.backfillForm.getByRole('button', { name: /submit|backfill|start/i });
    this.symbolSelect = page.locator('.header-actions .ant-select').first();
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/funding');
    await this.container.waitFor({ state: 'visible' });
  }

  async refresh(): Promise<void> {
    await this.refreshButton.click();
  }

  async selectSymbol(symbol: string): Promise<void> {
    await this.symbolSelect.click();
    await this.page.locator('.ant-select-item', { hasText: symbol }).click();
  }

  async fillBackfill(fieldValues: Record<string, string>): Promise<void> {
    for (const [label, value] of Object.entries(fieldValues)) {
      const input = this.backfillForm.locator(`input[placeholder*="${label}" i], label:has-text("${label}") + * input, .ant-form-item:has-text("${label}") input`);
      if ((await input.count()) > 0) {
        await input.fill(value);
      }
    }
  }

  async submitBackfill(): Promise<void> {
    await this.backfillSubmitButton.click();
  }
}

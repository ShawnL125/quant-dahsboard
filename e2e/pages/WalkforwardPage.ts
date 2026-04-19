import type { Page, Locator } from '@playwright/test';

export class WalkforwardPage {
  readonly page: Page;
  readonly container: Locator;
  readonly runCard: Locator;
  readonly runOptButton: Locator;
  readonly compareButton: Locator;
  readonly runsCard: Locator;
  readonly runsTable: Locator;
  readonly runsEmpty: Locator;
  readonly checkboxes: Locator;
  readonly compareModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.walkforward-page');
    this.runCard = page.locator('.run-card');
    this.runOptButton = page.getByRole('button', { name: /run optimization/i });
    this.compareButton = page.getByRole('button', { name: /compare/i });
    this.runsCard = page.locator('.runs-card');
    this.runsTable = this.runsCard.locator('.data-table');
    this.runsEmpty = this.runsCard.locator('.empty-state, .empty-inline');
    this.checkboxes = this.runsTable.locator('input[type="checkbox"]');
    this.compareModal = page.locator('.ant-modal');
  }

  async goto(): Promise<void> {
    await this.page.goto('/walkforward');
    await this.container.waitFor({ state: 'visible' });
  }

  async clickRunOptimization(): Promise<void> {
    await this.runOptButton.click();
  }

  async toggleCheckbox(index: number): Promise<void> {
    await this.checkboxes.nth(index).check();
  }

  async compare(): Promise<void> {
    await this.compareButton.click();
    await this.compareModal.waitFor({ state: 'visible' });
  }
}

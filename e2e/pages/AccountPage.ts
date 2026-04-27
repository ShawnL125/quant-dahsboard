import type { Page, Locator } from '@playwright/test';

export class AccountPage {
  readonly page: Page;

  // Page container
  readonly container: Locator;

  // Margin section
  readonly marginSection: Locator;
  readonly marginCards: Locator;
  readonly syncButton: Locator;
  readonly refreshButton: Locator;
  readonly marginEmpty: Locator;

  // Snapshots section
  readonly snapshotsSection: Locator;
  readonly snapshotCards: Locator;
  readonly snapshotBadge: Locator;
  readonly snapshotsEmpty: Locator;

  // Reconciliation section
  readonly reconSection: Locator;
  readonly reconcileButton: Locator;
  readonly reconTable: Locator;
  readonly reconEmpty: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.locator('.account-page');

    // Margin section
    this.marginSection = page.locator('.margin-section');
    this.marginCards = page.locator('.margin-card');
    this.syncButton = page.getByRole('button', { name: /sync all/i });
    this.refreshButton = this.marginSection.getByRole('button', { name: /refresh/i });
    this.marginEmpty = this.marginSection.locator('.empty-state');

    // Snapshots section
    this.snapshotsSection = page.locator('.snapshots-section');
    this.snapshotCards = page.locator('.snapshot-card');
    this.snapshotBadge = this.snapshotsSection.locator('.section-badge');
    this.snapshotsEmpty = this.snapshotsSection.locator('.empty-state');

    // Reconciliation section
    this.reconSection = page.locator('.recon-section');
    this.reconcileButton = page.getByRole('button', { name: /reconcile now/i });
    this.reconTable = this.reconSection.locator('.data-table');
    this.reconEmpty = this.reconSection.locator('.empty-state');
  }

  async goto(): Promise<void> {
    await this.page.goto('/account');
    await this.container.waitFor({ state: 'visible' });
  }

  async syncAll(): Promise<void> {
    await this.syncButton.click();
  }

  async refresh(): Promise<void> {
    await this.refreshButton.click();
  }

  async reconcile(): Promise<void> {
    await this.reconcileButton.click();
  }

  async getMarginCard(exchange: string): Promise<Locator> {
    return this.marginCards.filter({ hasText: exchange });
  }
}

import type { Page, Locator } from '@playwright/test';

export class AutoTunePage {
  readonly page: Page;
  readonly container: Locator;
  readonly runsSection: Locator;
  readonly runsTable: Locator;
  readonly runsEmpty: Locator;
  readonly schedulesSection: Locator;
  readonly schedulesTable: Locator;
  readonly schedulesEmpty: Locator;
  readonly triggerButton: Locator;
  readonly triggerModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.autotune-page');
    this.runsSection = page.locator('.runs-section');
    this.runsTable = this.runsSection.locator('.data-table');
    this.runsEmpty = this.runsSection.locator('.empty-state, .empty-inline');
    this.schedulesSection = page.locator('.schedules-section');
    this.schedulesTable = this.schedulesSection.locator('.data-table');
    this.schedulesEmpty = this.schedulesSection.locator('.empty-state, .empty-inline');
    this.triggerButton = page.getByRole('button', { name: /trigger run/i });
    this.triggerModal = page.locator('.ant-modal');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auto-tune');
    await this.container.waitFor({ state: 'visible' });
  }

  async openTriggerModal(): Promise<void> {
    await this.triggerButton.click();
    await this.triggerModal.waitFor({ state: 'visible' });
  }

  async fillTriggerForm(fields: Record<string, string>): Promise<void> {
    for (const [label, value] of Object.entries(fields)) {
      const input = this.triggerModal.locator(
        `.ant-form-item:has-text("${label}") input, .ant-form-item:has-text("${label}") .ant-select`
      );
      if ((await input.count()) > 0) {
        const isSelect = await input.locator('.ant-select').count();
        if (isSelect > 0) {
          await input.click();
          await this.page.locator('.ant-select-item', { hasText: value }).click();
        } else {
          await input.fill(value);
        }
      }
    }
  }

  async submitTrigger(): Promise<void> {
    await this.triggerModal.locator('.ant-btn-primary').click();
  }
}

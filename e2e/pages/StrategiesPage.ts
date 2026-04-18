import type { Page, Locator } from '@playwright/test';

export class StrategiesPage {
  readonly page: Page;

  // Page container
  readonly container: Locator;

  // Action bar
  readonly actionBar: Locator;
  readonly activeCount: Locator;
  readonly reloadButton: Locator;

  // Strategy list (grid)
  readonly strategyGrid: Locator;
  readonly strategyCards: Locator;
  readonly emptyState: Locator;

  // Detail drawer
  readonly drawer: Locator;
  readonly drawerTitle: Locator;
  readonly drawerClose: Locator;

  // Parameters section
  readonly paramsSection: Locator;
  readonly paramsGrid: Locator;
  readonly editParamsButton: Locator;
  readonly saveParamsButton: Locator;
  readonly cancelEditButton: Locator;

  // Audit log section
  readonly auditSection: Locator;
  readonly auditTable: Locator;

  // Error alert
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.locator('.strategies-page');
    this.actionBar = page.locator('.action-bar');
    this.activeCount = page.locator('.active-count');
    this.reloadButton = page.getByRole('button', { name: /reload/i });

    this.strategyGrid = page.locator('.strategy-grid');
    this.strategyCards = page.locator('.strategy-card');
    this.emptyState = page.locator('.strategy-grid .empty-state');

    // Drawer (Ant Design drawer)
    this.drawer = page.locator('.ant-drawer');
    this.drawerTitle = page.locator('.ant-drawer-header .ant-drawer-title');
    this.drawerClose = page.locator('.ant-drawer-header-close, .ant-drawer-close, .ant-drawer .anticon-close').first();

    // Parameters
    this.paramsSection = page.locator('.detail-section:has(.section-title:text("Parameters"))');
    this.paramsGrid = page.locator('.params-grid');
    this.editParamsButton = page.getByRole('button', { name: /edit parameters/i });
    this.saveParamsButton = page.getByRole('button', { name: /save/i });
    this.cancelEditButton = page.getByRole('button', { name: /cancel/i });

    // Audit
    this.auditSection = page.locator('.detail-section:has(.section-title:text("Parameter Audit Log"))');
    this.auditTable = this.auditSection.locator('.data-table');

    this.errorAlert = page.locator('.strategies-page .ant-alert-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/strategies');
    await this.container.waitFor({ state: 'visible' });
  }

  async reload(): Promise<void> {
    await this.reloadButton.click();
  }

  async openStrategyDetails(strategyId: string): Promise<void> {
    const card = this.strategyGrid.locator('.strategy-card', { hasText: strategyId });
    await card.locator('.view-link').click();
    await this.drawer.waitFor({ state: 'visible' });
  }

  async toggleStrategy(strategyId: string): Promise<void> {
    const card = this.strategyGrid.locator('.strategy-card', { hasText: strategyId });
    await card.locator('.ant-switch').click();
  }

  async getStrategyStatus(strategyId: string): Promise<string> {
    const card = this.strategyGrid.locator('.strategy-card', { hasText: strategyId });
    const dot = card.locator('.status-dot');
    const className = await dot.getAttribute('class') || '';
    if (className.includes('running')) return 'running';
    if (className.includes('stopped')) return 'stopped';
    return 'unknown';
  }

  async closeDrawer(): Promise<void> {
    await this.page.keyboard.press('Escape');

    try {
      await this.drawer.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      await this.drawerClose.click();
      await this.drawer.waitFor({ state: 'hidden', timeout: 5000 });
    }
  }

  async startEditParams(): Promise<void> {
    await this.editParamsButton.click();
  }

  async saveParams(): Promise<void> {
    await this.saveParamsButton.click();
  }

  async cancelEditParams(): Promise<void> {
    await this.cancelEditButton.click();
  }
}

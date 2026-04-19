import type { Page, Locator } from '@playwright/test';

export class RiskPage {
  readonly page: Page;

  // Page container
  readonly container: Locator;

  // Kill switch bar
  readonly killSwitchBar: Locator;
  readonly killSwitchLabel: Locator;
  readonly killSwitchIndicator: Locator;
  readonly activateButton: Locator;
  readonly deactivateButton: Locator;

  // Popconfirm dialogs (Ant Design)
  readonly popconfirm: Locator;
  readonly popconfirmOk: Locator;

  // Risk grid sections
  readonly riskGrid: Locator;

  // Risk grid detail sections
  readonly drawdownChart: Locator;
  readonly exposureCard: Locator;
  readonly configCard: Locator;
  readonly eventsCard: Locator;
  readonly eventsTable: Locator;
  readonly eventsEmpty: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.locator('.risk-page');
    this.killSwitchBar = page.locator('.killswitch-bar');
    this.killSwitchLabel = page.locator('.ks-label');
    this.killSwitchIndicator = page.locator('.ks-indicator');
    this.activateButton = page.locator('.killswitch-bar .btn-activate');
    this.deactivateButton = page.locator('.killswitch-bar .ant-btn-dangerous');
    this.popconfirm = page.locator('.ant-popconfirm');
    this.popconfirmOk = page.locator('.ant-popconfirm .ant-btn-primary');
    this.riskGrid = page.locator('.risk-grid');

    this.drawdownChart = this.riskGrid.locator('.risk-cell').first();
    this.exposureCard = this.riskGrid.locator('.risk-cell').nth(1);
    this.configCard = this.riskGrid.locator('.risk-cell').nth(2);
    this.eventsCard = this.riskGrid.locator('.risk-cell').nth(3);
    this.eventsTable = this.eventsCard.locator('.data-table');
    this.eventsEmpty = this.eventsCard.locator('.empty-state, .empty-inline');
  }

  async goto(): Promise<void> {
    await this.page.goto('/risk');
    await this.container.waitFor({ state: 'visible' });
  }

  async activateKillSwitch(): Promise<void> {
    await this.activateButton.click();
    // Confirm in the popconfirm dialog
    await this.popconfirmOk.click();
    // Wait for the bar to reflect the active state
    await this.killSwitchBar.locator('.ks-indicator.on').waitFor({ state: 'visible' });
  }

  async deactivateKillSwitch(): Promise<void> {
    await this.deactivateButton.click();
    // Confirm deactivation in the popconfirm dialog
    await this.popconfirmOk.click();
    // Wait for the active class to be removed
    await this.page.waitForFunction(
      (el: Element | null) => el !== null && !el.classList.contains('active'),
      await this.killSwitchBar.elementHandle({ timeout: 5000 }).catch(() => null),
    );
  }

  async isKillSwitchActive(): Promise<boolean> {
    const barElement = this.killSwitchBar.first();
    return barElement.evaluate((el) => el.classList.contains('active'));
  }
}

import type { Page, Locator } from '@playwright/test';

export class OrdersPage {
  readonly page: Page;

  // Page container
  readonly container: Locator;

  // Order form
  readonly orderForm: Locator;
  readonly symbolInput: Locator;
  readonly buyButton: Locator;
  readonly sellButton: Locator;
  readonly typeSelect: Locator;
  readonly quantityInput: Locator;
  readonly priceInput: Locator;
  readonly submitButton: Locator;

  // Tabs
  readonly tabs: Locator;

  // Open orders tab
  readonly openOrdersTable: Locator;

  // History tab
  readonly historyTable: Locator;

  // Error display
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.locator('.orders-page');

    // Order form selectors (from OrderForm.vue)
    this.orderForm = page.locator('.order-form-card');
    this.symbolInput = this.orderForm.getByLabel('Symbol');
    this.buyButton = this.orderForm.getByRole('button', { name: 'BUY' });
    this.sellButton = this.orderForm.getByRole('button', { name: 'SELL' });
    this.typeSelect = this.orderForm.locator('.ant-select').first();
    this.quantityInput = this.orderForm.getByLabel('Quantity');
    this.priceInput = this.orderForm.getByLabel('Price');
    this.submitButton = this.orderForm.getByRole('button', { name: 'Submit' });

    // Tabs (Ant Design tabs)
    this.tabs = page.locator('.orders-tabs .ant-tabs');

    // Tables
    this.openOrdersTable = page.locator('.orders-page .data-table').first();
    this.historyTable = page.locator('.ant-tabpane-active .data-table');

    // Error
    this.errorAlert = page.locator('.orders-page .ant-alert-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/orders');
    await this.container.waitFor({ state: 'visible' });
  }

  async clickTab(tabLabel: string): Promise<void> {
    const tab = this.page.locator('.ant-tabs-tab', { hasText: tabLabel });
    await tab.click();
  }

  async placeLimitOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): Promise<void> {
    await this.symbolInput.fill(symbol);

    if (side === 'BUY') {
      await this.buyButton.click();
    } else {
      await this.sellButton.click();
    }

    // Select LIMIT type
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: 'LIMIT' }).click();

    await this.quantityInput.fill(String(quantity));
    await this.priceInput.fill(String(price));
    await this.submitButton.click();
  }

  async cancelOrder(orderId: string): Promise<void> {
    // Find the row containing the order ID and click its cancel button
    const row = this.page.locator(`tr:has-text("${orderId}")`);
    await row.getByRole('button', { name: /cancel/i }).click();
  }
}

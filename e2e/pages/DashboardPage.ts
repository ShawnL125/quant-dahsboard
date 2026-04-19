import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  // Page container
  readonly container: Locator;

  // Key sections
  readonly chartsRow: Locator;
  readonly systemStatusBar: Locator;

  // Sidebar navigation
  readonly sidebar: Locator;
  readonly sidebarItems: Locator;
  readonly wsStatusDot: Locator;
  readonly wsStatusText: Locator;

  // Header
  readonly headerTitle: Locator;
  readonly headerSearch: Locator;
  readonly paperTradingBadge: Locator;

  // StatCards section
  readonly statCards: Locator;
  readonly statCardItems: Locator;

  // Charts
  readonly equityChart: Locator;
  readonly positionsDonut: Locator;

  // Recent trades
  readonly tradesCard: Locator;
  readonly tradesTable: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.locator('.dashboard');
    this.chartsRow = page.locator('.dashboard-charts');
    this.systemStatusBar = page.locator('.system-status-bar');

    // Sidebar (defined in SideMenu.vue)
    this.sidebar = page.locator('.sidebar-menu');
    this.sidebarItems = page.locator('.sidebar-item');
    this.wsStatusDot = page.locator('.sidebar-footer .status-dot');
    this.wsStatusText = page.locator('.sidebar-footer .status-text');

    // Header (defined in AppLayout.vue)
    this.headerTitle = page.locator('.header-title');
    this.headerSearch = page.locator('.header-search input');
    this.paperTradingBadge = page.locator('.header-right .ant-tag');

    // StatCards section
    this.statCards = page.locator('.stat-cards');
    this.statCardItems = page.locator('.stat-card');

    // Charts
    this.equityChart = page.locator('.chart-equity');
    this.positionsDonut = page.locator('.chart-positions');

    // Recent trades
    this.tradesCard = page.locator('.trades-card');
    this.tradesTable = page.locator('.trades-table');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.container.waitFor({ state: 'visible' });
  }

  async navigateTo(menuLabel: string): Promise<void> {
    await this.sidebar.locator('.sidebar-item', { hasText: menuLabel }).click();
  }

  getSidebarItem(label: string): Locator {
    return this.sidebar.locator('.sidebar-item', { hasText: label });
  }

  getActiveSidebarItem(): Locator {
    return this.sidebar.locator('.sidebar-item.active');
  }

  async getStatCardValue(label: string): Promise<string> {
    const card = this.statCardItems.filter({ hasText: label });
    return card.locator('.stat-value').innerText();
  }
}

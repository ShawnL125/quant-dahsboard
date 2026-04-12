# Dashboard Figma Style Redesign

Date: 2026-04-11

## Overview

Redesign all 5 pages of the quantitative trading dashboard to match the Figma "Dashboard (Community)" design style. Approach: customize Ant Design Vue theme tokens + CSS overrides, keeping all existing functional logic intact.

**Scope**: Dashboard, Orders, Strategies, Backtest, System — full redesign.

## Global Theme

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary Dark | `#1e3a8a` | Sidebar logo text, headings, deep accents |
| Primary | `#3b82f6` | Active states, buttons, links, chart main color, sidebar highlight |
| Success | `#10b981` | Profit, BUY, positive trends |
| Error | `#ef4444` | Loss, SELL, negative trends |
| Warning | `#f59e0b` | Warning states, paper trading badge |
| Background | `#f0f2f5` | Page background |
| Card | `#ffffff` | Card backgrounds |
| Text Primary | `#1e293b` | Main text |
| Text Secondary | `#64748b` | Secondary text |
| Text Muted | `#94a3b8` | Labels, timestamps |
| Border | `#e2e8f0` | Card borders, dividers |
| Hover | `#f1f5f9` | Menu item hover, table row hover |

### Typography

- Font: **Inter** (Google Fonts CDN)
- Headings: 14-24px, weight 600-700
- Stat numbers: 20-28px, weight 700
- Body: 13-14px, weight 400
- Labels: 11-12px, weight 500

### Ant Design Theme Token Overrides

```js
{
  token: {
    colorPrimary: '#3b82f6',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
  }
}
```

### Spacing & Visual

- Card border-radius: 12px
- Button border-radius: 8px
- Label/tag border-radius: 6px
- Card shadow: `0 1px 3px rgba(0,0,0,0.06)`
- Card padding: 20px
- Card gap: 16px
- Content padding: 24px

## Layout

### Sidebar

- Width: 220px, non-collapsible
- Background: `#ffffff`, right border 1px `#e2e8f0`
- Logo area: top 24px padding, blue gradient circle icon + "Quant" text (`#1e3a8a`, 18px, weight 700)
- Menu items:
  - Default: `#64748b` text, 14px, icon + label, 8px border-radius
  - Active: `#3b82f6` background, white text and icon
  - Hover: `#f1f5f9` background
  - Item spacing: 4px margin, 8px horizontal padding
- Bottom: WebSocket connection status indicator (green/red dot)

### Header Bar

- Background: `#ffffff`, bottom border 1px `#e2e8f0`
- Height: 56px
- Left: page title (18px, weight 700, `#1e293b`) + subtitle (12px, `#94a3b8`)
- Right: search input (bg `#f1f5f9`, radius 8px), notification icon with badge, paper trading mode tag (orange)
- Not fixed position, scrolls with content

### Content Area

- Background: `#f0f2f5`
- Padding: 24px
- Card gap: 16px

## Page Designs

### 1. Dashboard

**Row 1 — Stat Cards (4 columns)**

Each card:
- Top left: label name (12px, `#94a3b8`) + top right: time pill (light blue/red bg)
- Core number (22-24px, weight 700) — green for profit, red for loss, dark blue for neutral
- Trend arrow + percentage (11px) — green positive / red negative
- Bottom: sparkline mini line chart (40px height)

Metrics: Net Equity, Available Balance, Total P&L, Unrealized P&L

**Row 2 — Charts (2 columns: 2/3 + 1/3)**

Left — Equity Curve:
- Title "Equity Curve" + time range toggle (7d / 30d / 90d)
- ECharts area chart: `#3b82f6` line + gradient fill
- No grid lines, hidden Y-axis, X-axis date labels
- Height: 280px

Right — Positions Donut:
- Title "Positions"
- Donut chart grouped by P&L (green/blue/red segments)
- Center: total position count
- Legend: color dot + label + count

**Row 3 — System Status Bar**

Horizontal row of 3 small tags:
- Exchange count (blue bg)
- Active strategies count (green bg)
- System uptime (gray bg)

**Row 4 — Recent Trades Table**

- Title "Recent Trades" + "View All →" link
- Columns: Symbol, Side, Price, Quantity, P&L, Time
- Side: BUY green pill, SELL red pill
- P&L: green positive / red negative, weight 600
- Row hover: light gray bg
- Default 5 rows, no pagination (View All links to Orders page)

### 2. Orders

**Row 1 — Place Order Card**

- Title "Place Order"
- Inline form layout, each field 120-160px width
- Fields: Exchange, Symbol, Side, Type, Price, Amount
- Side selector: button group (BUY green / SELL red), filled on select
- Submit button: blue `#3b82f6`, radius 8px, right-aligned

**Row 2 — Open Orders Table**

- Title "Open Orders" + count badge
- Columns: Time, Exchange, Symbol, Side, Type, Price, Amount, Filled, Action
- Action: red "Cancel" text button
- Empty state: centered gray text "No open orders"
- No pagination

**Row 3 — Order History Table**

- Title "Order History" + count badge
- Columns: Time, Exchange, Symbol, Side, Type, Price, Amount, Status, Avg Price
- Status: Filled green pill, Canceled gray pill, Partial blue pill
- Pagination: 15 per page
- Row hover: light gray bg

### 3. Strategies

**Row 1 — Action Bar**

- Title "Strategies" + blue "Reload" button (with loading state)
- Right: count summary "3 Active / 5 Total"

**Row 2 — Strategy Cards (2-column grid)**

Each card:
- Header: strategy name (16px, weight 600) + Ant Switch (right-aligned)
- Body: 2 rows of key-value metrics
  - Row 1: Exchange / Symbol / Timeframe
  - Row 2: P&L / Win Rate / Trades
- Footer: "View Details" text link → opens detail drawer

**Detail Drawer**

- Width: 480px, white background
- Top: strategy name + running status badge
- Middle: key metrics grid (4 columns)
- Bottom: strategy params JSON display (collapsible panel)

### 4. Backtest

**Row 1 — Run Backtest Card**

- Title "Run Backtest"
- Inline form: Strategy, Symbol, Timeframe, Start Date, End Date
- Blue "Run" button right-aligned
- Running state: button shows loading + blue spinning badge top-right

**Row 2 — Result Metrics (6-column grid, shown only when results exist)**

Metrics: Total Return, Max Drawdown, Sharpe Ratio, Win Rate, Total Trades, Profit Factor
- Each: label (12px gray) + value (20px, weight 700)
- Positive values green, negative red

**Row 3 — Backtest History Table**

- Title "Backtest History" + count badge
- Columns: Date, Strategy, Symbol, Return, Drawdown, Sharpe, Trades, Status
- Status: Completed green pill / Failed red pill / Running blue pill
- Pagination: 10 per page

### 5. System

**Row 1 — Health Status Cards (3 columns)**

- Liveness: green/red circle icon + "Alive" / "Down" text
- Readiness: same pattern
- Uptime: large number display (e.g., "15d 7h 32m")

**Row 2 — Components Card**

- Title "Components"
- Horizontal flex layout, each component in a mini card:
  - Component name + description (one line)
  - Right: green dot = OK, red dot = Error
- Components separated by vertical dividers

**Row 3 — Configuration Card**

- Title "Configuration"
- Ant Design Collapse, one panel per config section
- Key-value pairs in code style (monospace font, light gray bg)

## Implementation Approach

- **Framework**: Keep Ant Design Vue v4, customize via ConfigProvider theme tokens
- **Charts**: Keep ECharts, create shared theme config matching blue palette
- **Font**: Load Inter via Google Fonts in index.html
- **Custom components**: New StatCard component for dashboard metrics
- **CSS**: Minimal overrides in a single `theme.css` file for elements not covered by theme tokens
- **No new dependencies**: Achieve the look with existing tools

## Files to Modify/Create

### Modified
- `src/main.ts` — theme token config, Inter font import
- `src/App.vue` — global styles, font loading
- `src/components/layout/AppLayout.vue` — sidebar and header redesign
- `src/components/layout/SideMenu.vue` — light sidebar with new menu style
- `src/views/DashboardView.vue` — new card layout
- `src/views/OrdersView.vue` — card-based form, styled tables
- `src/views/StrategiesView.vue` — card grid layout
- `src/views/BacktestView.vue` — styled metrics and form
- `src/views/SystemView.vue` — status cards, component display
- `index.html` — Inter font link

### Created
- `src/components/dashboard/StatCard.vue` — reusable stat card with sparkline
- `src/assets/styles/theme.css` — custom CSS overrides
- `src/utils/chart-theme.ts` — ECharts theme config

# Order History Enhancement — Design Spec

**Date:** 2026-04-13
**Priority:** P0 (live trading prerequisite)
**Backend:** Phase 20 — 2 existing REST endpoints

## Overview

Enhance the existing Orders page History section with:
1. Tab-based layout separating Open Orders and Order History
2. Symbol/exchange filtering on history query
3. Expandable rows showing order event timeline (CREATED → SUBMITTED → FILLED lifecycle)

## What Already Exists

- `ordersApi.getOrderHistory()` — fetches history (no filter params yet)
- `ordersApi.getOrderEvents(orderId)` — fetches event timeline
- `OrderEvent` type defined in `src/api/orders.ts`
- `OrdersView.vue` already renders history table with client-side pagination
- Store already calls `getOrderHistory()` in `fetchOrders()`

## Changes

### API Enhancement — `src/api/orders.ts`

Add optional filter params to `getOrderHistory`:
```typescript
getOrderHistory: (params?: { symbol?: string; exchange?: string; limit?: number }) =>
  apiClient.get<Order[]>('/orders/history', { params }).then((r) => r.data),
```

### Store Enhancement — `src/stores/orders.ts`

Add:
- `orderEvents: Record<string, OrderEvent[]>` — cached events per order
- `fetchOrderEvents(orderId: string)` — fetch and cache events
- `historyFilters: { symbol: string; exchange: string }` — reactive filter state

### Type — `src/types/index.ts`

Move `OrderEvent` from `src/api/orders.ts` to `src/types/index.ts` for consistency.

### Component: OrderHistoryTable — `src/components/orders/OrderHistoryTable.vue`

Extract history table from OrdersView into its own component with:
- Symbol/exchange filter inputs
- Expandable rows (click to expand event timeline)
- Server-side pagination via `limit` param

### Component: OrderEventTimeline — `src/components/orders/OrderEventTimeline.vue`

Vertical timeline displayed in expanded row:
- Each event shows: timestamp, event_type (status change), icon
- Visual: vertical line with dots, CREATED → SUBMITTED → FILLED progression
- Color-coded: success for FILLED, default for intermediate states

### Page Refactor — `src/views/OrdersView.vue`

Replace the current flat layout with tabs:
```
┌──────────────────────────────────────┐
│  Order Form                          │
├──────────────────────────────────────┤
│  [Open Orders]  [History]     tabs   │
├──────────────────────────────────────┤
│  Tab content (existing components)   │
└──────────────────────────────────────┘
```

- **Open Orders tab:** existing `OpenOrdersTable` component
- **History tab:** new `OrderHistoryTable` component

## Out of Scope

- Editing/canceling historical orders
- Exporting order history
- Advanced date range filtering

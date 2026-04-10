export const WS_CHANNELS = {
  TRADES: 'trades',
  POSITIONS: 'positions',
  ORDERS: 'orders',
  PNL: 'pnl',
  SYSTEM: 'system',
} as const;

export const ORDER_SIDES = [
  { label: 'BUY', value: 'BUY' },
  { label: 'SELL', value: 'SELL' },
] as const;

export const ORDER_TYPES = [
  { label: 'Market', value: 'MARKET' },
  { label: 'Limit', value: 'LIMIT' },
] as const;

export const POLL_INTERVAL_MS = 5000;

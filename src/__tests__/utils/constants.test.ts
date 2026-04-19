import { describe, it, expect } from 'vitest';
import { WS_CHANNELS, ORDER_SIDES, ORDER_TYPES, POLL_INTERVAL_MS } from '@/utils/constants';

describe('constants', () => {
  it('exports WS_CHANNELS with required keys', () => {
    expect(WS_CHANNELS.TRADES).toBe('trades');
    expect(WS_CHANNELS.POSITIONS).toBe('positions');
    expect(WS_CHANNELS.ORDERS).toBe('orders');
    expect(WS_CHANNELS.PNL).toBe('pnl');
    expect(WS_CHANNELS.SYSTEM).toBe('system');
  });

  it('exports ORDER_SIDES with BUY and SELL', () => {
    expect(ORDER_SIDES).toHaveLength(2);
    expect(ORDER_SIDES[0]).toEqual({ label: 'BUY', value: 'BUY' });
    expect(ORDER_SIDES[1]).toEqual({ label: 'SELL', value: 'SELL' });
  });

  it('exports ORDER_TYPES with Market and Limit', () => {
    expect(ORDER_TYPES).toHaveLength(2);
    expect(ORDER_TYPES[0]).toEqual({ label: 'Market', value: 'MARKET' });
    expect(ORDER_TYPES[1]).toEqual({ label: 'Limit', value: 'LIMIT' });
  });

  it('exports POLL_INTERVAL_MS as 5000', () => {
    expect(POLL_INTERVAL_MS).toBe(5000);
  });
});

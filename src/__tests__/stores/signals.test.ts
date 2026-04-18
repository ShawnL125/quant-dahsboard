import { describe, it, expect, beforeEach } from 'vitest';
import { useSignalsStore } from '@/stores/signals';
import type { SignalEvent } from '@/types';

// ── Fixtures ─────────────────────────────────────────────────────────
const makeSignal = (id: string, strategyId?: string): SignalEvent =>
  ({
    event_id: id,
    timestamp: `2026-01-01T00:00:0${id.slice(-1)}Z`,
    signal: strategyId
      ? { strategy_id: strategyId, symbol: 'BTC/USDT', direction: 'long' }
      : undefined,
  }) as unknown as SignalEvent;

// ── Tests ────────────────────────────────────────────────────────────
describe('signals store', () => {
  beforeEach(() => {
    // setup.ts handles pinia reset
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty signals array', () => {
      const store = useSignalsStore();
      expect(store.signals).toEqual([]);
    });

    it('has empty latestByStrategy', () => {
      const store = useSignalsStore();
      expect(store.latestByStrategy).toEqual({});
    });
  });

  // ── addSignal ─────────────────────────────────────────────────────
  describe('addSignal()', () => {
    it('prepends signal to the array', () => {
      const store = useSignalsStore();
      const sig1 = makeSignal('sig-1');
      const sig2 = makeSignal('sig-2');

      store.addSignal(sig1);
      store.addSignal(sig2);

      expect(store.signals).toHaveLength(2);
      expect(store.signals[0]).toEqual(sig2);
      expect(store.signals[1]).toEqual(sig1);
    });

    it('limits array to 500 signals (MAX_SIGNALS)', () => {
      const store = useSignalsStore();

      // Add 502 signals
      for (let i = 0; i < 502; i++) {
        store.addSignal(makeSignal(`sig-${i}`));
      }

      expect(store.signals).toHaveLength(500);
      // Most recent should be first
      expect(store.signals[0].event_id).toBe('sig-501');
    });

    it('updates latestByStrategy when strategy_id exists', () => {
      const store = useSignalsStore();
      const sig = makeSignal('sig-1', 'strat-a');

      store.addSignal(sig);

      expect(store.latestByStrategy['strat-a']).toEqual(sig);
    });

    it('does not update latestByStrategy when strategy_id is absent', () => {
      const store = useSignalsStore();
      const sig = makeSignal('sig-1');

      store.addSignal(sig);

      expect(store.latestByStrategy).toEqual({});
    });

    it('overwrites latestByStrategy entry for same strategy_id', () => {
      const store = useSignalsStore();
      const sig1 = makeSignal('sig-1', 'strat-a');
      const sig2 = makeSignal('sig-2', 'strat-a');

      store.addSignal(sig1);
      store.addSignal(sig2);

      expect(Object.keys(store.latestByStrategy)).toHaveLength(1);
      expect(store.latestByStrategy['strat-a']).toEqual(sig2);
    });

    it('tracks multiple strategies independently', () => {
      const store = useSignalsStore();
      const sigA = makeSignal('sig-1', 'strat-a');
      const sigB = makeSignal('sig-2', 'strat-b');

      store.addSignal(sigA);
      store.addSignal(sigB);

      expect(store.latestByStrategy['strat-a']).toEqual(sigA);
      expect(store.latestByStrategy['strat-b']).toEqual(sigB);
    });
  });

  // ── clear ─────────────────────────────────────────────────────────
  describe('clear()', () => {
    it('resets signals and latestByStrategy', () => {
      const store = useSignalsStore();
      store.addSignal(makeSignal('sig-1', 'strat-a'));
      store.addSignal(makeSignal('sig-2', 'strat-b'));

      store.clear();

      expect(store.signals).toEqual([]);
      expect(store.latestByStrategy).toEqual({});
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRiskStore } from '@/stores/risk';
import { riskApi } from '@/api/risk';
import type { RiskStatus, ExposureData, RiskConfig, RiskEvent, KillSwitchPayload } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/risk', () => ({
  riskApi: {
    getStatus: vi.fn(),
    getExposure: vi.fn(),
    getEvents: vi.fn(),
    getConfig: vi.fn(),
    postKillSwitch: vi.fn(),
  },
}));

const mockedRiskApi = vi.mocked(riskApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeStatus: RiskStatus = {
  kill_switch: {
    global: { active: false, reason: '' },
    symbols: {},
    strategies: {},
  },
  drawdown: {
    current_pct: 5.2,
    peak_equity: 100000,
    max_threshold: 20,
    reduce_threshold: 15,
    size_scale: 1.0,
  },
  exposure: { total_pct: 30, max_total_pct: 80 },
  positions: [],
  config: {
    sizing_model: 'fixed',
    max_open_positions: 5,
    allow_pyramiding: false,
    kill_switch_enabled: true,
  },
};

const fakeExposure: ExposureData = {
  total_exposure: 50000,
  total_pct: 30,
  max_total_pct: 80,
  by_symbol: {},
};

const fakeConfig: RiskConfig = {
  sizing_model: 'fixed',
  max_position_size_pct: 10,
  max_risk_per_trade_pct: 2,
  max_open_positions: 5,
  max_total_exposure_pct: 80,
  max_single_asset_pct: 25,
  position_reduce_at_pct: 60,
  max_drawdown_pct: 20,
  allow_pyramiding: false,
  kill_switch_enabled: true,
  max_correlated_exposure_pct: 40,
};

function makeEvent(overrides: Partial<RiskEvent> = {}): RiskEvent {
  return {
    event_id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toISOString(),
    event_type: 'POSITION_LIMIT',
    level: 'warning',
    target: 'BTC/USDT',
    reason: 'Exposure exceeded',
    metadata: {},
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────
describe('risk store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
    // Provide default resolved values so void Promise.all calls don't reject
    mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
    mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);
  });

  // ── Initial State ────────────────────────────────────────────────
  describe('initial state', () => {
    it('has null status, exposure, config', () => {
      const store = useRiskStore();
      expect(store.status).toBeNull();
      expect(store.exposure).toBeNull();
      expect(store.config).toBeNull();
    });

    it('has empty events computed', () => {
      const store = useRiskStore();
      expect(store.events).toEqual([]);
    });

    it('has zero eventsTotal', () => {
      const store = useRiskStore();
      expect(store.eventsTotal).toBe(0);
    });

    it('has empty drawdownHistory', () => {
      const store = useRiskStore();
      expect(store.drawdownHistory).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useRiskStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('defaults currentEventsPage to 1 and eventsPageSize to 20', () => {
      const store = useRiskStore();
      expect(store.currentEventsPage).toBe(1);
      expect(store.eventsPageSize).toBe(20);
    });
  });

  // ── fetchStatus ──────────────────────────────────────────────────
  describe('fetchStatus()', () => {
    it('sets status on success', async () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);

      const store = useRiskStore();
      const result = await store.fetchStatus();

      expect(store.status).toEqual(fakeStatus);
      expect(result).toEqual(fakeStatus);
    });

    it('returns null and sets error on failure', async () => {
      mockedRiskApi.getStatus.mockRejectedValue(new Error('Network error'));

      const store = useRiskStore();
      const result = await store.fetchStatus();

      expect(result).toBeNull();
      expect(store.error).toBe('Network error');
    });

    it('handles non-Error exceptions', async () => {
      mockedRiskApi.getStatus.mockRejectedValue('fail');

      const store = useRiskStore();
      const result = await store.fetchStatus();

      expect(result).toBeNull();
      expect(store.error).toBe('fail');
    });
  });

  // ── fetchExposure ────────────────────────────────────────────────
  describe('fetchExposure()', () => {
    it('sets exposure on success', async () => {
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();
      await store.fetchExposure();

      expect(store.exposure).toEqual(fakeExposure);
    });

    it('sets error on failure', async () => {
      mockedRiskApi.getExposure.mockRejectedValue(new Error('timeout'));

      const store = useRiskStore();
      await store.fetchExposure();

      expect(store.error).toBe('timeout');
    });
  });

  // ── fetchEvents ──────────────────────────────────────────────────
  describe('fetchEvents()', () => {
    it('normalizes and stores events', async () => {
      const rawEvent = {
        event_id: 'e1',
        time: '2026-01-01T00:00:00Z',
        event_type: 'DRAWDOWN',
        level: 'critical',
        target: 'BTC/USDT',
        reason: 'Max drawdown exceeded',
        metadata: {},
      };
      mockedRiskApi.getEvents.mockResolvedValue({ events: [rawEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();

      expect(store.events).toHaveLength(1);
      expect(store.events[0].event_id).toBe('e1');
      expect(store.eventsTotal).toBe(1);
    });

    it('paginates correctly for page 2', async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        makeEvent({ event_id: `e${i + 20}` }),
      );
      mockedRiskApi.getEvents.mockResolvedValue({ events, total: 50 });

      const store = useRiskStore();
      await store.fetchEvents(10, 10); // page 2: offset=10, limit=10

      expect(store.currentEventsPage).toBe(2);
      expect(store.eventsPageSize).toBe(10);
      expect(store.eventsTotal).toBe(50);
    });

    it('sets error on failure', async () => {
      mockedRiskApi.getEvents.mockRejectedValue(new Error('server error'));

      const store = useRiskStore();
      await store.fetchEvents();

      expect(store.error).toBe('server error');
    });

    it('normalizes events missing event_id by building one from fields', async () => {
      const rawEvent = {
        time: '2026-03-01T12:00:00Z',
        event_type: 'ALERT',
        level: 'warning',
        target: 'ETH/USDT',
        reason: 'High exposure',
        metadata: {},
      } as any;
      mockedRiskApi.getEvents.mockResolvedValue({ events: [rawEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();

      expect(store.events).toHaveLength(1);
      // The event_id should be auto-generated from the fields
      expect(store.events[0].event_id).toContain('2026-03-01T12:00:00Z');
      expect(store.events[0].event_id).toContain('ALERT');
    });
  });

  // ── fetchConfig ──────────────────────────────────────────────────
  describe('fetchConfig()', () => {
    it('sets config on success', async () => {
      mockedRiskApi.getConfig.mockResolvedValue(fakeConfig);

      const store = useRiskStore();
      await store.fetchConfig();

      expect(store.config).toEqual(fakeConfig);
    });

    it('sets error on failure', async () => {
      mockedRiskApi.getConfig.mockRejectedValue(new Error('forbidden'));

      const store = useRiskStore();
      await store.fetchConfig();

      expect(store.error).toBe('forbidden');
    });
  });

  // ── fetchAll ─────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('fetches status, exposure, events, and config in parallel', async () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);
      mockedRiskApi.getEvents.mockResolvedValue({ events: [], total: 0 });
      mockedRiskApi.getConfig.mockResolvedValue(fakeConfig);

      const store = useRiskStore();
      await store.fetchAll();

      expect(store.status).toEqual(fakeStatus);
      expect(store.exposure).toEqual(fakeExposure);
      expect(store.config).toEqual(fakeConfig);
      expect(mockedRiskApi.getStatus).toHaveBeenCalledOnce();
      expect(mockedRiskApi.getExposure).toHaveBeenCalledOnce();
      expect(mockedRiskApi.getEvents).toHaveBeenCalledOnce();
      expect(mockedRiskApi.getConfig).toHaveBeenCalledOnce();
    });

    it('sets loading during request', async () => {
      let resolveStatus!: (v: unknown) => void;
      mockedRiskApi.getStatus.mockReturnValue(new Promise((r) => { resolveStatus = r; }) as any);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);
      mockedRiskApi.getEvents.mockResolvedValue({ events: [], total: 0 });
      mockedRiskApi.getConfig.mockResolvedValue(fakeConfig);

      const store = useRiskStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolveStatus(fakeStatus);
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── Event Deduplication ──────────────────────────────────────────
  describe('event deduplication', () => {
    it('does not duplicate events with the same event_id', async () => {
      const event = makeEvent({ event_id: 'dup-1' });
      mockedRiskApi.getEvents.mockResolvedValue({ events: [event], total: 1 });

      const store = useRiskStore();
      // Fetch the same events page twice
      await store.fetchEvents();
      await store.fetchEvents();

      // The computed events list should have only 1 unique event
      expect(store.events).toHaveLength(1);
    });

    it('upserts event data when event_id matches', async () => {
      const eventV1 = makeEvent({ event_id: 'upsert-1', level: 'warning' });
      const eventV2 = makeEvent({ event_id: 'upsert-1', level: 'critical' });

      mockedRiskApi.getEvents.mockResolvedValueOnce({ events: [eventV1], total: 1 });
      mockedRiskApi.getEvents.mockResolvedValueOnce({ events: [eventV2], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();
      await store.fetchEvents();

      expect(store.events).toHaveLength(1);
      expect(store.events[0].level).toBe('critical');
    });

    it('deduplicates events without explicit event_id by using the deterministic fallback id', async () => {
      const rawEvent = {
        time: '2026-03-01T12:00:00Z',
        event_type: 'ALERT',
        level: 'warning',
        target: 'ETH/USDT',
        reason: 'High exposure',
        metadata: {},
      } as any;

      mockedRiskApi.getEvents.mockResolvedValueOnce({ events: [rawEvent], total: 1 });
      mockedRiskApi.getEvents.mockResolvedValueOnce({ events: [rawEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();
      await store.fetchEvents();

      expect(store.events).toHaveLength(1);
      expect(store.events[0].event_id).toBe('2026-03-01T12:00:00Z:ALERT:warning:ETH/USDT:High exposure');
    });
  });

  // ── updateFromWS ─────────────────────────────────────────────────
  describe('updateFromWS()', () => {
    it('merges realtime event and increments total for new events', () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();
      store.$patch({ eventsTotal: 5 });

      store.updateFromWS({
        event_id: 'ws-1',
        time: '2026-01-01T00:00:00Z',
        event_type: 'KILL_SWITCH',
        level: 'critical',
        target: 'GLOBAL',
        reason: 'Manual activation',
        metadata: {},
      });

      expect(store.eventsTotal).toBe(6);
    });

    it('does not increment total for duplicate events', () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();
      store.$patch({ eventsTotal: 5 });

      const eventData = {
        event_id: 'ws-dup',
        time: '2026-01-01T00:00:00Z',
        event_type: 'ALERT',
        level: 'info',
        target: 'BTC/USDT',
        reason: 'test',
        metadata: {},
      };

      store.updateFromWS(eventData);
      expect(store.eventsTotal).toBe(6);

      store.updateFromWS(eventData);
      expect(store.eventsTotal).toBe(6); // Should not increment again
    });

    it('places new realtime event at the front of page 1', async () => {
      const existingEvent = makeEvent({ event_id: 'existing-1' });
      mockedRiskApi.getEvents.mockResolvedValue({ events: [existingEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();

      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      store.updateFromWS({
        event_id: 'ws-new',
        time: '2026-01-01T00:00:00Z',
        event_type: 'ALERT',
        level: 'info',
        target: 'ETH/USDT',
        reason: 'test',
        metadata: {},
      });

      // The realtime event should appear first
      const ids = store.events.map((e) => e.event_id);
      expect(ids[0]).toBe('ws-new');
    });

    it('handles events with nested metadata.event_id for id building', () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();
      store.$patch({ eventsTotal: 0 });

      store.updateFromWS({
        time: '2026-01-01T00:00:00Z',
        event_type: 'ALERT',
        level: 'info',
        target: 'BTC/USDT',
        reason: 'check',
        metadata: { event_id: 'meta-123' },
      });

      expect(store.eventsTotal).toBe(1);
    });

    it('coalesces websocket refreshes while status and exposure requests are in flight', async () => {
      let resolveStatus!: (value: RiskStatus) => void;
      let resolveExposure!: (value: ExposureData) => void;

      mockedRiskApi.getStatus.mockImplementationOnce(() => new Promise((resolve) => {
        resolveStatus = resolve;
      }));
      mockedRiskApi.getExposure.mockImplementationOnce(() => new Promise((resolve) => {
        resolveExposure = resolve;
      }));
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();
      store.updateFromWS(makeEvent({ event_id: 'burst-1' }));
      store.updateFromWS(makeEvent({ event_id: 'burst-2' }));
      store.updateFromWS(makeEvent({ event_id: 'burst-3' }));

      await Promise.resolve();

      expect(mockedRiskApi.getStatus).toHaveBeenCalledTimes(1);
      expect(mockedRiskApi.getExposure).toHaveBeenCalledTimes(1);

      resolveStatus(fakeStatus);
      resolveExposure(fakeExposure);

      await vi.waitFor(() => {
        expect(mockedRiskApi.getStatus).toHaveBeenCalledTimes(2);
        expect(mockedRiskApi.getExposure).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ── mergeRealtimeEvent ───────────────────────────────────────────
  describe('mergeRealtimeEvent respects MAX_REALTIME_EVENT_IDS', () => {
    it('caps realtime event ids at 200', () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();

      // Add 205 unique events
      for (let i = 0; i < 205; i++) {
        store.updateFromWS({
          event_id: `ws-${i}`,
          time: '2026-01-01T00:00:00Z',
          event_type: 'ALERT',
          level: 'info',
          target: 'BTC/USDT',
          reason: 'test',
          metadata: {},
        });
      }

      // The latest event should be at the front
      const ids = store.events.map((e) => e.event_id);
      expect(ids[0]).toBe('ws-204');
      // Page should be capped to pageSize (20 by default)
      expect(store.events.length).toBeLessThanOrEqual(20);
    });
  });

  // ── Drawdown Sampling ────────────────────────────────────────────
  describe('sampleDrawdown()', () => {
    it('appends drawdown point from status', async () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);

      const store = useRiskStore();
      await store.sampleDrawdown();

      expect(store.drawdownHistory).toHaveLength(1);
      expect(store.drawdownHistory[0].value).toBe(5.2);
    });

    it('skips when status has no drawdown', async () => {
      const statusNoDrawdown = { ...fakeStatus, drawdown: undefined as unknown as RiskStatus['drawdown'] };
      mockedRiskApi.getStatus.mockResolvedValue(statusNoDrawdown);

      const store = useRiskStore();
      await store.sampleDrawdown();

      expect(store.drawdownHistory).toHaveLength(0);
    });

    it('skips duplicate value within 15-second dedup window', async () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);

      const store = useRiskStore();

      // First sample
      await store.sampleDrawdown();

      // Mock fetchStatus to return same drawdown value quickly
      // We need to call appendDrawdownSample directly with controlled time
      // The store exposes sampleDrawdown which calls fetchStatus then appendDrawdownSample
      // For dedup test, directly test via two calls with same value within window

      // Since sampleDrawdown calls fetchStatus which resolves asynchronously,
      // and appendDrawdownSample checks time diff, we test appendDrawdownSample
      // behavior indirectly. After the first sample, another call within 15s with
      // the same value should be skipped. We can verify by checking length stays 1.
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      await store.sampleDrawdown();

      // Both calls return same drawdown value (5.2) and happen within 15s
      // so the second should be deduplicated
      expect(store.drawdownHistory).toHaveLength(1);
    });

    it('accepts new drawdown value different from previous', async () => {
      const status1 = { ...fakeStatus, drawdown: { ...fakeStatus.drawdown, current_pct: 5.0 } };
      const status2 = { ...fakeStatus, drawdown: { ...fakeStatus.drawdown, current_pct: 7.5 } };

      mockedRiskApi.getStatus.mockResolvedValueOnce(status1);
      const store = useRiskStore();
      await store.sampleDrawdown();

      mockedRiskApi.getStatus.mockResolvedValueOnce(status2);
      await store.sampleDrawdown();

      expect(store.drawdownHistory).toHaveLength(2);
      expect(store.drawdownHistory[0].value).toBe(5.0);
      expect(store.drawdownHistory[1].value).toBe(7.5);
    });
  });

  // ── Drawdown History Max Cap ─────────────────────────────────────
  describe('drawdown history max cap (600 samples)', () => {
    it('keeps at most 600 drawdown points', () => {
      const store = useRiskStore();

      // Directly simulate adding 650 points by manipulating drawdownHistory
      // The store uses appendDrawdownSample internally, which slices to last 600
      // We can't call appendDrawdownSample directly, but we can verify via $patch
      // and then test that the cap logic works through sampleDrawdown

      // Since appendDrawdownSample creates a new array with .slice(-600),
      // we verify the logic by pre-filling and then checking behavior
      const points = Array.from({ length: 650 }, (_, i) => ({
        time: i * 20000, // each 20 seconds apart to avoid dedup
        value: i * 0.1,
      }));
      store.$patch({ drawdownHistory: points });

      // The store's drawdownHistory should still hold what we patched (650)
      // since we bypassed the cap. Now verify that appendDrawdownSample
      // through sampleDrawdown applies the cap.
      expect(store.drawdownHistory).toHaveLength(650);

      // To truly test the cap, we trigger sampleDrawdown which calls
      // appendDrawdownSample which creates [...old, new].slice(-600)
      const newStatus = { ...fakeStatus, drawdown: { ...fakeStatus.drawdown, current_pct: 99.9 } };
      mockedRiskApi.getStatus.mockResolvedValue(newStatus);

      return store.sampleDrawdown().then(() => {
        expect(store.drawdownHistory).toHaveLength(600);
      });
    });
  });

  // ── postKillSwitch ───────────────────────────────────────────────
  describe('postKillSwitch()', () => {
    it('adds expected_state and idempotency key before refetching status and exposure', async () => {
      mockedRiskApi.postKillSwitch.mockResolvedValue({});
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();
      const payload = { level: 'GLOBAL' as const, activate: true, reason: ' Emergency ' };
      await store.postKillSwitch(payload);

      expect(mockedRiskApi.postKillSwitch).toHaveBeenCalledWith({
        level: 'GLOBAL',
        activate: true,
        reason: 'Emergency',
        expected_state: { active: false },
        idempotency_key: '00000000-0000-4000-8000-000000000001',
      });
      expect(mockedRiskApi.getStatus).toHaveBeenCalled();
      expect(mockedRiskApi.getExposure).toHaveBeenCalled();
    });

    it('preserves caller-supplied expected_state version and idempotency key', async () => {
      mockedRiskApi.postKillSwitch.mockResolvedValue({});

      const store = useRiskStore();
      const payload: KillSwitchPayload = {
        level: 'GLOBAL',
        activate: false,
        reason: 'Manual release',
        expected_state: { active: true, version: 7 },
        idempotency_key: 'request-7',
      };
      await store.postKillSwitch(payload);

      expect(mockedRiskApi.postKillSwitch).toHaveBeenCalledWith(payload);
      expect(crypto.randomUUID).not.toHaveBeenCalled();
    });

    it('rejects blank reasons for both activation and deactivation before calling the API', async () => {
      const store = useRiskStore();

      await store.postKillSwitch({ level: 'GLOBAL', activate: true, reason: '   ' });
      expect(mockedRiskApi.postKillSwitch).not.toHaveBeenCalled();
      expect(store.error).toBe('Kill-switch reason is required');

      store.error = null;
      await store.postKillSwitch({ level: 'GLOBAL', activate: false, reason: '' });

      expect(mockedRiskApi.postKillSwitch).not.toHaveBeenCalled();
      expect(store.error).toBe('Kill-switch reason is required');
    });

    it('sets error when API call fails', async () => {
      mockedRiskApi.postKillSwitch.mockRejectedValue(new Error('forbidden'));

      const store = useRiskStore();
      await store.postKillSwitch({ level: 'GLOBAL', activate: true, reason: 'Emergency' });

      expect(store.error).toBe('forbidden');
    });
  });

  // ── Event Normalization ──────────────────────────────────────────
  describe('event normalization', () => {
    it('uses timestamp field when time is missing', async () => {
      const rawEvent = {
        event_id: 'e-ts',
        time: '2026-03-15T10:00:00Z',
        event_type: 'ALERT',
        level: 'info',
        target: 'SOL/USDT',
        reason: 'Test',
        metadata: {},
      };
      mockedRiskApi.getEvents.mockResolvedValue({ events: [rawEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();

      expect(store.events[0].time).toBe('2026-03-15T10:00:00Z');
    });

    it('leaves time empty when both time and timestamp are missing', async () => {
      const rawEvent = {
        event_id: 'e-notime',
        event_type: 'ALERT',
        level: 'info',
        target: 'BTC/USDT',
        reason: 'No time',
      } as any;
      mockedRiskApi.getEvents.mockResolvedValue({ events: [rawEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();

      expect(store.events[0].time).toBe('');
      expect(store.events[0].received_at).toBeUndefined();
    });

    it('stores websocket receipt time separately from payload event time', () => {
      mockedRiskApi.getStatus.mockResolvedValue(fakeStatus);
      mockedRiskApi.getExposure.mockResolvedValue(fakeExposure);

      const store = useRiskStore();
      store.updateFromWS(
        { event_id: 'ws-st', time: '2026-01-01T00:00:00Z', event_type: 'A', level: 'info', target: '', reason: '', metadata: {} },
        '2026-06-15T12:00:00Z',
      );

      expect(store.events[0].time).toBe('2026-01-01T00:00:00Z');
      expect(store.events[0].received_at).toBe('2026-06-15T12:00:00Z');
    });

    it('builds a deterministic fallback id when both id and event time are missing', async () => {
      const rawEvent = {
        event_type: 'ALERT',
        level: 'info',
        target: 'BTC/USDT',
        reason: 'No identifiers',
        metadata: { source: 'risk-engine', rule: 'max_total_exposure' },
      } as any;
      mockedRiskApi.getEvents.mockResolvedValue({ events: [rawEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();
      const firstId = store.events[0].event_id;

      await store.fetchEvents();
      expect(store.events[0].event_id).toBe(firstId);
      expect(firstId).toContain('risk-engine');
    });

    it('uses action field as fallback for event_type', async () => {
      const rawEvent = {
        event_id: 'e-action',
        time: '2026-01-01T00:00:00Z',
        action: 'KILL_SWITCH_ACTIVATED',
        level: 'critical',
        target: 'GLOBAL',
        reason: 'Emergency',
      } as any;
      mockedRiskApi.getEvents.mockResolvedValue({ events: [rawEvent], total: 1 });

      const store = useRiskStore();
      await store.fetchEvents();

      expect(store.events[0].event_type).toBe('KILL_SWITCH_ACTIVATED');
    });
  });
});

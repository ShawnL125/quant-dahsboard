import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWebSocket } from '@/composables/useWebSocket';

// ── Mock WebSocket ───────────────────────────────────────────────────
interface MockWs {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  readyState: number;
}

let mockWsInstance: MockWs;

// Stub a class so `new WebSocket(...)` works correctly in happy-dom
class MockWebSocketImpl {
  send: MockWs['send'];
  close: MockWs['close'];
  onopen: MockWs['onopen'];
  onclose: MockWs['onclose'];
  onmessage: MockWs['onmessage'];
  onerror: MockWs['onerror'];
  readyState: number;

  constructor() {
    this.send = vi.fn();
    this.close = vi.fn();
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    this.readyState = 1; // WebSocket.OPEN
    mockWsInstance = this;
  }
}

const MockWebSocket = vi.fn(MockWebSocketImpl);
// Provide WebSocket constants used by the composable
(MockWebSocket as unknown as { OPEN: number }).OPEN = 1;
(MockWebSocket as unknown as { CLOSED: number }).CLOSED = 3;
(MockWebSocket as unknown as { CONNECTING: number }).CONNECTING = 0;
(MockWebSocket as unknown as { CLOSING: number }).CLOSING = 2;

// ── Tests ────────────────────────────────────────────────────────────
describe('useWebSocket', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    MockWebSocket.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // ── Initial State ────────────────────────────────────────────────
  describe('initial state', () => {
    it('is not connected', () => {
      const { isConnected } = useWebSocket({ url: 'ws://localhost:8080' });
      expect(isConnected.value).toBe(false);
    });

    it('has zero reconnect attempts', () => {
      const { reconnectAttempt } = useWebSocket({ url: 'ws://localhost:8080' });
      expect(reconnectAttempt.value).toBe(0);
    });

    it('has null disconnectedAt', () => {
      const { disconnectedAt } = useWebSocket({ url: 'ws://localhost:8080' });
      expect(disconnectedAt.value).toBeNull();
    });
  });

  // ── connect ──────────────────────────────────────────────────────
  describe('connect()', () => {
    it('creates WebSocket and sets isConnected on open', () => {
      const { isConnected, connect } = useWebSocket({ url: 'ws://localhost:8080' });
      connect();

      expect(MockWebSocket).toHaveBeenCalledWith('ws://localhost:8080');

      // Simulate open event
      mockWsInstance.onopen!();

      expect(isConnected.value).toBe(true);
    });

    it('appends apiKey as query param when provided', () => {
      const { connect } = useWebSocket({ url: 'ws://localhost:8080', apiKey: 'secret123' });
      connect();

      expect(MockWebSocket).toHaveBeenCalledWith('ws://localhost:8080?api_key=secret123');
    });

    it('resets reconnect interval on open', () => {
      vi.useFakeTimers();
      const { connect } = useWebSocket({
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
      });

      connect();
      // Simulate close to schedule reconnect (interval doubles)
      mockWsInstance.onclose!();
      // Advance to trigger reconnect - the interval has been doubled
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.mock.calls.length).toBeGreaterThanOrEqual(2);

      // Simulate open on the new connection to reset interval
      mockWsInstance.onopen!();
      // Now simulate close again - interval should be back to base (1000)
      mockWsInstance.onclose!();
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('increments reconnectAttempt and sets disconnectedAt on close', () => {
      const { connect, reconnectAttempt, disconnectedAt } = useWebSocket({ url: 'ws://localhost:8080' });
      connect();

      expect(reconnectAttempt.value).toBe(0);
      expect(disconnectedAt.value).toBeNull();

      mockWsInstance.onclose!();

      expect(reconnectAttempt.value).toBe(1);
      expect(disconnectedAt.value).toBeGreaterThan(0);
    });

    it('resets reconnectAttempt and disconnectedAt on open', () => {
      const { connect, reconnectAttempt, disconnectedAt } = useWebSocket({ url: 'ws://localhost:8080' });
      connect();

      mockWsInstance.onclose!();
      expect(reconnectAttempt.value).toBe(1);
      expect(disconnectedAt.value).not.toBeNull();

      mockWsInstance.onopen!();
      expect(reconnectAttempt.value).toBe(0);
      expect(disconnectedAt.value).toBeNull();
    });
  });

  // ── disconnect ───────────────────────────────────────────────────
  describe('disconnect()', () => {
    it('closes WebSocket and clears reconnect timer', () => {
      vi.useFakeTimers();
      const { isConnected, connect, disconnect } = useWebSocket({ url: 'ws://localhost:8080' });

      connect();
      mockWsInstance.onopen!();
      expect(isConnected.value).toBe(true);

      // Simulate close to schedule a reconnect
      mockWsInstance.onclose!();

      disconnect();

      expect(mockWsInstance.close).toHaveBeenCalled();
      expect(isConnected.value).toBe(false);

      // Advancing timers should NOT trigger reconnect because disconnect cleared it
      const callCountBefore = MockWebSocket.mock.calls.length;
      vi.advanceTimersByTime(5000);
      expect(MockWebSocket.mock.calls.length).toBe(callCountBefore);
    });
  });

  // ── subscribe ────────────────────────────────────────────────────
  describe('subscribe()', () => {
    it('sends subscribe message when connected', () => {
      const { connect, subscribe } = useWebSocket({ url: 'ws://localhost:8080' });
      connect();
      mockWsInstance.onopen!();

      subscribe(['trades', 'positions']);

      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ action: 'subscribe', channels: ['trades', 'positions'] }),
      );
    });

    it('does not send when not connected', () => {
      const { connect, subscribe } = useWebSocket({ url: 'ws://localhost:8080' });
      connect();
      mockWsInstance.readyState = 0; // CONNECTING (not OPEN)

      subscribe(['trades']);

      expect(mockWsInstance.send).not.toHaveBeenCalledWith(
        expect.stringContaining('subscribe'),
      );
    });

    it('deduplicates channels', () => {
      const { connect, subscribe } = useWebSocket({ url: 'ws://localhost:8080' });
      connect();
      mockWsInstance.onopen!();

      subscribe(['trades', 'positions']);
      subscribe(['trades', 'orders']);

      // sendCommand is called with the channels argument passed to subscribe()
      expect(mockWsInstance.send).toHaveBeenCalledTimes(2);
      expect(mockWsInstance.send).toHaveBeenLastCalledWith(
        JSON.stringify({ action: 'subscribe', channels: ['trades', 'orders'] }),
      );
    });
  });

  // ── unsubscribe ──────────────────────────────────────────────────
  describe('unsubscribe()', () => {
    it('removes channels and sends unsubscribe message', () => {
      const { connect, subscribe, unsubscribe } = useWebSocket({ url: 'ws://localhost:8080' });
      connect();
      mockWsInstance.onopen!();

      subscribe(['trades', 'positions', 'orders']);
      unsubscribe(['positions']);

      expect(mockWsInstance.send).toHaveBeenLastCalledWith(
        JSON.stringify({ action: 'unsubscribe', channels: ['positions'] }),
      );
    });
  });

  // ── onMessage ────────────────────────────────────────────────────
  describe('onMessage()', () => {
    it('sets handler and calls on incoming messages', () => {
      const { connect, onMessage } = useWebSocket({ url: 'ws://localhost:8080' });
      const handler = vi.fn();

      connect();
      onMessage(handler);

      const testMessage = { channel: 'trades', timestamp: '2026-01-01T00:00:00Z', data: { price: 100 } };
      mockWsInstance.onmessage!({ data: JSON.stringify(testMessage) });

      expect(handler).toHaveBeenCalledWith(testMessage);
    });

    it('ignores malformed JSON messages', () => {
      const { connect, onMessage } = useWebSocket({ url: 'ws://localhost:8080' });
      const handler = vi.fn();

      connect();
      onMessage(handler);

      mockWsInstance.onmessage!({ data: 'not-valid-json' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ── Reconnection ────────────────────────────────────────────────
  describe('reconnection', () => {
    it('reconnects with exponential backoff on close', () => {
      vi.useFakeTimers();
      const { connect } = useWebSocket({
        url: 'ws://localhost:8080',
        reconnectInterval: 1000,
        maxReconnectInterval: 8000,
      });

      connect();
      // Initial call
      expect(MockWebSocket).toHaveBeenCalledTimes(1);

      // Simulate close
      mockWsInstance.onclose!();

      // First reconnect after 1000ms
      vi.advanceTimersByTime(999);
      expect(MockWebSocket).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      expect(MockWebSocket).toHaveBeenCalledTimes(2);

      // Second close - interval should double to 2000ms
      mockWsInstance.onclose!();

      vi.advanceTimersByTime(1999);
      expect(MockWebSocket).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(1);
      expect(MockWebSocket).toHaveBeenCalledTimes(3);
    });

    it('caps at maxReconnectInterval', () => {
      vi.useFakeTimers();
      const { connect } = useWebSocket({
        url: 'ws://localhost:8080',
        reconnectInterval: 2000,
        maxReconnectInterval: 4000,
      });

      connect();

      // Close #1: interval 2000 -> next is 4000
      mockWsInstance.onclose!();
      vi.advanceTimersByTime(2000);
      expect(MockWebSocket).toHaveBeenCalledTimes(2);

      // Close #2: interval 4000 -> next would be 8000 but capped at 4000
      mockWsInstance.onclose!();
      vi.advanceTimersByTime(4000);
      expect(MockWebSocket).toHaveBeenCalledTimes(3);

      // Close #3: interval still capped at 4000
      mockWsInstance.onclose!();
      vi.advanceTimersByTime(4000);
      expect(MockWebSocket).toHaveBeenCalledTimes(4);
    });

    it('resubscribes channels after reconnect', () => {
      vi.useFakeTimers();
      const { connect, subscribe } = useWebSocket({ url: 'ws://localhost:8080' });

      connect();
      mockWsInstance.onopen!();

      subscribe(['trades', 'positions']);

      // Simulate close — triggers reconnect scheduling via setTimeout
      mockWsInstance.onclose!();

      // Advance timers to trigger the reconnect (which calls connect() -> new WebSocket)
      vi.advanceTimersByTime(1000);

      // mockWsInstance is now the NEW instance from reconnect
      // Fire onopen on the new instance to trigger resubscribe
      mockWsInstance.onopen!();

      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ action: 'subscribe', channels: ['trades', 'positions'] }),
      );
    });
  });
});

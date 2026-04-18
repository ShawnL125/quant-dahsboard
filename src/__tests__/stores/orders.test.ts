import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOrdersStore } from '@/stores/orders';
import { ordersApi } from '@/api/orders';
import type { Order, OrderEvent, AlgoOrder } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/orders', () => ({
  ordersApi: {
    getOpenOrders: vi.fn(),
    getOrderHistory: vi.fn(),
    getOrderEvents: vi.fn(),
    placeOrder: vi.fn(),
    cancelOrder: vi.fn(),
    amendOrder: vi.fn(),
    getStrategyOrders: vi.fn(),
    activateTrailingStop: vi.fn(),
    deactivateTrailingStop: vi.fn(),
    getTrackedOrders: vi.fn(),
    getSLBindings: vi.fn(),
    getTrailingStops: vi.fn(),
    submitAlgoOrder: vi.fn(),
    getAlgoOrders: vi.fn(),
    getAlgoOrder: vi.fn(),
    cancelAlgoOrder: vi.fn(),
    pauseAlgoOrder: vi.fn(),
    resumeAlgoOrder: vi.fn(),
  },
}));

const mockedOrdersApi = vi.mocked(ordersApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeOpenOrder: Order = {
  order_id: 'o1',
  symbol: 'BTC/USDT',
  exchange: 'binance',
  side: 'buy',
  status: 'OPEN',
  order_type: 'limit',
  quantity: '1.0',
  price: '50000',
  created_at: '2026-01-01T00:00:00Z',
};

const fakeHistoryOrder: Order = {
  order_id: 'h1',
  symbol: 'ETH/USDT',
  exchange: 'binance',
  side: 'sell',
  status: 'FILLED',
  order_type: 'market',
  quantity: '10.0',
  filled_quantity: '10.0',
  avg_fill_price: '3000',
  created_at: '2025-12-01T00:00:00Z',
};

const fakeAlgoOrder: AlgoOrder = {
  algo_id: 'a1',
  algo_type: 'twap',
  symbol: 'BTC/USDT',
  exchange: 'binance',
  side: 'buy',
  total_quantity: '10.0',
  filled_quantity: '5.0',
  slice_count: 10,
  slices_completed: 5,
  status: 'RUNNING',
  created_at: '2026-01-01T00:00:00Z',
};

const fakeOrderEvent: OrderEvent = {
  event_id: 'ev1',
  order_id: 'o1',
  event_type: 'PLACED',
  timestamp: '2026-01-01T00:00:00Z',
};

// ── Tests ────────────────────────────────────────────────────────────
describe('orders store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty arrays for all order collections', () => {
      const store = useOrdersStore();
      expect(store.openOrders).toEqual([]);
      expect(store.orderHistory).toEqual([]);
      expect(store.trackedOrders).toEqual([]);
      expect(store.slBindings).toEqual([]);
      expect(store.trailingStops).toEqual([]);
      expect(store.algoOrders).toEqual([]);
      expect(store.orderEvents).toEqual({});
    });

    it('has loading false and error null', () => {
      const store = useOrdersStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchOrders ──────────────────────────────────────────────────
  describe('fetchOrders()', () => {
    it('sets openOrders and orderHistory', async () => {
      mockedOrdersApi.getOpenOrders.mockResolvedValue([fakeOpenOrder]);
      mockedOrdersApi.getOrderHistory.mockResolvedValue([fakeHistoryOrder]);

      const store = useOrdersStore();
      await store.fetchOrders();

      expect(store.openOrders).toEqual([fakeOpenOrder]);
      expect(store.orderHistory).toEqual([fakeHistoryOrder]);
    });

    it('sets loading during request', async () => {
      let resolveOpen!: (v: unknown) => void;
      mockedOrdersApi.getOpenOrders.mockReturnValue(
        new Promise((r) => { resolveOpen = r; }) as any,
      );
      mockedOrdersApi.getOrderHistory.mockResolvedValue([]);

      const store = useOrdersStore();
      const promise = store.fetchOrders();

      expect(store.loading).toBe(true);

      resolveOpen([fakeOpenOrder]);
      await promise;

      expect(store.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedOrdersApi.getOpenOrders.mockRejectedValue(new Error('network error'));
      mockedOrdersApi.getOrderHistory.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.fetchOrders();

      expect(store.error).toBe('network error');
      expect(store.loading).toBe(false);
    });

    it('handles non-Error exceptions', async () => {
      mockedOrdersApi.getOpenOrders.mockRejectedValue('string-error');
      mockedOrdersApi.getOrderHistory.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.fetchOrders();

      expect(store.error).toBe('string-error');
    });
  });

  // ── fetchOrderHistory ────────────────────────────────────────────
  describe('fetchOrderHistory()', () => {
    it('sets orderHistory with params', async () => {
      mockedOrdersApi.getOrderHistory.mockResolvedValue([fakeHistoryOrder]);

      const store = useOrdersStore();
      await store.fetchOrderHistory({ symbol: 'BTC/USDT', limit: 10 });

      expect(mockedOrdersApi.getOrderHistory).toHaveBeenCalledWith({
        symbol: 'BTC/USDT',
        limit: 10,
      });
      expect(store.orderHistory).toEqual([fakeHistoryOrder]);
    });

    it('sets error on failure', async () => {
      mockedOrdersApi.getOrderHistory.mockRejectedValue(new Error('timeout'));

      const store = useOrdersStore();
      await store.fetchOrderHistory();

      expect(store.error).toBe('timeout');
    });
  });

  // ── fetchOrderEvents ─────────────────────────────────────────────
  describe('fetchOrderEvents()', () => {
    it('stores events keyed by orderId', async () => {
      mockedOrdersApi.getOrderEvents.mockResolvedValue([fakeOrderEvent]);

      const store = useOrdersStore();
      await store.fetchOrderEvents('o1');

      expect(mockedOrdersApi.getOrderEvents).toHaveBeenCalledWith('o1');
      expect(store.orderEvents['o1']).toEqual([fakeOrderEvent]);
    });

    it('preserves existing events for other orders', async () => {
      const event2: OrderEvent = { ...fakeOrderEvent, event_id: 'ev2', order_id: 'o2' };
      mockedOrdersApi.getOrderEvents.mockResolvedValueOnce([fakeOrderEvent]);
      mockedOrdersApi.getOrderEvents.mockResolvedValueOnce([event2]);

      const store = useOrdersStore();
      await store.fetchOrderEvents('o1');
      await store.fetchOrderEvents('o2');

      expect(store.orderEvents['o1']).toHaveLength(1);
      expect(store.orderEvents['o2']).toHaveLength(1);
    });

    it('sets error on failure', async () => {
      mockedOrdersApi.getOrderEvents.mockRejectedValue(new Error('not found'));

      const store = useOrdersStore();
      await store.fetchOrderEvents('o1');

      expect(store.error).toBe('not found');
    });
  });

  // ── placeOrder ───────────────────────────────────────────────────
  describe('placeOrder()', () => {
    const orderRequest = {
      symbol: 'BTC/USDT',
      exchange: 'binance',
      side: 'buy',
      order_type: 'limit',
      quantity: '1.0',
      price: '50000',
    };

    it('adds new order to openOrders and returns it', async () => {
      mockedOrdersApi.placeOrder.mockResolvedValue(fakeOpenOrder);

      const store = useOrdersStore();
      const result = await store.placeOrder(orderRequest);

      expect(mockedOrdersApi.placeOrder).toHaveBeenCalledWith(orderRequest);
      expect(store.openOrders).toHaveLength(1);
      expect(store.openOrders[0]).toEqual(fakeOpenOrder);
      expect(result).toEqual(fakeOpenOrder);
    });

    it('prepends to existing open orders', async () => {
      const secondOrder: Order = { ...fakeOpenOrder, order_id: 'o2' };
      mockedOrdersApi.placeOrder.mockResolvedValue(secondOrder);

      const store = useOrdersStore();
      store.$patch({ openOrders: [fakeOpenOrder] });
      await store.placeOrder(orderRequest);

      expect(store.openOrders).toHaveLength(2);
      expect(store.openOrders[0].order_id).toBe('o2');
    });

    it('sets error and re-throws on failure', async () => {
      mockedOrdersApi.placeOrder.mockRejectedValue(new Error('insufficient balance'));

      const store = useOrdersStore();
      await expect(store.placeOrder(orderRequest)).rejects.toThrow('insufficient balance');

      expect(store.error).toBe('insufficient balance');
    });
  });

  // ── cancelOrder ──────────────────────────────────────────────────
  describe('cancelOrder()', () => {
    it('removes order from openOrders', async () => {
      mockedOrdersApi.cancelOrder.mockResolvedValue({});

      const store = useOrdersStore();
      store.$patch({ openOrders: [fakeOpenOrder] });
      await store.cancelOrder('o1', 'BTC/USDT', 'binance');

      expect(mockedOrdersApi.cancelOrder).toHaveBeenCalledWith('o1', 'BTC/USDT', 'binance');
      expect(store.openOrders).toEqual([]);
    });

    it('removes only the specified order', async () => {
      const secondOrder: Order = { ...fakeOpenOrder, order_id: 'o2' };
      mockedOrdersApi.cancelOrder.mockResolvedValue({});

      const store = useOrdersStore();
      store.$patch({ openOrders: [fakeOpenOrder, secondOrder] });
      await store.cancelOrder('o1', 'BTC/USDT', 'binance');

      expect(store.openOrders).toHaveLength(1);
      expect(store.openOrders[0].order_id).toBe('o2');
    });

    it('sets error and re-throws on failure', async () => {
      mockedOrdersApi.cancelOrder.mockRejectedValue(new Error('order not found'));

      const store = useOrdersStore();
      store.$patch({ openOrders: [fakeOpenOrder] });
      await expect(store.cancelOrder('o1', 'BTC/USDT', 'binance')).rejects.toThrow('order not found');

      expect(store.error).toBe('order not found');
      // Order should still be in openOrders since cancel failed
      expect(store.openOrders).toHaveLength(1);
    });
  });

  // ── amendOrder ───────────────────────────────────────────────────
  describe('amendOrder()', () => {
    it('calls API then refetches orders', async () => {
      mockedOrdersApi.amendOrder.mockResolvedValue({ status: 'AMENDED', order_id: 'o1' });
      mockedOrdersApi.getOpenOrders.mockResolvedValue([fakeOpenOrder]);
      mockedOrdersApi.getOrderHistory.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.amendOrder('o1', { price: '51000' });

      expect(mockedOrdersApi.amendOrder).toHaveBeenCalledWith('o1', { price: '51000' });
      expect(mockedOrdersApi.getOpenOrders).toHaveBeenCalled();
      expect(mockedOrdersApi.getOrderHistory).toHaveBeenCalled();
    });
  });

  // ── Tracked Orders / SL Bindings / Trailing Stops ────────────────
  describe('fetchTrackedOrders()', () => {
    it('sets trackedOrders on success', async () => {
      mockedOrdersApi.getTrackedOrders.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.fetchTrackedOrders();

      expect(mockedOrdersApi.getTrackedOrders).toHaveBeenCalled();
    });

    it('resets to empty on failure', async () => {
      mockedOrdersApi.getTrackedOrders.mockRejectedValue(new Error('fail'));

      const store = useOrdersStore();
      await store.fetchTrackedOrders();

      expect(store.trackedOrders).toEqual([]);
    });
  });

  describe('fetchSLBindings()', () => {
    it('resets to empty on failure', async () => {
      mockedOrdersApi.getSLBindings.mockRejectedValue(new Error('fail'));

      const store = useOrdersStore();
      await store.fetchSLBindings();

      expect(store.slBindings).toEqual([]);
    });
  });

  describe('fetchTrailingStops()', () => {
    it('resets to empty on failure', async () => {
      mockedOrdersApi.getTrailingStops.mockRejectedValue(new Error('fail'));

      const store = useOrdersStore();
      await store.fetchTrailingStops();

      expect(store.trailingStops).toEqual([]);
    });
  });

  describe('activateTrailingStop()', () => {
    it('calls API then refetches trailing stops', async () => {
      mockedOrdersApi.activateTrailingStop.mockResolvedValue({ status: 'activated' });
      mockedOrdersApi.getTrailingStops.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.activateTrailingStop('o1', { callback_rate: '5.0' });

      expect(mockedOrdersApi.activateTrailingStop).toHaveBeenCalledWith('o1', { callback_rate: '5.0' });
      expect(mockedOrdersApi.getTrailingStops).toHaveBeenCalled();
    });
  });

  describe('deactivateTrailingStop()', () => {
    it('calls API then refetches trailing stops', async () => {
      mockedOrdersApi.deactivateTrailingStop.mockResolvedValue({ status: 'deactivated' });
      mockedOrdersApi.getTrailingStops.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.deactivateTrailingStop('o1');

      expect(mockedOrdersApi.deactivateTrailingStop).toHaveBeenCalledWith('o1');
      expect(mockedOrdersApi.getTrailingStops).toHaveBeenCalled();
    });
  });

  // ── Algo Order Lifecycle ─────────────────────────────────────────
  describe('algo order lifecycle', () => {
    it('fetchAlgoOrders() sets algoOrders on success', async () => {
      mockedOrdersApi.getAlgoOrders.mockResolvedValue([fakeAlgoOrder]);

      const store = useOrdersStore();
      await store.fetchAlgoOrders();

      expect(store.algoOrders).toEqual([fakeAlgoOrder]);
    });

    it('fetchAlgoOrders() resets to empty on failure', async () => {
      mockedOrdersApi.getAlgoOrders.mockRejectedValue(new Error('fail'));

      const store = useOrdersStore();
      await store.fetchAlgoOrders();

      expect(store.algoOrders).toEqual([]);
    });

    it('submitAlgoOrder() calls API then refetches', async () => {
      mockedOrdersApi.submitAlgoOrder.mockResolvedValue({
        algo_id: 'a1',
        algo_type: 'twap',
        status: 'ACCEPTED',
        slice_count: 10,
      });
      mockedOrdersApi.getAlgoOrders.mockResolvedValue([fakeAlgoOrder]);

      const store = useOrdersStore();
      await store.submitAlgoOrder({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'buy',
        quantity: '10.0',
        algo_type: 'twap',
      });

      expect(mockedOrdersApi.submitAlgoOrder).toHaveBeenCalled();
      expect(mockedOrdersApi.getAlgoOrders).toHaveBeenCalled();
    });

    it('cancelAlgoOrder() calls API then refetches', async () => {
      mockedOrdersApi.cancelAlgoOrder.mockResolvedValue({ status: 'CANCELED', algo_id: 'a1' });
      mockedOrdersApi.getAlgoOrders.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.cancelAlgoOrder('a1');

      expect(mockedOrdersApi.cancelAlgoOrder).toHaveBeenCalledWith('a1');
      expect(mockedOrdersApi.getAlgoOrders).toHaveBeenCalled();
    });

    it('pauseAlgoOrder() calls API then refetches', async () => {
      mockedOrdersApi.pauseAlgoOrder.mockResolvedValue({ status: 'PAUSED', algo_id: 'a1' });
      mockedOrdersApi.getAlgoOrders.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.pauseAlgoOrder('a1');

      expect(mockedOrdersApi.pauseAlgoOrder).toHaveBeenCalledWith('a1');
      expect(mockedOrdersApi.getAlgoOrders).toHaveBeenCalled();
    });

    it('resumeAlgoOrder() calls API then refetches', async () => {
      mockedOrdersApi.resumeAlgoOrder.mockResolvedValue({ status: 'RUNNING', algo_id: 'a1' });
      mockedOrdersApi.getAlgoOrders.mockResolvedValue([]);

      const store = useOrdersStore();
      await store.resumeAlgoOrder('a1');

      expect(mockedOrdersApi.resumeAlgoOrder).toHaveBeenCalledWith('a1');
      expect(mockedOrdersApi.getAlgoOrders).toHaveBeenCalled();
    });
  });

  // ── updateOrderFromWS ────────────────────────────────────────────
  describe('updateOrderFromWS()', () => {
    it('does nothing when data has no order_id', () => {
      const store = useOrdersStore();
      store.updateOrderFromWS({ status: 'FILLED' });
      expect(store.openOrders).toEqual([]);
      expect(store.orderHistory).toEqual([]);
    });

    describe('terminal state transitions', () => {
      const terminalStatuses = ['FILLED', 'CANCELED', 'REJECTED', 'FAILED'];

      terminalStatuses.forEach((terminalStatus) => {
        it(`moves order to history when status is ${terminalStatus}`, () => {
          const store = useOrdersStore();
          store.$patch({ openOrders: [fakeOpenOrder], orderHistory: [] });

          store.updateOrderFromWS({
            order_id: 'o1',
            status: terminalStatus,
          });

          expect(store.openOrders).toHaveLength(0);
          expect(store.orderHistory).toHaveLength(1);
          expect(store.orderHistory[0].order_id).toBe('o1');
          expect(store.orderHistory[0].status).toBe(terminalStatus);
        });
      });

      it('maps avg_price to avg_fill_price', () => {
        const store = useOrdersStore();
        store.$patch({ openOrders: [fakeOpenOrder], orderHistory: [] });

        store.updateOrderFromWS({
          order_id: 'o1',
          status: 'FILLED',
          avg_price: '50500',
        });

        expect(store.orderHistory[0].avg_fill_price).toBe('50500');
      });

      it('preserves existing avg_fill_price if both fields present', () => {
        const store = useOrdersStore();
        store.$patch({ openOrders: [fakeOpenOrder], orderHistory: [] });

        store.updateOrderFromWS({
          order_id: 'o1',
          status: 'FILLED',
          avg_price: '50500',
          avg_fill_price: '50400',
        });

        // avg_fill_price should NOT be overwritten by avg_price when already present
        expect(store.orderHistory[0].avg_fill_price).toBe('50400');
      });

      it('prepends to existing order history', () => {
        const store = useOrdersStore();
        store.$patch({ openOrders: [fakeOpenOrder], orderHistory: [fakeHistoryOrder] });

        store.updateOrderFromWS({
          order_id: 'o1',
          status: 'FILLED',
        });

        expect(store.orderHistory).toHaveLength(2);
        expect(store.orderHistory[0].order_id).toBe('o1');
        expect(store.orderHistory[1].order_id).toBe('h1');
      });
    });

    describe('non-terminal updates', () => {
      it('updates order in place for PARTIALLY_FILLED', () => {
        const store = useOrdersStore();
        store.$patch({ openOrders: [fakeOpenOrder] });

        store.updateOrderFromWS({
          order_id: 'o1',
          status: 'PARTIALLY_FILLED',
          filled_quantity: '0.5',
          avg_price: '49800',
        });

        expect(store.openOrders).toHaveLength(1);
        expect(store.openOrders[0].status).toBe('PARTIALLY_FILLED');
        expect(store.openOrders[0].filled_quantity).toBe('0.5');
        expect(store.openOrders[0].avg_fill_price).toBe('49800');
      });

      it('uses order_status as fallback field name', () => {
        const store = useOrdersStore();
        store.$patch({ openOrders: [fakeOpenOrder] });

        store.updateOrderFromWS({
          order_id: 'o1',
          order_status: 'PARTIALLY_FILLED',
          filled_quantity: '0.3',
        });

        expect(store.openOrders[0].filled_quantity).toBe('0.3');
      });
    });

    describe('unknown order (not in openOrders)', () => {
      it('adds non-terminal order to openOrders', () => {
        const store = useOrdersStore();
        store.$patch({ openOrders: [], orderHistory: [] });

        store.updateOrderFromWS({
          order_id: 'new-1',
          status: 'OPEN',
          symbol: 'SOL/USDT',
          exchange: 'binance',
          side: 'buy',
          order_type: 'market',
          quantity: '100',
        });

        expect(store.openOrders).toHaveLength(1);
        expect(store.openOrders[0].order_id).toBe('new-1');
      });

      it('does not add terminal orders not already in openOrders', () => {
        const store = useOrdersStore();
        store.$patch({ openOrders: [], orderHistory: [] });

        store.updateOrderFromWS({
          order_id: 'unknown-1',
          status: 'FILLED',
        });

        expect(store.openOrders).toHaveLength(0);
        expect(store.orderHistory).toHaveLength(0);
      });
    });
  });
});

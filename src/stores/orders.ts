import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ordersApi } from '@/api/orders';
import type { Order, OrderRequest, OrderEvent, TrackedOrder, SLBinding, TrailingStop, AmendOrderBody, TrailingStopBody, AlgoOrder, SubmitAlgoBody } from '@/types';

export const useOrdersStore = defineStore('orders', () => {
  const openOrders = ref<Order[]>([]);
  const orderHistory = ref<Order[]>([]);
  const orderEvents = ref<Record<string, OrderEvent[]>>({});
  const trackedOrders = ref<TrackedOrder[]>([]);
  const slBindings = ref<SLBinding[]>([]);
  const trailingStops = ref<TrailingStop[]>([]);
  const algoOrders = ref<AlgoOrder[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchOrders() {
    try {
      loading.value = true;
      const [open, history] = await Promise.all([
        ordersApi.getOpenOrders(),
        ordersApi.getOrderHistory(),
      ]);
      openOrders.value = open;
      orderHistory.value = history;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrderHistory(params?: { symbol?: string; exchange?: string; limit?: number }) {
    try {
      orderHistory.value = await ordersApi.getOrderHistory(params);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchOrderEvents(orderId: string) {
    try {
      const events = await ordersApi.getOrderEvents(orderId);
      orderEvents.value = { ...orderEvents.value, [orderId]: events };
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function placeOrder(order: OrderRequest) {
    try {
      const result = await ordersApi.placeOrder(order);
      openOrders.value = [result, ...openOrders.value];
      return result;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  async function cancelOrder(orderId: string, symbol: string, exchange: string) {
    try {
      await ordersApi.cancelOrder(orderId, symbol, exchange);
      openOrders.value = openOrders.value.filter((o) => o.order_id !== orderId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  // OMS (Phase 31-32)
  async function fetchTrackedOrders() {
    try { trackedOrders.value = await ordersApi.getTrackedOrders(); }
    catch { trackedOrders.value = []; }
  }

  async function fetchSLBindings() {
    try { slBindings.value = await ordersApi.getSLBindings(); }
    catch { slBindings.value = []; }
  }

  async function fetchTrailingStops() {
    try { trailingStops.value = await ordersApi.getTrailingStops(); }
    catch { trailingStops.value = []; }
  }

  async function amendOrder(orderId: string, data: AmendOrderBody) {
    await ordersApi.amendOrder(orderId, data);
    await fetchOrders();
  }

  async function activateTrailingStop(orderId: string, data: TrailingStopBody) {
    await ordersApi.activateTrailingStop(orderId, data);
    await fetchTrailingStops();
  }

  async function deactivateTrailingStop(orderId: string) {
    await ordersApi.deactivateTrailingStop(orderId);
    await fetchTrailingStops();
  }

  // Algo Orders (Phase 38)
  async function fetchAlgoOrders() {
    try { algoOrders.value = await ordersApi.getAlgoOrders(); }
    catch { algoOrders.value = []; }
  }

  async function submitAlgoOrder(data: SubmitAlgoBody) {
    await ordersApi.submitAlgoOrder(data);
    await fetchAlgoOrders();
  }

  async function cancelAlgoOrder(algoId: string) {
    await ordersApi.cancelAlgoOrder(algoId);
    await fetchAlgoOrders();
  }

  async function pauseAlgoOrder(algoId: string) {
    await ordersApi.pauseAlgoOrder(algoId);
    await fetchAlgoOrders();
  }

  async function resumeAlgoOrder(algoId: string) {
    await ordersApi.resumeAlgoOrder(algoId);
    await fetchAlgoOrders();
  }

  function updateOrderFromWS(data: Record<string, unknown>) {
    if (!data?.order_id) return;
    const orderId = data.order_id as string;
    const status = (data.status || data.order_status) as string;
    const idx = openOrders.value.findIndex((o) => o.order_id === orderId);
    const isTerminal = ['FILLED', 'CANCELED', 'REJECTED', 'FAILED'].includes(status);

    // Map WS field names to Order type fields
    const mapped = { ...data } as Record<string, unknown>;
    if ('avg_price' in mapped && !('avg_fill_price' in mapped)) {
      mapped.avg_fill_price = mapped.avg_price;
    }

    if (idx >= 0) {
      if (isTerminal) {
        const order = { ...openOrders.value[idx], ...mapped } as Order;
        openOrders.value = openOrders.value.filter((_, i) => i !== idx);
        orderHistory.value = [order, ...orderHistory.value];
      } else {
        openOrders.value[idx] = { ...openOrders.value[idx], ...mapped } as Order;
      }
    } else if (!isTerminal) {
      openOrders.value = [mapped as unknown as Order, ...openOrders.value];
    }
  }

  return {
    openOrders,
    orderHistory,
    orderEvents,
    trackedOrders,
    slBindings,
    trailingStops,
    algoOrders,
    loading,
    error,
    fetchOrders,
    fetchOrderHistory,
    fetchOrderEvents,
    placeOrder,
    cancelOrder,
    updateOrderFromWS,
    fetchTrackedOrders,
    fetchSLBindings,
    fetchTrailingStops,
    amendOrder,
    activateTrailingStop,
    deactivateTrailingStop,
    fetchAlgoOrders,
    submitAlgoOrder,
    cancelAlgoOrder,
    pauseAlgoOrder,
    resumeAlgoOrder,
  };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ordersApi } from '@/api/orders';
import type { Order, OrderRequest } from '@/types';

export const useOrdersStore = defineStore('orders', () => {
  const openOrders = ref<Order[]>([]);
  const orderHistory = ref<Order[]>([]);
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
    loading,
    error,
    fetchOrders,
    placeOrder,
    cancelOrder,
    updateOrderFromWS,
  };
});

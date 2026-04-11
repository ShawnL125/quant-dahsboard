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
    const idx = openOrders.value.findIndex(
      (o) => o.order_id === data.order_id,
    );
    if (idx >= 0) {
      const status = (data.status || data.order_status) as string;
      if (['FILLED', 'CANCELED', 'REJECTED', 'FAILED'].includes(status)) {
        openOrders.value = openOrders.value.filter(
          (_, i) => i !== idx,
        );
      } else {
        openOrders.value[idx] = { ...openOrders.value[idx], ...data } as Order;
      }
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

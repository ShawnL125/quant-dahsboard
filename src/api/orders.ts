import apiClient from './client';
import type { Order, OrderRequest, OrderEvent, TrackedOrder, SLBinding, TrailingStop, AmendOrderBody, TrailingStopBody, AlgoOrder, AlgoOrderDetail, SubmitAlgoBody } from '@/types';

export const ordersApi = {
  getOpenOrders: () => apiClient.get<Order[]>('/orders').then((r) => r.data),
  getOrderHistory: (params?: { symbol?: string; exchange?: string; limit?: number }) =>
    apiClient.get<Order[]>('/orders/history', { params }).then((r) => r.data),
  getOrderEvents: (orderId: string, limit?: number) =>
    apiClient.get<OrderEvent[]>(`/orders/${orderId}/events`, { params: { limit } }).then((r) => r.data),
  placeOrder: (order: OrderRequest) => apiClient.post<Order>('/orders', order).then((r) => r.data),
  cancelOrder: (orderId: string, symbol: string, exchange: string) =>
    apiClient.delete(`/orders/${orderId}`, { params: { symbol, exchange } }).then((r) => r.data),

  // OMS (Phase 31-32)
  amendOrder: (orderId: string, data: AmendOrderBody) =>
    apiClient.patch<{ status: string; order_id: string }>(`/orders/${orderId}`, data).then((r) => r.data),
  getStrategyOrders: (strategyId: string) =>
    apiClient.get<Order[]>(`/orders/strategy/${strategyId}`).then((r) => r.data),
  activateTrailingStop: (orderId: string, data: TrailingStopBody) =>
    apiClient.post<{ status: string }>(`/orders/${orderId}/trailing-stop`, data).then((r) => r.data),
  deactivateTrailingStop: (orderId: string) =>
    apiClient.delete<{ status: string }>(`/orders/${orderId}/trailing-stop`).then((r) => r.data),
  getTrackedOrders: () =>
    apiClient.get<TrackedOrder[]>('/orders/tracked').then((r) => r.data),
  getSLBindings: () =>
    apiClient.get<SLBinding[]>('/orders/sl-bindings').then((r) => r.data),
  getTrailingStops: () =>
    apiClient.get<TrailingStop[]>('/orders/trailing').then((r) => r.data),

  // Algo Orders (Phase 38)
  submitAlgoOrder: (data: SubmitAlgoBody) =>
    apiClient.post<{ algo_id: string; algo_type: string; status: string; slice_count: number }>('/orders/algo', data).then((r) => r.data),
  getAlgoOrders: () =>
    apiClient.get<AlgoOrder[]>('/orders/algo').then((r) => r.data),
  getAlgoOrder: (algoId: string) =>
    apiClient.get<AlgoOrderDetail>(`/orders/algo/${algoId}`).then((r) => r.data),
  cancelAlgoOrder: (algoId: string) =>
    apiClient.post<{ status: string; algo_id: string }>(`/orders/algo/${algoId}/cancel`).then((r) => r.data),
  pauseAlgoOrder: (algoId: string) =>
    apiClient.post<{ status: string; algo_id: string }>(`/orders/algo/${algoId}/pause`).then((r) => r.data),
  resumeAlgoOrder: (algoId: string) =>
    apiClient.post<{ status: string; algo_id: string }>(`/orders/algo/${algoId}/resume`).then((r) => r.data),
};

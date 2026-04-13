import apiClient from './client';
import type { Order, OrderRequest, OrderEvent } from '@/types';

export const ordersApi = {
  getOpenOrders: () => apiClient.get<Order[]>('/orders').then((r) => r.data),
  getOrderHistory: (params?: { symbol?: string; exchange?: string; limit?: number }) =>
    apiClient.get<Order[]>('/orders/history', { params }).then((r) => r.data),
  getOrderEvents: (orderId: string, limit?: number) =>
    apiClient.get<OrderEvent[]>(`/orders/${orderId}/events`, { params: { limit } }).then((r) => r.data),
  placeOrder: (order: OrderRequest) => apiClient.post<Order>('/orders', order).then((r) => r.data),
  cancelOrder: (orderId: string, symbol: string, exchange: string) =>
    apiClient.delete(`/orders/${orderId}`, { params: { symbol, exchange } }).then((r) => r.data),
};

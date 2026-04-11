import apiClient from './client';
import type { Order, OrderRequest } from '@/types';

export interface OrderEvent {
  event_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export const ordersApi = {
  getOpenOrders: () => apiClient.get<Order[]>('/orders').then((r) => r.data),
  getOrderHistory: () => apiClient.get<Order[]>('/orders/history').then((r) => r.data),
  getOrderEvents: (orderId: string) => apiClient.get<OrderEvent[]>(`/orders/${orderId}/events`).then((r) => r.data),
  placeOrder: (order: OrderRequest) => apiClient.post<Order>('/orders', order).then((r) => r.data),
  cancelOrder: (orderId: string) => apiClient.delete(`/orders/${orderId}`).then((r) => r.data),
};

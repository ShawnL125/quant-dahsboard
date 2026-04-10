import apiClient from './client';
import type { Order, OrderRequest } from '@/types';

export const ordersApi = {
  getOrders: () => apiClient.get<Order[]>('/orders').then((r) => r.data),
  placeOrder: (order: OrderRequest) => apiClient.post<Order>('/orders', order).then((r) => r.data),
  cancelOrder: (orderId: string) => apiClient.delete(`/orders/${orderId}`).then((r) => r.data),
};

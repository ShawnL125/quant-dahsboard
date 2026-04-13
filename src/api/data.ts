import apiClient from './client';

export const dataApi = {
  getSymbols: () =>
    apiClient.get<string[]>('/data/symbols').then((r) => r.data),
  getCandles: (params: { symbol: string; timeframe?: string; limit?: number }) =>
    apiClient.get<unknown[]>('/data/candles', { params }).then((r) => r.data),
};

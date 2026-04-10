import apiClient from './client';
import type { PortfolioSnapshot, Position } from '@/types';

export const tradingApi = {
  getStatus: () => apiClient.get('/trading/status').then((r) => r.data),
  getPortfolio: () => apiClient.get<PortfolioSnapshot>('/portfolio').then((r) => r.data),
  getPositions: () => apiClient.get<Position[]>('/portfolio/positions').then((r) => r.data),
  getPosition: (symbol: string) => apiClient.get<Position>(`/portfolio/positions/${symbol}`).then((r) => r.data),
  getPnl: () => apiClient.get('/portfolio/pnl').then((r) => r.data),
};

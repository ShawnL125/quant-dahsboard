import apiClient from './client';
import type { BacktestResult, BacktestHistoryItem } from '@/types';

export const backtestApi = {
  runBacktest: (params?: Record<string, unknown>) =>
    apiClient.post('/backtest/run', params).then((r) => r.data),
  getStatus: (taskId: string) =>
    apiClient.get(`/backtest/${taskId}/status`).then((r) => r.data),
  getResult: (taskId: string) =>
    apiClient.get<BacktestResult>(`/backtest/${taskId}/result`).then((r) => r.data),
  getHistory: () =>
    apiClient.get<BacktestHistoryItem[]>('/backtest/history').then((r) => r.data),
  getRuns: () =>
    apiClient.get('/backtest/runs').then((r) => r.data),
};

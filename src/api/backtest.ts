import apiClient from './client';
import type { BacktestResult, BacktestHistoryItem, BacktestRunRecord, BacktestEquityPoint, BacktestTrade } from '@/types';

export const backtestApi = {
  runBacktest: (params?: Record<string, unknown>) =>
    apiClient.post('/backtest/run', params).then((r) => r.data),
  getStatus: (taskId: string) =>
    apiClient.get(`/backtest/${taskId}/status`).then((r) => r.data),
  getResult: (taskId: string) =>
    apiClient.get<BacktestResult>(`/backtest/${taskId}/result`).then((r) => r.data),
  getHistory: () =>
    apiClient.get<BacktestHistoryItem[]>('/backtest/history').then((r) => r.data),
  getRuns: (limit = 50, offset = 0) =>
    apiClient.get<BacktestRunRecord[]>('/backtest/runs', { params: { limit, offset } }).then((r) => r.data),
  getRun: (runId: string) =>
    apiClient.get<BacktestRunRecord>(`/backtest/runs/${runId}`).then((r) => r.data),
  getEquity: (runId: string) =>
    apiClient.get<BacktestEquityPoint[]>(`/backtest/runs/${runId}/equity`).then((r) => r.data),
  getTrades: (runId: string) =>
    apiClient.get<BacktestTrade[]>(`/backtest/runs/${runId}/trades`).then((r) => r.data),
  compare: (runIds: string[]) =>
    apiClient.get('/backtest/compare', { params: { runs: runIds.join(',') } }).then((r) => r.data),
  importResults: (data: Record<string, unknown>) =>
    apiClient.post('/backtest/import', data).then((r) => r.data),
};

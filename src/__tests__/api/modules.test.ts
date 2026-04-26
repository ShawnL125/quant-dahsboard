import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn(() => Promise.resolve({ data: {} }));
const mockPost = vi.fn(() => Promise.resolve({ data: {} }));
const mockPut = vi.fn(() => Promise.resolve({ data: {} }));
const mockPatch = vi.fn(() => Promise.resolve({ data: {} }));
const mockDelete = vi.fn(() => Promise.resolve({ data: {} }));

vi.mock('@/api/client', () => ({
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    put: (...a: any[]) => mockPut(...a),
    patch: (...a: any[]) => mockPatch(...a),
    delete: (...a: any[]) => mockDelete(...a),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('accountApi', () => {
  it('getSnapshots calls GET /account/snapshots', async () => {
    const { accountApi } = await import('@/api/account');
    await accountApi.getSnapshots();
    expect(mockGet).toHaveBeenCalledWith('/account/snapshots');
  });
  it('getSnapshotByExchange calls GET with exchange path', async () => {
    const { accountApi } = await import('@/api/account');
    await accountApi.getSnapshotByExchange('binance', 5);
    expect(mockGet).toHaveBeenCalledWith('/account/snapshots/binance', { params: { limit: 5 } });
  });
  it('sync calls POST /account/sync', async () => {
    const { accountApi } = await import('@/api/account');
    await accountApi.sync();
    expect(mockPost).toHaveBeenCalledWith('/account/sync');
  });
  it('reconcile calls POST with params', async () => {
    const { accountApi } = await import('@/api/account');
    await accountApi.reconcile('binance');
    expect(mockPost).toHaveBeenCalledWith('/account/reconcile', null, { params: { exchange: 'binance' } });
  });
  it('getReconciliations calls GET with params', async () => {
    const { accountApi } = await import('@/api/account');
    await accountApi.getReconciliations({ exchange: 'binance', limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/account/reconciliations', { params: { exchange: 'binance', limit: 10 } });
  });
  it('getMargin calls GET /account/margin', async () => {
    const { accountApi } = await import('@/api/account');
    await accountApi.getMargin();
    expect(mockGet).toHaveBeenCalledWith('/account/margin');
  });
});

describe('analyticsApi', () => {
  it('getSignals calls GET /analytics/signals', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getSignals({ strategy_id: 's1' });
    expect(mockGet).toHaveBeenCalledWith('/analytics/signals', { params: { strategy_id: 's1' } });
  });
  it('getRoundTrips calls GET /analytics/round-trips', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getRoundTrips();
    expect(mockGet).toHaveBeenCalledWith('/analytics/round-trips', { params: undefined });
  });
  it('getRoundTrip calls GET with tradeId', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getRoundTrip('t1');
    expect(mockGet).toHaveBeenCalledWith('/analytics/round-trips/t1');
  });
  it('getStrategyStats calls GET /analytics/strategy-stats', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getStrategyStats('s1');
    expect(mockGet).toHaveBeenCalledWith('/analytics/strategy-stats', { params: { strategy_id: 's1' } });
  });
  it('getStrategyStatsHistory calls GET with path', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getStrategyStatsHistory('s1');
    expect(mockGet).toHaveBeenCalledWith('/analytics/strategy-stats/s1/history');
  });
  it('getConsecutiveLosses calls GET', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getConsecutiveLosses('s1');
    expect(mockGet).toHaveBeenCalledWith('/analytics/consecutive-losses', { params: { strategy_id: 's1' } });
  });
  it('getSignalQuality calls GET', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getSignalQuality({ strategy_id: 's1' });
    expect(mockGet).toHaveBeenCalledWith('/analytics/signal-quality', { params: { strategy_id: 's1' } });
  });
  it('getConfig calls GET /analytics/config', async () => {
    const { analyticsApi } = await import('@/api/analytics');
    await analyticsApi.getConfig();
    expect(mockGet).toHaveBeenCalledWith('/analytics/config');
  });
});

describe('authApi', () => {
  it('login calls POST /auth/login', async () => {
    const { authApi } = await import('@/api/auth');
    await authApi.login({ username: 'a', password: 'b' });
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { username: 'a', password: 'b' });
  });
  it('refresh calls POST /auth/refresh', async () => {
    const { authApi } = await import('@/api/auth');
    await authApi.refresh('rt');
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh', { refresh_token: 'rt' });
  });
  it('getMe calls GET /auth/me', async () => {
    const { authApi } = await import('@/api/auth');
    await authApi.getMe();
    expect(mockGet).toHaveBeenCalledWith('/auth/me');
  });
  it('changePassword calls PUT /auth/password', async () => {
    const { authApi } = await import('@/api/auth');
    await authApi.changePassword({ old_password: 'x', new_password: 'y' });
    expect(mockPut).toHaveBeenCalledWith('/auth/password', { old_password: 'x', new_password: 'y' });
  });
});

describe('apiKeysApi', () => {
  it('list calls GET /keys', async () => {
    const { apiKeysApi } = await import('@/api/auth');
    await apiKeysApi.list();
    expect(mockGet).toHaveBeenCalledWith('/keys');
  });
  it('create calls POST /keys', async () => {
    const { apiKeysApi } = await import('@/api/auth');
    await apiKeysApi.create('mykey');
    expect(mockPost).toHaveBeenCalledWith('/keys', null, { params: { name: 'mykey' } });
  });
  it('delete calls DELETE /keys/:id', async () => {
    const { apiKeysApi } = await import('@/api/auth');
    await apiKeysApi.delete('k1');
    expect(mockDelete).toHaveBeenCalledWith('/keys/k1');
  });
});

describe('usersApi', () => {
  it('list calls GET /users', async () => {
    const { usersApi } = await import('@/api/auth');
    await usersApi.list();
    expect(mockGet).toHaveBeenCalledWith('/users');
  });
  it('create calls POST /users', async () => {
    const { usersApi } = await import('@/api/auth');
    await usersApi.create({ username: 'u', password: 'p', role: 'admin' });
    expect(mockPost).toHaveBeenCalledWith('/users', { username: 'u', password: 'p', role: 'admin' });
  });
  it('update calls PUT /users/:id', async () => {
    const { usersApi } = await import('@/api/auth');
    await usersApi.update('u1', { role: 'user' });
    expect(mockPut).toHaveBeenCalledWith('/users/u1', { role: 'user' });
  });
  it('delete calls DELETE /users/:id', async () => {
    const { usersApi } = await import('@/api/auth');
    await usersApi.delete('u1');
    expect(mockDelete).toHaveBeenCalledWith('/users/u1');
  });
});

describe('autoTuneApi', () => {
  it('triggerRun calls POST /auto-tune/run', async () => {
    const { autoTuneApi } = await import('@/api/auto_tune');
    await autoTuneApi.triggerRun({ strategy_id: 's1' });
    expect(mockPost).toHaveBeenCalledWith('/auto-tune/run', { strategy_id: 's1' });
  });
  it('confirmRun calls POST /auto-tune/:id/confirm', async () => {
    const { autoTuneApi } = await import('@/api/auto_tune');
    await autoTuneApi.confirmRun('r1');
    expect(mockPost).toHaveBeenCalledWith('/auto-tune/r1/confirm');
  });
  it('rollbackRun calls POST /auto-tune/:id/rollback', async () => {
    const { autoTuneApi } = await import('@/api/auto_tune');
    await autoTuneApi.rollbackRun('r1');
    expect(mockPost).toHaveBeenCalledWith('/auto-tune/r1/rollback');
  });
  it('getRuns calls GET /auto-tune/runs', async () => {
    const { autoTuneApi } = await import('@/api/auto_tune');
    await autoTuneApi.getRuns({ strategy_id: 's1' });
    expect(mockGet).toHaveBeenCalledWith('/auto-tune/runs', { params: { strategy_id: 's1' } });
  });
  it('createSchedule calls POST /auto-tune/schedules', async () => {
    const { autoTuneApi } = await import('@/api/auto_tune');
    await autoTuneApi.createSchedule({ strategy_id: 's1', cron_expr: '0 * * * *', apply_mode: 'manual', train_days: 30, test_days: 7 });
    expect(mockPost).toHaveBeenCalledWith('/auto-tune/schedules', expect.objectContaining({ strategy_id: 's1' }));
  });
  it('deleteSchedule calls DELETE /auto-tune/schedules/:id', async () => {
    const { autoTuneApi } = await import('@/api/auto_tune');
    await autoTuneApi.deleteSchedule('sc1');
    expect(mockDelete).toHaveBeenCalledWith('/auto-tune/schedules/sc1');
  });
  it('getSchedules calls GET /auto-tune/schedules', async () => {
    const { autoTuneApi } = await import('@/api/auto_tune');
    await autoTuneApi.getSchedules();
    expect(mockGet).toHaveBeenCalledWith('/auto-tune/schedules');
  });
});

describe('backtestApi', () => {
  it('runBacktest calls POST /backtest/run', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.runBacktest({ symbol: 'BTC' });
    expect(mockPost).toHaveBeenCalledWith('/backtest/run', { symbol: 'BTC' });
  });
  it('getStatus calls GET /backtest/:id/status', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.getStatus('t1');
    expect(mockGet).toHaveBeenCalledWith('/backtest/t1/status');
  });
  it('getResult calls GET /backtest/:id/result', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.getResult('t1');
    expect(mockGet).toHaveBeenCalledWith('/backtest/t1/result');
  });
  it('getHistory calls GET /backtest/history', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.getHistory();
    expect(mockGet).toHaveBeenCalledWith('/backtest/history');
  });
  it('getRuns calls GET /backtest/runs with pagination', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.getRuns(10, 5);
    expect(mockGet).toHaveBeenCalledWith('/backtest/runs', { params: { limit: 10, offset: 5 } });
  });
  it('getRun calls GET /backtest/runs/:id', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.getRun('r1');
    expect(mockGet).toHaveBeenCalledWith('/backtest/runs/r1');
  });
  it('getEquity calls GET /backtest/runs/:id/equity', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.getEquity('r1');
    expect(mockGet).toHaveBeenCalledWith('/backtest/runs/r1/equity');
  });
  it('getTrades calls GET /backtest/runs/:id/trades', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.getTrades('r1');
    expect(mockGet).toHaveBeenCalledWith('/backtest/runs/r1/trades');
  });
  it('compare calls GET /backtest/compare with run IDs', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.compare(['r1', 'r2']);
    expect(mockGet).toHaveBeenCalledWith('/backtest/compare', { params: { runs: 'r1,r2' } });
  });
  it('importResults calls POST /backtest/import', async () => {
    const { backtestApi } = await import('@/api/backtest');
    await backtestApi.importResults({ data: 1 });
    expect(mockPost).toHaveBeenCalledWith('/backtest/import', { data: 1 });
  });
});

describe('dataApi', () => {
  it('getSymbols calls GET /data/symbols', async () => {
    const { dataApi } = await import('@/api/data');
    await dataApi.getSymbols();
    expect(mockGet).toHaveBeenCalledWith('/data/symbols');
  });
  it('getCandles calls GET /data/candles with params', async () => {
    const { dataApi } = await import('@/api/data');
    await dataApi.getCandles({ symbol: 'BTC/USDT', timeframe: '1h', limit: 100 });
    expect(mockGet).toHaveBeenCalledWith('/data/candles', { params: { symbol: 'BTC/USDT', timeframe: '1h', limit: 100 } });
  });
});

describe('fundingApi', () => {
  it('getCurrent calls GET /funding/current', async () => {
    const { fundingApi } = await import('@/api/funding');
    await fundingApi.getCurrent();
    expect(mockGet).toHaveBeenCalledWith('/funding/current');
  });
  it('getHistory calls GET /funding/history/:symbol', async () => {
    const { fundingApi } = await import('@/api/funding');
    await fundingApi.getHistory('BTC/USDT', { limit: 50 });
    expect(mockGet).toHaveBeenCalledWith('/funding/history/BTC/USDT', { params: { limit: 50 } });
  });
  it('getCost calls GET /funding/cost/:strategyId', async () => {
    const { fundingApi } = await import('@/api/funding');
    await fundingApi.getCost('s1');
    expect(mockGet).toHaveBeenCalledWith('/funding/cost/s1', { params: undefined });
  });
  it('backfill calls POST /funding/backfill', async () => {
    const { fundingApi } = await import('@/api/funding');
    await fundingApi.backfill({ symbol: 'BTC/USDT', exchange: 'binance' });
    expect(mockPost).toHaveBeenCalledWith('/funding/backfill', { symbol: 'BTC/USDT', exchange: 'binance' });
  });
});

describe('ledgerApi', () => {
  it('getBalances calls GET /ledger/balances', async () => {
    const { ledgerApi } = await import('@/api/ledger');
    await ledgerApi.getBalances();
    expect(mockGet).toHaveBeenCalledWith('/ledger/balances');
  });
  it('getBalance calls GET /ledger/balances/:account', async () => {
    const { ledgerApi } = await import('@/api/ledger');
    await ledgerApi.getBalance('main');
    expect(mockGet).toHaveBeenCalledWith('/ledger/balances/main');
  });
  it('getEntries calls GET /ledger/entries with params', async () => {
    const { ledgerApi } = await import('@/api/ledger');
    await ledgerApi.getEntries({ account: 'main', limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/ledger/entries', { params: { account: 'main', limit: 10 } });
  });
  it('getEntriesByReference calls GET /ledger/entries/:id', async () => {
    const { ledgerApi } = await import('@/api/ledger');
    await ledgerApi.getEntriesByReference('ref1');
    expect(mockGet).toHaveBeenCalledWith('/ledger/entries/ref1');
  });
  it('getDailySummary calls GET /ledger/daily-summary', async () => {
    const { ledgerApi } = await import('@/api/ledger');
    await ledgerApi.getDailySummary('2026-01-01');
    expect(mockGet).toHaveBeenCalledWith('/ledger/daily-summary', { params: { date: '2026-01-01' } });
  });
  it('postCashFlow calls POST /ledger/cash-flow', async () => {
    const { ledgerApi } = await import('@/api/ledger');
    await ledgerApi.postCashFlow({ account: 'main', amount: 100, asset: 'USDT' } as any);
    expect(mockPost).toHaveBeenCalledWith('/ledger/cash-flow', expect.objectContaining({ account: 'main' }));
  });
  it('getConfig calls GET /ledger/config', async () => {
    const { ledgerApi } = await import('@/api/ledger');
    await ledgerApi.getConfig();
    expect(mockGet).toHaveBeenCalledWith('/ledger/config');
  });
});

describe('ordersApi', () => {
  it('getOpenOrders calls GET /orders', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getOpenOrders();
    expect(mockGet).toHaveBeenCalledWith('/orders');
  });
  it('getOrderHistory calls GET /orders/history', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getOrderHistory({ symbol: 'BTC' });
    expect(mockGet).toHaveBeenCalledWith('/orders/history', { params: { symbol: 'BTC' } });
  });
  it('getOrderEvents calls GET /orders/:id/events', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getOrderEvents('o1', 10);
    expect(mockGet).toHaveBeenCalledWith('/orders/o1/events', { params: { limit: 10 } });
  });
  it('placeOrder calls POST /orders', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.placeOrder({ symbol: 'BTC', side: 'BUY', type: 'LIMIT' } as any);
    expect(mockPost).toHaveBeenCalledWith('/orders', expect.objectContaining({ symbol: 'BTC' }));
  });
  it('cancelOrder calls DELETE /orders/:id', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.cancelOrder('o1', 'BTC', 'binance');
    expect(mockDelete).toHaveBeenCalledWith('/orders/o1', { params: { symbol: 'BTC', exchange: 'binance' } });
  });
  it('amendOrder calls PATCH /orders/:id', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.amendOrder('o1', { price: 50000 } as any);
    expect(mockPatch).toHaveBeenCalledWith('/orders/o1', { price: 50000 });
  });
  it('getStrategyOrders calls GET /orders/strategy/:id', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getStrategyOrders('s1');
    expect(mockGet).toHaveBeenCalledWith('/orders/strategy/s1');
  });
  it('activateTrailingStop calls POST /orders/:id/trailing-stop', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.activateTrailingStop('o1', { trailing_stop_pct: '5' } as any);
    expect(mockPost).toHaveBeenCalledWith('/orders/o1/trailing-stop', { trailing_stop_pct: '5' });
  });
  it('deactivateTrailingStop calls DELETE /orders/:id/trailing-stop', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.deactivateTrailingStop('o1');
    expect(mockDelete).toHaveBeenCalledWith('/orders/o1/trailing-stop');
  });
  it('getTrackedOrders calls GET /orders/tracked', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getTrackedOrders();
    expect(mockGet).toHaveBeenCalledWith('/orders/tracked');
  });
  it('getSLBindings calls GET /orders/sl-bindings', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getSLBindings();
    expect(mockGet).toHaveBeenCalledWith('/orders/sl-bindings');
  });
  it('getTrailingStops calls GET /orders/trailing', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getTrailingStops();
    expect(mockGet).toHaveBeenCalledWith('/orders/trailing');
  });
  it('submitAlgoOrder calls POST /orders/algo', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.submitAlgoOrder({ algo_type: 'TWAP' } as any);
    expect(mockPost).toHaveBeenCalledWith('/orders/algo', { algo_type: 'TWAP' });
  });
  it('getAlgoOrders calls GET /orders/algo', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getAlgoOrders();
    expect(mockGet).toHaveBeenCalledWith('/orders/algo');
  });
  it('getAlgoOrder calls GET /orders/algo/:id', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.getAlgoOrder('a1');
    expect(mockGet).toHaveBeenCalledWith('/orders/algo/a1');
  });
  it('cancelAlgoOrder calls POST /orders/algo/:id/cancel', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.cancelAlgoOrder('a1');
    expect(mockPost).toHaveBeenCalledWith('/orders/algo/a1/cancel');
  });
  it('pauseAlgoOrder calls POST /orders/algo/:id/pause', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.pauseAlgoOrder('a1');
    expect(mockPost).toHaveBeenCalledWith('/orders/algo/a1/pause');
  });
  it('resumeAlgoOrder calls POST /orders/algo/:id/resume', async () => {
    const { ordersApi } = await import('@/api/orders');
    await ordersApi.resumeAlgoOrder('a1');
    expect(mockPost).toHaveBeenCalledWith('/orders/algo/a1/resume');
  });
});

describe('reconciliationApi', () => {
  it('run calls POST /reconciliation/run', async () => {
    const { reconciliationApi } = await import('@/api/reconciliation');
    await reconciliationApi.run({} as any);
    expect(mockPost).toHaveBeenCalledWith('/reconciliation/run', {});
  });
  it('getReports calls GET /reconciliation/reports', async () => {
    const { reconciliationApi } = await import('@/api/reconciliation');
    await reconciliationApi.getReports();
    expect(mockGet).toHaveBeenCalledWith('/reconciliation/reports');
  });
  it('getReport calls GET /reconciliation/reports/:id', async () => {
    const { reconciliationApi } = await import('@/api/reconciliation');
    await reconciliationApi.getReport('r1');
    expect(mockGet).toHaveBeenCalledWith('/reconciliation/reports/r1');
  });
  it('getAlerts calls GET /reconciliation/alerts', async () => {
    const { reconciliationApi } = await import('@/api/reconciliation');
    await reconciliationApi.getAlerts();
    expect(mockGet).toHaveBeenCalledWith('/reconciliation/alerts');
  });
});

describe('riskApi', () => {
  it('getStatus calls GET /risk/status', async () => {
    const { riskApi } = await import('@/api/risk');
    await riskApi.getStatus();
    expect(mockGet).toHaveBeenCalledWith('/risk/status');
  });
  it('getExposure calls GET /risk/exposure', async () => {
    const { riskApi } = await import('@/api/risk');
    await riskApi.getExposure();
    expect(mockGet).toHaveBeenCalledWith('/risk/exposure');
  });
  it('getEvents calls GET /risk/events with pagination', async () => {
    const { riskApi } = await import('@/api/risk');
    await riskApi.getEvents(10, 20);
    expect(mockGet).toHaveBeenCalledWith('/risk/events', { params: { limit: 10, offset: 20 } });
  });
  it('getConfig calls GET /risk/config', async () => {
    const { riskApi } = await import('@/api/risk');
    await riskApi.getConfig();
    expect(mockGet).toHaveBeenCalledWith('/risk/config');
  });
  it('postKillSwitch calls POST /risk/kill-switch', async () => {
    const { riskApi } = await import('@/api/risk');
    await riskApi.postKillSwitch({ reason: 'test' } as any);
    expect(mockPost).toHaveBeenCalledWith('/risk/kill-switch', { reason: 'test' });
  });
});

describe('strategiesApi', () => {
  it('getStrategies calls GET /strategies', async () => {
    const { strategiesApi } = await import('@/api/strategies');
    await strategiesApi.getStrategies();
    expect(mockGet).toHaveBeenCalledWith('/strategies');
  });
  it('getStrategy calls GET /strategies/:id', async () => {
    const { strategiesApi } = await import('@/api/strategies');
    await strategiesApi.getStrategy('s1');
    expect(mockGet).toHaveBeenCalledWith('/strategies/s1');
  });
  it('toggleStrategy calls PATCH /strategies/:id/toggle', async () => {
    const { strategiesApi } = await import('@/api/strategies');
    await strategiesApi.toggleStrategy('s1', true);
    expect(mockPatch).toHaveBeenCalledWith('/strategies/s1/toggle', { enabled: true });
  });
  it('reloadStrategies calls POST /strategies/reload', async () => {
    const { strategiesApi } = await import('@/api/strategies');
    await strategiesApi.reloadStrategies();
    expect(mockPost).toHaveBeenCalledWith('/strategies/reload');
  });
  it('getParams calls GET /strategies/:id/params', async () => {
    const { strategiesApi } = await import('@/api/strategies');
    await strategiesApi.getParams('s1');
    expect(mockGet).toHaveBeenCalledWith('/strategies/s1/params');
  });
  it('updateParams calls PATCH /strategies/:id/params', async () => {
    const { strategiesApi } = await import('@/api/strategies');
    await strategiesApi.updateParams('s1', { a: 1 });
    expect(mockPatch).toHaveBeenCalledWith('/strategies/s1/params', { params: { a: 1 } });
  });
  it('getParamsAudit calls GET /strategies/:id/params/audit', async () => {
    const { strategiesApi } = await import('@/api/strategies');
    await strategiesApi.getParamsAudit('s1', 10);
    expect(mockGet).toHaveBeenCalledWith('/strategies/s1/params/audit', { params: { limit: 10 } });
  });
});

describe('systemApi', () => {
  it('getLiveness calls GET /health/live', async () => {
    const { systemApi } = await import('@/api/system');
    await systemApi.getLiveness();
    expect(mockGet).toHaveBeenCalledWith('/health/live');
  });
  it('getReadiness calls GET /health/ready', async () => {
    const { systemApi } = await import('@/api/system');
    await systemApi.getReadiness();
    expect(mockGet).toHaveBeenCalledWith('/health/ready');
  });
  it('getStatus calls GET /status', async () => {
    const { systemApi } = await import('@/api/system');
    await systemApi.getStatus();
    expect(mockGet).toHaveBeenCalledWith('/status');
  });
  it('getConfig calls GET /admin/config', async () => {
    const { systemApi } = await import('@/api/system');
    await systemApi.getConfig();
    expect(mockGet).toHaveBeenCalledWith('/admin/config');
  });
  it('getEventStats calls GET /admin/events/stats', async () => {
    const { systemApi } = await import('@/api/system');
    await systemApi.getEventStats();
    expect(mockGet).toHaveBeenCalledWith('/admin/events/stats');
  });
  it('reloadConfig calls POST /admin/reload-config', async () => {
    const { systemApi } = await import('@/api/system');
    await systemApi.reloadConfig();
    expect(mockPost).toHaveBeenCalledWith('/admin/reload-config');
  });
});

describe('tradingApi', () => {
  it('getStatus calls GET /trading/status', async () => {
    const { tradingApi } = await import('@/api/trading');
    await tradingApi.getStatus();
    expect(mockGet).toHaveBeenCalledWith('/trading/status');
  });
  it('getPortfolio calls GET /portfolio', async () => {
    const { tradingApi } = await import('@/api/trading');
    await tradingApi.getPortfolio();
    expect(mockGet).toHaveBeenCalledWith('/portfolio');
  });
  it('getPositions calls GET /portfolio/positions', async () => {
    const { tradingApi } = await import('@/api/trading');
    await tradingApi.getPositions();
    expect(mockGet).toHaveBeenCalledWith('/portfolio/positions');
  });
  it('getPosition calls GET /portfolio/positions/:symbol', async () => {
    const { tradingApi } = await import('@/api/trading');
    await tradingApi.getPosition('BTC');
    expect(mockGet).toHaveBeenCalledWith('/portfolio/positions/BTC');
  });
  it('getPnl calls GET /portfolio/pnl', async () => {
    const { tradingApi } = await import('@/api/trading');
    await tradingApi.getPnl();
    expect(mockGet).toHaveBeenCalledWith('/portfolio/pnl');
  });
});

describe('walkforwardApi', () => {
  it('run calls POST /walkforward/run', async () => {
    const { walkforwardApi } = await import('@/api/walkforward');
    await walkforwardApi.run({ symbol: 'BTC' });
    expect(mockPost).toHaveBeenCalledWith('/walkforward/run', { symbol: 'BTC' });
  });
  it('getRuns calls GET /walkforward/runs', async () => {
    const { walkforwardApi } = await import('@/api/walkforward');
    await walkforwardApi.getRuns(10, 5);
    expect(mockGet).toHaveBeenCalledWith('/walkforward/runs', { params: { limit: 10, offset: 5 } });
  });
  it('getRun calls GET /walkforward/runs/:id', async () => {
    const { walkforwardApi } = await import('@/api/walkforward');
    await walkforwardApi.getRun('r1');
    expect(mockGet).toHaveBeenCalledWith('/walkforward/runs/r1');
  });
  it('getWindows calls GET /walkforward/runs/:id/windows', async () => {
    const { walkforwardApi } = await import('@/api/walkforward');
    await walkforwardApi.getWindows('r1');
    expect(mockGet).toHaveBeenCalledWith('/walkforward/runs/r1/windows');
  });
  it('getBestParams calls GET /walkforward/runs/:id/best-params', async () => {
    const { walkforwardApi } = await import('@/api/walkforward');
    await walkforwardApi.getBestParams('r1');
    expect(mockGet).toHaveBeenCalledWith('/walkforward/runs/r1/best-params');
  });
  it('compare calls GET /walkforward/compare', async () => {
    const { walkforwardApi } = await import('@/api/walkforward');
    await walkforwardApi.compare(['r1', 'r2']);
    expect(mockGet).toHaveBeenCalledWith('/walkforward/compare', { params: { runs: 'r1,r2' } });
  });
});

describe('strategyMgmtApi', () => {
  it('listStrategies calls GET /strategy-mgmt/strategies', async () => {
    const { strategyMgmtApi } = await import('@/api/strategy_management');
    await strategyMgmtApi.listStrategies();
    expect(mockGet).toHaveBeenCalledWith('/strategy-mgmt/strategies');
  });
  it('loadStrategy calls POST with path', async () => {
    const { strategyMgmtApi } = await import('@/api/strategy_management');
    await strategyMgmtApi.loadStrategy('plugins/test.py');
    expect(mockPost).toHaveBeenCalledWith('/strategy-mgmt/strategies/load', { path: 'plugins/test.py' });
  });
  it('startStrategy calls POST with strategyId', async () => {
    const { strategyMgmtApi } = await import('@/api/strategy_management');
    await strategyMgmtApi.startStrategy('s1');
    expect(mockPost).toHaveBeenCalledWith('/strategy-mgmt/strategies/s1/start');
  });
  it('stopStrategy calls POST with strategyId', async () => {
    const { strategyMgmtApi } = await import('@/api/strategy_management');
    await strategyMgmtApi.stopStrategy('s1');
    expect(mockPost).toHaveBeenCalledWith('/strategy-mgmt/strategies/s1/stop');
  });
  it('reloadStrategy calls POST with strategyId', async () => {
    const { strategyMgmtApi } = await import('@/api/strategy_management');
    await strategyMgmtApi.reloadStrategy('s1');
    expect(mockPost).toHaveBeenCalledWith('/strategy-mgmt/strategies/s1/reload');
  });
  it('unloadStrategy calls DELETE with strategyId', async () => {
    const { strategyMgmtApi } = await import('@/api/strategy_management');
    await strategyMgmtApi.unloadStrategy('s1');
    expect(mockDelete).toHaveBeenCalledWith('/strategy-mgmt/strategies/s1');
  });
});

describe('feesApi', () => {
  it('getSummary calls GET /fees/summary', async () => {
    const { feesApi } = await import('@/api/fees');
    await feesApi.getSummary();
    expect(mockGet).toHaveBeenCalledWith('/fees/summary', { params: undefined });
  });
  it('getSummary passes params', async () => {
    const { feesApi } = await import('@/api/fees');
    await feesApi.getSummary({ exchange: 'binance', start: '2026-01-01' });
    expect(mockGet).toHaveBeenCalledWith('/fees/summary', { params: { exchange: 'binance', start: '2026-01-01' } });
  });
  it('getBreakdown calls GET /fees/breakdown', async () => {
    const { feesApi } = await import('@/api/fees');
    await feesApi.getBreakdown();
    expect(mockGet).toHaveBeenCalledWith('/fees/breakdown', { params: undefined });
  });
  it('getVipProgress calls GET /fees/vip-progress', async () => {
    const { feesApi } = await import('@/api/fees');
    await feesApi.getVipProgress({ exchange: 'binance' });
    expect(mockGet).toHaveBeenCalledWith('/fees/vip-progress', { params: { exchange: 'binance' } });
  });
  it('getDeviation calls GET /fees/deviation', async () => {
    const { feesApi } = await import('@/api/fees');
    await feesApi.getDeviation();
    expect(mockGet).toHaveBeenCalledWith('/fees/deviation', { params: undefined });
  });
  it('getStrategyReport calls GET /fees/strategy', async () => {
    const { feesApi } = await import('@/api/fees');
    await feesApi.getStrategyReport({ strategy_id: 's1' });
    expect(mockGet).toHaveBeenCalledWith('/fees/strategy', { params: { strategy_id: 's1' } });
  });
});

describe('attributionApi', () => {
  it('computeReport calls POST /attribution/report', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.computeReport({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });
    expect(mockPost).toHaveBeenCalledWith('/attribution/report', { strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });
  });
  it('listReports calls GET /attribution/reports', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.listReports();
    expect(mockGet).toHaveBeenCalledWith('/attribution/reports', { params: undefined });
  });
  it('getReport calls GET with reportId', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.getReport('r1');
    expect(mockGet).toHaveBeenCalledWith('/attribution/reports/r1');
  });
  it('deleteReport calls DELETE with reportId', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.deleteReport('r1');
    expect(mockDelete).toHaveBeenCalledWith('/attribution/reports/r1');
  });
  it('getContributions calls GET with params', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.getContributions({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01', top_n: 10 });
    expect(mockGet).toHaveBeenCalledWith('/attribution/contributions', { params: { strategy_id: 's1', start: '2026-01-01', end: '2026-02-01', top_n: 10 } });
  });
  it('getRollforward calls GET with params', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.getRollforward({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });
    expect(mockGet).toHaveBeenCalledWith('/attribution/rollforward', { params: { strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' } });
  });
  it('getRegime calls GET with params', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.getRegime({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });
    expect(mockGet).toHaveBeenCalledWith('/attribution/regime', { params: { strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' } });
  });
  it('compareBenchmark calls GET with params', async () => {
    const { attributionApi } = await import('@/api/attribution');
    await attributionApi.compareBenchmark({ strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' });
    expect(mockGet).toHaveBeenCalledWith('/attribution/compare-benchmark', { params: { strategy_id: 's1', start: '2026-01-01', end: '2026-02-01' } });
  });
});

describe('alertsApi', () => {
  it('listRules calls GET /alerts/rules', async () => {
    const { alertsApi } = await import('@/api/alerts');
    await alertsApi.listRules();
    expect(mockGet).toHaveBeenCalledWith('/alerts/rules', { params: undefined });
  });
  it('createRule calls POST /alerts/rules', async () => {
    const { alertsApi } = await import('@/api/alerts');
    await alertsApi.createRule({ rule_id: 'r1', name: 'test', alert_type: 'threshold' });
    expect(mockPost).toHaveBeenCalledWith('/alerts/rules', { rule_id: 'r1', name: 'test', alert_type: 'threshold' });
  });
  it('updateRule calls PATCH with ruleId', async () => {
    const { alertsApi } = await import('@/api/alerts');
    await alertsApi.updateRule('r1', { enabled: false });
    expect(mockPatch).toHaveBeenCalledWith('/alerts/rules/r1', { enabled: false });
  });
  it('deleteRule calls DELETE with ruleId', async () => {
    const { alertsApi } = await import('@/api/alerts');
    await alertsApi.deleteRule('r1');
    expect(mockDelete).toHaveBeenCalledWith('/alerts/rules/r1');
  });
  it('listFirings calls GET /alerts/firings', async () => {
    const { alertsApi } = await import('@/api/alerts');
    await alertsApi.listFirings({ status: 'active', limit: 50 });
    expect(mockGet).toHaveBeenCalledWith('/alerts/firings', { params: { status: 'active', limit: 50 } });
  });
  it('getActiveAlerts calls GET /alerts/active', async () => {
    const { alertsApi } = await import('@/api/alerts');
    await alertsApi.getActiveAlerts();
    expect(mockGet).toHaveBeenCalledWith('/alerts/active');
  });
  it('manualEvaluate calls POST with ruleId', async () => {
    const { alertsApi } = await import('@/api/alerts');
    await alertsApi.manualEvaluate('r1');
    expect(mockPost).toHaveBeenCalledWith('/alerts/rules/r1/evaluate');
  });
});

// ── Rebalance API ────────────────────────────────────────────────
describe('rebalanceApi', () => {
  it('triggerRebalance calls POST /portfolio/rebalance', async () => {
    const { rebalanceApi } = await import('@/api/rebalance');
    await rebalanceApi.triggerRebalance({ strategy_id: 's1', target_weights: { BTC: 0.5 } });
    expect(mockPost).toHaveBeenCalledWith('/portfolio/rebalance', { strategy_id: 's1', target_weights: { BTC: 0.5 } });
  });
  it('getStatus calls GET with strategy_id param', async () => {
    const { rebalanceApi } = await import('@/api/rebalance');
    await rebalanceApi.getStatus('s1');
    expect(mockGet).toHaveBeenCalledWith('/portfolio/rebalance/status', { params: { strategy_id: 's1' } });
  });
  it('getHistory calls GET with params', async () => {
    const { rebalanceApi } = await import('@/api/rebalance');
    await rebalanceApi.getHistory({ strategy_id: 's1', limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/portfolio/rebalance/history', { params: { strategy_id: 's1', limit: 10 } });
  });
  it('getDrift calls GET with strategy_id param', async () => {
    const { rebalanceApi } = await import('@/api/rebalance');
    await rebalanceApi.getDrift('s1');
    expect(mockGet).toHaveBeenCalledWith('/portfolio/rebalance/drift', { params: { strategy_id: 's1' } });
  });
  it('updateTargets calls PUT /portfolio/rebalance/targets', async () => {
    const { rebalanceApi } = await import('@/api/rebalance');
    await rebalanceApi.updateTargets({ strategy_id: 's1', target_weights: { BTC: 0.6 } });
    expect(mockPut).toHaveBeenCalledWith('/portfolio/rebalance/targets', { strategy_id: 's1', target_weights: { BTC: 0.6 } });
  });
});

// ── Journal API ──────────────────────────────────────────────────
describe('journalApi', () => {
  it('getEntries calls GET /journal/entries', async () => {
    const { journalApi } = await import('@/api/journal');
    await journalApi.getEntries({ strategy_id: 's1', limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/journal/entries', { params: { strategy_id: 's1', limit: 20 } });
  });
  it('getEntry calls GET with entryId path', async () => {
    const { journalApi } = await import('@/api/journal');
    await journalApi.getEntry('e1');
    expect(mockGet).toHaveBeenCalledWith('/journal/entries/e1');
  });
  it('updateEntry calls PATCH with entryId', async () => {
    const { journalApi } = await import('@/api/journal');
    await journalApi.updateEntry('e1', { notes: 'test' });
    expect(mockPatch).toHaveBeenCalledWith('/journal/entries/e1', { notes: 'test' });
  });
  it('reviewEntry calls POST review endpoint', async () => {
    const { journalApi } = await import('@/api/journal');
    await journalApi.reviewEntry('e1', { review_notes: 'ok' });
    expect(mockPost).toHaveBeenCalledWith('/journal/entries/e1/review', { review_notes: 'ok' });
  });
  it('dismissEntry calls POST dismiss endpoint', async () => {
    const { journalApi } = await import('@/api/journal');
    await journalApi.dismissEntry('e1');
    expect(mockPost).toHaveBeenCalledWith('/journal/entries/e1/dismiss');
  });
  it('getReport calls GET /journal/report', async () => {
    const { journalApi } = await import('@/api/journal');
    await journalApi.getReport({ strategy_id: 's1', days: 30 });
    expect(mockGet).toHaveBeenCalledWith('/journal/report', { params: { strategy_id: 's1', days: 30 } });
  });
  it('getPendingCount calls GET /journal/pending-count', async () => {
    const { journalApi } = await import('@/api/journal');
    await journalApi.getPendingCount();
    expect(mockGet).toHaveBeenCalledWith('/journal/pending-count');
  });
});

// ── Replay API ───────────────────────────────────────────────────
describe('replayApi', () => {
  it('run calls POST /replay/run', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.run({ strategy_id: 's1', symbol: 'BTC/USDT' });
    expect(mockPost).toHaveBeenCalledWith('/replay/run', { strategy_id: 's1', symbol: 'BTC/USDT' });
  });
  it('getTask calls GET with taskId path', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.getTask('t1');
    expect(mockGet).toHaveBeenCalledWith('/replay/tasks/t1');
  });
  it('getScenarios calls GET /replay/scenarios', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.getScenarios({ limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/replay/scenarios', { params: { limit: 10 } });
  });
  it('getScenario calls GET with scenarioId path', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.getScenario('sc1');
    expect(mockGet).toHaveBeenCalledWith('/replay/scenarios/sc1');
  });
  it('deleteScenario calls DELETE with scenarioId', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.deleteScenario('sc1');
    expect(mockDelete).toHaveBeenCalledWith('/replay/scenarios/sc1');
  });
  it('getSteps calls GET steps path', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.getSteps('sc1');
    expect(mockGet).toHaveBeenCalledWith('/replay/scenarios/sc1/steps');
  });
  it('getStep calls GET step index path', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.getStep(5);
    expect(mockGet).toHaveBeenCalledWith('/replay/steps/5');
  });
  it('getSummary calls GET /replay/summary', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.getSummary('t1');
    expect(mockGet).toHaveBeenCalledWith('/replay/summary', { params: { task_id: 't1' } });
  });
  it('compare calls POST /replay/compare', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.compare(['t1', 't2']);
    expect(mockPost).toHaveBeenCalledWith('/replay/compare', { task_ids: ['t1', 't2'] });
  });
  it('getTradeContext calls GET trade-context path', async () => {
    const { replayApi } = await import('@/api/replay');
    await replayApi.getTradeContext('tr1');
    expect(mockGet).toHaveBeenCalledWith('/replay/trade-context/tr1');
  });
});

// ── Governance API ───────────────────────────────────────────────
describe('governanceApi', () => {
  it('getQualityScores calls GET /governance/quality/scores', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.getQualityScores({ symbol: 'BTC/USDT' });
    expect(mockGet).toHaveBeenCalledWith('/governance/quality/scores', { params: { symbol: 'BTC/USDT' } });
  });
  it('getQualitySymbols calls GET /governance/quality/symbols', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.getQualitySymbols();
    expect(mockGet).toHaveBeenCalledWith('/governance/quality/symbols');
  });
  it('evaluateQuality calls POST evaluate', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.evaluateQuality({ symbol: 'BTC/USDT', timeframe: '1h' });
    expect(mockPost).toHaveBeenCalledWith('/governance/quality/evaluate', { symbol: 'BTC/USDT', timeframe: '1h' });
  });
  it('getArchiveStatus calls GET archive/status', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.getArchiveStatus();
    expect(mockGet).toHaveBeenCalledWith('/governance/archive/status');
  });
  it('runArchive calls POST archive/run', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.runArchive({ symbols: ['BTC'], start_time: '2026-01-01', end_time: '2026-01-31' });
    expect(mockPost).toHaveBeenCalledWith('/governance/archive/run', { symbols: ['BTC'], start_time: '2026-01-01', end_time: '2026-01-31' });
  });
  it('getArchiveRuns calls GET archive/runs', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.getArchiveRuns({ limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/governance/archive/runs', { params: { limit: 10 } });
  });
  it('lifecycleDryRun calls POST lifecycle/dry-run', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.lifecycleDryRun({ symbol: 'BTC/USDT', timeframe: '1h', action: 'archive' });
    expect(mockPost).toHaveBeenCalledWith('/governance/lifecycle/dry-run', { symbol: 'BTC/USDT', timeframe: '1h', action: 'archive' });
  });
  it('lifecycleExecute calls POST lifecycle/execute', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.lifecycleExecute({ symbol: 'BTC/USDT', timeframe: '1h', action: 'archive', confirmed: true });
    expect(mockPost).toHaveBeenCalledWith('/governance/lifecycle/execute', { symbol: 'BTC/USDT', timeframe: '1h', action: 'archive', confirmed: true });
  });
  it('getStatus calls GET /governance/status', async () => {
    const { governanceApi } = await import('@/api/governance');
    await governanceApi.getStatus();
    expect(mockGet).toHaveBeenCalledWith('/governance/status');
  });
});

// ── Exchange Health API ──────────────────────────────────────────
describe('exchangeHealthApi', () => {
  it('getStatus calls GET /exchange-health/status', async () => {
    const { exchangeHealthApi } = await import('@/api/exchange_health');
    await exchangeHealthApi.getStatus();
    expect(mockGet).toHaveBeenCalledWith('/exchange-health/status');
  });
  it('getFailovers calls GET with limit param', async () => {
    const { exchangeHealthApi } = await import('@/api/exchange_health');
    await exchangeHealthApi.getFailovers(20);
    expect(mockGet).toHaveBeenCalledWith('/exchange-health/failovers', { params: { limit: 20 } });
  });
  it('getHistory calls GET with exchange path', async () => {
    const { exchangeHealthApi } = await import('@/api/exchange_health');
    await exchangeHealthApi.getHistory('binance', 10);
    expect(mockGet).toHaveBeenCalledWith('/exchange-health/binance/history', { params: { limit: 10 } });
  });
  it('triggerCheck calls POST with exchange path', async () => {
    const { exchangeHealthApi } = await import('@/api/exchange_health');
    await exchangeHealthApi.triggerCheck('binance');
    expect(mockPost).toHaveBeenCalledWith('/exchange-health/binance/check');
  });
});

// ── Features API ─────────────────────────────────────────────────
describe('featuresApi', () => {
  it('registerDefinition calls POST /features/definitions', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.registerDefinition({ name: 'sma' });
    expect(mockPost).toHaveBeenCalledWith('/features/definitions', { name: 'sma' });
  });
  it('listDefinitions calls GET with params', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.listDefinitions({ feature_type: 'indicator' });
    expect(mockGet).toHaveBeenCalledWith('/features/definitions', { params: { feature_type: 'indicator' } });
  });
  it('getDefinition calls GET with name path', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.getDefinition('sma');
    expect(mockGet).toHaveBeenCalledWith('/features/definitions/sma');
  });
  it('deleteDefinition calls DELETE with name path', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.deleteDefinition('sma');
    expect(mockDelete).toHaveBeenCalledWith('/features/definitions/sma');
  });
  it('queryValues calls GET /features/values', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.queryValues({ symbol: 'BTC', limit: 50 });
    expect(mockGet).toHaveBeenCalledWith('/features/values', { params: { symbol: 'BTC', limit: 50 } });
  });
  it('getValue calls GET with symbol/tf/name path', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.getValue('BTC', '1h', 'sma');
    expect(mockGet).toHaveBeenCalledWith('/features/values/BTC/1h/sma');
  });
  it('precompute calls POST /features/precompute', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.precompute({ symbol: 'BTC', timeframe: '1h' });
    expect(mockPost).toHaveBeenCalledWith('/features/precompute', { symbol: 'BTC', timeframe: '1h' });
  });
  it('getStatus calls GET /features/status', async () => {
    const { featuresApi } = await import('@/api/features');
    await featuresApi.getStatus();
    expect(mockGet).toHaveBeenCalledWith('/features/status');
  });
});

// ── Security API ─────────────────────────────────────────────────
describe('securityApi', () => {
  it('getAudit calls GET /security/audit', async () => {
    const { securityApi } = await import('@/api/security');
    await securityApi.getAudit({ severity: 'critical' });
    expect(mockGet).toHaveBeenCalledWith('/security/audit', { params: { severity: 'critical' } });
  });
  it('getSummary calls GET /security/audit/summary', async () => {
    const { securityApi } = await import('@/api/security');
    await securityApi.getSummary();
    expect(mockGet).toHaveBeenCalledWith('/security/audit/summary');
  });
});

// ── Admin API ────────────────────────────────────────────────────
describe('adminApi', () => {
  it('getConfig calls GET /admin/config', async () => {
    const { adminApi } = await import('@/api/admin');
    await adminApi.getConfig();
    expect(mockGet).toHaveBeenCalledWith('/admin/config');
  });
  it('getEventsStats calls GET /admin/events/stats', async () => {
    const { adminApi } = await import('@/api/admin');
    await adminApi.getEventsStats();
    expect(mockGet).toHaveBeenCalledWith('/admin/events/stats');
  });
  it('reloadConfig calls POST /admin/reload-config', async () => {
    const { adminApi } = await import('@/api/admin');
    await adminApi.reloadConfig();
    expect(mockPost).toHaveBeenCalledWith('/admin/reload-config');
  });
});

// ── Warmup API ───────────────────────────────────────────────────
describe('warmupApi', () => {
  it('getStatus calls GET /warmup/status', async () => {
    const { warmupApi } = await import('@/api/warmup');
    await warmupApi.getStatus();
    expect(mockGet).toHaveBeenCalledWith('/warmup/status');
  });
  it('getResults calls GET /warmup/results with params', async () => {
    const { warmupApi } = await import('@/api/warmup');
    await warmupApi.getResults({ symbol: 'BTC/USDT', timeframe: '1h' });
    expect(mockGet).toHaveBeenCalledWith('/warmup/results', { params: { symbol: 'BTC/USDT', timeframe: '1h' } });
  });
});

// ── Accounts API ─────────────────────────────────────────────────
describe('accountsApi', () => {
  it('list calls GET /accounts', async () => {
    const { accountsApi } = await import('@/api/accounts');
    await accountsApi.list();
    expect(mockGet).toHaveBeenCalledWith('/accounts');
  });
  it('get calls GET with accountId path', async () => {
    const { accountsApi } = await import('@/api/accounts');
    await accountsApi.get('acc1');
    expect(mockGet).toHaveBeenCalledWith('/accounts/acc1');
  });
  it('kill calls POST with accountId path', async () => {
    const { accountsApi } = await import('@/api/accounts');
    await accountsApi.kill('acc1');
    expect(mockPost).toHaveBeenCalledWith('/accounts/acc1/kill');
  });
  it('unkill calls DELETE with accountId path', async () => {
    const { accountsApi } = await import('@/api/accounts');
    await accountsApi.unkill('acc1');
    expect(mockDelete).toHaveBeenCalledWith('/accounts/acc1/kill');
  });
});

// ── Archive API ──────────────────────────────────────────────────
describe('archiveApi', () => {
  it('archiveRun calls POST with runId path', async () => {
    const { archiveApi } = await import('@/api/archive');
    await archiveApi.archiveRun('r1', { strategy_id: 's1', tag: 'v1' });
    expect(mockPost).toHaveBeenCalledWith('/archive/runs/r1', { strategy_id: 's1', tag: 'v1' });
  });
  it('getVersions calls GET /archive/versions with strategy_id', async () => {
    const { archiveApi } = await import('@/api/archive');
    await archiveApi.getVersions('s1');
    expect(mockGet).toHaveBeenCalledWith('/archive/versions', { params: { strategy_id: 's1' } });
  });
  it('compareVersions calls GET with strategy path and version params', async () => {
    const { archiveApi } = await import('@/api/archive');
    await archiveApi.compareVersions('s1', 'v1', 'v2');
    expect(mockGet).toHaveBeenCalledWith('/archive/versions/s1/compare', { params: { version_a: 'v1', version_b: 'v2' } });
  });
  it('getEntries calls GET /archive/entries with params', async () => {
    const { archiveApi } = await import('@/api/archive');
    await archiveApi.getEntries({ strategy_id: 's1', limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/archive/entries', { params: { strategy_id: 's1', limit: 20 } });
  });
  it('getEntry calls GET with runId path', async () => {
    const { archiveApi } = await import('@/api/archive');
    await archiveApi.getEntry('r1');
    expect(mockGet).toHaveBeenCalledWith('/archive/entries/r1');
  });
  it('updateTag calls PATCH with runId path', async () => {
    const { archiveApi } = await import('@/api/archive');
    await archiveApi.updateTag('r1', 'production');
    expect(mockPatch).toHaveBeenCalledWith('/archive/entries/r1/tag', { tag: 'production' });
  });
});

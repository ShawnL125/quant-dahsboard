// ── Portfolio ──────────────────────────────────────────────────────
export interface PortfolioSnapshot {
  total_equity: string;
  available_balance: string;
  realized_pnl: string;
  unrealized_pnl: string;
}

// ── Position ───────────────────────────────────────────────────────
export interface Position {
  symbol: string;
  exchange: string;
  side: string;
  quantity: string;
  entry_price: string;
  unrealized_pnl: string;
  stop_loss?: string | null;
  take_profit?: string | null;
}

// ── Order ──────────────────────────────────────────────────────────
export interface Order {
  order_id: string;
  symbol: string;
  exchange: string;
  side: string;
  status: string;
  order_type: string;
  quantity: string;
  price?: string | null;
  filled_quantity?: string;
  avg_fill_price?: string | null;
  created_at?: string;
}

export interface OrderRequest {
  symbol: string;
  exchange: string;
  side: string;
  order_type: string;
  quantity: string;
  price?: string | null;
  stop_price?: string | null;
}

export interface OrderEvent {
  event_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ── Strategy ───────────────────────────────────────────────────────
export interface Strategy {
  strategy_id: string;
  symbols: string[];
  exchanges: string[];
  timeframes: string[];
  is_running: boolean;
  parameters: Record<string, unknown>;
  stop_loss_pct?: string | null;
  take_profit_pct?: string | null;
  trailing_stop_pct?: string | null;
}

// ── Backtest ───────────────────────────────────────────────────────
export interface BacktestRun {
  task_id: string;
  status: string;
  created_at?: string;
}

export interface BacktestResult {
  group_id: string;
  total_return_pct: string;
  sharpe_ratio: string;
  calmar_ratio: string;
  max_drawdown_pct: string;
  win_rate: string;
  total_trades: number;
}

export interface BacktestRunRecord {
  run_id: string;
  symbol: string;
  exchange: string;
  timeframe: string;
  start_time: string;
  end_time: string;
  group_id: string;
  strategy_ids: string[];
  initial_balance: string;
  total_return_pct: string;
  sharpe_ratio: string;
  calmar_ratio: string;
  max_drawdown_pct: string;
  win_rate: string;
  total_trades: number;
  status: string;
  created_at: string;
}

export interface BacktestEquityPoint {
  run_id: string;
  timestamp: string;
  equity: string;
}

export interface BacktestTrade {
  run_id: string;
  symbol: string;
  exchange: string;
  side: string;
  entry_time: string;
  exit_time: string;
  entry_price: string;
  exit_price: string;
  quantity: string;
  pnl: string;
}

// ── Walk-Forward ────────────────────────────────────────────────────
export interface WalkForwardRun {
  run_id: string;
  strategy_id: string;
  algorithm: string;
  objective: string;
  window_mode: string;
  train_days: number;
  test_days: number;
  config: Record<string, unknown>;
  status: string;
  summary: Record<string, unknown> | null;
  time: string;
}

export interface WalkForwardWindow {
  run_id: string;
  window_index: number;
  train_start: string;
  train_end: string;
  test_start: string;
  test_end: string;
  best_params: Record<string, unknown>;
  train_metrics: Record<string, unknown>;
  test_metrics: Record<string, unknown>;
  objective_score: number;
  overfitting_ratio: number;
}

export interface WalkForwardBestParams {
  window_index: number;
  best_params: Record<string, unknown>;
  objective_score: number;
  overfitting_ratio: number;
}

export interface BacktestHistoryItem {
  task_id: string;
  status: string;
  created_at: string;
  total_return_pct?: string;
  sharpe_ratio?: string;
}

// ── System ─────────────────────────────────────────────────────────
export interface SystemStatus {
  portfolio: {
    total_equity: string;
    available_balance: string;
    realized_pnl: string;
    unrealized_pnl: string;
  };
  positions: Position[];
  open_orders: number;
  connected_exchanges: string[];
  subscribed_symbols: Record<string, string[]>;
}

export interface HealthStatus {
  status: string;
  uptime_seconds: number;
}

export interface ConfigView {
  [key: string]: unknown;
}

export interface EventStats {
  [eventType: string]: number;
}

// ── WebSocket ──────────────────────────────────────────────────────
export type WSChannel = 'trades' | 'positions' | 'orders' | 'pnl' | 'system' | 'risk' | 'signals' | 'quality';

export interface WSMessage {
  channel: WSChannel;
  timestamp: string;
  data: unknown;
}

export interface WSCommand {
  action: 'subscribe' | 'unsubscribe';
  channels: WSChannel[];
}

// ── Paper Trading ──────────────────────────────────────────────────
export interface PaperStatus {
  paper_trading: boolean;
  message?: string;
}

// ── Risk ───────────────────────────────────────────────────────────
export interface KillSwitchState {
  global: { active: boolean; reason: string };
  symbols: Record<string, string>;
  strategies: Record<string, string>;
}

export interface DrawdownData {
  current_pct: number;
  peak_equity: number;
  max_threshold: number;
  reduce_threshold: number;
  size_scale: number;
}

export interface ExposureData {
  total_exposure: number;
  total_pct: number;
  max_total_pct: number;
  by_symbol: Record<string, SymbolExposure>;
}

export interface SymbolExposure {
  symbol: string;
  exchange: string;
  side: string;
  quantity: number;
  value: number;
  pct_of_equity: number;
}

export interface RiskStatus {
  kill_switch: KillSwitchState;
  drawdown: DrawdownData;
  exposure: { total_pct: number; max_total_pct: number };
  positions: Array<{
    symbol: string;
    exchange: string;
    side: string;
    quantity: string;
    entry_price: string;
    value: string;
  }>;
  config: {
    sizing_model: string;
    max_open_positions: number;
    allow_pyramiding: boolean;
    kill_switch_enabled: boolean;
  };
}

export interface RiskEvent {
  event_id: string;
  time: string;
  event_type: string;
  level: string;
  target: string;
  reason: string;
  metadata: Record<string, unknown>;
}

export interface RiskEventsResponse {
  events: RiskEvent[];
  total: number;
}

export interface RiskConfig {
  sizing_model: string;
  max_position_size_pct: number;
  max_risk_per_trade_pct: number;
  max_open_positions: number;
  max_total_exposure_pct: number;
  max_single_asset_pct: number;
  position_reduce_at_pct: number;
  max_drawdown_pct: number;
  allow_pyramiding: boolean;
  kill_switch_enabled: boolean;
  max_correlated_exposure_pct: number;
}

export interface KillSwitchPayload {
  level: 'GLOBAL' | 'SYMBOL' | 'STRATEGY';
  target?: string;
  reason?: string;
  activate: boolean;
}

export interface DrawdownPoint {
  time: number;
  value: number;
}

// ── Signal Flow ────────────────────────────────────────────────────
export interface SignalData {
  strategy_id: string;
  symbol: string;
  exchange: string;
  direction: 'LONG' | 'SHORT' | 'CLOSE';
  strength: string;
  reason: string;
  target_price?: string | null;
  stop_price?: string | null;
  stop_loss_pct?: string | null;
  take_profit_pct?: string | null;
  trailing_stop_pct?: string | null;
  metadata: Record<string, unknown>;
}

export interface SignalEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  priority: number;
  signal: SignalData;
}

// ── Data Quality ───────────────────────────────────────────────────
export interface QualityAlert {
  alert_type: 'data_gap' | 'price_anomaly' | 'volume_spike' | 'high_latency' | 'validation_failure';
  symbol: string;
  exchange: string;
  severity: 'warning' | 'critical';
  metric_value: string;
  threshold: string;
  detected_at: string;
  details: Record<string, unknown>;
}

export interface ConnectorStatus {
  ready: boolean;
  ws_connected: boolean;
  ws_running: boolean;
  reconnect_attempts: number | null;
  market_data: {
    last_event_at: string | null;
    last_received_at: string | null;
    last_event_age_s: number | null;
    receiving: boolean;
    events_received: number;
  };
}

export interface HealthReadyResponse {
  status: string;
  connectors: Record<string, ConnectorStatus>;
}

export interface SystemStatusResponse {
  service: { alive: boolean; ready: boolean; paper_trading: boolean };
  frontend_ws: { connected_clients: number };
  market_data: {
    last_event_at: string | null;
    last_received_at: string | null;
    last_event_type: string | null;
    last_event_age_s: number | null;
    receiving: boolean;
  };
  connectors: Record<string, ConnectorStatus>;
}

// ── Analytics ──────────────────────────────────────────────────────
export interface AnalyticsSignal {
  time: string;
  signal_id: string;
  strategy_id: string;
  symbol: string;
  exchange: string;
  direction: string;
  strength: string;
  reason: string;
  target_price?: string | null;
  stop_price?: string | null;
  metadata: Record<string, unknown>;
}

export interface AnalyticsSignalsResponse {
  signals: AnalyticsSignal[];
  total: number;
}

export interface RoundTrip {
  time: string;
  trade_id: string;
  strategy_id: string;
  signal_id: string | null;
  close_signal_id: string | null;
  symbol: string;
  exchange: string;
  side: string;
  entry_time: string | null;
  exit_time: string | null;
  entry_price: string;
  exit_price: string;
  quantity: string;
  gross_pnl: string;
  fee: string;
  net_pnl: string;
  holding_duration_sec: number;
  stop_triggered: boolean;
  metadata: Record<string, unknown>;
}

export interface RoundTripsResponse {
  round_trips: RoundTrip[];
  total: number;
}

export interface StrategyStatsSnapshot {
  time: string;
  snapshot_id: string;
  strategy_id: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: string;
  avg_win: string;
  avg_loss: string;
  profit_factor: string;
  total_pnl: string;
  sharpe_ratio: string | null;
  max_drawdown_pct: string;
  consecutive_losses: number;
  max_consecutive_losses: number;
  avg_holding_sec: number;
  signal_count: number;
  signal_fill_rate: string;
}

export interface StrategyStatsResponse {
  snapshots: StrategyStatsSnapshot[];
}

export interface StrategyStatsHistoryResponse {
  history: StrategyStatsSnapshot[];
}

export interface ConsecutiveLossesResponse {
  consecutive_losses: number;
  max_consecutive_losses: number;
  strategy_id: string | null;
}

export interface SignalQualityResponse {
  signal_count: number;
  trade_count: number;
  fill_rate: string;
}

export interface AnalyticsConfigResponse {
  enabled: boolean;
  snapshot_interval_hours: number;
  track_signals: boolean;
  max_open_position_memory: number;
}

// ── Ledger ─────────────────────────────────────────────────────────
export interface LedgerEntry {
  entry_id: string;
  timestamp: string;
  account: string;
  counter_account: string;
  debit: string;
  credit: string;
  balance: string;
  asset: string;
  reference_type: string;
  reference_id: string;
  strategy_id?: string | null;
  symbol?: string | null;
  exchange?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LedgerEntriesResponse {
  entries: LedgerEntry[];
  total: number;
}

export interface DailySummary {
  date: string;
  account: string;
  asset: string;
  total_debit: string;
  total_credit: string;
  opening_balance: string;
  closing_balance: string;
  entry_count: number;
}

export interface CashFlowRequest {
  flow_type: 'deposit' | 'withdrawal';
  asset?: string;
  amount: string;
}

export interface CashFlowResponse {
  cash_flow_id: string;
  flow_type: string;
  asset: string;
  amount: string;
}

export interface LedgerConfigResponse {
  enabled: boolean;
  track_funding: boolean;
  snapshot_interval_hours: number;
  daily_summary_hour_utc: number;
}

// ── Reconciliation ─────────────────────────────────────────────────
export interface ReconciliationRunRequest {
  backtest_run_id: string;
}

export interface ReconciliationRunResponse {
  report_id: string;
  trade_match_count: number;
  alert_count: number;
}

export interface ReconAlert {
  alert_id: string;
  level: string;
  alert_type: string;
  message: string;
  data: Record<string, unknown>;
}

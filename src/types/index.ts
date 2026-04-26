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

export type TradingMode = 'live' | 'testnet' | 'paper';

export interface HealthStatus {
  status: string;
  uptime_seconds: number;
  trading_mode?: TradingMode;
}

export interface ConfigView {
  [key: string]: unknown;
}

export interface EventStats {
  [eventType: string]: number;
}

// ── WebSocket ──────────────────────────────────────────────────────
export type WSChannel =
  | 'trades' | 'positions' | 'orders' | 'pnl' | 'system'
  | 'risk' | 'signals' | 'quality'
  | 'account' | 'margin' | 'reconcile' | 'funding' | 'params' | 'notifications';

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
  // Stable audit identifier used to merge REST and websocket events idempotently.
  event_id: string;
  time: string;
  received_at?: string;
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

export interface KillSwitchExpectedState {
  active: boolean;
  version?: string | number;
}

export interface KillSwitchPayload {
  level: 'GLOBAL' | 'SYMBOL' | 'STRATEGY';
  target?: string;
  reason: string;
  activate: boolean;
  expected_state: KillSwitchExpectedState;
  idempotency_key: string;
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

// ── Algorithmic Orders (Phase 38) ─────────────────────────────────
export interface AlgoOrder {
  algo_id: string;
  algo_type: 'twap' | 'vwap' | 'iceberg';
  symbol: string;
  exchange: string;
  side: string;
  total_quantity: string;
  filled_quantity: string;
  avg_fill_price?: string;
  slice_count: number;
  slices_completed: number;
  status: string;
  progress_pct?: string;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface AlgoOrderDetail extends AlgoOrder {
  slices_pending: number;
  slices_filled: number;
}

export interface SubmitAlgoBody {
  symbol: string;
  exchange: string;
  side: string;
  quantity: string;
  algo_type: 'twap' | 'vwap' | 'iceberg';
  config?: Record<string, unknown>;
}

// ── OMS State (Phase 31-32) ───────────────────────────────────────
export interface TrackedOrder {
  order_id: string;
  strategy_id: string;
  symbol: string;
  exchange: string;
  side: string;
  order_type: string;
  quantity: string;
  price?: string;
  stop_price?: string;
  status: string;
  filled_quantity: string;
  exchange_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SLBinding {
  exchange: string;
  symbol: string;
  strategy_id: string;
  sl_order_id: string;
  tp_order_id: string;
}

export interface TrailingStop {
  exchange: string;
  symbol: string;
  strategy_id: string;
  order_id: string;
  activation_price: string;
  callback_rate: string;
  highest_price: string;
  lowest_price: string;
  current_stop: string;
  step_bps: string;
  is_long: boolean;
}

export interface AmendOrderBody {
  price?: string;
  quantity?: string;
  stop_price?: string;
}

export interface TrailingStopBody {
  callback_rate: string;
  step_bps?: string;
}

// ── Strategy Parameters (Phase 33) ────────────────────────────────
export interface ParamAuditEntry {
  time: string;
  param_name: string;
  old_value: string;
  new_value: string;
  source: string;
}

// ── Account Sync (Phase 35) ───────────────────────────────────────
export interface AccountSnapshot {
  snapshot_id: string;
  exchange: string;
  snapshot_type: string;
  balances: Record<string, string>;
  total_equity: string;
  margin_ratio?: string;
  created_at: string;
}

export interface AccountReconciliation {
  reconcile_id: string;
  exchange: string;
  matched: boolean;
  total_diff_usd: string;
  corrections_count: number;
  created_at: string;
}

export interface MarginStatus {
  exchange: string;
  margin_ratio: string;
  margin_balance: string;
  total_equity: string;
  total_position_value: string;
  liquidation_risk: boolean;
  updated_at: string;
}

// ── Auto-Tune (Phase 34) ──────────────────────────────────────────
export interface AutoTuneRun {
  run_id: string;
  strategy_id: string;
  status: string;
  apply_mode: string;
  created_at: string;
  completed_at?: string;
  [key: string]: unknown;
}

export interface AutoTuneSchedule {
  schedule_id: string;
  strategy_id: string;
  cron_expr: string;
  apply_mode: string;
  train_days: number;
  test_days: number;
  [key: string]: unknown;
}

// ── Funding (Phase 29) ────────────────────────────────────────────
export interface FundingRate {
  symbol: string;
  funding_rate: string;
  funding_time: string;
  mark_price?: string;
}

export interface FundingCostSummary {
  strategy_id: string;
  total_cost: string;
  record_count: number;
  [key: string]: unknown;
}

// ── Auth (Phase 36) ───────────────────────────────────────────────
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserInfo {
  user_id: string;
  username: string;
  role: string;
  is_active: boolean;
}

export interface ApiKeyInfo {
  id: string;
  key_prefix: string;
  name: string;
  permissions: string;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

export interface ApiKeyCreated {
  id: string;
  key: string;
  key_prefix: string;
  name: string;
  created_at: string;
}

// ── Strategy Lifecycle Management ──────────────────
export interface StrategyMgmtRecord {
  strategy_id: string;
  status: 'LOADED' | 'STARTED' | 'STOPPED' | 'FAILED' | 'UNKNOWN';
  version: string;
  author: string;
  description: string;
  source_path: string;
  loaded_at: string | null;
  started_at: string | null;
}

// ── Fee Tracking ───────────────────────────────────
export interface FeeSummary {
  date: string;
  exchange: string;
  account_id: string;
  total_fee: string;
  trade_volume: string;
}

export interface FeeBreakdown {
  maker_count: number;
  taker_count: number;
  maker_fee: string;
  taker_fee: string;
  maker_ratio: string;
}

export interface VipProgress {
  current_tier: string;
  rolling_volume_30d: string;
  next_tier: string;
  volume_to_next: string;
  progress_pct: string;
}

export interface FeeDeviation {
  total_actual: string;
  total_estimated: string;
  deviation_bps: string;
  trade_count: number;
}

export interface StrategyFeeReport {
  strategy_id: string;
  total_fee: string;
  total_estimated: string;
  trade_count: number;
}

// ── Attribution ────────────────────────────────────
export interface AttributionReport {
  report_id: string;
  strategy_id: string;
  start_time: string;
  end_time: string;
  total_pnl: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: string;
  profit_factor: string;
  trading_pnl: string;
  fee_cost: string;
  funding_cost: string;
  by_symbol: Record<string, unknown>;
  by_side: Record<string, unknown>;
  by_hour: Record<string, unknown>;
  by_day: Record<string, unknown>;
  by_regime: Record<string, unknown>;
  entry_quality_score: string;
  exit_quality_score: string;
  strategy_return_pct: string;
  benchmark_return_pct: string;
  alpha: string;
  top_winner_concentration: string;
  top_loser_concentration: string;
  top_winners: unknown[];
  top_losers: unknown[];
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export interface TradeContribution {
  trade_id: string;
  symbol: string;
  side: string;
  entry_time: string | null;
  exit_time: string | null;
  net_pnl: string;
  holding_duration_sec: number;
  market_regime: string;
  entry_score: string;
  exit_score: string;
}

export interface RollforwardBucket {
  bucket_start: string;
  bucket_end: string;
  trading_pnl: string;
  fee_cost: string;
  funding_cost: string;
  net_change: string;
  cumulative_equity: string;
}

export interface RegimeAttribution {
  regime: string;
  start_time: string;
  end_time: string;
  avg_volatility: string;
  trend_direction: string;
}

export interface BenchmarkComparison {
  strategy_return_pct: string;
  benchmark_return_pct: string;
  alpha: string;
  total_pnl: string;
  total_trades: number;
}

// ── Alerts ─────────────────────────────────────────
export interface AlertRule {
  rule_id: string;
  name: string;
  alert_type: string;
  enabled: boolean;
  conditions: Record<string, unknown>;
  cooldown_seconds: number;
  severity: string;
}

export interface CreateAlertRule {
  rule_id: string;
  name: string;
  alert_type: string;
  enabled?: boolean;
  conditions?: Record<string, unknown>;
  cooldown_seconds?: number;
  severity?: string;
}

export interface UpdateAlertRule {
  name?: string;
  alert_type?: string;
  enabled?: boolean;
  conditions?: Record<string, unknown>;
  cooldown_seconds?: number;
  severity?: string;
}

export interface AlertFiring {
  firing_id: string;
  rule_id: string;
  alert_type: string;
  severity: string;
  message: string;
  actual_value: string;
  threshold: string;
  fired_at: string | null;
  resolved_at: string | null;
}

// ── Exchange Health ──────────────────────────────────
export interface ExchangeHealthStatus {
  exchange: string;
  is_healthy: boolean;
  latency_ms: number;
  error_rate_pct: number;
  last_check_at: string | null;
  consecutive_failures: number;
}

export interface HealthCheckResult {
  exchange: string;
  latency_ms: number;
  success: boolean;
  error_message: string | null;
  checked_at: string | null;
}

export interface FailoverAction {
  action_id: string;
  from_exchange: string;
  to_exchange: string;
  reason: string;
  triggered_at: string | null;
}

// ── Feature Store ────────────────────────────────────
export interface FeatureDefinition {
  name: string;
  feature_type: string;
  source: string;
  min_periods: number;
  output_keys: string[];
  params: Record<string, unknown>;
  description: string;
}

export interface FeatureValue {
  symbol: string;
  timeframe: string;
  feature_name: string;
  timestamp: string;
  values: Record<string, unknown>;
  candle_count: number;
}

// ── Security Audit ───────────────────────────────────
export interface SecurityAuditEntry {
  audit_id: string;
  category: string;
  severity: string;
  finding: string;
  recommendation: string;
  detected_at: string;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
}

export interface SecurityAuditSummary {
  total_findings: number;
  by_severity: Record<string, number>;
  by_category: Record<string, number>;
  unresolved_count: number;
  last_audit_at: string | null;
}

// ── Replay ──────────────────────────────────────────
export interface ReplayTask {
  task_id: string;
  scenario_id: string;
  strategy_id: string;
  symbol: string;
  status: string;
  progress_pct: string;
  created_at: string;
  completed_at: string | null;
}

export interface ReplayScenario {
  scenario_id: string;
  name: string;
  description: string;
  symbol: string;
  start_time: string;
  end_time: string;
  config: Record<string, unknown>;
  created_at: string;
}

export interface ReplayStep {
  step_index: number;
  timestamp: string;
  action: string;
  price: string;
  quantity: string;
  pnl: string;
  metadata: Record<string, unknown>;
}

export interface ReplaySummary {
  task_id: string;
  total_steps: number;
  total_pnl: string;
  max_drawdown_pct: string;
  sharpe_ratio: string | null;
  win_rate: string;
  trade_count: number;
}

export interface ReplayTradeContext {
  trade_id: string;
  entry_step: number;
  exit_step: number;
  entry_price: string;
  exit_price: string;
  side: string;
  quantity: string;
  pnl: string;
  context: Record<string, unknown>;
}

// ── Data Governance ─────────────────────────────────
export interface QualityScore {
  symbol: string;
  overall_score: string;
  completeness_pct: string;
  freshness_score: string;
  anomaly_count: number;
  last_evaluated_at: string;
}

export interface ArchiveRun {
  run_id: string;
  symbols: string[];
  start_time: string;
  end_time: string;
  status: string;
  records_archived: number;
  created_at: string;
}

export interface LifecycleResult {
  symbol: string;
  timeframe: string;
  action: string;
  dry_run: boolean;
  affected_records: number;
  warnings: string[];
  executed: boolean;
}

// ── Walkforward Extensions ──────────────────────────
export interface WalkforwardBatchResult {
  task_ids: string[];
  strategy_id: string;
  symbols: string[];
  status: string;
}

export interface SensitivityPoint {
  param_name: string;
  param_value: string;
  pnl: string;
  sharpe: string | null;
  win_rate: string;
}

export interface OverfittingResult {
  run_id: string;
  is_score: string;
  oos_score: string;
  degradation_pct: string;
  likely_overfit: boolean;
  details: Record<string, unknown>;
}

export interface CrossValidateResult {
  fold_results: Array<{
    fold: number;
    train_pnl: string;
    test_pnl: string;
    degradation_pct: string;
  }>;
  avg_degradation_pct: string;
  max_degradation_pct: string;
  is_stable: boolean;
}

// ── Portfolio Rebalance ─────────────────────────────
export interface RebalanceRequest {
  strategy_id: string;
  target_weights: Record<string, number>;
  rebalance_mode?: string;
}

export interface RebalanceResult {
  rebalance_id: string;
  strategy_id: string;
  status: string;
  target_weights: Record<string, number>;
  actual_weights: Record<string, number>;
  drift_pct: string;
  orders_planned: number;
  orders_executed: number;
  created_at: string;
}

export interface RebalanceStatus {
  strategy_id: string;
  current_weights: Record<string, number>;
  target_weights: Record<string, number>;
  drift_pct: string;
  last_rebalance_at: string | null;
  status: string;
}

export interface RebalanceDrift {
  strategy_id: string;
  total_drift_pct: string;
  asset_drift: Record<string, { target_pct: string; actual_pct: string; drift_pct: string }>;
}

// ── Journal ─────────────────────────────────────────
export interface JournalEntry {
  entry_id: string;
  strategy_id: string;
  symbol: string;
  exchange: string;
  side: string;
  entry_time: string;
  exit_time: string | null;
  entry_price: string;
  exit_price: string | null;
  quantity: string;
  realized_pnl: string;
  notes: string;
  tags: string[];
  rating: number | null;
  status: string;
  review_notes: string;
  action_items: string[];
  created_at: string;
  updated_at: string;
}

export interface JournalReport {
  strategy_id: string;
  period_days: number;
  total_entries: number;
  reviewed_count: number;
  pending_count: number;
  avg_rating: string;
  top_tags: string[];
  pnl_summary: Record<string, unknown>;
}

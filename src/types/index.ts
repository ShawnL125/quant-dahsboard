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
export type WSChannel = 'trades' | 'positions' | 'orders' | 'pnl' | 'system' | 'risk';

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

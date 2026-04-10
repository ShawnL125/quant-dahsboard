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
export type WSChannel = 'trades' | 'positions' | 'orders' | 'pnl' | 'system';

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

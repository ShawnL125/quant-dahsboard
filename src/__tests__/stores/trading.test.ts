import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTradingStore } from '@/stores/trading';
import { tradingApi } from '@/api/trading';
import type { PortfolioSnapshot, Position } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/trading', () => ({
  tradingApi: {
    getStatus: vi.fn(),
    getPortfolio: vi.fn(),
    getPositions: vi.fn(),
    getPosition: vi.fn(),
    getPnl: vi.fn(),
  },
}));

const mockedTradingApi = vi.mocked(tradingApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakePortfolio: PortfolioSnapshot = {
  total_equity: '10000.00',
  available_balance: '8000.00',
  realized_pnl: '500.00',
  unrealized_pnl: '-50.00',
};

const fakePositions: Position[] = [
  {
    symbol: 'BTC/USDT',
    exchange: 'binance',
    side: 'long',
    quantity: '0.5',
    entry_price: '40000.00',
    unrealized_pnl: '100.00',
  },
  {
    symbol: 'ETH/USDT',
    exchange: 'binance',
    side: 'short',
    quantity: '5.0',
    entry_price: '3000.00',
    unrealized_pnl: '-25.00',
  },
];

// ── Tests ────────────────────────────────────────────────────────────
describe('trading store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ────────────────────────────────────────────────
  describe('initial state', () => {
    it('has null portfolio', () => {
      const store = useTradingStore();
      expect(store.portfolio).toBeNull();
    });

    it('has empty positions', () => {
      const store = useTradingStore();
      expect(store.positions).toEqual([]);
    });

    it('has loading false', () => {
      const store = useTradingStore();
      expect(store.loading).toBe(false);
    });

    it('has null error', () => {
      const store = useTradingStore();
      expect(store.error).toBeNull();
    });
  });

  // ── fetchPortfolio ───────────────────────────────────────────────
  describe('fetchPortfolio()', () => {
    it('sets portfolio on success', async () => {
      mockedTradingApi.getPortfolio.mockResolvedValue(fakePortfolio);

      const store = useTradingStore();
      await store.fetchPortfolio();

      expect(store.portfolio).toEqual(fakePortfolio);
    });

    it('sets error on failure', async () => {
      mockedTradingApi.getPortfolio.mockRejectedValue(new Error('Network error'));

      const store = useTradingStore();
      await store.fetchPortfolio();

      expect(store.error).toBe('Network error');
    });

    it('handles non-Error exceptions', async () => {
      mockedTradingApi.getPortfolio.mockRejectedValue('fail');

      const store = useTradingStore();
      await store.fetchPortfolio();

      expect(store.error).toBe('fail');
    });
  });

  // ── fetchPositions ───────────────────────────────────────────────
  describe('fetchPositions()', () => {
    it('sets positions on success', async () => {
      mockedTradingApi.getPositions.mockResolvedValue(fakePositions);

      const store = useTradingStore();
      await store.fetchPositions();

      expect(store.positions).toEqual(fakePositions);
    });

    it('sets error on failure', async () => {
      mockedTradingApi.getPositions.mockRejectedValue(new Error('timeout'));

      const store = useTradingStore();
      await store.fetchPositions();

      expect(store.error).toBe('timeout');
    });
  });

  // ── fetchAll ─────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('calls both fetchPortfolio and fetchPositions in parallel', async () => {
      mockedTradingApi.getPortfolio.mockResolvedValue(fakePortfolio);
      mockedTradingApi.getPositions.mockResolvedValue(fakePositions);

      const store = useTradingStore();
      await store.fetchAll();

      expect(store.portfolio).toEqual(fakePortfolio);
      expect(store.positions).toEqual(fakePositions);
      expect(mockedTradingApi.getPortfolio).toHaveBeenCalledOnce();
      expect(mockedTradingApi.getPositions).toHaveBeenCalledOnce();
    });

    it('sets loading during request', async () => {
      let resolvePortfolio!: (v: unknown) => void;
      mockedTradingApi.getPortfolio.mockReturnValue(
        new Promise((r) => { resolvePortfolio = r; }) as any,
      );
      mockedTradingApi.getPositions.mockResolvedValue([]);

      const store = useTradingStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolvePortfolio(fakePortfolio);
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── updatePortfolioFromWS ────────────────────────────────────────
  describe('updatePortfolioFromWS()', () => {
    it('merges data when total_equity exists', () => {
      const store = useTradingStore();
      // Set initial portfolio
      store.$patch({ portfolio: fakePortfolio });

      store.updatePortfolioFromWS({ total_equity: '12000.00', available_balance: '10000.00' });

      expect(store.portfolio).toEqual({
        ...fakePortfolio,
        total_equity: '12000.00',
        available_balance: '10000.00',
      });
    });

    it('does not update when total_equity is missing', () => {
      const store = useTradingStore();
      store.$patch({ portfolio: fakePortfolio });

      store.updatePortfolioFromWS({ available_balance: '9999.00' });

      expect(store.portfolio).toEqual(fakePortfolio);
    });
  });

  // ── updatePositionsFromWS ────────────────────────────────────────
  describe('updatePositionsFromWS()', () => {
    it('handles array format (direct replace)', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      const newPositions: Position[] = [
        { symbol: 'SOL/USDT', exchange: 'binance', side: 'long', quantity: '10', entry_price: '100.00', unrealized_pnl: '5.00' },
      ];

      store.updatePositionsFromWS(newPositions);

      expect(store.positions).toEqual(newPositions);
    });

    it('handles envelope format with action: DELETE', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      store.updatePositionsFromWS({
        action: 'DELETE',
        data: { symbol: 'BTC/USDT', exchange: 'binance' },
      });

      expect(store.positions).toHaveLength(1);
      expect(store.positions[0].symbol).toBe('ETH/USDT');
    });

    it('handles envelope format with action: UPSERT replacing existing', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      store.updatePositionsFromWS({
        action: 'UPSERT',
        data: { symbol: 'BTC/USDT', exchange: 'binance', side: 'long', quantity: '1.0', entry_price: '42000.00', unrealized_pnl: '200.00' },
      });

      expect(store.positions).toHaveLength(2);
      const updated = store.positions.find((p) => p.symbol === 'BTC/USDT');
      expect(updated?.quantity).toBe('1.0');
      expect(updated?.entry_price).toBe('42000.00');
    });

    it('handles envelope format with action: UPSERT appending new', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      store.updatePositionsFromWS({
        action: 'UPSERT',
        data: { symbol: 'SOL/USDT', exchange: 'binance', side: 'long', quantity: '10', entry_price: '100.00', unrealized_pnl: '5.00' },
      });

      expect(store.positions).toHaveLength(3);
      const added = store.positions.find((p) => p.symbol === 'SOL/USDT');
      expect(added).toBeDefined();
    });

    it('handles individual position object (single upsert)', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      // An object that is not an envelope (no action field) and has symbol
      store.updatePositionsFromWS({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'long',
        quantity: '0.75',
        entry_price: '41000.00',
        unrealized_pnl: '150.00',
      });

      expect(store.positions).toHaveLength(2);
      const updated = store.positions.find((p) => p.symbol === 'BTC/USDT');
      expect(updated?.quantity).toBe('0.75');
    });

    it('handles individual position object appending new', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      store.updatePositionsFromWS({
        symbol: 'DOGE/USDT',
        exchange: 'binance',
        side: 'long',
        quantity: '1000',
        entry_price: '0.10',
        unrealized_pnl: '2.00',
      });

      expect(store.positions).toHaveLength(3);
      const added = store.positions.find((p) => p.symbol === 'DOGE/USDT');
      expect(added).toBeDefined();
    });

    it('ignores data that is null or non-object non-array', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      store.updatePositionsFromWS(null);
      expect(store.positions).toEqual(fakePositions);

      store.updatePositionsFromWS('string');
      expect(store.positions).toEqual(fakePositions);

      store.updatePositionsFromWS(123);
      expect(store.positions).toEqual(fakePositions);
    });

    it('ignores envelope with no symbol', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      store.updatePositionsFromWS({
        action: 'UPSERT',
        data: { exchange: 'binance' },
      });

      expect(store.positions).toEqual(fakePositions);
    });

    it('handles DELETE action when position not found', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      store.updatePositionsFromWS({
        action: 'DELETE',
        data: { symbol: 'NOTEXIST/USDT', exchange: 'binance' },
      });

      // Position was not found so idx < 0, falls through to append branch
      expect(store.positions).toHaveLength(3);
    });

    it('handles envelope without nested data field (uses envelope as posData)', () => {
      const store = useTradingStore();
      store.$patch({ positions: fakePositions });

      // Envelope has no data field, so posData falls back to envelope itself
      store.updatePositionsFromWS({
        action: 'UPSERT',
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'long',
        quantity: '0.6',
        entry_price: '41500.00',
        unrealized_pnl: '175.00',
      });

      expect(store.positions).toHaveLength(2);
      const updated = store.positions.find((p) => p.symbol === 'BTC/USDT');
      expect(updated?.quantity).toBe('0.6');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useJournalStore } from '@/stores/journal';
import { journalApi } from '@/api/journal';
import type { JournalEntry, JournalReport } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/journal', () => ({
  journalApi: {
    getEntries: vi.fn(),
    getEntry: vi.fn(),
    updateEntry: vi.fn(),
    reviewEntry: vi.fn(),
    dismissEntry: vi.fn(),
    getReport: vi.fn(),
    getPendingCount: vi.fn(),
  },
}));

const mockedApi = vi.mocked(journalApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeEntry: JournalEntry = {
  entry_id: 'entry-1',
  strategy_id: 'strat-1',
  symbol: 'BTC/USDT',
  exchange: 'binance',
  side: 'buy',
  entry_time: '2026-01-01T10:00:00Z',
  exit_time: '2026-01-01T12:00:00Z',
  entry_price: '42000',
  exit_price: '43500',
  quantity: '0.1',
  realized_pnl: '150',
  notes: 'Good trade',
  tags: ['breakout', 'momentum'],
  rating: 4,
  status: 'reviewed',
  review_notes: 'Solid execution',
  action_items: ['review setup again'],
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T12:00:00Z',
};

const fakeEntry2: JournalEntry = {
  ...fakeEntry,
  entry_id: 'entry-2',
  symbol: 'ETH/USDT',
  status: 'pending',
  rating: null,
  notes: '',
  tags: [],
  review_notes: '',
  action_items: [],
};

const fakeReport: JournalReport = {
  strategy_id: 'strat-1',
  period_days: 30,
  total_entries: 10,
  reviewed_count: 7,
  pending_count: 3,
  avg_rating: '3.8',
  top_tags: ['breakout', 'momentum', 'reversal'],
  pnl_summary: { total_pnl: '1500', win_rate: '0.65' },
};

// ── Tests ────────────────────────────────────────────────────────────
describe('journal store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty entries', () => {
      const store = useJournalStore();
      expect(store.entries).toEqual([]);
    });

    it('has null report', () => {
      const store = useJournalStore();
      expect(store.report).toBeNull();
    });

    it('has zero pendingCount', () => {
      const store = useJournalStore();
      expect(store.pendingCount).toBe(0);
    });

    it('has loading false and error null', () => {
      const store = useJournalStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchEntries ──────────────────────────────────────────────────
  describe('fetchEntries()', () => {
    it('sets entries on success', async () => {
      mockedApi.getEntries.mockResolvedValue({ data: [fakeEntry, fakeEntry2] });

      const store = useJournalStore();
      await store.fetchEntries({ strategy_id: 'strat-1' });

      expect(store.entries).toEqual([fakeEntry, fakeEntry2]);
      expect(mockedApi.getEntries).toHaveBeenCalledWith({ strategy_id: 'strat-1' });
    });

    it('passes params to API', async () => {
      mockedApi.getEntries.mockResolvedValue({ data: [fakeEntry] });

      const store = useJournalStore();
      await store.fetchEntries({ strategy_id: 'strat-1', symbol: 'BTC/USDT', limit: 10 });

      expect(mockedApi.getEntries).toHaveBeenCalledWith({ strategy_id: 'strat-1', symbol: 'BTC/USDT', limit: 10 });
    });

    it('sets entries to empty on failure', async () => {
      mockedApi.getEntries.mockRejectedValue(new Error('fail'));

      const store = useJournalStore();
      await store.fetchEntries();

      expect(store.entries).toEqual([]);
    });
  });

  // ── fetchReport ───────────────────────────────────────────────────
  describe('fetchReport()', () => {
    it('sets report on success', async () => {
      mockedApi.getReport.mockResolvedValue({ data: fakeReport });

      const store = useJournalStore();
      await store.fetchReport({ strategy_id: 'strat-1', days: 30 });

      expect(store.report).toEqual(fakeReport);
      expect(mockedApi.getReport).toHaveBeenCalledWith({ strategy_id: 'strat-1', days: 30 });
    });

    it('sets report to null on failure', async () => {
      mockedApi.getReport.mockRejectedValue(new Error('fail'));

      const store = useJournalStore();
      await store.fetchReport();

      expect(store.report).toBeNull();
    });
  });

  // ── fetchPendingCount ─────────────────────────────────────────────
  describe('fetchPendingCount()', () => {
    it('sets pendingCount on success', async () => {
      mockedApi.getPendingCount.mockResolvedValue({ data: { count: 5 } });

      const store = useJournalStore();
      await store.fetchPendingCount();

      expect(store.pendingCount).toBe(5);
      expect(mockedApi.getPendingCount).toHaveBeenCalledOnce();
    });

    it('sets pendingCount to 0 on failure', async () => {
      mockedApi.getPendingCount.mockRejectedValue(new Error('fail'));

      const store = useJournalStore();
      await store.fetchPendingCount();

      expect(store.pendingCount).toBe(0);
    });
  });

  // ── updateEntry ───────────────────────────────────────────────────
  describe('updateEntry()', () => {
    it('updates entry in list on success', async () => {
      const updatedEntry = { ...fakeEntry, notes: 'Updated notes', rating: 5 };
      mockedApi.updateEntry.mockResolvedValue({ data: updatedEntry });

      const store = useJournalStore();
      store.entries = [fakeEntry, fakeEntry2];
      await store.updateEntry('entry-1', { notes: 'Updated notes', rating: 5 });

      expect(store.entries[0]).toEqual(updatedEntry);
      expect(mockedApi.updateEntry).toHaveBeenCalledWith('entry-1', { notes: 'Updated notes', rating: 5 });
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.updateEntry.mockRejectedValue(new Error('update fail'));

      const store = useJournalStore();
      store.entries = [fakeEntry];
      await expect(store.updateEntry('entry-1', { notes: 'x' })).rejects.toThrow('update fail');

      expect(store.error).toBe('update fail');
    });
  });

  // ── reviewEntry ───────────────────────────────────────────────────
  describe('reviewEntry()', () => {
    it('updates entry and decrements pendingCount on success', async () => {
      const reviewedEntry = { ...fakeEntry2, status: 'reviewed', review_notes: 'Reviewed', rating: 3 };
      mockedApi.reviewEntry.mockResolvedValue({ data: reviewedEntry });

      const store = useJournalStore();
      store.entries = [fakeEntry, fakeEntry2];
      store.pendingCount = 3;
      await store.reviewEntry('entry-2', { review_notes: 'Reviewed', action_items: [] });

      expect(store.entries[1]).toEqual(reviewedEntry);
      expect(store.pendingCount).toBe(2);
      expect(mockedApi.reviewEntry).toHaveBeenCalledWith('entry-2', { review_notes: 'Reviewed', action_items: [] });
    });

    it('does not go below zero for pendingCount', async () => {
      mockedApi.reviewEntry.mockResolvedValue({ data: fakeEntry });

      const store = useJournalStore();
      store.pendingCount = 0;
      await store.reviewEntry('entry-1', { review_notes: 'Reviewed' });

      expect(store.pendingCount).toBe(0);
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.reviewEntry.mockRejectedValue(new Error('review fail'));

      const store = useJournalStore();
      store.entries = [fakeEntry];
      await expect(store.reviewEntry('entry-1', { review_notes: 'x' })).rejects.toThrow('review fail');

      expect(store.error).toBe('review fail');
    });
  });

  // ── dismissEntry ──────────────────────────────────────────────────
  describe('dismissEntry()', () => {
    it('removes entry from list and decrements pendingCount', async () => {
      mockedApi.dismissEntry.mockResolvedValue({ data: { dismissed: true } });

      const store = useJournalStore();
      store.entries = [fakeEntry, fakeEntry2];
      store.pendingCount = 3;
      await store.dismissEntry('entry-2');

      expect(store.entries).toHaveLength(1);
      expect(store.entries[0].entry_id).toBe('entry-1');
      expect(store.pendingCount).toBe(2);
      expect(mockedApi.dismissEntry).toHaveBeenCalledWith('entry-2');
    });

    it('does not go below zero for pendingCount', async () => {
      mockedApi.dismissEntry.mockResolvedValue({ data: { dismissed: true } });

      const store = useJournalStore();
      store.entries = [fakeEntry];
      store.pendingCount = 0;
      await store.dismissEntry('entry-1');

      expect(store.pendingCount).toBe(0);
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.dismissEntry.mockRejectedValue(new Error('dismiss fail'));

      const store = useJournalStore();
      store.entries = [fakeEntry];
      await expect(store.dismissEntry('entry-1')).rejects.toThrow('dismiss fail');

      expect(store.error).toBe('dismiss fail');
    });
  });
});

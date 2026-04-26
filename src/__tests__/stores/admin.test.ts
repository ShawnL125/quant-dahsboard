import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminStore } from '@/stores/admin';
import { adminApi } from '@/api/admin';
import type { AdminConfig, AdminEventsStats } from '@/types';

vi.mock('@/api/admin', () => ({
  adminApi: {
    getConfig: vi.fn(),
    getEventsStats: vi.fn(),
    reloadConfig: vi.fn(),
  },
}));

const mockedApi = vi.mocked(adminApi);

const fakeConfig: AdminConfig = { environment: 'paper', allowed_symbols: ['BTC/USDT'] };
const fakeStats: AdminEventsStats = { subscribers: 5 };

describe('admin store', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('initial state', () => {
    it('has null config', () => {
      const store = useAdminStore();
      expect(store.config).toBeNull();
    });
    it('has null eventsStats', () => {
      const store = useAdminStore();
      expect(store.eventsStats).toBeNull();
    });
    it('has loading false and error null', () => {
      const store = useAdminStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchConfig()', () => {
    it('sets config on success', async () => {
      mockedApi.getConfig.mockResolvedValue(fakeConfig);
      const store = useAdminStore();
      await store.fetchConfig();
      expect(store.config).toEqual(fakeConfig);
    });
    it('sets config to null on failure', async () => {
      mockedApi.getConfig.mockRejectedValue(new Error('fail'));
      const store = useAdminStore();
      await store.fetchConfig();
      expect(store.config).toBeNull();
    });
  });

  describe('fetchEventsStats()', () => {
    it('sets eventsStats on success', async () => {
      mockedApi.getEventsStats.mockResolvedValue(fakeStats);
      const store = useAdminStore();
      await store.fetchEventsStats();
      expect(store.eventsStats).toEqual(fakeStats);
    });
    it('sets eventsStats to null on failure', async () => {
      mockedApi.getEventsStats.mockRejectedValue(new Error('fail'));
      const store = useAdminStore();
      await store.fetchEventsStats();
      expect(store.eventsStats).toBeNull();
    });
  });

  describe('reloadConfig()', () => {
    it('reloads and re-fetches config on success', async () => {
      mockedApi.reloadConfig.mockResolvedValue({ status: 'reloaded' });
      mockedApi.getConfig.mockResolvedValue(fakeConfig);
      const store = useAdminStore();
      const result = await store.reloadConfig();
      expect(result.status).toBe('reloaded');
      expect(mockedApi.getConfig).toHaveBeenCalled();
    });
    it('sets error on failure and rethrows', async () => {
      mockedApi.reloadConfig.mockRejectedValue(new Error('reload fail'));
      const store = useAdminStore();
      await expect(store.reloadConfig()).rejects.toThrow('reload fail');
      expect(store.error).toBe('reload fail');
    });
  });
});

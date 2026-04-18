import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { authApi, apiKeysApi, usersApi } from '@/api/auth';
import type { UserInfo, ApiKeyInfo, ApiKeyCreated } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn(),
    refresh: vi.fn(),
    changePassword: vi.fn(),
  },
  apiKeysApi: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  usersApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAuthApi = vi.mocked(authApi);
const mockedApiKeysApi = vi.mocked(apiKeysApi);
const mockedUsersApi = vi.mocked(usersApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeUser: UserInfo = {
  user_id: 'u1',
  username: 'trader',
  role: 'user',
  is_active: true,
};

const fakeAdminUser: UserInfo = {
  user_id: 'u2',
  username: 'admin',
  role: 'admin',
  is_active: true,
};

const fakeApiKey: ApiKeyInfo = {
  id: 'k1',
  key_prefix: 'pk_',
  name: 'test-key',
  permissions: 'read',
  created_at: '2026-01-01T00:00:00Z',
};

const fakeApiKeyCreated: ApiKeyCreated = {
  id: 'k2',
  key: 'sk_newkey123',
  key_prefix: 'sk_',
  name: 'new-key',
  created_at: '2026-01-02T00:00:00Z',
};

// ── Tests ────────────────────────────────────────────────────────────
describe('auth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Initial State ────────────────────────────────────────────────
  describe('initial state', () => {
    it('has no user and no tokens when localStorage is empty', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
      expect(store.accessToken).toBe('');
      expect(store.refreshToken).toBe('');
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('is not authenticated when no token present', () => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });

    it('is not admin when no user present', () => {
      const store = useAuthStore();
      expect(store.isAdmin).toBe(false);
    });
  });

  // ── Computed Properties ──────────────────────────────────────────
  describe('isAuthenticated', () => {
    it('returns true when accessToken is set', () => {
      const store = useAuthStore();
      store.$patch({ accessToken: 'some-token' });
      expect(store.isAuthenticated).toBe(true);
    });

    it('returns false when accessToken is empty', () => {
      const store = useAuthStore();
      store.$patch({ accessToken: '' });
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true when user role is admin', () => {
      const store = useAuthStore();
      store.$patch({ user: fakeAdminUser });
      expect(store.isAdmin).toBe(true);
    });

    it('returns false when user role is not admin', () => {
      const store = useAuthStore();
      store.$patch({ user: fakeUser });
      expect(store.isAdmin).toBe(false);
    });

    it('returns false when user is null', () => {
      const store = useAuthStore();
      expect(store.isAdmin).toBe(false);
    });
  });

  // ── Login ────────────────────────────────────────────────────────
  describe('login()', () => {
    it('stores tokens in state and localStorage', async () => {
      mockedAuthApi.login.mockResolvedValue({
        access_token: 'at-123',
        refresh_token: 'rt-456',
        token_type: 'bearer',
      });
      mockedAuthApi.getMe.mockResolvedValue(fakeUser);

      const store = useAuthStore();
      await store.login('trader', 'password');

      expect(store.accessToken).toBe('at-123');
      expect(store.refreshToken).toBe('rt-456');
      expect(localStorage.getItem('access_token')).toBe('at-123');
      expect(localStorage.getItem('refresh_token')).toBe('rt-456');
    });

    it('fetches user info after successful login', async () => {
      mockedAuthApi.login.mockResolvedValue({
        access_token: 'at-123',
        refresh_token: 'rt-456',
        token_type: 'bearer',
      });
      mockedAuthApi.getMe.mockResolvedValue(fakeUser);

      const store = useAuthStore();
      await store.login('trader', 'password');

      expect(mockedAuthApi.getMe).toHaveBeenCalledOnce();
      expect(store.user).toEqual(fakeUser);
    });

    it('sets error and re-throws on failure', async () => {
      const loginError = new Error('Invalid credentials');
      mockedAuthApi.login.mockRejectedValue(loginError);

      const store = useAuthStore();
      await expect(store.login('trader', 'wrong')).rejects.toThrow('Invalid credentials');

      expect(store.error).toBe('Invalid credentials');
      expect(store.user).toBeNull();
    });

    it('sets generic error for non-Error exceptions', async () => {
      mockedAuthApi.login.mockRejectedValue('string-error');

      const store = useAuthStore();
      await expect(store.login('trader', 'wrong')).rejects.toBe('string-error');

      expect(store.error).toBe('Login failed');
    });

    it('sets loading to true during request, false after', async () => {
      let resolveLogin!: (v: unknown) => void;
      mockedAuthApi.login.mockReturnValue(
        new Promise((resolve) => { resolveLogin = resolve; }) as any,
      );
      mockedAuthApi.getMe.mockResolvedValue(fakeUser);

      const store = useAuthStore();
      const loginPromise = store.login('trader', 'password');

      expect(store.loading).toBe(true);

      resolveLogin({ access_token: 'at', refresh_token: 'rt', token_type: 'bearer' });
      await loginPromise;

      expect(store.loading).toBe(false);
    });

    it('sets loading to false even when login fails', async () => {
      mockedAuthApi.login.mockRejectedValue(new Error('fail'));

      const store = useAuthStore();
      await expect(store.login('trader', 'pass')).rejects.toThrow('fail');

      expect(store.loading).toBe(false);
    });
  });

  // ── Logout ───────────────────────────────────────────────────────
  describe('logout()', () => {
    it('clears tokens from state and localStorage', () => {
      localStorage.setItem('access_token', 'at');
      localStorage.setItem('refresh_token', 'rt');

      const store = useAuthStore();
      store.$patch({ accessToken: 'at', refreshToken: 'rt', user: fakeUser });

      store.logout();

      expect(store.accessToken).toBe('');
      expect(store.refreshToken).toBe('');
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(store.user).toBeNull();
    });
  });

  // ── fetchMe ──────────────────────────────────────────────────────
  describe('fetchMe()', () => {
    it('sets user on success', async () => {
      mockedAuthApi.getMe.mockResolvedValue(fakeUser);

      const store = useAuthStore();
      await store.fetchMe();

      expect(store.user).toEqual(fakeUser);
    });

    it('sets user to null on failure', async () => {
      mockedAuthApi.getMe.mockRejectedValue(new Error('unauthorized'));

      const store = useAuthStore();
      store.$patch({ user: fakeUser });
      await store.fetchMe();

      expect(store.user).toBeNull();
    });
  });

  // ── changePassword ───────────────────────────────────────────────
  describe('changePassword()', () => {
    it('delegates to authApi with correct params', async () => {
      mockedAuthApi.changePassword.mockResolvedValue({ status: 'ok' });

      const store = useAuthStore();
      await store.changePassword('old', 'new');

      expect(mockedAuthApi.changePassword).toHaveBeenCalledWith({
        old_password: 'old',
        new_password: 'new',
      });
    });
  });

  // ── API Keys ─────────────────────────────────────────────────────
  describe('fetchApiKeys()', () => {
    it('sets apiKeys on success', async () => {
      mockedApiKeysApi.list.mockResolvedValue({ keys: [fakeApiKey] });

      const store = useAuthStore();
      await store.fetchApiKeys();

      expect(store.apiKeys).toEqual([fakeApiKey]);
    });

    it('sets apiKeys to empty on failure', async () => {
      mockedApiKeysApi.list.mockRejectedValue(new Error('fail'));

      const store = useAuthStore();
      store.$patch({ apiKeys: [fakeApiKey] });
      await store.fetchApiKeys();

      expect(store.apiKeys).toEqual([]);
    });
  });

  describe('createApiKey()', () => {
    it('delegates to apiKeysApi.create and returns result', async () => {
      mockedApiKeysApi.create.mockResolvedValue(fakeApiKeyCreated);

      const store = useAuthStore();
      const result = await store.createApiKey('new-key');

      expect(mockedApiKeysApi.create).toHaveBeenCalledWith('new-key');
      expect(result).toEqual(fakeApiKeyCreated);
    });
  });

  describe('deleteApiKey()', () => {
    it('calls API and removes key from local array', async () => {
      mockedApiKeysApi.delete.mockResolvedValue({ status: 'deleted', key_id: 'k1' });

      const store = useAuthStore();
      store.$patch({ apiKeys: [fakeApiKey] });
      await store.deleteApiKey('k1');

      expect(mockedApiKeysApi.delete).toHaveBeenCalledWith('k1');
      expect(store.apiKeys).toEqual([]);
    });

    it('removes only the specified key', async () => {
      const secondKey: ApiKeyInfo = { ...fakeApiKey, id: 'k2', name: 'other' };
      mockedApiKeysApi.delete.mockResolvedValue({ status: 'deleted', key_id: 'k1' });

      const store = useAuthStore();
      store.$patch({ apiKeys: [fakeApiKey, secondKey] });
      await store.deleteApiKey('k1');

      expect(store.apiKeys).toHaveLength(1);
      expect(store.apiKeys[0].id).toBe('k2');
    });
  });

  // ── Users ────────────────────────────────────────────────────────
  describe('fetchUsers()', () => {
    it('sets users on success', async () => {
      mockedUsersApi.list.mockResolvedValue([fakeUser, fakeAdminUser]);

      const store = useAuthStore();
      await store.fetchUsers();

      expect(store.users).toEqual([fakeUser, fakeAdminUser]);
    });

    it('sets users to empty on failure', async () => {
      mockedUsersApi.list.mockRejectedValue(new Error('fail'));

      const store = useAuthStore();
      store.$patch({ users: [fakeUser] });
      await store.fetchUsers();

      expect(store.users).toEqual([]);
    });
  });

  describe('createUser()', () => {
    it('calls API and adds created user to local array', async () => {
      mockedUsersApi.create.mockResolvedValue(fakeUser);

      const store = useAuthStore();
      const result = await store.createUser({ username: 'trader', password: 'pass', role: 'user' });

      expect(mockedUsersApi.create).toHaveBeenCalledWith({
        username: 'trader',
        password: 'pass',
        role: 'user',
      });
      expect(store.users).toContainEqual(fakeUser);
      expect(result).toEqual(fakeUser);
    });

    it('appends to existing users immutably', async () => {
      mockedUsersApi.create.mockResolvedValue(fakeAdminUser);

      const store = useAuthStore();
      store.$patch({ users: [fakeUser] });
      const originalLength = store.users.length;

      await store.createUser({ username: 'admin', password: 'admin', role: 'admin' });

      expect(store.users).toHaveLength(originalLength + 1);
    });
  });

  describe('updateUser()', () => {
    it('calls API and updates local array in place', async () => {
      const updatedUser: UserInfo = { ...fakeUser, role: 'admin' };
      mockedUsersApi.update.mockResolvedValue(updatedUser);

      const store = useAuthStore();
      store.$patch({ users: [fakeUser] });
      await store.updateUser('u1', { role: 'admin' });

      expect(mockedUsersApi.update).toHaveBeenCalledWith('u1', { role: 'admin' });
      expect(store.users[0]).toEqual(updatedUser);
    });

    it('does not crash when user is not in local array', async () => {
      const updatedUser: UserInfo = { ...fakeUser, role: 'admin' };
      mockedUsersApi.update.mockResolvedValue(updatedUser);

      const store = useAuthStore();
      store.$patch({ users: [] });

      // Should not throw
      await store.updateUser('u1', { role: 'admin' });
      expect(store.users).toEqual([]);
    });
  });

  describe('deleteUser()', () => {
    it('calls API and removes user from local array', async () => {
      mockedUsersApi.delete.mockResolvedValue({ status: 'deleted', user_id: 'u1' });

      const store = useAuthStore();
      store.$patch({ users: [fakeUser, fakeAdminUser] });
      await store.deleteUser('u1');

      expect(mockedUsersApi.delete).toHaveBeenCalledWith('u1');
      expect(store.users).toHaveLength(1);
      expect(store.users[0].user_id).toBe('u2');
    });

    it('results in empty array when deleting last user', async () => {
      mockedUsersApi.delete.mockResolvedValue({ status: 'deleted', user_id: 'u1' });

      const store = useAuthStore();
      store.$patch({ users: [fakeUser] });
      await store.deleteUser('u1');

      expect(store.users).toEqual([]);
    });
  });
});

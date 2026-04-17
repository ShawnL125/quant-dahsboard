import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, apiKeysApi, usersApi } from '@/api/auth';
import type { UserInfo, ApiKeyInfo, ApiKeyCreated } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null);
  const accessToken = ref(localStorage.getItem('access_token') || '');
  const refreshToken = ref(localStorage.getItem('refresh_token') || '');
  const apiKeys = ref<ApiKeyInfo[]>([]);
  const users = ref<UserInfo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(username: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const result = await authApi.login({ username, password });
      accessToken.value = result.access_token;
      refreshToken.value = result.refresh_token;
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      await fetchMe();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Login failed';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    accessToken.value = '';
    refreshToken.value = '';
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    user.value = null;
  }

  async function fetchMe() {
    try {
      user.value = await authApi.getMe();
    } catch {
      user.value = null;
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
  }

  async function fetchApiKeys() {
    try {
      const data = await apiKeysApi.list();
      apiKeys.value = data.keys;
    } catch {
      apiKeys.value = [];
    }
  }

  async function createApiKey(name?: string): Promise<ApiKeyCreated> {
    return await apiKeysApi.create(name);
  }

  async function deleteApiKey(keyId: string) {
    await apiKeysApi.delete(keyId);
    apiKeys.value = apiKeys.value.filter((k) => k.id !== keyId);
  }

  async function fetchUsers() {
    try {
      users.value = await usersApi.list();
    } catch {
      users.value = [];
    }
  }

  async function createUser(data: { username: string; password: string; role: string }) {
    const created = await usersApi.create(data);
    users.value = [...users.value, created];
    return created;
  }

  async function updateUser(userId: string, data: { role?: string; is_active?: boolean }) {
    const updated = await usersApi.update(userId, data);
    const idx = users.value.findIndex((u) => u.user_id === userId);
    if (idx >= 0) users.value[idx] = updated;
  }

  async function deleteUser(userId: string) {
    await usersApi.delete(userId);
    users.value = users.value.filter((u) => u.user_id !== userId);
  }

  return {
    user, accessToken, refreshToken, apiKeys, users,
    loading, error, isAuthenticated, isAdmin,
    login, logout, fetchMe, changePassword,
    fetchApiKeys, createApiKey, deleteApiKey,
    fetchUsers, createUser, updateUser, deleteUser,
  };
});

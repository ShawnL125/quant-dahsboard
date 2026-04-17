import apiClient from './client';
import type { LoginResponse, UserInfo, ApiKeyInfo, ApiKeyCreated } from '@/types';

export const authApi = {
  login: (data: { username: string; password: string }) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  refresh: (refreshToken: string) =>
    apiClient.post<{ access_token: string; token_type: string }>('/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),
  getMe: () =>
    apiClient.get<UserInfo>('/auth/me').then((r) => r.data),
  changePassword: (data: { old_password: string; new_password: string }) =>
    apiClient.put<{ status: string }>('/auth/password', data).then((r) => r.data),
};

export const apiKeysApi = {
  list: () =>
    apiClient.get<{ keys: ApiKeyInfo[] }>('/keys').then((r) => r.data),
  create: (name?: string) =>
    apiClient.post<ApiKeyCreated>('/keys', null, { params: { name } }).then((r) => r.data),
  delete: (keyId: string) =>
    apiClient.delete<{ status: string; key_id: string }>(`/keys/${keyId}`).then((r) => r.data),
};

export const usersApi = {
  list: () =>
    apiClient.get<UserInfo[]>('/users').then((r) => r.data),
  create: (data: { username: string; password: string; role: string }) =>
    apiClient.post<UserInfo>('/users', data).then((r) => r.data),
  update: (userId: string, data: { role?: string; is_active?: boolean }) =>
    apiClient.put<UserInfo>(`/users/${userId}`, data).then((r) => r.data),
  delete: (userId: string) =>
    apiClient.delete<{ status: string; user_id: string }>(`/users/${userId}`).then((r) => r.data),
};

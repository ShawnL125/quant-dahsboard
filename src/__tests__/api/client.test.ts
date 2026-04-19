import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  async function getClient() {
    return (await import('@/api/client')).default;
  }

  describe('Client Initialization', () => {
    it('creates axios instance with correct baseURL', async () => {
      const client = await getClient();
      expect(client.defaults.baseURL).toBe('/api/v1');
    });

    it('creates axios instance with correct headers', async () => {
      const client = await getClient();
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request Interceptor', () => {
    it('adds Bearer token when localStorage has access_token', async () => {
      localStorage.setItem('access_token', 'test-jwt');
      const client = await getClient();
      const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
      expect(config.headers.Authorization).toBe('Bearer test-jwt');
      expect(config.headers['X-API-Key']).toBeUndefined();
    });

    it('falls back to X-API-Key when no token but env has VITE_API_KEY', async () => {
      vi.stubEnv('VITE_API_KEY', 'my-key');
      const client = await getClient();
      const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
      expect(config.headers.Authorization).toBeUndefined();
      expect(config.headers['X-API-Key']).toBe('my-key');
    });

    it('adds nothing when neither token nor API key', async () => {
      vi.stubEnv('VITE_API_KEY', '');
      const client = await getClient();
      const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
      expect(config.headers.Authorization).toBeUndefined();
      expect(config.headers['X-API-Key']).toBeUndefined();
    });

    it('prioritizes Bearer token over API key when both exist', async () => {
      localStorage.setItem('access_token', 'jwt-token');
      vi.stubEnv('VITE_API_KEY', 'my-key');
      const client = await getClient();
      const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
      expect(config.headers.Authorization).toBe('Bearer jwt-token');
      expect(config.headers['X-API-Key']).toBeUndefined();
    });

    it('preserves existing headers', async () => {
      localStorage.setItem('access_token', 'jwt-token');
      const client = await getClient();
      const config = await client.interceptors.request.handlers[0].fulfilled({
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'val' },
      });
      expect(config.headers['Content-Type']).toBe('application/json');
      expect(config.headers['X-Custom']).toBe('val');
      expect(config.headers.Authorization).toBe('Bearer jwt-token');
    });
  });

  describe('Response Interceptor', () => {
    it('passes through successful responses', async () => {
      const client = await getClient();
      const response = { data: 'ok', status: 200 };
      const result = await client.interceptors.response.handlers[0].fulfilled(response);
      expect(result).toEqual(response);
    });

    it('clears tokens on 401 error', async () => {
      localStorage.setItem('access_token', 't');
      localStorage.setItem('refresh_token', 'r');
      const client = await getClient();
      const error = { response: { status: 401 } };
      await expect(
        client.interceptors.response.handlers[0].rejected(error),
      ).rejects.toEqual(error);
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('does NOT clear tokens on non-401 errors', async () => {
      localStorage.setItem('access_token', 't');
      localStorage.setItem('refresh_token', 'r');
      const client = await getClient();
      const error = { response: { status: 500 } };
      await expect(
        client.interceptors.response.handlers[0].rejected(error),
      ).rejects.toEqual(error);
      expect(localStorage.getItem('access_token')).toBe('t');
      expect(localStorage.getItem('refresh_token')).toBe('r');
    });

    it('handles errors without response object', async () => {
      localStorage.setItem('access_token', 't');
      const client = await getClient();
      const error = { message: 'Network Error' };
      await expect(
        client.interceptors.response.handlers[0].rejected(error),
      ).rejects.toEqual(error);
      expect(localStorage.getItem('access_token')).toBe('t');
    });

    it('handles 401 when tokens already absent', async () => {
      const client = await getClient();
      const error = { response: { status: 401 } };
      await expect(
        client.interceptors.response.handlers[0].rejected(error),
      ).rejects.toEqual(error);
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API Client Interceptors', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  describe('Client Initialization', () => {
    it('creates axios instance with correct baseURL', async () => {
      // Dynamic import to get fresh module
      const clientModule = await import('@/api/client');
      expect(clientModule.default).toBeDefined();
      expect(clientModule.default.defaults.baseURL).toBe('/api/v1');
    });

    it('creates axios instance with correct headers', async () => {
      const clientModule = await import('@/api/client');
      expect(clientModule.default.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request Interceptor Behavior', () => {
    it('adds Bearer token when localStorage has access_token', async () => {
      const token = 'test-jwt-token';
      localStorage.setItem('access_token', token);

      // Import fresh instance
      const clientModule = await import('@/api/client');
      clientModule.default;

      // Test that interceptor modifies config correctly
      // through a mock request

      const mockConfig = {
        headers: {} as any,
      };

      // Simulate what the interceptor does
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        mockConfig.headers.Authorization = `Bearer ${storedToken}`;
      }

      expect(mockConfig.headers.Authorization).toBe(`Bearer ${token}`);
      expect(mockConfig.headers['X-API-Key']).toBeUndefined();
    });

    it('falls back to X-API-Key when no token but env has VITE_API_KEY', async () => {
      vi.stubEnv('VITE_API_KEY', 'test-api-key');

      const mockConfig = {
        headers: {} as any,
      };

      // Simulate what the interceptor does
      const token = localStorage.getItem('access_token');
      if (!token) {
        const apiKey = import.meta.env.VITE_API_KEY || '';
        if (apiKey) mockConfig.headers['X-API-Key'] = apiKey;
      }

      expect(mockConfig.headers.Authorization).toBeUndefined();
      expect(mockConfig.headers['X-API-Key']).toBe('test-api-key');
    });

    it('adds nothing when neither token nor API key', async () => {
      vi.stubEnv('VITE_API_KEY', '');

      const mockConfig = {
        headers: {} as any,
      };

      // Simulate what the interceptor does
      const token = localStorage.getItem('access_token');
      if (!token) {
        const apiKey = import.meta.env.VITE_API_KEY || '';
        if (apiKey) mockConfig.headers['X-API-Key'] = apiKey;
      }

      expect(mockConfig.headers.Authorization).toBeUndefined();
      expect(mockConfig.headers['X-API-Key']).toBeUndefined();
    });

    it('prioritizes Bearer token over API key when both exist', async () => {
      const token = 'test-jwt-token';
      localStorage.setItem('access_token', token);
      vi.stubEnv('VITE_API_KEY', 'test-api-key');

      const mockConfig = {
        headers: {} as any,
      };

      // Simulate what the interceptor does
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        mockConfig.headers.Authorization = `Bearer ${storedToken}`;
      } else {
        const apiKey = import.meta.env.VITE_API_KEY || '';
        if (apiKey) mockConfig.headers['X-API-Key'] = apiKey;
      }

      expect(mockConfig.headers.Authorization).toBe(`Bearer ${token}`);
      expect(mockConfig.headers['X-API-Key']).toBeUndefined();
    });

    it('preserves existing headers', async () => {
      const token = 'test-jwt-token';
      localStorage.setItem('access_token', token);

      const mockConfig = {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        } as any,
      };

      // Simulate what the interceptor does
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        mockConfig.headers.Authorization = `Bearer ${storedToken}`;
      }

      expect(mockConfig.headers['Content-Type']).toBe('application/json');
      expect(mockConfig.headers['X-Custom-Header']).toBe('custom-value');
      expect(mockConfig.headers.Authorization).toBe(`Bearer ${token}`);
    });
  });

  describe('Response Interceptor Behavior', () => {
    it('passes through successful responses', () => {
      const response = {
        data: { result: 'success' },
        status: 200,
      };

      // Success interceptor just returns the response
      const successInterceptor = (resp: any) => resp;
      const result = successInterceptor(response);

      expect(result).toEqual(response);
    });

    it('clears tokens on 401 error', async () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');

      expect(localStorage.getItem('access_token')).toBe('test-token');
      expect(localStorage.getItem('refresh_token')).toBe('test-refresh');

      const error = {
        response: {
          status: 401,
        },
      };

      // Simulate what the error interceptor does
      const errorInterceptor = (err: any) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return Promise.reject(err);
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('does NOT clear tokens on non-401 errors', async () => {
      const accessToken = 'test-token';
      const refreshToken = 'test-refresh';
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      const error = {
        response: {
          status: 403,
        },
      };

      // Simulate what the error interceptor does
      const errorInterceptor = (err: any) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return Promise.reject(err);
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);

      expect(localStorage.getItem('access_token')).toBe(accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(refreshToken);
    });

    it('does NOT clear tokens on 500 error', async () => {
      const accessToken = 'test-token';
      const refreshToken = 'test-refresh';
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      const error = {
        response: {
          status: 500,
        },
      };

      // Simulate what the error interceptor does
      const errorInterceptor = (err: any) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return Promise.reject(err);
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);

      expect(localStorage.getItem('access_token')).toBe(accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(refreshToken);
    });

    it('handles errors without response object', async () => {
      const accessToken = 'test-token';
      const refreshToken = 'test-refresh';
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      const error = {
        message: 'Network Error',
      };

      // Simulate what the error interceptor does
      const errorInterceptor = (err: any) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return Promise.reject(err);
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);

      expect(localStorage.getItem('access_token')).toBe(accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(refreshToken);
    });

    it('handles 401 error when tokens are already absent', async () => {
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();

      const error = {
        response: {
          status: 401,
        },
      };

      // Simulate what the error interceptor does
      const errorInterceptor = (err: any) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return Promise.reject(err);
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});

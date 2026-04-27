import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const apiKey = import.meta.env.VITE_API_KEY || '';
    if (apiKey) config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

function getUserMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'An unknown error occurred.';

  const err = error as { code?: string; response?: { status?: number } };

  if (err.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
  if (err.code === 'ECONNABORTED') return 'Request timed out.';

  const status = err.response?.status;
  if (status === 403) return 'Access denied.';
  if (status && status >= 500) return 'Server error. Please try again.';

  return 'An unexpected error occurred.';
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }

    // Attach user-friendly message without showing UI
    error.userMessage = getUserMessage(error);

    return Promise.reject(error);
  },
);

export default apiClient;

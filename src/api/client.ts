import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || '',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('API Key authentication failed. Set VITE_API_KEY in .env');
    }
    return Promise.reject(error);
  },
);

export default apiClient;

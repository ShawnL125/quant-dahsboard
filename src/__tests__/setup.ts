import { setActivePinia, createPinia } from 'pinia';
import { vi } from 'vitest';
import { beforeEach } from 'vitest';

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  vi.restoreAllMocks();
});

vi.stubGlobal('import.meta', {
  ...import.meta,
  env: {
    VITE_API_URL: '/api/v1',
    VITE_WS_URL: 'ws://localhost:18000/ws',
    VITE_API_KEY: '',
  },
});

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/__tests__/**',
        'src/types/**',
        'src/**/*.d.ts',
        'src/main.ts',
      ],
      thresholds: {
        'src/utils/**': { branches: 100, functions: 100, lines: 100, statements: 100 },
        'src/api/client.ts': { branches: 90, functions: 90, lines: 90, statements: 90 },
        'src/stores/**': { branches: 70, functions: 70, lines: 70, statements: 70 },
      },
    },
  },
});

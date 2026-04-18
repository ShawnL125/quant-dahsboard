import { defineConfig } from '@playwright/test';

const allowDestructive = process.env.E2E_ALLOW_DESTRUCTIVE === 'true';

export default defineConfig({
  testDir: './e2e/flows',
  fullyParallel: true,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    storageState: 'e2e/.auth/admin.json',
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: /global-setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: 'authenticated',
      dependencies: ['setup'],
      testDir: './e2e/flows',
      testIgnore: allowDestructive
        ? [/login\.spec\.ts/]
        : [/login\.spec\.ts/, /kill-switch\.spec\.ts/],
    },
    {
      name: 'public',
      testDir: './e2e/flows',
      testMatch: /login\.spec\.ts/,
      use: { storageState: undefined },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});

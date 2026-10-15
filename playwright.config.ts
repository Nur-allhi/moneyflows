import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 15_000,
  expect: { timeout: 3_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 6,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 8_000,
    actionTimeout: 5_000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    // GIS is fully stubbed in e2e — any ID works; real builds use GOOGLE_CLIENT_ID.
    env: { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'e2e-test-client-id.apps.googleusercontent.com' },
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/storage.json' },
      dependencies: ['setup'],
    },
  ],
});

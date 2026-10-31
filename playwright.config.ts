import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 15_000,
  expect: { timeout: 3_000 },
  // BUG-44: running specs in parallel made 1–3 of them fail at random with
  // "element not found" — each passes when run alone, and the failures moved
  // between runs (29/2, 28/3, 30/1 on an unchanged app). A suite you have to
  // re-run to interpret cannot act as a gate, so the whole suite runs on one
  // worker: slower, but the result means something. Revisit only after the
  // actual cause (seed vs app boot vs animation timing) is found — BUG-44.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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

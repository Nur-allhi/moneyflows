import { defineConfig, devices } from '@playwright/test';

// The dev server's port. `E2E_PORT` overrides it so the suite can run on a
// machine where 3000 is already taken by another server (the default Vite
// port is 3000, and `reuseExistingServer` below would otherwise attach the
// suite to that unrelated server instead of starting Vite). Default is
// unchanged: 3000.
const E2E_PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = `http://localhost:${E2E_PORT}`;

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
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 8_000,
    actionTimeout: 5_000,
  },
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    // GIS is fully stubbed in e2e — any ID works; real builds use GOOGLE_CLIENT_ID.
    // `PORT` must match `E2E_PORT`, otherwise Vite binds elsewhere and the
    // suite waits on a URL nothing is serving.
    env: {
      PORT: String(E2E_PORT),
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'e2e-test-client-id.apps.googleusercontent.com',
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      // BUG-56: a cold Vite dev boot plus OPFS init cannot finish inside the
      // global 15s budget (the file already allowed 30s for its first `goto`
      // per BUG-49, which the test timeout silently overrode). The seeded step
      // is one-time work, so it gets its own budget; the specs keep 15s so a
      // slow test still fails like a defect instead of hiding behind a long
      // timeout.
      timeout: 60_000,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/storage.json' },
      dependencies: ['setup'],
    },
  ],
});

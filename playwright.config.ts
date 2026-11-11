import { defineConfig, devices } from '@playwright/test';

// The dev server's port for the e2e suite. `E2E_PORT` overrides it.
//
// It is deliberately NOT the app's own dev port (3000): the suite must never
// share a port with a running dev server, because `reuseExistingServer` would
// attach the tests to it — and a server that was started without this
// suite's env has a *different build-time* `__GOOGLE_CLIENT_ID__` baked in.
// That is not hypothetical: with the dev server on 3000, the three cloud-sync
// specs failed because the reused server reported "Online sync is not set up
// in this build yet" (empty client ID) instead of showing the sign-in row.
// A dedicated port means the suite always starts its own server with the
// env it expects.
const E2E_PORT = Number(process.env.E2E_PORT ?? 3001);
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
    // Never reuse an existing server: a reused one carries whatever env it
    // was started with, and this suite asserts on env-dependent behaviour
    // (the mocked Google sign-in). Starting fresh is the only way the result
    // means something. If the port is busy, Playwright fails loudly instead
    // of testing someone else's server.
    reuseExistingServer: false,
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

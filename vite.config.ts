/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig(({ mode }) => {
  // Real env wins (CI, Playwright webServer), then gitignored `.env.local`.
  const env = loadEnv(mode, process.cwd(), '');
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? env.GOOGLE_CLIENT_ID ?? '';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __GOOGLE_CLIENT_ID__: JSON.stringify(googleClientId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // `PORT` overrides the dev port. It exists because the port can be
      // taken by another server on the same machine (anything already bound to
      // 3000 would otherwise be silently reused by Playwright's
      // `reuseExistingServer`, which points the whole e2e suite at the wrong
      // app). When `PORT` is set we also fail loudly instead of sliding to the
      // next free port, so the server and Playwright's baseURL can never drift
      // apart. Default is unchanged: 3000.
      port: Number(process.env.PORT ?? 3000),
      strictPort: process.env.PORT !== undefined,
      open: false,
    },
    test: {
      // Unit tests live in `src/`. Vitest's default `include` also matches
      // `e2e/*.spec.ts`, which are Playwright specs — each one aborts with
      // "Playwright Test did not expect test() to be called here", so the
      // unit gate could never exit 0 (BUG-38).
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});

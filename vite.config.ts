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
      port: 3000,
      open: false,
    },
  };
});

import { test, expect } from '@playwright/test';

const GIS_URL = 'https://accounts.google.com/gsi/client';

test.describe('15 cloud sync (mocked Google + Drive)', () => {
  test('connect → sync now uploads the database', async ({ page }) => {
    const uploads: string[] = [];

    await page.route(GIS_URL, async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `window.google = { accounts: { oauth2: {
          initTokenClient: (cfg) => ({ requestAccessToken: () => { cfg.callback({ access_token: 'e2e-tok', expires_in: 3600 }); } }),
          revoke: () => {},
        } } };`,
      });
    });
    await page.route('https://www.googleapis.com/oauth2/v3/userinfo', async (route) => {
      await route.fulfill({ json: { email: 'e2e@test.dev' } });
    });
    await page.route('**/drive/v3/files**', async (route) => {
      const url = route.request().url();
      if (url.includes('alt=media')) await route.fulfill({ body: 'mockhash' });
      else await route.fulfill({ json: { files: [] } });
    });
    await page.route('**/upload/drive/v3/files**', async (route) => {
      uploads.push(route.request().url());
      await route.fulfill({ json: { id: 'mock-id' } });
    });

    await page.goto('/settings');
    await page.getByText('Backup & Storage').click();
    await page.getByText('Google Drive Sync').click();
    await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
    await expect(page.getByText('e2e@test.dev').first()).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: 'Sync now', exact: true }).click();
    await expect
      .poll(async () => uploads.length, { timeout: 10000 })
      .toBeGreaterThan(0);
    await expect(page.getByText(/last synced (?!never)/i).first()).toBeVisible({ timeout: 8000 });

    // Header sync button deep-links to Backup with the Google section open.
    await page.getByRole('button', { name: /^Cloud sync:/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Backup & Storage' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeVisible({ timeout: 8000 });
  });

  test('unreachable Google with stale sign-in boots local and warns', async ({ page }) => {
    await page.goto('/');
    // Prime an expired sign-in (email known, token gone).
    await page.evaluate(() => new Promise((resolve, reject) => {
      const req = indexedDB.open('moneyflows_google_auth', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('auth');
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('auth', 'readwrite');
        tx.objectStore('auth').put(
          { clientId: 'e2e-client', email: 'e2e@test.dev', expiresAtMs: 0 },
          'google_auth_state',
        );
        tx.oncomplete = () => { db.close(); resolve(0); };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    }));
    await page.route(/googleapis\.com|accounts\.google\.com/, (route) => route.abort());
    await page.reload();
    // App boots to real content — no splash hang, no crash.
    await expect(page.getByText(/Dashboard|Members|Family/i).first()).toBeVisible({ timeout: 10000 });
    await page.goto('/settings');
    await page.getByText('Backup & Storage').click();
    await page.getByText('Google Drive Sync').click();
    await expect(page.getByText(/session expired/i).first()).toBeVisible({ timeout: 8000 });
  });
});

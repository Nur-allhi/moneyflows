import { test, expect } from '@playwright/test';

const GIS_URL = 'https://accounts.google.com/gsi/client';

test.describe('15 cloud sync (mocked Google + Drive)', () => {
  test('connect → sync now uploads the database', async ({ page }) => {
    const uploads: string[] = [];
    // Stateful fake Drive: created files persist across list calls so the
    // app's write-verify read-back observes its own writes (T-162).
    const storedIds: { db: string | null; hash: string | null } = { db: null, hash: null };
    const storedBytes: Record<string, string> = {};
    let storedHash = '';
    let nextId = 1;

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
    // NOTE: glob '**/drive/v3/files**' does NOT match file-id URLs with ?alt=media
    // (verified by probe) — regex matcher covers list + download uniformly.
    await page.route(/googleapis\.com\/drive\/v3\/files/, async (route) => {
      const url = route.request().url();
      if (url.includes('alt=media')) {
        // Newest-first: serve whatever was "uploaded" for that id, else the hash.
        const id = url.split('/drive/v3/files/')[1]?.split('?')[0] ?? '';
        const body = storedBytes[id] ?? storedHash;
        await route.fulfill({ body });
        return;
      }
      const isHash = url.includes('moneyflows.db.sha256');
      const id = isHash ? storedIds.hash : storedIds.db;
      await route.fulfill({
        json: { files: id ? [{ id, modifiedTime: new Date().toISOString() }] : [] },
      });
    });
    await page.route('**/upload/drive/v3/files**', async (route) => {
      uploads.push(route.request().url());
      const req = route.request();
      const post = req.postData() ?? '';
      if (req.method() === 'PATCH') {
        await route.fulfill({ body: '' });
        return;
      }
      // Multipart create: record which slot by the metadata filename, and
      // capture a 64-hex sidecar body so write-verify can read it back.
      const isHash = post.includes('"name":"moneyflows.db.sha256"');
      const id = `mock-id-${nextId++}`;
      if (isHash) {
        storedIds.hash = id;
        storedHash = post.match(/[0-9a-f]{64}/)?.[0] ?? storedHash;
      } else {
        storedIds.db = id;
        storedBytes[id] = 'e2e-db-bytes';
      }
      await route.fulfill({ json: { id } });
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

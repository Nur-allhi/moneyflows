import { test as setup, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'fs';
import { seedTinyB64 } from './helpers/seed-tiny';

const AUTH = 'e2e/.auth/storage.json';

/**
 * BUG-56: seeds `lastSeenVersion` so the "What's New" dialog never mounts
 * during e2e (`main.tsx` opens it whenever `lastSeenVersion !== APP_VERSION`,
 * and while it is open the rest of the app is `aria-hidden`). Measured with a
 * deliberate mismatch, this was NOT what broke setup — the real blocker was the
 * 15s test budget (see `playwright.config.ts` `setup.timeout`). Kept anyway so
 * no future spec has to fight a modal that only exists because a test seeded
 * settings from scratch. Read from `package.json` (the single source for
 * `__APP_VERSION__`) so it can never drift on a bump.
 */
const APP_VERSION: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
).version;

setup('seed tiny DB', async ({ page }) => {
  mkdirSync('e2e/.auth', { recursive: true });
  const b64 = await seedTinyB64();

  await page.goto('/', { timeout: 30_000 }); // BUG-49: the first visit on a cold dev server must transform the whole module graph — the global 8s budget cannot cover it (past green runs rode an already-warm server).
  await page.evaluate(async ({ db, version }) => {
    localStorage.setItem('moneyflows_db', db);
    localStorage.removeItem('moneyflows_opfs_migrated');
    localStorage.removeItem('moneyflows_storage');
    localStorage.setItem('moneyflows_settings', JSON.stringify({ state: { settings: { currency: 'BDT', locale: 'en-IN', primaryMemberId: null, descriptionMaxLength: 200, dashboardTxLimit: 10, setupComplete: true, lastSeenVersion: version } }, version: 0 }));
    try { indexedDB.deleteDatabase('moneyflows_opfs'); } catch {}
    try {
      // @ts-ignore
      const root = await navigator.storage.getDirectory();
      // @ts-ignore
      await root.removeEntry('money_flows.db').catch(() => {});
      // @ts-ignore
      await root.removeEntry('snapshots').catch(() => {});
    } catch {}
  }, { db: b64, version: APP_VERSION });

  await page.reload({ timeout: 30_000 }); // BUG-56: the reload re-runs the module graph + OPFS init; the global 8s navigation budget is too tight on a cold boot.
  await expect(page.getByText(/Where Your Money Is|Recent Transactions/i).first()).toBeVisible({ timeout: 30_000 });
  await page.context().storageState({ path: AUTH });
});

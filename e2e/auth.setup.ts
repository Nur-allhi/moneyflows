import { test as setup, expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import { seedTinyB64 } from './helpers/seed-tiny';

const AUTH = 'e2e/.auth/storage.json';

setup('seed tiny DB', async ({ page }) => {
  mkdirSync('e2e/.auth', { recursive: true });
  const b64 = await seedTinyB64();

  await page.goto('/');
  await page.evaluate(async (b) => {
    localStorage.setItem('moneyflows_db', b);
    localStorage.removeItem('moneyflows_opfs_migrated');
    localStorage.removeItem('moneyflows_storage');
    localStorage.setItem('moneyflows_settings', JSON.stringify({ state: { settings: { currency: 'BDT', locale: 'en-IN', primaryMemberId: null, descriptionMaxLength: 200, numpadMaxDigits: 10, dashboardTxLimit: 10, setupComplete: true } }, version: 0 }));
    try { indexedDB.deleteDatabase('moneyflows_opfs'); } catch {}
    try {
      // @ts-ignore
      const root = await navigator.storage.getDirectory();
      // @ts-ignore
      await root.removeEntry('money_flows.db').catch(() => {});
      // @ts-ignore
      await root.removeEntry('snapshots').catch(() => {});
    } catch {}
  }, b64);

  await page.reload();
  await expect(page.getByText(/Where Your Money Is|Recent Transactions/i).first()).toBeVisible({ timeout: 15000 });
  await page.context().storageState({ path: AUTH });
});

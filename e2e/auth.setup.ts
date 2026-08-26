import { test as setup, expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import { seedTinyB64 } from './helpers/seed-tiny';

const AUTH = 'e2e/.auth/storage.json';

setup('seed tiny DB', async ({ page }) => {
  mkdirSync('e2e/.auth', { recursive: true });
  const b64 = await seedTinyB64();

  await page.goto('/');
  await page.evaluate((b) => {
    localStorage.setItem('moneyflows_db', b);
    localStorage.removeItem('moneyflows_opfs_migrated');
    // Clear OPFS flag so storage setup is deterministic
    indexedDB.deleteDatabase('moneyflows_opfs');
  }, b64);

  await page.reload();
  await expect(page.getByText(/Where Your Money Is|Recent Transactions/i).first()).toBeVisible({ timeout: 15000 });
  await page.context().storageState({ path: AUTH });
});

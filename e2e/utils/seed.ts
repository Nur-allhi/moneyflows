import type { Page } from '@playwright/test';
import { seedTinyB64 } from '../helpers/seed-tiny';

export async function resetToSeed(page: Page) {
  const b64 = await seedTinyB64();
  await page.goto('/');
  await page.evaluate(async (b) => {
    localStorage.setItem('moneyflows_db', b);
    localStorage.removeItem('moneyflows_opfs_migrated');
    localStorage.removeItem('moneyflows_storage');
    localStorage.setItem('moneyflows_settings', JSON.stringify({ state: { settings: { currency: 'BDT', locale: 'en-IN', primaryMemberId: null, descriptionMaxLength: 200, numpadMaxDigits: 10, dashboardTxLimit: 10, setupComplete: true } }, version: 0 }));
    try { (indexedDB as any).deleteDatabase('moneyflows_opfs'); } catch {}
    try {
      const root: any = await (navigator as any).storage.getDirectory();
      await root.removeEntry('money_flows.db').catch(() => {});
      await root.removeEntry('snapshots').catch(() => {});
    } catch {}
  }, b64);
  await page.reload();
}

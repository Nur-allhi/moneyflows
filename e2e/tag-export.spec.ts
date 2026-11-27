import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { seedTinyB64 } from './helpers/seed-tiny';

const APP_VERSION: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;

async function seedTagged(page: Page, extraGroceriesTag = false, nonPrimaryOwner = false) {
  const db = await seedTinyB64(0, true, extraGroceriesTag, nonPrimaryOwner);
  await page.goto('/');
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
  }, { db, version: APP_VERSION });
  await page.reload();
}

async function downloadTagPdf(page: Page, contains: string[] = [], notContains: string[] = []) {
  const button = page.getByRole('button', { name: 'Download PDF' });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    button.click(),
  ]);
  expect(download.suggestedFilename()).toBe('tag_groceries_ledger.pdf');
  const path = await download.path();
  expect(path).not.toBeNull();
  const pdf = readFileSync(path!, { encoding: 'latin1' });
  // jsPDF's output starts with the PDF magic number; a broken export would not.
  expect(pdf.slice(0, 5)).toBe('%PDF-');
  for (const text of contains) expect(pdf).toContain(text);
  for (const text of notContains) expect(pdf).not.toContain(text);
}

test.describe('tag ledger PDF export (T-179)', () => {
  test('desktop exports the tag ledger', async ({ page }) => {
    await seedTagged(page);
    await page.goto('/tags/groceries');
    await expect(page.getByRole('heading', { name: /#groceries/ })).toBeVisible();
    await downloadTagPdf(page);
  });

  test('the button stays usable after narrowing the ledger by search', async ({ page }) => {
    await seedTagged(page, true);
    await page.goto('/tags/groceries');
    await expect(page.getByText('Groceries - Eid').first()).toBeVisible();
    await page.getByPlaceholder(/Search ledger/).fill('Weekly');
    await expect(page.getByText('Groceries - Eid').first()).toBeHidden();
    // The search narrowed the file too: only the matching tagged row is in it.
    await downloadTagPdf(page, ['Groceries - Weekly'], ['Groceries - Eid']);
  });

  test('shows the account owner in Member, on screen and in the PDF (BUG-65)', async ({ page }) => {
    await seedTagged(page, false, true);
    await page.goto('/tags/groceries');
    const row = page.locator('[data-tx-id]').filter({ hasText: 'Groceries at Brac' });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Namira');
    await expect(row).toContainText('Brac Bank');
    await expect(row).not.toContainText('Admin');
    await downloadTagPdf(page, ['Namira', 'Brac Bank']);
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('icon-only button is a 44px target and downloads the PDF', async ({ page }) => {
      await seedTagged(page);
      await page.goto('/tags/groceries');
      const button = page.getByRole('button', { name: 'Download PDF' });
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      await expect(page.getByText('Download PDF')).toBeHidden();
      await downloadTagPdf(page);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
});

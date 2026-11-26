import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { seedTinyB64 } from './helpers/seed-tiny';

const APP_VERSION: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
const TAGGED = 'Groceries - Weekly';

async function seedTagged(page: Page) {
  const db = await seedTinyB64(0, true);
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

async function openTransaction(page: Page, title: string, mobile = false) {
  if (mobile) await page.getByRole('button', { name: 'Search' }).click();
  const search = page.getByPlaceholder('Search anything...').last();
  await expect(search).toBeVisible();
  await search.fill(title);
  await expect(page.getByRole('option', { name: new RegExp(title) }).first()).toBeVisible();
  await search.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Transaction Details' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('transaction tags (T-178)', () => {
  test('desktop details and Description cells show tag links', async ({ page }) => {
    await seedTagged(page);
    const dialog = await openTransaction(page, TAGGED);
    await expect(dialog.getByText('Tags')).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'View tag groceries' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'View tag weekly' })).toBeVisible();

    // A chip in the detail field closes the sheet/modal and opens that tag family.
    await dialog.getByRole('link', { name: 'View tag groceries' }).click();
    await expect(page).toHaveURL(/\/tags\/groceries$/);
    await expect(dialog).toBeHidden();

    const row = page.locator('[data-tx-id]').filter({ hasText: TAGGED });
    await expect(row.getByRole('link', { name: 'View tag groceries' })).toBeVisible();
    await expect(row.getByRole('link', { name: 'View tag weekly' })).toBeVisible();
    // BUG-64: the first pill must not be glued to the description text.
    const chipGroup = row.locator('a[href^="/tags/"]').first().locator('..');
    expect(await chipGroup.evaluate((el) => parseFloat(getComputedStyle(el).marginLeft))).toBeGreaterThanOrEqual(4);

    // Row chips swallow the click: the row's own detail handler must not fire.
    await row.getByRole('link', { name: 'View tag weekly' }).click();
    await expect(page).toHaveURL(/\/tags\/weekly$/);
    await expect(page.getByRole('dialog', { name: 'Transaction Details' })).toBeHidden();
  });

  test('an untagged transaction has no Tags field', async ({ page }) => {
    await seedTagged(page);
    const dialog = await openTransaction(page, 'Medical Groceries');
    await expect(dialog.getByText('Tags')).toHaveCount(0);
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('mobile rows and sheet show tags without overflow', async ({ page }) => {
      await seedTagged(page);
      const dialog = await openTransaction(page, TAGGED, true);
      await expect(dialog.getByRole('link', { name: 'View tag groceries' })).toBeVisible();
      await expect(dialog.getByRole('link', { name: 'View tag weekly' })).toBeVisible();

      await dialog.getByRole('button', { name: 'Ledger', exact: true }).click();
      await expect(page).toHaveURL(/\/member\/[^?]+\?account=/);
      const row = page.locator('[data-tx-id]').filter({ hasText: TAGGED });
      await expect(row.getByRole('link', { name: 'View tag groceries' })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      await row.getByRole('link', { name: 'View tag weekly' }).click();
      await expect(page).toHaveURL(/\/tags\/weekly$/);
      await expect(page.getByRole('dialog', { name: 'Transaction Details' })).toBeHidden();
    });
  });
});

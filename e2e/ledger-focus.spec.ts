import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { seedTinyB64 } from './helpers/seed-tiny';

const APP_VERSION: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
const TARGET = 'Old DBBL Expense 6'; // oldest of 13 DBBL rows — past the 10-row first page

async function seedLongLedger(page: Page) {
  const db = await seedTinyB64(6);
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

/** Open the old transaction's detail from global search — it is beyond page one. */
async function openOldTransaction(page: Page, mobile = false) {
  if (mobile) await page.getByRole('button', { name: 'Search' }).click();
  // Desktop has one header input; mobile also mounts the toggled SearchBar row.
  const search = page.getByPlaceholder('Search anything...').last();
  await expect(search).toBeVisible();
  await search.fill(TARGET);
  // On phones the floating result row sits behind a dashboard card, so pick it
  // with the keyboard instead of clicking through the overlay.
  await expect(page.getByRole('option', { name: new RegExp(TARGET) }).first()).toBeVisible();
  await search.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Transaction Details' })).toBeVisible();
}

async function assertFocusedAtBottom(page: Page, desktop: boolean) {
  const buttonName = desktop ? 'Open in Ledger' : 'Ledger';
  await page.getByRole('button', { name: buttonName, exact: !desktop }).click();

  await expect(page).toHaveURL(/\/member\/[^?]+\?account=/);
  const rows = page.locator('[data-tx-id]');
  await expect(rows.first()).toBeVisible({ timeout: 10000 });
  // The target was outside the first page: the reveal expanded past 10 rows and
  // put it at the bottom of the newest-first list.
  await expect.poll(async () => rows.count()).toBeGreaterThan(10);
  await expect(rows.last()).toContainText(TARGET);

  const row = rows.filter({ hasText: TARGET });
  await expect(row).toHaveCount(1);
  await expect(row).toHaveClass(/anim-focus-row/);
  // The URL hand-off is consumed once the row exists; a second click re-triggers.
  await expect(page).not.toHaveURL(/[?&]tx=/);
  // The table body grows with the page, so the meaningful check is the real
  // browser viewport: the page itself must have scrolled down to the row.
  await expect.poll(async () => row.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  })).toBe(true);

  await expect(row).not.toHaveClass(/anim-focus-row/, { timeout: 5000 });

  // A second "Open in Ledger" on the same transaction flashes it again.
  await row.click();
  await expect(page.getByRole('dialog', { name: 'Transaction Details' })).toBeVisible();
  await page.getByRole('button', { name: buttonName, exact: !desktop }).click();
  await expect(row).toHaveClass(/anim-focus-row/);
}

test.describe('ledger focus (T-177)', () => {
  test('desktop "Open in Ledger" reveals, scrolls to and flashes an old row', async ({ page }) => {
    await seedLongLedger(page);
    await openOldTransaction(page);
    await assertFocusedAtBottom(page, true);
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('the sheet "Ledger" action focuses the same old row', async ({ page }) => {
      await seedLongLedger(page);
      await openOldTransaction(page, true);
      await assertFocusedAtBottom(page, false);
    });
  });
});

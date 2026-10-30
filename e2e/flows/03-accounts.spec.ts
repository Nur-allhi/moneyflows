import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * BUG-20 / BUG-19 regression: the Linked Accounts surfaces must show the same
 * per-account balances as the dashboard metric, before and after a reload.
 *
 * Fixture = e2e/helpers/seed-tiny.ts, which zeroes every account row and
 * replays its transactions, so these are the values boot's
 * `recalculateBalances()` (T-171) is expected to reproduce:
 *   DBBL (bank) 70,000 · Cash (cash) -6,000 · bKash (wallet) 0
 */
const BANK_TOTAL = 70_000;
const MEMBER_NET = 64_000;
const ACCOUNT_BALANCES: Record<string, number> = { DBBL: BANK_TOTAL, Cash: -6_000, bKash: 0 };

const format = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const money = (n: number) => `${format(n)} BDT`;
/** The profile hero renders amount and currency as separate elements ("64,000BDT"). */
const moneyLoose = (n: number) => new RegExp(`${format(n).replace(/[^\d,]/g, (c) => `\\${c}`)}\\s*BDT`);

async function openMemberProfile(page: Page) {
  await page.goto('/member');
  await page.getByRole('button', { name: /Admin/ }).first().click();
  await expect(page.getByText('Net Balance').first()).toBeVisible();
}

/** AccountCard text is "Name / Type / <amount> BDT / Available Balance". */
async function cardBalances(cards: Locator): Promise<Record<string, string>> {
  const rows = await cards.evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).innerText.split('\n').map((line) => line.trim()).filter(Boolean)),
  );
  return Object.fromEntries(rows.map((lines) => [lines[0], lines.find((line) => line.endsWith('BDT')) ?? '']));
}

const expectedCards = () =>
  Object.fromEntries(Object.entries(ACCOUNT_BALANCES).map(([name, value]) => [name, money(value)]));

test.describe('03 accounts', () => {
  test('accounts visible on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Where Your Money Is/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Cash|Bank|Wallet/i).first()).toBeVisible();
  });

  test.describe('linked accounts match the dashboard', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('mobile modal shows each balance, before and after reload', async ({ page }) => {
      await page.goto('/');
      const banksCard = page.locator('[class*="metricCard"]').filter({ hasText: /total in banks/i });
      await expect(banksCard).toContainText(money(BANK_TOTAL), { timeout: 15000 });

      await openMemberProfile(page);
      await expect(page.locator('[class*="profileCard"]')).toContainText(moneyLoose(MEMBER_NET));

      await page.locator('[class*="mobileLinkedAccounts"]').click();
      let dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      expect(await cardBalances(dialog.locator('[class*="gridCard"]'))).toEqual(expectedCards());
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      // BUG-19/20: a reload must not zero or desync any of it.
      await page.reload();
      await expect(page.getByText('Net Balance').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[class*="profileCard"]')).toContainText(moneyLoose(MEMBER_NET));
      await page.locator('[class*="mobileLinkedAccounts"]').click();
      dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      expect(await cardBalances(dialog.locator('[class*="gridCard"]'))).toEqual(expectedCards());
      await page.keyboard.press('Escape');

      await page.goto('/');
      await expect(page.locator('[class*="metricCard"]').filter({ hasText: /total in banks/i }))
        .toContainText(money(BANK_TOTAL), { timeout: 15000 });
    });
  });

  test.describe('desktop linked-accounts dropdown', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('dropdown cards carry the same balances', async ({ page }) => {
      await openMemberProfile(page);
      await page.locator('[class*="accountsDropdownHeader"]').click();
      await expect(page.locator('[class*="accountsGrid"]')).toBeVisible();
      expect(await cardBalances(page.locator('[class*="accountsGrid"] > div'))).toEqual(expectedCards());
    });
  });
});

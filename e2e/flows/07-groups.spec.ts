import { test, expect, type Page } from '@playwright/test';

/** Open the seeded group that contains both DBBL and Cash. */
async function openGroupLedger(page: Page) {
  await page.goto('/groups');
  await page.getByText('Family Accounts').first().click();
}

test.describe('07 groups', () => {
  test('groups list', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.getByText(/Groups|No groups/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('desktop ledger shows the account route and both legs of an internal transfer', async ({ page }) => {
    await openGroupLedger(page);
    await page.getByRole('button', { name: /View Ledger/i }).click();
    await expect(page.getByRole('heading', { name: 'Family Accounts' })).toBeVisible({ timeout: 15000 });

    const atmRows = page.getByRole('button').filter({ hasText: 'ATM Cash' });
    await expect(atmRows).toHaveCount(2);
    const cells = await atmRows.evaluateAll((els) =>
      els.map((el) => Array.from(el.children).map((c) => (c as HTMLElement).innerText.trim())),
    );
    // Date | Type | Description | Account | Debit | Credit | Balance
    for (const row of cells) expect(row[3]).toContain('DBBL → Cash');
    // BUG-62: the visible cell may ellipsise, but the full route is on hover.
    await expect(atmRows.first().locator('span[class*="account"]')).toHaveAttribute('title', 'DBBL → Cash');
    // Balance must stay on the same line as Date — a 7th cell in a 6-track grid
    // silently wraps to a second line.
    const alignment = await atmRows.first().evaluate((el) => {
      const children = Array.from(el.children);
      return { date: children[0]!.getBoundingClientRect().y, balance: children[6]!.getBoundingClientRect().y };
    });
    expect(alignment.balance).toBeCloseTo(alignment.date, 0);
    expect(cells[0]?.[4]).toContain('10,000');
    expect(cells[0]?.[5]).toBe('\u2014');
    expect(cells[1]?.[4]).toBe('\u2014');
    expect(cells[1]?.[5]).toContain('10,000');

    // A single-sided expense still names the one account it touched.
    const groceries = page.getByRole('button').filter({ hasText: 'Groceries - Eid' });
    await expect(groceries).toHaveCount(1);
    expect((await groceries.evaluateAll((els) => Array.from(els[0]!.children).map((c) => (c as HTMLElement).innerText.trim())))[3])
      .toContain('Cash');
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('phone ledger shows two account-labelled cards for an internal transfer', async ({ page }) => {
      await openGroupLedger(page);
      await page.getByRole('button', { name: 'Ledger', exact: true }).click();
      await expect(page.getByText('Family Accounts').first()).toBeVisible({ timeout: 15000 });

      const cards = page.locator('[class*="txRow"]').filter({ hasText: 'ATM Cash' });
      await expect(cards).toHaveCount(2);
      await expect(page.getByText('DBBL → Cash')).toHaveCount(2);
      await expect(cards.first().locator('span[class*="txAccount"]')).toHaveAttribute('title', 'DBBL → Cash');
      await expect(cards.locator('[class*="txArrowIn"]')).toHaveCount(1);
      await expect(cards.locator('[class*="txArrowOut"]')).toHaveCount(1);
    });
  });
});

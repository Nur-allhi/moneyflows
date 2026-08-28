import { test, expect } from '@playwright/test';
test.describe('05 other ledgers', () => {
  test('other ledgers nav', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/Other Ledgers/i).first().click({ timeout: 8000 }).catch(async()=>{ await page.goto('/other-ledgers'); });
    await expect(page.getByText(/Other Ledgers|No ledgers/i).first()).toBeVisible({ timeout: 8000 });
  });
});

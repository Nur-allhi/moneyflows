import { test, expect } from '@playwright/test';
test.describe('04 transactions', () => {
  test('new transaction modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /New Transaction/i }).first().click().catch(async()=>{
      await page.locator('button').filter({hasText: '+' }).first().click();
    });
    await expect(page.getByText(/New Transaction|Amount/i).first()).toBeVisible({ timeout: 8000 });
  });
  test('recent transactions list', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Recent Transactions/i).first()).toBeVisible({ timeout: 15000 });
  });
});

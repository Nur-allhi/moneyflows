import { test, expect } from '@playwright/test';
test.describe('02 members', () => {
  test('member list loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Where Your Money Is/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Self|Spouse|Family/i);
  });
  test('open member profile', async ({ page }) => {
    await page.goto('/');
    await page.locator('body').click();
    await expect(page.getByText(/Net Balance|Linked Accounts|Where Your Money Is/i).first()).toBeVisible({ timeout: 8000 });
  });
});

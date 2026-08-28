import { test, expect } from '@playwright/test';
test.describe('03 accounts', () => {
  test('accounts visible on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Where Your Money Is/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Cash|Bank|Wallet/i).first()).toBeVisible();
  });
});

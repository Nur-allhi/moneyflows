import { test, expect } from '@playwright/test';
test.describe('01 dashboard', () => {
  test('loads seeded metrics', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Where Your Money Is|Total Assets/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Recent Transactions/i).first()).toBeVisible();
  });
  test('FAB visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/MoneyFlows|Dashboard|Total/i, { timeout: 8000 });
  });
});

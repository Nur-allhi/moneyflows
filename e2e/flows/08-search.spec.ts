import { test, expect } from '@playwright/test';
test.describe('08 search', () => {
  test('search input exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder(/Search/i).first()).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder(/Search/i).first().fill('Self');
    await expect(page.getByText(/Self/i).first()).toBeVisible({ timeout: 5000 });
  });
});

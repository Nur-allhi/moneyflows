import { test, expect } from '@playwright/test';
test.describe('12 settings', () => {
  test('settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/Settings|Currency|Locale/i).first()).toBeVisible({ timeout: 10000 });
  });
});

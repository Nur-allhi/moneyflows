import { test, expect } from '@playwright/test';
test.describe('06 loans', () => {
  test('loans page loads', async ({ page }) => {
    await page.goto('/loans');
    await expect(page.getByText(/Loans|No active loans|Outstanding/i).first()).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from '@playwright/test';
test.describe('07 groups', () => {
  test('groups list', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.getByText(/Groups|No groups/i).first()).toBeVisible({ timeout: 10000 });
  });
});

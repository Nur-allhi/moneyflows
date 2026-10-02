import { test, expect } from '@playwright/test';
test.describe('11 backup', () => {
  test('settings shows storage health', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/Settings/i).first().click({ timeout: 8000 }).catch(async()=>{ await page.goto('/settings'); });
    await expect(page.getByText(/Storage|Health|Backup/i).first()).toBeVisible({ timeout: 8000 });
  });
});

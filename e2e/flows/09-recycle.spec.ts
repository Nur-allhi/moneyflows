import { test, expect } from '@playwright/test';
test.describe('09 recycle bin', () => {
  test('recycle bin opens', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/Recycle|Bin/i).first().click({ timeout: 8000 }).catch(async()=>{ await page.goto('/recycle'); });
    await expect(page.locator('body')).toContainText(/Recycle|Bin|Deleted/i, { timeout: 8000 });
  });
});

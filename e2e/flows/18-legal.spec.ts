import { test, expect } from '@playwright/test';

test.describe('18 legal pages', () => {
  test('privacy and terms render outside the setup guard', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/drive\.appdata/i).first()).toBeVisible();
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible({ timeout: 8000 });
  });
});

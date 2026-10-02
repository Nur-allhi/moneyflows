import { test, expect } from '@playwright/test';
import { disableMotion } from './helpers/motion';

test('report filter custom calendar opens', async ({ page }) => {
  await disableMotion(page);
  await page.goto('/member');
  await page.getByText('Admin').first().click();
  await page.getByRole('button', { name: /report/i }).first().click();
  await expect(page).toHaveURL(/\/report/);
  await page.getByRole('button', { name: /report filters/i }).click();
  await page.getByRole('button', { name: /^custom$/i }).click();
  await page.getByText('Pick a date').first().click();
  await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 5000 });
});

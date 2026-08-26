import { test, expect } from '@playwright/test';
import { disableMotion } from './helpers/motion';

test('dashboard loads (DB + splash ready)', async ({ page }) => {
  await page.goto('/');
  await disableMotion(page);
  await expect(page.getByText(/Where Your Money Is|Recent Transactions/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Total Assets|Cash in Hand/i).first()).toBeVisible();
});

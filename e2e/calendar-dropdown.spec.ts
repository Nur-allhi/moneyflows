import { test, expect } from '@playwright/test';
import { disableMotion } from './helpers/motion';

test('calendar shows month and year dropdown labels', async ({ page }) => {
  await disableMotion(page);
  await page.goto('/member');
  await page.getByText('Admin').first().click();
  await page.getByRole('button', { name: /report/i }).first().click();
  await expect(page).toHaveURL(/\/report/);
  await page.getByRole('button', { name: /report filters/i }).click();
  await page.getByRole('button', { name: /^custom$/i }).click();

  // Open the date picker calendar via its calendar icon button (PopoverTrigger).
  // Scope to the button inside the same wrapper div as the date input.
  await page
    .locator('div:has(input[placeholder="YYYY-MM-DD"]) > button')
    .first()
    .click();

  // Calendar panel should be visible (react-day-picker renders a table grid)
  await expect(page.locator('table').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

  // Both month and year dropdown labels/triggers should be visible side by side.
  // Match standalone month names / year numbers (not day-button aria-labels like
  // "Sunday, November 1st, 2026").
  await expect(
    page.getByRole('button', { name: /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i }).first()
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^\d{4}$/ }).first()).toBeVisible();
});

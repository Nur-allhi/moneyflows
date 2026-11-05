import { test, expect } from '@playwright/test';
import { disableMotion } from './helpers/motion';

test('report filter custom date picker opens and applies a day', async ({ page }) => {
  await disableMotion(page);
  await page.goto('/member');
  await page.getByText('Admin').first().click();
  await page.getByRole('button', { name: /report/i }).first().click();
  await expect(page).toHaveURL(/\/report/);
  await page.getByRole('button', { name: /report filters/i }).click();
  await page.getByRole('button', { name: /^custom$/i }).click();

  // BUG-51: the DatePicker used to sit inside a <label> whose implicit control
  // was the Popover trigger, so each press toggled it open→closed and the
  // calendar never rendered. Open it from the calendar icon.
  const fromInput = page.locator('input[placeholder="YYYY-MM-DD"]:visible').first();
  await expect(fromInput).toHaveValue('');
  await page.locator('div:has(> input[placeholder="YYYY-MM-DD"]:visible) > button').first().click();

  await expect(page.locator('[data-slot="calendar"]')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: /^\d{4}$/ }).first()).toBeVisible();

  await page.locator('[data-slot="calendar"] button[data-day]:not([disabled])').first().click();
  await expect(page.locator('[data-slot="calendar"]')).toHaveCount(0);
  await expect(fromInput).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
});

test('report print shows only report content', async ({ page }) => {
  await disableMotion(page);
  await page.goto('/member');
  await page.getByText('Admin').first().click();
  await page.getByRole('button', { name: /report/i }).first().click();
  await expect(page).toHaveURL(/\/report/);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('aside')).toBeHidden();
  await expect(page.locator('header')).toBeHidden();
  await expect(page.getByTestId('bottom-nav')).toBeHidden();
  await expect(page.getByTestId('report-print-table').first()).toBeVisible();
  await expect(page.getByTestId('report-screen-table').first()).toBeHidden();
});

import { test, expect, type Page } from '@playwright/test';
import { disableMotion } from './helpers/motion';

/**
 * Regression guard for the calendar month/year dropdown.
 *
 * NOTE: this must open the calendar from the transaction wizard, not from
 * Report filters → Custom — those DatePickers sit inside a `<label>` that
 * double-activates the Popover trigger, so the calendar never opens there
 * (BUG-51). A guard written against that screen passes without ever
 * rendering a calendar.
 */

const MONTH_NAMES = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i;

async function openCalendar(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /New Transaction/i }).first().click();
  await page.waitForSelector('input[placeholder="YYYY-MM-DD"]:visible', { timeout: 8000 });
  await page
    .locator('div:has(> input[placeholder="YYYY-MM-DD"]:visible) > button')
    .first()
    .click();
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible({ timeout: 5000 });
}

test('calendar shows month and year dropdown triggers', async ({ page }) => {
  await disableMotion(page);
  await openCalendar(page);

  await expect(page.getByRole('button', { name: MONTH_NAMES }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^\d{4}$/ }).first()).toBeVisible();
});

test('month dropdown opens as the app dropdown panel and applies the pick', async ({ page }) => {
  await disableMotion(page);
  await openCalendar(page);

  const monthTrigger = page.getByRole('button', { name: MONTH_NAMES }).first();
  const currentMonth = (await monthTrigger.innerText()).trim();

  await monthTrigger.click();
  const panel = page.getByRole('listbox');
  await expect(panel).toBeVisible();

  // All 12 months in the panel, with the current one marked as selected.
  const options = panel.getByRole('option');
  await expect(options).toHaveCount(12);
  await expect(page.getByRole('option', { name: currentMonth, exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  // Selected item carries the app's primary-gradient active state (not a plain list row).
  const activeBg = await page
    .getByRole('option', { name: currentMonth, exact: true })
    .evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(activeBg).toContain('gradient');

  const targetName = currentMonth.toLowerCase() === 'jan' ? 'Feb' : 'Jan';
  await page.getByRole('option', { name: targetName, exact: true }).click();

  await expect(panel).toHaveCount(0);
  await expect(monthTrigger).toHaveText(new RegExp(targetName, 'i'));
});

test('year dropdown opens, stays in the panel and applies the pick', async ({ page }) => {
  await disableMotion(page);
  await openCalendar(page);

  const yearTrigger = page.getByRole('button', { name: /^\d{4}$/ }).first();
  const currentYear = (await yearTrigger.innerText()).trim();
  await yearTrigger.click();

  const panel = page.getByRole('listbox');
  await expect(panel).toBeVisible();
  await expect(page.getByRole('option', { name: currentYear, exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  // The panel is anchored inside the calendar popover — it must not spill out of it.
  const [panelBox, popoverBox] = await Promise.all([
    panel.boundingBox(),
    page.locator('[data-slot="popover-content"]').boundingBox(),
  ]);
  expect(panelBox).not.toBeNull();
  expect(popoverBox).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(popoverBox!.x - 1);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(popoverBox!.x + popoverBox!.width + 1);

  await page.getByRole('option', { name: /^\d{4}$/, exact: false }).filter({ hasNotText: currentYear }).first().click();
  await expect(panel).toHaveCount(0);
});

test('month dropdown closes on Escape without closing the calendar', async ({ page }) => {
  await disableMotion(page);
  await openCalendar(page);

  await page.getByRole('button', { name: MONTH_NAMES }).first().click();
  await expect(page.getByRole('listbox')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible();
});

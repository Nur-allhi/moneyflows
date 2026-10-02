import { expect, type Page } from '@playwright/test';

export async function goto(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.locator('body')).toBeVisible();
}

export async function openMember(page: Page, name: string) {
  await page.getByRole('link', { name }).first().click().catch(async () => {
    await page.getByText(name).first().click();
  });
  await expect(page.getByText(name).first()).toBeVisible();
}

export async function expectVisible(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 8000 });
}

export async function clickByText(page: Page, text: string | RegExp) {
  await page.getByRole('button', { name: text }).first().click();
}

import type { Page } from '@playwright/test';

/**
 * Disables all CSS animations/transitions for deterministic, faster e2e.
 * Call once per test after goto.
 */
export async function disableMotion(page: Page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}`,
  });
}

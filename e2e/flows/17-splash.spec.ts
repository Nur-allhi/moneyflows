import { test, expect } from '@playwright/test';

// BUG-13: on slow boots the progress bar must stage and persist through the
// fade-out (100% Ready) instead of vanishing the instant boot completes.
test.describe('17 splash progress', () => {
  test('slow boot stages progress and shows Ready through fade', async ({ page }) => {
    await page.route('**/sql-wasm.wasm', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto('/');
    // Bar appears after the 600ms narration threshold with a live stage…
    await expect(page.getByText(/Starting|engine|data|cloud|ready/i).first()).toBeVisible({ timeout: 8000 });
    // …and completion stays visible through the fade-out instead of unmounting.
    await expect(page.getByText('Ready').first()).toBeVisible({ timeout: 10000 });
    // Boot still completes to the app.
    await expect(page).toHaveURL(/\/(setup)?$/, { timeout: 10000 });
  });
});

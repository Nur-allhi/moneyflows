import { test, expect } from '@playwright/test';

// Recovery screen: forced engine failure must land on the Database Error UI
// with working actions and no crashes from the snapshot slot list.
test.describe('16 recovery screen', () => {
  test('blocked wasm shows Database Error with restore actions', async ({ page }) => {
    await page.route('**/sql-wasm.wasm', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByText('Database Error').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Restore Latest Backup' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Fresh' })).toBeVisible();
    // Slot list degrades gracefully when storage never initialized.
    await expect(page.getByText(/No older backups|pick a specific backup/i).first()).toBeVisible({ timeout: 8000 });
  });
});

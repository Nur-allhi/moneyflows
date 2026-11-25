import { test, expect } from '@playwright/test';

/** T-176: the header bell must surface backup/restore-point problems, not just wiggle. */
test.describe('backup alerts in the header bell', () => {
  test('warns when no backup folder is chosen and deep-links to Backup settings', async ({ page }) => {
    await page.goto('/');

    const bell = page.getByTestId('notification-bell');
    await expect(bell).toBeVisible();
    await expect(page.getByTestId('notification-badge')).toBeVisible();
    await expect(bell).toHaveAttribute('title', /backup/i);

    await bell.click();
    const panel = page.getByRole('dialog', { name: 'Backup alerts' });
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-alert-id="folder-not-set-up"]')).toBeVisible();

    await page.getByRole('button', { name: 'Open Backup settings', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\?tab=backup/);
    await expect(page.getByText('Backup & Storage')).toBeVisible();
  });

  test('folder alerts clear as soon as a backup folder is chosen', async ({ page }) => {
    // Use the real OPFS root as the picked folder: it is a genuine, structured-
    // cloneable FileSystemDirectoryHandle, so FolderSync stores it exactly as it
    // would in production. Seed one backup file so the folder is not empty.
    await page.addInitScript(() => {
      const rootPromise = (navigator.storage as unknown as {
        getDirectory: () => Promise<FileSystemDirectoryHandle>;
      }).getDirectory();
      void rootPromise.then(async (root) => {
        const dir = await root.getDirectoryHandle('MoneyFlows', { create: true });
        const file = await dir.getFileHandle('moneyflows-20260101-000000.db', { create: true });
        const writable = await file.createWritable();
        await writable.write(new Uint8Array([1]));
        await writable.close();
      }).catch(() => {});
      (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker = async () => rootPromise;
    });

    await page.goto('/settings?tab=backup');
    await expect(page.getByTestId('notification-badge')).toBeVisible();
    await page.getByRole('button', { name: 'Choose backup folder' }).click();
    await expect(page.getByText(/Backing up to/)).toBeVisible();
    await expect(page.getByTestId('notification-badge')).toHaveCount(0);

    await page.getByTestId('notification-bell').click();
    const panel = page.getByRole('dialog', { name: 'Backup alerts' });
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('backup-alert')).toHaveCount(0);
  });
});

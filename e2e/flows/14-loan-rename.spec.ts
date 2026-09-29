import { test, expect } from '@playwright/test';

test.describe('14 loan ledger rename', () => {
  test.setTimeout(60_000);
  test('rename borrower account from the loan ledger header', async ({ page }) => {
    await page.goto('/loans');
    await expect(page.getByRole('button', { name: '+ New Loan' })).toBeVisible({ timeout: 10000 });

    // Create a loan: DBBL lends 10000 to existing counterparty Rafiq.
    await page.getByRole('button', { name: '+ New Loan' }).click();
    await page.getByRole('textbox', { name: '0' }).fill('10000');
    await page.getByRole('button', { name: /Lender Account|Select account/ }).first().click();
    await page.getByRole('button', { name: /Admin/ }).first().click();
    await page.getByRole('button', { name: /DBBL/ }).first().click();
    await page.getByRole('button', { name: 'Select account' }).last().click();
    await page.getByRole('button', { name: /Rafiq/ }).first().click();
    await page.getByRole('textbox', { name: "What's this for?" }).fill('rename e2e loan');
    await page.getByRole('button', { name: 'Confirm Loan' }).click();

    // Wait out the form's close animation, then open the new ledger from the index.
    await expect(page.getByRole('button', { name: 'Confirm Loan' })).toBeHidden({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Rafiq/ })).toHaveCount(1, { timeout: 10000 });
    await page.getByRole('button', { name: /Rafiq/ }).click();
    await expect(page.getByRole('button', { name: 'Rename ledger' })).toBeVisible({ timeout: 10000 });

    // Rename via the shared account editor.
    await page.getByRole('button', { name: 'Rename ledger' }).click();
    const nameInput = page.getByPlaceholder('e.g. bKash, Brac Bank');
    await expect(nameInput).toHaveValue('Rafiq', { timeout: 5000 });
    await nameInput.fill('Rafiq Renamed');
    await page.getByRole('button', { name: 'Save' }).click();

    // Header reflects the new ledger name.
    await expect(page.getByText('Rafiq Renamed').first()).toBeVisible({ timeout: 10000 });
  });
});

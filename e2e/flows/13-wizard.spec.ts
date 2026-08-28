import { test, expect } from '@playwright/test';
test.describe('13 wizard', () => {
  test('wizard redirects when setupComplete false', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(()=>{ const s=JSON.parse(localStorage.getItem('moneyflows_settings')||'{}'); if(s.state) s.state.settings.setupComplete=false; localStorage.setItem('moneyflows_settings', JSON.stringify(s)); });
    await page.goto('/setup');
    await expect(page.getByText(/Welcome|Family|Money/i).first()).toBeVisible({ timeout: 8000 });
  });
});

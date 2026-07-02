# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-tests.spec.ts >> TS-00: Data Setup >> TS-00F — Create External Debtors/Creditors
- Location: e2e-tests.spec.ts:230:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'Creditor' }).first()
    - locator resolved to <button class="_filterBtn_53w44_326 ">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_overlay_53w44_498">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_overlay_53w44_498">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    110 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div class="_overlay_53w44_498">…</div> intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - banner [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: MoneyFlows
          - generic [ref=e8]: Loans
        - generic [ref=e9]:
          - generic [ref=e10]: Thu, 2 Jul 2026
          - button "New transaction" [ref=e11] [cursor=pointer]:
            - img [ref=e12]
          - button "Notifications" [ref=e14] [cursor=pointer]: 🔔
      - generic [ref=e17]:
        - generic [ref=e18]:
          - heading "Your Loans" [level=2] [ref=e19]
          - generic [ref=e20]:
            - generic [ref=e21]: 0 Accounts
            - button "+ Add" [active] [ref=e22] [cursor=pointer]
        - generic [ref=e23]:
          - button "All 0 BDT" [ref=e24] [cursor=pointer]:
            - text: All
            - generic [ref=e25]: 0 BDT
          - button "Debtors 0 BDT" [ref=e26] [cursor=pointer]:
            - text: Debtors
            - generic [ref=e27]: 0 BDT
          - button "Creditors 0 BDT" [ref=e28] [cursor=pointer]:
            - text: Creditors
            - generic [ref=e29]: 0 BDT
          - button "Internal 0 BDT" [ref=e30] [cursor=pointer]:
            - text: Internal
            - generic [ref=e31]: 0 BDT
        - generic [ref=e33]:
          - generic [ref=e34]: 💵
          - paragraph [ref=e35]: No active loans
        - generic [ref=e37]:
          - generic [ref=e38]:
            - heading "Add Counterparty" [level=3] [ref=e39]
            - button "×" [ref=e40] [cursor=pointer]
          - generic [ref=e41]:
            - generic [ref=e42]:
              - button "Debtor" [ref=e43] [cursor=pointer]
              - button "Creditor" [ref=e44] [cursor=pointer]
            - generic [ref=e45]:
              - generic [ref=e46]: Name
              - textbox "Full name" [ref=e47]
            - button "Create Debtor" [disabled] [ref=e48]
    - navigation [ref=e49]:
      - link "🏠 Home" [ref=e50] [cursor=pointer]:
        - /url: /
        - generic [ref=e51]: 🏠
        - text: Home
      - link "👥 Members" [ref=e52] [cursor=pointer]:
        - /url: /member
        - generic [ref=e53]: 👥
        - text: Members
      - link "📋 Loans" [ref=e54] [cursor=pointer]:
        - /url: /loans
        - generic [ref=e55]: 📋
        - text: Loans
      - link "🗑️ Recycle" [ref=e56] [cursor=pointer]:
        - /url: /recycle
        - generic [ref=e57]: 🗑️
        - text: Recycle
  - button "v3.0.2 Output Detail Standard React Components Hide Until Restart Marker Color Clear on copy/send Block page interactions Manage MCP & Webhooks Manage MCP & Webhooks MCP Connection MCP connection allows agents to receive and act on annotations. Learn more Webhooks Auto-Send The webhook URL will receive live annotation changes and annotation data." [ref=e59] [cursor=pointer]:
    - img [ref=e61]
    - generic:
      - generic:
        - button:
          - img
      - generic:
        - button:
          - img
      - generic:
        - button [disabled]:
          - img
      - generic:
        - button [disabled]:
          - img
      - generic:
        - button [disabled]:
          - img
      - generic:
        - button [disabled]:
          - img
      - generic:
        - button:
          - img
      - generic:
        - button:
          - img
    - generic:
      - generic:
        - generic:
          - generic:
            - link:
              - /url: https://agentation.com
              - img
            - paragraph: v3.0.2
            - button "Switch to light mode":
              - generic:
                - generic:
                  - img
          - generic:
            - generic:
              - generic:
                - text: Output Detail
                - generic:
                  - img
              - button "Standard":
                - generic: Standard
            - generic:
              - generic:
                - text: React Components
                - generic:
                  - img
              - generic:
                - checkbox [checked]
            - generic:
              - generic:
                - text: Hide Until Restart
                - generic:
                  - img
              - generic:
                - checkbox
          - generic:
            - generic: Marker Color
            - generic:
              - button "Indigo"
              - button "Blue"
              - button "Cyan"
              - button "Green"
              - button "Yellow"
              - button "Orange"
              - button "Red"
          - generic:
            - generic:
              - generic:
                - checkbox "Clear on copy/send"
                - img
              - generic: Clear on copy/send
              - generic:
                - img
            - generic:
              - generic:
                - checkbox "Block page interactions" [checked]
                - img
              - generic: Block page interactions
          - button "Manage MCP & Webhooks":
            - generic: Manage MCP & Webhooks
            - generic:
              - img
        - generic:
          - button "Manage MCP & Webhooks":
            - img
            - generic: Manage MCP & Webhooks
          - generic:
            - generic:
              - generic:
                - text: MCP Connection
                - generic:
                  - img
            - paragraph:
              - text: MCP connection allows agents to receive and act on annotations.
              - link "Learn more":
                - /url: https://agentation.dev/mcp
          - generic:
            - generic:
              - generic:
                - text: Webhooks
                - generic:
                  - img
              - generic:
                - generic: Auto-Send
                - generic:
                  - checkbox "Auto-Send" [checked] [disabled]
            - paragraph: The webhook URL will receive live annotation changes and annotation data.
            - textbox "Webhook URL"
```

# Test source

```ts
  181 |       if (!(await addBtn.isVisible())) continue;
  182 |       await addBtn.click();
  183 |       await page.waitForTimeout(800);
  184 |       await page.locator('input').first().fill(acct.name);
  185 |       const select = page.locator('select').first();
  186 |       if (await select.isVisible()) await select.selectOption(acct.type);
  187 |       const allInputs = await page.locator('input').all();
  188 |       for (const inp of allInputs) {
  189 |         const ph = await inp.getAttribute('placeholder');
  190 |         if (ph && (ph.toLowerCase().includes('balance') || ph.toLowerCase().includes('amount') || ph === '0')) {
  191 |           await inp.fill(acct.balance);
  192 |           break;
  193 |         }
  194 |       }
  195 |       const saveBtn = page.locator('button').filter({ hasText: 'Add Account' }).first();
  196 |       if (await saveBtn.isVisible()) { await saveBtn.click(); await page.waitForTimeout(800); console.log(`  Created account: ${acct.name}`); }
  197 |     }
  198 |   });
  199 | 
  200 |   test('TS-00E — Add Accounts to Test Borrower', async ({ page }) => {
  201 |     await waitForApp(page, '/member/4', 5000);
  202 |     await page.waitForTimeout(1500);
  203 |     const body = await page.textContent('body') ?? '';
  204 |     const accounts = [
  205 |       { name: 'TB Cash', type: 'Cash', balance: '5000' },
  206 |       { name: 'TB Bank', type: 'Bank', balance: '20000' },
  207 |     ];
  208 |     for (const acct of accounts) {
  209 |       if (body.includes(acct.name)) continue;
  210 |       const addBtn = page.locator('button').filter({ hasText: /Add/i }).first();
  211 |       if (!(await addBtn.isVisible())) continue;
  212 |       await addBtn.click();
  213 |       await page.waitForTimeout(800);
  214 |       await page.locator('input').first().fill(acct.name);
  215 |       const select = page.locator('select').first();
  216 |       if (await select.isVisible()) await select.selectOption(acct.type);
  217 |       const allInputs = await page.locator('input').all();
  218 |       for (const inp of allInputs) {
  219 |         const ph = await inp.getAttribute('placeholder');
  220 |         if (ph && (ph.toLowerCase().includes('balance') || ph.toLowerCase().includes('amount') || ph === '0')) {
  221 |           await inp.fill(acct.balance);
  222 |           break;
  223 |         }
  224 |       }
  225 |       const saveBtn = page.locator('button').filter({ hasText: 'Add Account' }).first();
  226 |       if (await saveBtn.isVisible()) { await saveBtn.click(); await page.waitForTimeout(800); console.log(`  Created account: ${acct.name}`); }
  227 |     }
  228 |   });
  229 | 
  230 |   test('TS-00F — Create External Debtors/Creditors', async ({ page }) => {
  231 |     await waitForApp(page, '/loans', 5000);
  232 |     await page.waitForTimeout(2000);
  233 |     const body = await page.textContent('body') ?? '';
  234 |     console.log(`  Loans page body preview: ${body.substring(0, 150)}`);
  235 | 
  236 |     // Check if External Debtor A exists
  237 |     if (!body.includes('External Debtor A')) {
  238 |       const addBtn = page.locator('button').filter({ hasText: '+ Add' }).first();
  239 |       if (await addBtn.isVisible()) {
  240 |         await addBtn.click();
  241 |         await page.waitForTimeout(800);
  242 | 
  243 |         // Fill name in AddCounterpartyForm
  244 |         const nameInput = page.locator('input').first();
  245 |         if (await nameInput.isVisible()) {
  246 |           await nameInput.fill('External Debtor A');
  247 |           // Submit - button text is "Create Debtor"
  248 |           const submitBtn = page.locator('button').filter({ hasText: 'Create Debtor' }).first();
  249 |           if (await submitBtn.isVisible()) {
  250 |             await submitBtn.click();
  251 |             await page.waitForTimeout(1000);
  252 |             console.log('  Created External Debtor A');
  253 |           } else {
  254 |             // Try alternative button text
  255 |             const altBtn = page.locator('button').filter({ hasText: /Create/i }).first();
  256 |             if (await altBtn.isVisible()) {
  257 |               await altBtn.click();
  258 |               await page.waitForTimeout(1000);
  259 |               console.log('  Created External Debtor A (alt button)');
  260 |             }
  261 |           }
  262 |         }
  263 |       } else {
  264 |         console.log('  No + Add button found on loans page');
  265 |       }
  266 |     } else {
  267 |       console.log('  External Debtor A already exists');
  268 |     }
  269 | 
  270 |     // Check if External Creditor B exists
  271 |     const body2 = await page.textContent('body') ?? '';
  272 |     if (!body2.includes('External Creditor B')) {
  273 |       const addBtn = page.locator('button').filter({ hasText: '+ Add' }).first();
  274 |       if (await addBtn.isVisible()) {
  275 |         await addBtn.click();
  276 |         await page.waitForTimeout(800);
  277 | 
  278 |         // Toggle to Creditor
  279 |         const creditorToggle = page.locator('button').filter({ hasText: 'Creditor' }).first();
  280 |         if (await creditorToggle.isVisible()) {
> 281 |           await creditorToggle.click();
      |                                ^ Error: locator.click: Test timeout of 60000ms exceeded.
  282 |           await page.waitForTimeout(300);
  283 |         }
  284 | 
  285 |         const nameInput = page.locator('input').first();
  286 |         if (await nameInput.isVisible()) {
  287 |           await nameInput.fill('External Creditor B');
  288 |           const submitBtn = page.locator('button').filter({ hasText: 'Create Creditor' }).first();
  289 |           if (await submitBtn.isVisible()) {
  290 |             await submitBtn.click();
  291 |             await page.waitForTimeout(1000);
  292 |             console.log('  Created External Creditor B');
  293 |           } else {
  294 |             const altBtn = page.locator('button').filter({ hasText: /Create/i }).first();
  295 |             if (await altBtn.isVisible()) { await altBtn.click(); await page.waitForTimeout(1000); }
  296 |           }
  297 |         }
  298 |       }
  299 |     } else {
  300 |       console.log('  External Creditor B already exists');
  301 |     }
  302 |   });
  303 | 
  304 |   test('TS-00G+ — Verify dashboard data', async ({ page }) => {
  305 |     await waitForApp(page, '/', 5000);
  306 |     await page.waitForTimeout(2000);
  307 |     const body = await page.textContent('body') ?? '';
  308 |     // Check that dashboard has content
  309 |     const hasMetrics = body.includes('Total Assets');
  310 |     console.log(`  Dashboard metrics visible: ${hasMetrics}`);
  311 |     console.log(`  Dashboard body starts: ${body.substring(0, 300)}`);
  312 |   });
  313 | });
  314 | 
  315 | // ─── TS-01: LAUNCHER SCREEN ──────────────────────────────────────────────────
  316 | 
  317 | test.describe('TS-01: Launcher Screen', () => {
  318 |   test('TS-01.1-1.12 — Full Launcher flow', async ({ page }) => {
  319 |     await waitForApp(page, '/launcher', 5000);
  320 |     await page.waitForTimeout(2000);
  321 | 
  322 |     // 1.1: Launcher loads at /launcher
  323 |     expect(page.url()).toContain('/launcher');
  324 |     const body = await page.textContent('body') ?? '';
  325 |     expect(body).toContain('MoneyFlows');
  326 |     console.log('  Launcher loaded, URL includes /launcher');
  327 | 
  328 |     // 1.2: Check for clickable link cards
  329 |     const links = page.locator('a');
  330 |     const linkCount = await links.count();
  331 |     console.log(`  Found ${linkCount} links on launcher`);
  332 |     expect(linkCount).toBeGreaterThanOrEqual(3);
  333 | 
  334 |     // 1.3: Click Main Dashboard link (href="/")
  335 |     const dashLink = page.locator('a[href="/"]').first();
  336 |     if (await dashLink.isVisible()) {
  337 |       await dashLink.click();
  338 |       await page.waitForTimeout(1500);
  339 |       console.log(`  After clicking Main Dashboard, URL: ${page.url()}`);
  340 |     }
  341 | 
  342 |     // Navigate back
  343 |     await page.goto(`${BASE}/launcher`);
  344 |     await page.waitForTimeout(1500);
  345 | 
  346 |     // 1.5: Click Member Profile link
  347 |     const memberLink = page.locator('a[href="/member/1"]').first();
  348 |     if (await memberLink.isVisible()) {
  349 |       await memberLink.click();
  350 |       await page.waitForTimeout(1500);
  351 |       console.log(`  After clicking Member Profile, URL: ${page.url()}`);
  352 |     }
  353 | 
  354 |     // Navigate back
  355 |     await page.goto(`${BASE}/launcher`);
  356 |     await page.waitForTimeout(1500);
  357 | 
  358 |     // 1.7: Click Loans link
  359 |     const loansLink = page.locator('a[href="/loans"]').first();
  360 |     if (await loansLink.isVisible()) {
  361 |       await loansLink.click();
  362 |       await page.waitForTimeout(1500);
  363 |       console.log(`  After clicking Loans, URL: ${page.url()}`);
  364 |     }
  365 | 
  366 |     // Navigate back
  367 |     await page.goto(`${BASE}/launcher`);
  368 |     await page.waitForTimeout(1500);
  369 | 
  370 |     // 1.9: Click Recycle link
  371 |     const recycleLink = page.locator('a[href="/recycle"]').first();
  372 |     if (await recycleLink.isVisible()) {
  373 |       await recycleLink.click();
  374 |       await page.waitForTimeout(1500);
  375 |       console.log(`  After clicking Recycle, URL: ${page.url()}`);
  376 |     }
  377 | 
  378 |     // 1.12: Footer
  379 |     await page.goto(`${BASE}/launcher`);
  380 |     await page.waitForTimeout(1500);
  381 |     const body2 = await page.textContent('body') ?? '';
```
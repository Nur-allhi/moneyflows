# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-tests.spec.ts >> TS-02: Dashboard >> TS-02.1-2.16 — Dashboard full flow
- Location: e2e-tests.spec.ts:390:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'Settings' })
    - locator resolved to <button class="_qaBtn_1efl9_18">Settings</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_wizard_1x168_9">…</div> from <div class="_wrapper_48yg4_1 ">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_wizard_1x168_9">…</div> from <div class="_wrapper_48yg4_1 ">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    104 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div class="_wizard_1x168_9">…</div> from <div class="_wrapper_48yg4_1 ">…</div> subtree intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - banner [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: MoneyFlows
          - generic [ref=e8]: Dashboard
        - generic [ref=e9]:
          - generic [ref=e10]: Thu, 2 Jul 2026
          - button "New transaction" [ref=e11] [cursor=pointer]:
            - img [ref=e12]
          - button "Notifications" [ref=e14] [cursor=pointer]: 🔔
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: Total Assets
            - generic [ref=e21]: 0 BDT
          - generic [ref=e22]:
            - generic [ref=e23]: Cash in Hand
            - generic [ref=e24]: 0 BDT
          - generic [ref=e25]:
            - generic [ref=e26]: Active Loans
            - generic [ref=e27]: 0 BDT
          - generic [ref=e28]:
            - generic [ref=e29]: Family Net Worth
            - generic [ref=e30]: 0 BDT
        - generic [ref=e31]:
          - button "+ New Transaction" [ref=e32] [cursor=pointer]
          - button "Transfer" [ref=e33] [cursor=pointer]
          - button "Settings" [ref=e34] [cursor=pointer]
          - button "Import DB" [ref=e35] [cursor=pointer]
        - generic [ref=e36]:
          - generic [ref=e37]:
            - generic [ref=e38]:
              - heading "Combined Balances" [level=2] [ref=e39]
              - generic [ref=e40] [cursor=pointer]: View all →
            - generic [ref=e42]:
              - generic [ref=e43]: 💰
              - paragraph [ref=e44]: No accounts connected yet
          - generic [ref=e45]:
            - generic [ref=e46]:
              - heading "Recent Transactions" [level=2] [ref=e47]
              - generic [ref=e48] [cursor=pointer]: View all →
            - generic [ref=e50]:
              - generic [ref=e51]: 📄
              - paragraph [ref=e52]: No recent transactions
    - navigation [ref=e53]:
      - link "🏠 Home" [ref=e54] [cursor=pointer]:
        - /url: /
        - generic [ref=e55]: 🏠
        - text: Home
      - link "👥 Members" [ref=e56] [cursor=pointer]:
        - /url: /member
        - generic [ref=e57]: 👥
        - text: Members
      - link "📋 Loans" [ref=e58] [cursor=pointer]:
        - /url: /loans
        - generic [ref=e59]: 📋
        - text: Loans
      - link "🗑️ Recycle" [ref=e60] [cursor=pointer]:
        - /url: /recycle
        - generic [ref=e61]: 🗑️
        - text: Recycle
    - generic [ref=e63]:
      - generic [ref=e65]:
        - heading "New Transaction" [level=2] [ref=e66]
        - button "Close" [ref=e67] [cursor=pointer]: ×
      - generic [ref=e68]:
        - generic [ref=e69]: 💰
        - paragraph [ref=e70]: No accounts available
        - button "Go Back" [ref=e71] [cursor=pointer]
  - button "v3.0.2 Output Detail Standard React Components Hide Until Restart Marker Color Clear on copy/send Block page interactions Manage MCP & Webhooks Manage MCP & Webhooks MCP Connection MCP connection allows agents to receive and act on annotations. Learn more Webhooks Auto-Send The webhook URL will receive live annotation changes and annotation data." [ref=e73] [cursor=pointer]:
    - img [ref=e75]
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
  382 |     expect(body2).toContain('MoneyFlows');
  383 |     console.log('  Footer/body contains MoneyFlows branding');
  384 |   });
  385 | });
  386 | 
  387 | // ─── TS-02: DASHBOARD ────────────────────────────────────────────────────────
  388 | 
  389 | test.describe('TS-02: Dashboard', () => {
  390 |   test('TS-02.1-2.16 — Dashboard full flow', async ({ page }) => {
  391 |     await waitForApp(page, '/', 5000);
  392 |     await page.waitForTimeout(2000);
  393 |     const body = await page.textContent('body') ?? '';
  394 | 
  395 |     // 2.1: Metric cards
  396 |     expect(body).toContain('Total Assets');
  397 |     expect(body).toContain('Cash in Hand');
  398 |     expect(body).toContain('Active Loans');
  399 |     expect(body).toContain('Net Worth');
  400 |     console.log('  All 4 metric cards visible');
  401 | 
  402 |     // 2.2: Quick action buttons
  403 |     const newTxBtn = page.locator('button').filter({ hasText: '+ New Transaction' });
  404 |     const settingsBtn = page.locator('button').filter({ hasText: 'Settings' });
  405 |     const transferBtn = page.locator('button').filter({ hasText: /^Transfer$/ });
  406 |     const importBtn = page.locator('button').filter({ hasText: 'Import DB' });
  407 |     console.log(`  + New Transaction: ${await newTxBtn.isVisible()}`);
  408 |     console.log(`  Transfer: ${await transferBtn.isVisible()}`);
  409 |     console.log(`  Settings: ${await settingsBtn.isVisible()}`);
  410 |     console.log(`  Import DB: ${await importBtn.isVisible()}`);
  411 | 
  412 |     // 2.3: Click New Transaction
  413 |     if (await newTxBtn.isVisible()) {
  414 |       await newTxBtn.click();
  415 |       await page.waitForTimeout(1000);
  416 |       const dialog = page.locator('[role="dialog"]');
  417 |       if (await dialog.isVisible()) {
  418 |         console.log('  Transaction modal opened');
  419 |         // 2.4: Close
  420 |         const closeBtn = dialog.locator('button[aria-label="Close"]');
  421 |         if (await closeBtn.isVisible()) {
  422 |           await closeBtn.click();
  423 |           await page.waitForTimeout(500);
  424 |           console.log('  Modal closed via ×');
  425 |         }
  426 |       }
  427 |     }
  428 | 
  429 |     // 2.5: Settings modal
  430 |     if (await settingsBtn.isVisible()) {
> 431 |       await settingsBtn.click();
      |                         ^ Error: locator.click: Test timeout of 60000ms exceeded.
  432 |       await page.waitForTimeout(1000);
  433 |       const dialog = page.locator('[role="dialog"]');
  434 |       if (await dialog.isVisible()) {
  435 |         console.log('  Settings modal opened');
  436 |         const closeBtn = dialog.locator('button[aria-label="Close"]');
  437 |         if (await closeBtn.isVisible()) {
  438 |           await closeBtn.click();
  439 |           await page.waitForTimeout(500);
  440 |         }
  441 |       }
  442 |     }
  443 | 
  444 |     // 2.10: Transfer button
  445 |     if (await transferBtn.isVisible()) {
  446 |       await transferBtn.click();
  447 |       await page.waitForTimeout(1000);
  448 |       console.log('  Transfer button clicked, modal should open');
  449 |       const closeBtn = page.locator('[role="dialog"] button[aria-label="Close"]');
  450 |       if (await closeBtn.isVisible()) {
  451 |         await closeBtn.click();
  452 |         await page.waitForTimeout(500);
  453 |       }
  454 |     }
  455 | 
  456 |     // 2.12-2.13: Sections
  457 |     expect(body).toContain('Combined');
  458 |     expect(body).toContain('Recent');
  459 |     console.log('  Combined Balances and Recent Transactions sections visible');
  460 |   });
  461 | });
  462 | 
  463 | // ─── TS-03: MEMBER LIST ──────────────────────────────────────────────────────
  464 | 
  465 | test.describe('TS-03: Member List', () => {
  466 |   test('TS-03.1-3.15 — Member list flow', async ({ page }) => {
  467 |     await waitForApp(page, '/member', 5000);
  468 |     await page.waitForTimeout(2000);
  469 |     const body = await page.textContent('body') ?? '';
  470 |     expect(body).toContain('Family');
  471 |     expect(body).toContain('Efty');
  472 |     console.log('  Member list loaded with Family header and Efty');
  473 | 
  474 |     // 3.2: Click Efty card (button that navigates to /member/1)
  475 |     const eftyCard = page.locator('button').filter({ hasText: 'Efty' }).first();
  476 |     if (await eftyCard.isVisible()) {
  477 |       await eftyCard.click();
  478 |       await page.waitForTimeout(1500);
  479 |       console.log(`  After clicking Efty, URL: ${page.url()}`);
  480 |     }
  481 | 
  482 |     // 3.5: Back to member list
  483 |     await page.goto(`${BASE}/member`);
  484 |     await page.waitForTimeout(1500);
  485 | 
  486 |     // 3.4: Click Azam
  487 |     const azamCard = page.locator('button').filter({ hasText: 'Azam' }).first();
  488 |     if (await azamCard.isVisible()) {
  489 |       await azamCard.click();
  490 |       await page.waitForTimeout(1500);
  491 |       console.log(`  After clicking Azam, URL: ${page.url()}`);
  492 |     }
  493 | 
  494 |     // Back
  495 |     await page.goto(`${BASE}/member`);
  496 |     await page.waitForTimeout(1500);
  497 | 
  498 |     // 3.6: Click Nahar
  499 |     const naharCard = page.locator('button').filter({ hasText: 'Nahar' }).first();
  500 |     if (await naharCard.isVisible()) {
  501 |       await naharCard.click();
  502 |       await page.waitForTimeout(1500);
  503 |       console.log(`  After clicking Nahar, URL: ${page.url()}`);
  504 |     }
  505 | 
  506 |     // Back
  507 |     await page.goto(`${BASE}/member`);
  508 |     await page.waitForTimeout(1500);
  509 | 
  510 |     // 3.8-3.12: Create a new member
  511 |     const newMemberBtn = page.locator('button').filter({ hasText: /New Member/i }).first();
  512 |     if (await newMemberBtn.isVisible()) {
  513 |       await newMemberBtn.click();
  514 |       await page.waitForTimeout(800);
  515 |       const dialog = page.locator('[role="dialog"]');
  516 |       if (await dialog.isVisible()) {
  517 |         console.log('  New Member modal opened');
  518 |         // Fill name
  519 |         await page.locator('input').first().fill('Test User');
  520 |         const inputs = await page.locator('input').all();
  521 |         if (inputs.length > 1) await inputs[1].fill('TU');
  522 |         // Click Add Member
  523 |         const addBtn = page.locator('button').filter({ hasText: 'Add Member' });
  524 |         if (await addBtn.isVisible()) {
  525 |           await addBtn.click();
  526 |           await page.waitForTimeout(1000);
  527 |           console.log('  Test User created');
  528 |         }
  529 |       }
  530 |     }
  531 |   });
```
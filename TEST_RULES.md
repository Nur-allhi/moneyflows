# MoneyFlows — Playwright E2E Test Rules

## Setup

```bash
cd C:\Dev_Projects\money_flows_v0.4
npx playwright install chromium
npm run dev
```

Playwright connects to `http://localhost:5173`.

**IMPORTANT:** Before every test run, open DevTools Console (`F12`). If any step fails, capture the full error and **append it to `bug_report.json`** (format below). Do NOT stop — log the issue and continue.

---

## Bug Report Format

Every time a step fails or a visual defect is spotted, append to `bug_report.json`:

```json
{
  "id": "BUG-001",
  "timestamp": "2026-07-02T12:00:00.000Z",
  "test": "TS-01.1 — Navigate to /launcher",
  "step": "Click 'Main Dashboard' card",
  "expected": "Navigates to / route, Dashboard loads with 4 metric cards",
  "actual": "<description of what happened>",
  "screenshot": "bug-001.png",
  "console": "<relevant console errors>",
  "status": "open"
}
```

Capture a screenshot and save it in the project root as `bug-XXX.png` after each failure.

---

## Test Suite

Every test MUST be run in sequence. Each step must be verified visually AND by checking DOM/URL state.

---

### TS-00: DATA SETUP — Seed the App

**Purpose:** Create the initial data state needed for all subsequent tests. Run this FIRST in a fresh session. If any step fails, log the bug but continue — the test data is foundational.

**Precondition:** App running at `http://localhost:5173`. Navigate to `/member`.

| # | Step | Expected | Check |
|---|------|----------|-------|
| **TS-00A — Ensure Members Exist** | | | |
| 00.1 | Navigate to `/member` | Member list loads | Verify existing members: Efty, Azam, Nahar should already be seeded. If not, create them via "+ New Member". |
| 00.2 | If fewer than 3 members exist, create them: | | |
| 00.3 | Click "+ New Member", Name="Efty", Short Name="EF", click "Add Member" | Member created | Efty card appears in list. |
| 00.4 | Click "+ New Member", Name="Azam", Short Name="AZ", click "Add Member" | Member created | Azam card appears. |
| 00.5 | Click "+ New Member", Name="Nahar", Short Name="NA", click "Add Member" | Member created | Nahar card appears. |
| 00.6 | Click "+ New Member", Name="Test Borrower", Short Name="TB", click "Add Member" | Member created | Test Borrower card appears. |
| **TS-00B — Add Accounts to Efty (member 1)** | | | |
| 00.7 | Navigate to `/member/1` (Efty's profile) | Profile loads | |
| 00.8 | Click "+ Add" in Accounts section | Add Account modal opens | |
| 00.9 | Name="Efty Cash", Type="Cash", Balance="50000", click "Add Account" | Account created | Appears in carousel with gold chip (cash type). |
| 00.10 | Click "+ Add", Name="Efty bKash", Type="Mobile Wallet", Balance="25000", click "Add Account" | Account created | |
| 00.11 | Click "+ Add", Name="Efty Bank", Type="Bank", Balance="100000", click "Add Account" | Account created | |
| 00.12 | Click "+ Add", Name="Efty Business", Type="Business", Balance="75000", click "Add Account" | Account created | |
| 00.13 | Click "+ Add", Name="Efty Savings", Type="Savings", Balance="30000", click "Add Account" | Account created | |
| **TS-00C — Add Accounts to Azam (member 2)** | | | |
| 00.14 | Navigate to `/member/2` (Azam's profile) | | |
| 00.15 | Click "+ Add", Name="Azam Cash", Type="Cash", Balance="20000", click "Add Account" | Account created | |
| 00.16 | Click "+ Add", Name="Azam Bank", Type="Bank", Balance="80000", click "Add Account" | Account created | |
| 00.17 | Click "+ Add", Name="Azam bKash", Type="Mobile Wallet", Balance="15000", click "Add Account" | Account created | |
| **TS-00D — Add Accounts to Nahar (member 3)** | | | |
| 00.18 | Navigate to `/member/3` (Nahar's profile) | | |
| 00.19 | Click "+ Add", Name="Nahar Bank", Type="Bank", Balance="60000", click "Add Account" | Account created | |
| 00.20 | Click "+ Add", Name="Nahar Cash", Type="Cash", Balance="10000", click "Add Account" | Account created | |
| **TS-00E — Add Accounts to Test Borrower (member 4)** | | | |
| 00.21 | Navigate to `/member/4` (Test Borrower's profile) | | |
| 00.22 | Click "+ Add", Name="TB Cash", Type="Cash", Balance="5000", click "Add Account" | Account created | |
| 00.23 | Click "+ Add", Name="TB Bank", Type="Bank", Balance="20000", click "Add Account" | Account created | |
| **TS-00F — Create External Debtors/Creditors** | | | |
| 00.24 | Navigate to `/loans` | Loans screen loads | |
| 00.25 | Click "+ Add" button | AddCounterpartyForm opens | |
| 00.26 | Ensure "Debtor" toggle active, Name="External Debtor A", click submit | Debtor created | Appears in debtor list. |
| 00.27 | Click "+ Add", toggle to "Creditor", Name="External Creditor B", click submit | Creditor created | Appears in creditor list. |
| **TS-00G — Issue Internal Loans (member-to-member)** | | | |
| 00.28 | From Dashboard `/`, click "+ New Transaction" | Modal opens | |
| 00.29 | Click "Loan" tab, click "Internal" toggle | Internal mode | Source (Lender) + Destination (Borrower) shown. |
| 00.30 | Pick source = Efty's Bank (lender), destination = Azam's Bank (borrower), amount=30000, desc="Internal loan: Efty→Azam" | Fields filled | |
| 00.31 | Click "Issue Internal Loan" | Loan created | Modal closes. |
| 00.32 | Open modal → Loan → Internal. Source = Efty Cash, Destination = Nahar Bank, amount=15000, desc="Internal loan: Efty→Nahar" | Loan created | |
| 00.33 | Open modal → Loan → Internal. Source = Azam Bank, Destination = Test Borrower's Bank, amount=10000, desc="Internal loan: Azam→TB" | Loan created | |
| **TS-00H — Issue External Loans** | | | |
| 00.34 | Open modal → Loan → External → "Give" | Give mode | Source + Debtor counterparty. |
| 00.35 | Pick source = Efty bKash, debtor = External Debtor A, amount=20000, desc="Loan to External Debtor A" | | |
| 00.36 | Click "Issue Loan" | External loan created | |
| 00.37 | Open modal → Loan → External → "Give". Source = Efty Bank, debtor = External Debtor A, amount=10000, desc="Second loan to Debtor A" | Another loan | Stack for External Debtor A now has 2 loans. |
| **TS-00I — Add Regular Transactions (Income & Expense)** | | | |
| 00.38 | Open modal → "Income". Source = Efty Business, amount=50000, desc="Business revenue" | | |
| 00.39 | Click "Complete Income" | Income created | |
| 00.40 | Open modal → "Income". Source = Azam Bank, amount=25000, desc="Salary deposit" | | |
| 00.41 | Click "Complete Income" | Income created | |
| 00.42 | Open modal → "Expense". Source = Efty Cash, amount=3000, desc="Groceries" | | |
| 00.43 | Click "Complete Expense" | Expense created | |
| 00.44 | Open modal → "Expense". Source = Azam bKash, amount=1500, desc="Mobile recharge" | | |
| 00.45 | Click "Complete Expense" | Expense created | |
| 00.46 | Open modal → "Expense". Source = Efty Bank, amount=10000, desc="Utility bills" | | |
| 00.47 | Click "Complete Expense" | Expense created | |
| **TS-00J — Record a Transfer between members** | | | |
| 00.48 | Open modal → "Transfer". Source = Efty Cash, Destination = Nahar Bank, amount=5000, desc="Transfer to Nahar" | | |
| 00.49 | Click "Complete Transfer" | Transfer created | Source debited 5000, destination credited 5000. |
| **TS-00K — Verify Data Setup** | | | |
| 00.50 | Navigate to `/` Dashboard | Metric cards show correct aggregates | Total Assets = sum of all account balances. Active Loans reflects outstanding. |
| 00.51 | Navigate to `/loans` | All loan stacks visible | Internal stacks (3) + External debtor (1 with 2 loans). Filter tabs work. |
| 00.52 | Navigate to `/member/1` (Efty) | Ledger shows all transactions | Income, expense, transfer, internal loan issue, external loan issue all visible. Filter tabs work. |
| 00.53 | Navigate to `/member/2` (Azam) | Ledger shows transactions | Internal loan received, income, expense visible. |
| 00.54 | Navigate to `/member/3` (Nahar) | Ledger shows transactions | Internal loan received, transfer received visible. |

---

### TS-01: LAUNCHER SCREEN (`/launcher`)

**Precondition:** App is running, navigate to `http://localhost:5173/launcher`.

| # | Step | Expected | Check |
|---|------|----------|-------|
| 1.1 | Navigate to `/launcher` | Launcher screen loads | URL is `/launcher`. Hero section visible with "MoneyFlows.app" logo + subtitle containing currency symbol. |
| 1.2 | Verify 6 glass cards | 6 cards in a 3-column grid | Cards: "Main Dashboard", "Member Profile", "Loan Receivables", "Transaction Wizard", "Recycle Bin", "brand-spec.md". Each card has icon + title. |
| 1.3 | Click "Main Dashboard" card | Navigates to `/` | URL changes to `/`. Dashboard renders with metric cards. |
| 1.4 | Navigate back to `/launcher` | Launcher re-renders | Same layout as step 1.2. |
| 1.5 | Click "Member Profile" card | Navigates to `/member/1` | URL changes to `/member/1`. Member profile for Efty loads. |
| 1.6 | Navigate back to `/launcher` | Launcher re-renders | |
| 1.7 | Click "Loan Receivables" card | Navigates to `/loans` | URL changes to `/loans`. Loans screen loads with debtor cards. |
| 1.8 | Navigate back to `/launcher` | | |
| 1.9 | Click "Recycle Bin" card | Navigates to `/recycle` | URL changes to `/recycle`. Recycle bin loads. |
| 1.10 | Navigate back to `/launcher` | | |
| 1.11 | Verify disabled cards | "Transaction Wizard" and "brand-spec.md" cards have disabled styling | Cards have `.cardDisabled` class. Cursor is `not-allowed` or similar. Click does nothing. |
| 1.12 | Footer text | Footer visible | Text: "MoneyFlows · Family Finance · {currency} · Dark Glassmorphism" |

---

### TS-02: DASHBOARD (`/`)

**Precondition:** Navigate to `http://localhost:5173/`.

| # | Step | Expected | Check |
|---|------|----------|-------|
| 2.1 | Dashboard loads | 4 metric cards visible | Cards: Total Assets, Cash in Hand, Active Loans, Family Net Worth. Each has accent color (violet, gold, purple, teal). Values animated (count up). |
| 2.2 | Quick action strip | Buttons visible | "+ New Transaction", "Transfer", "Settings", "Import DB" buttons visible. |
| 2.3 | Click "+ New Transaction" | Transaction modal opens | Bottom sheet (mobile) or centered modal (desktop >=1024px) appears with "New Transaction" header. |
| 2.4 | Close modal | Modal closes | Click close button (&times;) or overlay. Modal disappears. |
| 2.5 | Click "Settings" | Settings modal opens | Modal with 6 fields: Currency, Locale, Primary Member, Description Max Length, Numpad Max Digits, Dashboard Transaction Limit. |
| 2.6 | Change Currency to "USD" | Currency field accepts input | Type "USD" in currency field. Field auto-uppercases. |
| 2.7 | Change Locale to "en-US" | Locale field accepts input | Type "en-US" in locale field. |
| 2.8 | Click "Save" | Settings saved, modal closes | Modal closes. Reload page — settings should persist (localStorage). |
| 2.9 | Re-open Settings, change back to Currency="BDT", Locale="en-IN" | Restore defaults | Save and close. |
| 2.10 | Click "Transfer" button | Transaction modal opens with Transfer tab selected | Same modal as step 2.3 but Transfer tab active. |
| 2.11 | Close modal | | |
| 2.12 | Combined Balances section | List of accounts visible | Section header "Combined Balances". Non-counterparty accounts listed with icon + name + type + balance. |
| 2.13 | Recent Transactions section | Transaction feed visible | Section header "Recent Transactions". Up to 7 transactions shown. Each with icon + description + date + colored amount (teal=income, coral=expense, neutral=transfer). |
| 2.14 | Sidebar (desktop >=1024px) | Sidebar visible | 4 nav items: Dashboard, Members, Loans, Recycle Bin. Active item highlighted. Footer shows family name + member count. |
| 2.15 | Bottom nav (mobile <=768px) | Bottom nav visible | 4 tabs: Home, Members, Loans, Recycle. Active tab accented. |
| 2.16 | Header visible | Header shows date | Date formatted like "Thu, 2 Jul 2026". "+" button visible (opens Transaction modal). Notification bell icon visible (decorative). |

---

### TS-03: MEMBER LIST (`/member`)

**Precondition:** Navigate to `http://localhost:5173/member`.

| # | Step | Expected | Check |
|---|------|----------|-------|
| 3.1 | Member list loads | Cards for non-external members | Header "Family Members" + count. Grid of member cards (Efty, Azam, Nahar). Each card: avatar (48px) + name + "Member" tag + net balance. |
| 3.2 | Click Efty's card | Navigates to `/member/1` | URL is `/member/1`. Efty's profile loads. |
| 3.3 | Navigate back to `/member` | | |
| 3.4 | Click Azam's card | Navigates to `/member/2` | URL is `/member/2`. Azam's profile loads. |
| 3.5 | Navigate back to `/member` | | |
| 3.6 | Click Nahar's card | Navigates to `/member/3` | URL is `/member/3`. Nahar's profile loads. |
| 3.7 | Navigate back to `/member` | | |
| 3.8 | Click "+ New Member" button | Add Member modal opens | Modal titled "New Member". Fields: Name (required, autoFocus), Short Name (optional, max 4 chars). |
| 3.9 | Close modal (click Cancel or &times;) | Modal closes | |
| 3.10 | Click "+ New Member" again | Modal opens | |
| 3.11 | Type "Test User" in Name, "TU" in Short Name | Fields accept input | |
| 3.12 | Click "Add Member" | Member created, appears in list | Modal closes. New card "Test User" appears in member grid. Click it — navigates to new member ID. |
| 3.13 | Navigate back to `/member` | | |
| 3.14 | Click pencil/edit button on Test User card (or navigate to profile and click edit) | Edit Member modal opens | Modal with Name + Short Name pre-filled. |
| 3.15 | Edit Name to "Test Updated", click "Save" | Name updates | Go back to member list — name is "Test Updated". |

---

### TS-04: MEMBER PROFILE (`/member/:id`)

**Precondition:** Navigate to Efty's profile at `/member/1`.

| # | Step | Expected | Check |
|---|------|----------|-------|
| 4.0 | Desktop >=1024px — expand this test for desktop layout | | |
| 4.1 | Profile loads | Profile card visible | Avatar (72px) + name "Efty" + tag "Family" + net balance (animated). |
| 4.2 | Accounts section | Account cards in carousel | Section label "Accounts" with "+ Add" button. Horizontal scroll carousel with snap scrolling. Each card: gradient background + name + type + balance. Gold chip for cash accounts. |
| 4.3 | Click an account card | Card highlights, ledger filters | Card gets selected state (highlighted). Ledger updates to show only that account's transactions. |
| 4.4 | Click "All account" button | Filter cleared | Ledger shows all member accounts again. |
| 4.5 | Click "+ Add" button | Add Account modal opens | Modal titled "Add Account". Fields: Account Name (autoFocus), Account Type (select: Bank/Mobile Wallet/Cash/Savings/Business), Initial Balance (optional). |
| 4.6 | Fill: Name="Test Account", Type="Savings", Balance="5000" | Form filled | |
| 4.7 | Click "Add Account" | Account created | Modal closes. New account card appears in carousel. Balance 5000. |
| 4.8 | Scroll ledger down | More rows load | Virtual scrolling: rows load in batches (intersection observer). |
| 4.9 | Filter tabs: click "Income" | Ledger filtered | Only income-type transactions shown. Running balance recalculates. |
| 4.10 | Click "Expense" | Ledger filtered | Only expense-type transactions shown. |
| 4.11 | Click "Transfer" | Ledger filtered | Only transfer-type transactions shown. |
| 4.12 | Click "Loan" | Ledger filtered | Only loan-type transactions (loan_issue, loan_repayment, etc.) shown. |
| 4.13 | Click "All" | Full ledger restored | All transaction types shown again. |
| 4.14 | Click "Download PDF" button | PDF download starts | A PDF file is generated with member name, account filter info, transaction table, watermark. |
| 4.15 | Click any transaction row | Transaction Detail modal opens | Modal showing: type badge (colored), amount (large), description, date/time, from/to accounts (with member names), debtor/borrower info (if applicable), loan ref (if applicable). |
| 4.16 | Click "Edit" button in detail modal | Detail closes, Edit modal opens | Edit modal with Amount + Description + Date fields pre-filled. |
| 4.17 | Cancel edit (or click Save without changes) | Edit modal closes | |
| 4.18 | Click any transaction row again, click "Delete" | Delete Confirm modal opens | Warning text about soft-delete + 30 day auto-purge. "Delete" button. |
| 4.19 | Click "Delete" | Transaction soft-deleted | Modal closes. Row disappears from ledger. Transaction appears in Recycle Bin. |

**Repeat TS-04 for desktop layout (viewport >=1024px):**
| 4.20 | Set viewport to 1366x768 | Desktop layout | Sidebar visible. Profile hero section with edit (pencil) button. Quick action buttons visible: "+ Transaction", "+ Account". Stats row: Net Balance, Total Income, Total Expenses. |
| 4.21 | Click edit (pencil) button | Edit Member modal opens | Name + Short Name pre-filled. |
| 4.22 | Linked Accounts dropdown | Collapsible section | Click to expand — 3-column grid of account cards. Click to collapse. |
| 4.23 | Split content view | Ledger (65%) | Ledger visible on left. All filter tabs work same as mobile. |

---

### TS-05: LOANS SCREEN — LIST VIEW (`/loans`)

**Precondition:** Navigate to `http://localhost:5173/loans`.

| # | Step | Expected | Check |
|---|------|----------|-------|
| 5.1 | Loans list loads | Header + debtor cards | Title "Your Loans". Account count badge ("X Accounts"). "+ Add" button. |
| 5.2 | Filter strip | 4 filter buttons | "All", "Debtors", "Creditors", "Internal". Each button shows total amount for that category. Active filter highlighted. |
| 5.3 | Verify default filter is "All" | All stacks shown | All debtor + creditor + internal stacks visible as cards in grid. |
| 5.4 | Click "Debtors" filter | Only debtors shown | Cards show badge "Debtor". Internal/creditor stacks hidden. |
| 5.5 | Click "Creditors" filter | Only creditors shown | Cards show badge "Creditor". Debtor/internal stacks hidden. |
| 5.6 | Click "Internal" filter | Only internal loans shown | Cards show badge "Internal". External stacks hidden. |
| 5.7 | Click "All" filter | All stacks shown again | |
| 5.8 | Verify debtor card contents | Each card has: | Initial letter avatar with gradient (business or counterparty color). Name. Badge ("Debtor"/"Creditor"/"Internal"). Total outstanding amount (large, mono font). Loan count + "% repaid". |
| 5.9 | Click a debtor card | Navigates to `/loans/:debtorId` | Loan detail view loads. |
| 5.10 | Click back "← All Loans" | Returns to list | |
| 5.11 | Click "+ Add" button | AddCounterpartyForm overlay opens | Title "Add Counterparty". Toggle: Debtor | Creditor (pill toggle). Name field. |
| 5.12 | Type "Test Debtor", ensure "Debtor" toggle active, click submit | Counterparty created | Overlay closes. New debtor card appears in grid. |
| 5.13 | Click "+ Add" again | | |
| 5.14 | Toggle to "Creditor", type "Test Creditor", submit | Creditor created | New creditor card appears. |
| 5.15 | Click "All" filter | All stacks shown | Test Debtor and Test Creditor visible. |

---

### TS-06: LOANS SCREEN — DETAIL VIEW (`/loans/:debtorId`)

**Precondition:** Navigate to a debtor's detail view (click any debtor card from `/loans`).

| # | Step | Expected | Check |
|---|------|----------|-------|
| 6.1 | Detail view loads | Summary card visible | Type label ("Debtor"/"Creditor"/"Internal"). Name + badge. "X active loan(s)". Total Outstanding (large, mono). |
| 6.2 | ProgressBar | Animated progress bar | "Repayment Progress" + sublabel "X% repaid · {amount} remaining". Bar fills on scroll (IntersectionObserver). |
| 6.3 | Action buttons | Delete + Repay/Pay Back | "Delete Loan Account" button (left). If outstanding > 0: "Repay" (for debtors) or "Pay Back" (for creditors) button (right). Both below progress bar. |
| 6.4 | Click "Repay" / "Pay Back" button | Transaction modal opens with Loan tab pre-selected | Modal shows with: Loan tab active. For debtors: mode = "Repay", counterparty pre-selected. For creditors: mode = "Pay Back", counterparty pre-selected. For internal: internal mode with borrower/lender accounts pre-selected. |
| 6.5 | Verify Loan tab is pre-selected | Loan segmented tab active | Tab strip shows Loan highlighted. |
| 6.6 | Verify counterparty is pre-selected | Counterparty field shows name | The debtor/creditor name appears in the counterparty field WITHOUT needing to open the picker. |
| 6.7 | Verify mode is pre-selected | Mode strip shows correct mode | For debtors: "Repay" button active. For creditors: "Pay Back" button active. |
| 6.8 | Close modal (Cancel or &times;) | Modal closes | |
| 6.9 | Click "Delete Loan Account" button | Confirmation dialog opens | Warning: "This will permanently remove all loans and transactions associated with {name}. This action cannot be undone." Cancel + Delete buttons. |
| 6.10 | Click "Cancel" | Dialog closes | |
| 6.11 | Click "Delete Loan Account" again, click "Delete" | Loans + transactions deleted | Navigates back to `/loans`. The deleted stack no longer appears in the list. |
| 6.12 | Navigate to Recycle Bin (`/recycle`) | Deleted items visible (if soft-delete applies to loans) | Check if deleted loans appear in recycle (may be permanent delete as per UX). |

---

### TS-07: TRANSACTION WIZARD (MODAL) — FULL FLOW

**Precondition:** Open the Transaction modal from any entry point (Dashboard "+" button, Header "+", or MemberProfile "+ Transaction").

| # | Step | Expected | Check |
|---|------|----------|-------|
| 7.0 | Open Transaction modal | Modal appears | "New Transaction" header. 4 segmented tabs: Income, Expense, Transfer, Loan. Close button (&times;). |
| 7.1 | Verify default tab is Transfer | Transfer tab active | Source + Destination fields visible. Numpad (mobile) or keyboard input (desktop). |
| 7.2 | Click "Income" tab | Income form shows | Source field only (account receiving money). "Complete Income" button. |
| 7.3 | Pick a source account (click Source button, select member, select account) | Account selected | Account name appears in the Source field. |
| 7.4 | Enter amount via numpad (type "5000") | Amount displayed | Amount shows formatted with currency prefix (e.g., "BDT 5,000"). |
| 7.5 | Enter description | Description filled | Type "Test income entry" in textarea. |
| 7.6 | Click "Complete Income" button | Transaction created | Modal closes. Dashboard/Ledger updates with new transaction showing teal (income) color. |
| 7.7 | Open modal again, click "Expense" tab | Expense form shows | Source field only (account spending money). "Complete Expense" button. Balance validation: amount must not exceed source balance. |
| 7.8 | Pick source account, enter "1000", description "Test expense" | Fields filled | |
| 7.9 | Click "Complete Expense" | Transaction created | Modal closes. New expense shows coral color. |
| 7.10 | Open modal, click "Transfer" tab | Transfer form shows | Source + Destination fields. Must be different accounts. Balance validation. "Complete Transfer" button. |
| 7.11 | Pick source, pick different destination, enter "2000", desc "Test transfer" | Fields filled | |
| 7.12 | Click "Complete Transfer" | Transaction created | Modal closes. Source debited, destination credited. Both balances update. |

---

### TS-08: TRANSACTION WIZARD — LOAN TAB

**Precondition:** Open Transaction modal. Click "Loan" tab.

| # | Step | Expected | Check |
|---|------|----------|-------|
| 8.1 | Loan tab selected | Type toggle visible | Sub-toggle: External (Debtors/Creditors) | Internal (Between members). |
| 8.2 | External mode active by default | External sub-mode strip visible | 4 buttons: Give, Take, Repay, Pay Back. Default: "Give" active. |
| **Test External: Give** | | | |
| 8.3 | Click "Give" (if not already) | Give mode | Hint: "Money leaves the source account to the counterparty." Source Account + Counterparty (Debtor) picker. |
| 8.4 | Pick source account, pick debtor counterparty | Fields filled | |
| 8.5 | Enter amount "10000", description "Test loan give" | | |
| 8.6 | Click "Issue Loan" button | Loan created | `loan_issue` transaction created. Debtor's outstanding increases. Loan stack appears in `/loans`. Modal closes. |
| **Test External: Take** | | | |
| 8.7 | Open modal → Loan tab → "Take" | Take mode | Hint: "Money enters the destination account from the counterparty." Counterparty (Creditor) picker + Destination Account. |
| 8.8 | Pick creditor, pick destination, amount "5000", desc "Test loan take" | | |
| 8.9 | Click "Record Loan Received" | Loan created | `loan_received` transaction created. |
| **Test External: Repay** | | | |
| 8.10 | Open modal → Loan tab → "Repay" | Repay mode | Hint: "Repayment from counterparty to the destination account." Counterparty (Debtor) picker + Destination Account. |
| 8.11 | Pick debtor (one with outstanding > 0), pick destination, enter amount <= outstanding, desc "Test repay" | | |
| 8.12 | Click "Record Repayment" | Repayment recorded | `loan_repayment` transaction. Debtor's outstanding decreases. |
| **Test External: Pay Back** | | | |
| 8.13 | Open modal → Loan tab → "Pay Back" | Pay Back mode | Hint: "Pay back from the source account to the counterparty." Source Account + Counterparty (Creditor) picker. |
| 8.14 | Pick source, pick creditor, enter amount, desc "Test payback" | | |
| 8.15 | Click "Record Payback" | Payback recorded | `loan_paidback` transaction. |
| **Test Internal: Issue** | | | |
| 8.16 | Open modal → Loan tab → Click "Internal" | Internal mode | Source (Lender) + Destination (Borrower) pickers. Both members shown. Must be different members. |
| 8.17 | Pick source account (one member), pick destination account (different member) | Different members selected | Validation should pass. |
| 8.18 | Try picking same member for both | Validation error | Error: "Source and destination must belong to different members". |
| 8.19 | Fix: pick different members, amount "15000", desc "Test internal loan" | | |
| 8.20 | Click "Issue Internal Loan" | Internal loan created | `loan_issue` + `loan_received` transactions. Member balances update. Internal stack appears in `/loans`. |
| **Test Internal: Repay** | | | |
| 8.21 | From loan detail view of an internal stack, click "Repay" | Modal opens with internal repay pre-selected | `initialSource` (borrower), `initialDestination` (lender) pre-filled. Internal mode active. Button: "Record Repayment". |
| 8.22 | Verify source (borrower) and destination (lender) pre-selected | Both fields filled | Account names visible without opening picker. |
| 8.23 | Enter amount, description, click "Record Repayment" | Repayment recorded | `loan_repayment` transaction. Outstanding decreases. |

---

### TS-09: TRANSACTION WIZARD — FORM VALIDATION

| # | Step | Expected | Check |
|---|------|----------|-------|
| 9.1 | Open modal, any tab | Submit button disabled | Button disabled when amount = "0" or empty. |
| 9.2 | Click "Complete Income" with empty fields | Validation errors | Error messages appear: "Amount is required", "Description is required", "Select an account". |
| 9.3 | Enter amount, click submit again | Errors now: "Description is required", "Select an account" | Errors progressively resolved. |
| 9.4 | Add description, pick account, submit | Success | Transaction created. |
| 9.5 | Open modal → Expense tab, pick an account with low balance, enter amount > balance | Balance validation | Error: "Insufficient balance ({amount} available)". |
| 9.6 | Transfer tab: pick same source and destination | Validation error | "Source and destination must differ". |
| 9.7 | Description field: type >200 chars | Max length enforced | Only 200 chars accepted. |
| 9.8 | Amount: type non-numeric characters | Stripped | Only digits accepted. Max 10 digits. |

---

### TS-10: RECYCLE BIN (`/recycle`)

**Precondition:** Navigate to `http://localhost:5173/recycle`. Ensure at least one item has been soft-deleted (perform TS-04 step 4.19 first if needed).

| # | Step | Expected | Check |
|---|------|----------|-------|
| 10.1 | Recycle bin loads | Stats bar visible | 4 stats: "Deleted Items" count, "Total Amount" (coral), "Days Until Auto-Purge" ("30"), Refresh button. |
| 10.2 | Tabbed item list | 3 tabs with count badges | "All Items", "Transactions", "Accounts". Each tab shows count. Default: "All Items" active. |
| 10.3 | Deleted items listed | Sort by deletion date | Each row: icon (warning/account) + name + meta ("Transaction"/"Account") + amount + relative time ("just now", "Xh ago", "Xd ago") + Restore button (↩) + Delete permanently button (🗑). |
| 10.4 | Click "Transactions" tab | Only transactions shown | |
| 10.5 | Click "Accounts" tab | Only accounts shown | |
| 10.6 | Click "All Items" tab | All items shown | |
| 10.7 | Click Restore (↩) on a deleted transaction | Transaction restored | Row disappears from recycle. Navigate to the account — transaction is back in ledger. |
| 10.8 | Click Delete permanently (🗑) on a deleted item | Item purged | Row disappears. Item permanently deleted (cannot be restored). |
| 10.9 | Click Refresh button | Items re-fetched | List refreshes. |

---

### TS-11: SETTINGS MODAL — PERSISTENCE

| # | Step | Expected | Check |
|---|------|----------|-------|
| 11.1 | Open Settings from Dashboard | Modal opens | 6 fields with current values. |
| 11.2 | Change Currency to "EUR" | Accepts input | Auto-uppercased. |
| 11.3 | Change Locale to "de-DE" | Accepts input | |
| 11.4 | Click "Save" | Settings saved | Modal closes. |
| 11.5 | Check Dashboard amounts | Formatted in EUR | Amounts show "€" or "EUR" prefix. Comma/dot format follows de-DE locale. |
| 11.6 | Navigate to another screen, check amounts | All amounts in EUR | Consistent across all screens. |
| 11.7 | Reload the page | Settings persist | Settings loaded from localStorage. All amounts still in EUR. |
| 11.8 | Open Settings, restore defaults (BDT, en-IN) | Defaults restored | |
| 11.9 | Verify amounts back to BDT with en-IN formatting | | |

---

### TS-12: NAVIGATION & RESPONSIVE

| # | Step | Expected | Check |
|---|------|----------|-------|
| 12.1 | Desktop viewport (1366x768) | Sidebar visible | 4 nav items. Header shows breadcrumb on nested routes. |
| 12.2 | Click each sidebar link | Navigates correctly | Dashboard → `/`, Members → `/member`, Loans → `/loans`, Recycle → `/recycle`. Active link highlighted. |
| 12.3 | Mobile viewport (430x932) | Bottom nav visible | 4 tabs. Header back button appears on nested routes. |
| 12.4 | Click each bottom nav tab | Navigates correctly | Same as step 12.2 but bottom nav. |
| 12.5 | Tablet viewport (820x1180) | Layout adapts | Two-column layout where applicable. Sidebar hidden, bottom nav visible. |
| 12.6 | Narrow mobile (360x800) | No overflow | All content reachable. No horizontal scrollbar. |
| 12.7 | Wide desktop (1920x1080) | Full layout | Three-column grid where applicable. Sidebar visible. Content centered/wide. |

---

### TS-13: DATA INTEGRITY CHECKS

| # | Step | Expected | Check |
|---|------|----------|-------|
| 13.1 | Navigate to Dashboard | Aggregate values | Total Assets = sum of all non-counterparty account balances. Cash in Hand = sum of cash + mobile_wallet accounts. Active Loans = sum of all loan stacks' totalOutstanding. Net Worth = same as Total Assets (v1). |
| 13.2 | Create a new transaction | Balances update | Source account debited, destination credited (for transfers). Dashboard metric cards update. |
| 13.3 | Create a new loan | Loan stack appears | Navigate to `/loans`. New stack visible in the list. Total outstanding matches loan amount. |
| 13.4 | Record a repayment | Outstanding decreases | Navigate to loan detail. Outstanding reduced. ProgressBar updates. |
| 13.5 | Delete a loan stack | Stack removed | Navigate to `/loans`. Stack no longer visible. Associated transactions reversed. |
| 13.6 | Create member → add account → create transaction → soft-delete → restore → verify | Full lifecycle | End-to-end data integrity: member has account, account has transaction, transaction can be soft-deleted, restored, appears in ledger again. |

---

## Bug Report Template

```json
{
  "id": "BUG-{auto-increment}",
  "timestamp": "{ISO timestamp}",
  "test": "{test-identifier}",
  "step": "{step description}",
  "expected": "{expected behavior}",
  "actual": "{actual behavior}",
  "screenshot": "bug-{id}.png",
  "console": "{console errors if any}",
  "status": "open"
}
```

Save all bugs to `bug_report.json` in the project root.

---

## Quick-Start Command

```bash
# Terminal 1: Start the app
cd C:\Dev_Projects\money_flows_v0.4
npm run dev

# Terminal 2: Run Playwright (after Playwright MCP is configured)
# The MCP tool will execute steps from this file sequentially
```

---

## Test Completion Criteria

- All 13 test suites pass (TS-01 through TS-13)
- No critical bugs in `bug_report.json`
- All UI states verified: loading, empty, error, success
- Responsive: mobile, tablet, desktop viewports checked
- Data integrity: create → read → update → delete → restore lifecycle verified

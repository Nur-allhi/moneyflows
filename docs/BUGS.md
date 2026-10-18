# MoneyFlows — Bug Tracker

Living queue of known issues. Maintained per the BUG TRACKING PROTOCOL (AGENTS.md §3.11).

## Ordering rules (maintain this file exactly so)

1. `open` and `in-progress` bugs always sort above `fixed` and `wontfix`.
2. Within the same status, sort by severity: `critical` → `high` → `medium` → `low`.
3. Within the same status + severity, sort by found date, oldest first.
4. `fixed`/`wontfix` entries stay at the bottom as history, in the same severity/date order.

## Entry template

```markdown
## BUG-<sequential-id>: <short title>

- **Status:** open | in-progress | fixed | wontfix
- **Severity:** critical | high | medium | low
- **Found:** YYYY-MM-DD (during: <what surfaced it>)
- **Location:** <file(s)/component/route affected>
- **Description:** What's wrong; observed vs. expected behavior.
- **Root Cause:** (unknown until diagnosed)
- **Fix Approach:** (only after user confirms the approach)
- **Resolved:** YYYY-MM-DD — commit/PR reference
```

---

## BUG-21: Dashboard metric chips use two different formulas under one "vs last month" label

- **Status:** open
- **Severity:** high
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/screens/dashboard/useDashboardData.ts:42-52` + `src/presentation/screens/dashboard/sections.tsx:23,28,33,41`
- **Description:** The four metric cards compute their trend from inconsistent inputs: `prevAssets = totalAssets - thisMonthNet` and `prevCash = cashInHand - thisMonthNet` (this month's net), but `prevBanks = totalInBanks - lastMonthNet` and `prevLoans = activeLoansOutstanding - lastMonthNet` (last month's net). All four chips read "vs last month". `loansChange` subtracts an income/expense net from a loan stock (outstanding), which is not a comparable quantity. `thisMonthNet`/`lastMonthNet` are family-wide yet applied to single buckets, so an expense paid from a bank account also moves the Cash-in-Hand baseline it never touched. Expected: one agreed definition (period + numerator + baseline) applied to all four cards and labelled to match.
- **Root Cause:** two formulas evolved side by side; assets/cash were moved to month-to-date while banks/loans kept last month's net, and the shared label was never updated.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-25: Loan movements are counted as income and expenses, distorting every "net" figure

- **Status:** open
- **Severity:** medium
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/screens/dashboard/useDashboardData.ts:11-12` (`INCOME_TYPES` / `EXPENSE_TYPES`)
- **Description:** `INCOME_TYPES` includes `loan_repayment`, `repay`, `loan_received` and `EXPENSE_TYPES` includes `loan_issue`, `lend`, `loan_paidback`. Lending money out is an asset conversion (cash → receivable) rather than an expense, and a repayment is not income. These sets feed `thisMonthNet`/`lastMonthNet`, the Month Summary panel, and (via BUG-21) every dashboard trend chip. Expected: loan principal movements excluded from income/expense, or reported as their own category.
- **Root Cause:** type sets were built from transaction type lists without separating principal movements from real income/expense.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-40: Editing a repayment upward silently clamps the loan instead of refusing (BUG-23's second door)

- **Status:** open
- **Severity:** medium
- **Found:** 2026-10-17 (during: BUG-23 fix — tracing every write path that changes `loans.outstanding`)
- **Location:** `src/loans/application/LoanService.ts:154-168` (`syncLoanTransaction`), reached from `src/presentation/modals/TransactionEditModal.tsx` when a `lend`/`repay` transaction is edited
- **Description:** BUG-23's overpayment is now refused on the create path, but the **edit** path still holds the same silent clamp: `loan.outstanding -= diff` followed by `loan.outstanding = Math.max(0, loan.outstanding)`. Editing an existing repayment *upward* past what the loan still owes therefore raises the amount on the ledger while the loan record stops at zero — the same "ledger says more was repaid than the loan received" divergence, now reachable through an ordinary edit. It is not a one-line amount check either: a transaction stores a **single** `loanRef`, while one repayment may have paid down several loans (the deliberate spillover in `recordRepayment`), so there is no per-transaction allocation record to reverse or re-apply. Expected: an edit that cannot be absorbed is refused as clearly as BUG-23, which needs the allocation question answered first.
- **Root Cause:** `syncLoanTransaction` applies a delta to the single linked loan and clamps, treating that loan as the only one the transaction could have touched.
- **Fix Approach:** (pending user confirmation) — kept as its own decision so the allocation model (one `loanRef` per transaction vs a recorded split) can be settled on its own merits instead of being smuggled into a bug fix.
- **Resolved:**

## BUG-29: Recycle Bin "Total Amount" sums incomparable quantities

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/infrastructure/database/SQLiteDatabaseService.ts:1415-1426` (`getDeletedItems` amount mapping) + `src/presentation/screens/RecycleBin.tsx:49-52,169`
- **Description:** The headline figure adds transaction `amount`, account `balance`, `other_ledgers.opening_balance` and `other_ledger_entries.(debit+credit)` into one number — a transaction amount added to an account balance added to a ledger opening balance. The row renderer also prefixes every value with `-`, so a positive deleted account balance displays as a negative amount. Expected: totals per tab/kind, or no combined total for heterogeneous items.
- **Root Cause:** each table exposes a different column as `amount` and the UI sums them all as if homogeneous.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-30: Recycle Bin shows other-ledger rows as "Account", but they never appear under the Accounts tab

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/screens/RecycleBin.tsx:38,46` (tab filters on `type === 'account'`) vs `:165-168` (labels/icon: `item.type === 'transaction' ? … : 'Account'`)
- **Description:** Deleted `other_ledger` and `other_entry` items are rendered under **All Items** with the bank icon and the label "Account", but the **Accounts** tab filters strictly on `type === 'account'`, so those rows can never be reached by switching tabs — the tab is inconsistent with its own labelling. Expected: either surface the other-ledger kinds as their own tab/label, or include them in the Accounts tab.
- **Root Cause:** tab predicates were not updated when `other_ledger`/`other_entry` were added to `DeletedItem['type']`.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-32: Member ledger running balance is wrong when no account is selected (latent)

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/screens/memberProfile/useMemberData.ts:84-99` (`isTxCredit`), duplicated in `src/presentation/screens/memberProfile/pdfExport.ts:14-18`
- **Description:** For loan-like types the credit test is `tx.destAccount === selectedAccountId`. With `selectedAccountId === null` this is always false, so every transfer and loan is treated as a debit and an internal transfer subtracts both legs from the running balance. Currently latent because the balance column is only rendered when `showBalance = !!selectedAccountId` (`MemberProfile.tsx:27`), but the arithmetic still runs and the same predicate is shared by the PDF path. Expected: a credit/debit rule that does not depend on a selected account, or an explicit guard.
- **Root Cause:** the sign rule was written for the single-account view and left unguarded for the all-accounts view.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-33: Member ledger balance column is rendered without locale formatting

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/screens/memberProfile/useMemberData.ts:99` (`balance: String(balance)`) rendered verbatim by `src/presentation/components/LedgerTable.tsx`
- **Description:** The running balance is passed as a raw `String()`, so it bypasses `formatAmount()`/`useFormatNumber()` and shows without thousands grouping or locale digits — inconsistent with every other surface in the app, which also breaks the DESIGN_IDENTITY no-hardcoded-formatting rule.
- **Root Cause:** the row model stores a pre-stringified balance instead of a number formatted at render time.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-34: Loan status `on_track` actually means "fully repaid"

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/loans/infrastructure/LoanDatabase.ts:171-178` (`status = 'on_track'` when `outstanding <= 0` but the row's own status is not `settled`)
- **Description:** A loan with zero outstanding but a stale `active` status is reported as `on_track`, a label that reads as "repayment proceeding on schedule" while it actually denotes a paid-off loan. Reachable if a loan row is left in an inconsistent state (e.g. an interrupted save), and the UI then shows a finished loan as on-track. Expected: status names match their meaning.
- **Root Cause:** the display status was derived from outstanding alone with `settled` reserved for the stored flag.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-35: Other-ledger `recomputeBalances` rewrites `updated_at` on every entry

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/otherLedgers/application/OtherLedgerService.ts:163-171` (called from `addEntry` :140, `updateEntry` :151, `deleteEntry` :160)
- **Description:** Every add/edit/delete of a single entry rewrites `balance` **and** `updatedAt` for all rows in the ledger, even when the balance is unchanged. Harmless to the arithmetic, but it is row churn across the whole ledger on each mutation, which any `updated_at`-keyed digest/sync/diff logic will observe.
- **Root Cause:** the recompute loop unconditionally stamps `updated_at` instead of only when the balance actually changes (unlike `recalculateBalances`, which computes first and only writes differences).
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-36: Unused loan-store methods, one with inverted semantics

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/loans/presentation/stores/useLoanStore.ts:41-43` (interface) and `:195-259` (`createGivenLoan`, `createReceivedLoan`, `recordPayback`)
- **Description:** These three store methods have no UI caller. `createReceivedLoan` is a line-for-line copy of `createGivenLoan` (identical `lenderAccountId: params.sourceAccount` / `borrowerAccountId: params.destAccount` mapping, itself missing the `throw err` that `createGivenLoan` has), so if it were ever wired up, a loan you *received* would be recorded as a loan you *gave out* — an inverted balance effect. Expected: dead code removed, or semantics corrected and covered by a test before use.
- **Root Cause:** backwards-compatibility shims added for the pre-T-054 store were never deleted after the unified loan system shipped.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-37: `getFamilySummary` mislabels account types as loans and is unused

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/infrastructure/database/SQLiteDatabaseService.ts:1456-1462` (port: `src/core/ports/IDatabaseService.ts:181`)
- **Description:** The summary sums `mobile_wallet` and `business` balances into the `activeLoans` field, ignores the real loan stacks entirely, and excludes `counterparty` accounts from every bucket while `totalAssets`/`netWorth` are built from the same partial set. No UI consumer today (the dashboard uses `loanStacks`), so nothing visibly breaks — but the port is public and any future caller receives wrong figures. Expected: either correct semantics or removal.
- **Root Cause:** left over from the pre-unified-loan model where those account types stood in for loans.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

---

## BUG-39: Stale `search.smoke.spec.ts` makes the Playwright suite permanently red

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-17 (during: BUG-20 verification — full `npx playwright test` before pushing `dev`)
- **Location:** `e2e/search.smoke.spec.ts:13-23` (`dashboard global finds across all txs (proves slice gap)`)
- **Description:** The test waits for a dashboard search *input* `getByPlaceholder('Search...')` and times out: the dashboard no longer has one — global search moved to the header Search button + overlay (`a641ba9`, merged after the smoke was written on 2026-08-26). `npx playwright test` therefore ends 30 passed / 1 failed on an untouched app (this session changed no `src/` file). The file's own header comment says these smokes document the pre-S-1 gap and "should be updated to assert highlighting + all-transactions scope" after S-2/S-3 — that update never happened. Expected: the suite exits 0, so "playwright green" is a real signal.
- **Root Cause:** the smoke asserts pre-S-1 UI (inline dashboard search input) that the global-search feature replaced; only the sibling "ledger-scoped" smoke was made tolerant of the new UI.
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

## BUG-42: Group ledger "Expense" tab counts lending on mobile but not on desktop

- **Status:** open
- **Severity:** low
- **Found:** 2026-10-18 (during: BUG-28 fix — deciding which filtered set the group ledger PDF must export)
- **Location:** `src/presentation/screens/GroupLedgerScreen.tsx` (`mobileFilteredTxs`: `expense → ['expense', 'lend', 'loan_issue']`) vs (`ledgerRows`: loan types classify as `type: 'loan'`, so the desktop Expense tab matches `expense` only)
- **Description:** Both layouts offer the same five tabs (All / Income / Expense / Transfer / Loan), but the **Expense** tab selects different rows per layout: a `lend` or `loan_issue` transaction is listed under Expense on mobile and under Loan on desktop. The other four tabs agree (`income` = `income` on both, `transfer` likewise, `loan` = all six loan types on both). The tab set is presented as a shared filter, so the same tab showing two different row sets is a defect in one of them. Expected: one definition of each tab's row set, or a deliberate difference that is documented in the UI.
- **Root Cause:** the mobile list was given its own inline type→tab map instead of reusing the desktop table's classification (the `isLoanType` helper that maps the six loan types to `loan`).
- **Fix Approach:** (pending user confirmation) — needs a product call first: is lending money out an **expense** (cash left the account) or a **loan** (cash became a receivable)? Both readings are defensible and the app currently says "loan" on desktop and "expense" on mobile. It is also why the BUG-28 PDF fix deliberately preserved the export's existing type-tab behaviour instead of baking one map into a statement.
- **Resolved:**

---

## BUG-26: Member profile "Total Income" and "Total Expenses" were not comparable

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/screens/memberProfile/useMemberData.ts` (`totalIncome` / `totalExpenses`, rendered by `ProfileHero.tsx`) + `src/presentation/screens/dashboard/useDashboardData.ts` (its private `INCOME_TYPES` / `EXPENSE_TYPES` are gone) + new shared `src/core/domain/transactionCategory.ts`
- **Description:** The two hero stats were built by two separate reducers with different filters: `totalIncome` counted only `type === 'income'`, while `totalExpenses` counted `expense` **plus** `loan_issue` and `lend`. Nothing was counted on the income side for `repay` / `loan_repayment` / `loan_received`, and `loan_paidback` was missing from the expense side. A member who lent money out and got it back therefore looked steadily poorer — income unchanged, expenses up by the whole loan. The two figures sit side by side under one hero, so they read as the same scope.
- **Root Cause:** the two reducers were written independently with different type filters. The dashboard had already settled the question (its `INCOME_TYPES` / `EXPENSE_TYPES` are symmetric and cover all eight non-transfer types), but that classification lived as a private const inside `useDashboardData.ts`, so the member profile grew its own — a fourth copy of the same idea (`TagLedgerScreen` holds a third, `cloudDiff.ts` a fifth, differently-scoped). Nothing forced them to agree.
- **Fix Approach:** taken from the audit's own expectation — *"symmetric, explicitly-defined buckets"* — and implemented as **one** definition rather than two that have to be kept in step: new `src/core/domain/transactionCategory.ts` exports `INCOME_TX_TYPES` / `EXPENSE_TX_TYPES`, `isIncomeTx` / `isExpenseTx` and `sumIncomeExpense(txs) → { income, expense, net }`. The dashboard now consumes it (behaviour unchanged — its sets were copied verbatim) and the member profile computes both hero figures from one call, so the surfaces cannot disagree about the same transactions again. `transfer` is documented as belonging to neither set. Loan principal stays on **both** sides, deliberately: whether it belongs in these totals *at all* is the separate, still-open BUG-25, and that decision now lands in exactly one file. Account opening balances are `income` transactions by construction (BUG-19 records them that way), so they count as income here — excluding them would be an app-wide change (dashboard month summary included), not a member-profile one, so it was not smuggled in.
- **Resolved:** 2026-10-18 on `fix/calculation-audit` (not merged yet). Evidence: 5 new unit tests (**163 total**, was 158) pinning the classification — including an exhaustiveness test over all nine schema types that fails if a type is ever neither income nor expense, and the loan-cycle case (`lend 1000` + `repay 1000` → income 1000, expense 1000, net 0); **mutation-verified** — reducing `INCOME_TX_TYPES` to `['income']` (the old member-profile rule) fails 3 of them, the loan-cycle one reading `expected { income: +0, expense: 1000 } to deeply equal { income: 1000, expense: 1000, net: 0 }`. Typecheck / lint / build PASS; full Playwright suite back at its documented baseline (**30 passed / 1 failed** = BUG-39). A throwaway spec — deleted, never committed — drove the real seeded database end to end: the Admin member's hero now reads **Net Balance 64,000 · Total Income 1,12,000 · Total Expenses 48,000**, where the old rules produced 1,07,000 / 48,000 (a 59,000 gap that did not match the 64,000 balance rendered beside it); the new pair reconciles exactly (income − expenses = 64,000 = the member's account balances, because the seed's only transfer is internal). Recorded mid-verification: the desktop hero class is `profileHero` / `heroStats`, the mobile one `profileCard` — a locator copied from the mobile spec finds nothing on desktop.

---

## BUG-28: Group ledger PDF exported only the currently visible page

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/screens/GroupLedgerScreen.tsx` (PDF builder; the `searchFilteredTxs = displayedTxs` alias is gone) + new shared `src/presentation/utils/runningBalance.ts`
- **Description:** The exported statement was built from `searchFilteredTxs` — an alias for `displayedTxs`, the `displayLimit` page slice (default 10 rows) — so every row past the first page was silently omitted, and the statement's Opening Balance / Total Debit / Total Credit came from that same slice. On any group with more history than one page the PDF presented itself as the group's statement while showing a page of it, with an "opening balance" that was really the balance 10 rows back.
- **Root Cause:** the PDF builder was pointed at the paginated view model instead of the full sorted set. The alias hid it: the name promised the full filtered set and delivered the page.
- **Fix Approach:** (no user decision needed — the audit's "expected: export the full filtered set" is the only defensible behaviour) export `searchFilteredAll`, the full search-filtered ledger, and derive the opening balance from it; the on-screen table keeps its page-scoped walk, which the audit explicitly verified as internally consistent. Two `running` accumulators were the reason the two surfaces could disagree, so the walk is now one shared pure helper used by both. The export deliberately keeps ignoring the type tabs, because the tabs themselves disagree across layouts (BUG-42, open) and adding tab support now would bake an undecided rule into a statement. The statement stays chronological regardless of the on-screen sort, as before.
- **Resolved:** 2026-10-18 on `fix/calculation-audit` (not merged yet). `handleDownloadPdf` walks `searchFilteredAll` through new `withRunningBalances(items, deltaOf, endBalance)`; `ledgerRows` uses the same helper, so table and PDF can no longer drift; the misleading alias was deleted and its two remaining consumers now read `displayedTxs`, which is what they actually meant. The PDF also now reuses the component's `isGroupCredit`/`isGroupDebit` instead of its own private credit predicate. Evidence: 5 new unit tests (**158 total**, was 153) covering the whole-ledger walk, zero-delta (internal transfer) items, negative balances, the empty case, and the slice-vs-ledger property itself — the test that documents *why* the old code was wrong; **mutation-verified** — replacing `endBalance - net` with `endBalance` fails 3 of them, the first reading `expected [1850, 1850, 1650, 1700] to deeply equal [1000, 1000, 800, 850]`. Typecheck / lint / build PASS; full Playwright suite at its documented baseline (**30 passed / 1 failed** = BUG-39). That run also surfaced two load-dependent flakes (`03-accounts` mobile modal, `15-cloud-sync` sign-out) which pass in isolation in 27s and are unrelated to this change.
- **Not covered:** the `handleDownloadPdf` → jsPDF wiring itself. The pure helper bounds the arithmetic, but no test asserts that the callback is fed the full set; driving it would mean intercepting a browser download, and extracting the PDF body for a unit test would duplicate its column layout.

---

## BUG-27: Loan stack repayment progress and total recovered exclude settled loans

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/loans/infrastructure/LoanDatabase.ts` (`_getStackForBorrower`; new pure `stackTotals`)
- **Description:** Settled loans were pushed into `settledLoans` and excluded from the aggregate figures, so `totalRecovered` and `progressPercent` described only the loans still open. A borrower who had fully repaid an earlier loan and then taken a new one saw "0% repaid" next to money that had genuinely been paid back, and the recovered total understated what had come in. The stack's own figures did not add up: `totalOutstanding` is the money *left*, so on a card showing 1,000 remaining after 1,000 had been repaid, "0% repaid" contradicted the amount beside it — remaining + repaid = lent.
- **Root Cause:** the settled/active split was introduced for the loan list (which genuinely wants the two groups) and then reused as the scope for the aggregate figures, where lifetime semantics were needed.
- **Fix Approach:** taken from the audit's expected behaviour — *"progress/recovered reflect the whole stack"* — chosen over the audit's alternative of relabelling them active-only. Relabelling would have left the two figures on the same card on different scopes (an active-only percentage next to a lifetime amount), which is what made the card read as wrong in the first place.
- **Resolved:** 2026-10-18 on `fix/calculation-audit` (not merged yet). New pure exported `stackTotals(loans)` computes `totalAmount` / `totalRecovered` / `progressPercent` over **every** loan in the stack, settled included; `_getStackForBorrower` derives its two aggregate fields from it. The active/settled split still drives the list, `activeCount`, `settledCount`, `isSettled` and `totalOutstanding` (unaffected anyway — `LoanService` only marks a loan settled once `outstanding` hits 0, and clamps `outstanding <= principal`, so recovered stays within 0..100% and no clamp is needed). One UI follow-through, flagged as the only visible change beyond the number: `LoanCard` and `LoanDetailView` no longer hide the percentage behind an `activeCount > 0` guard, so a fully settled stack reads **100%** instead of a dash, and the card and the detail bar finally state the same figure. Evidence: **8 new unit tests** (153 total, was 145) covering the mixed settled+active case, all-settled, nothing-repaid, partial repayments across loans, rounding and the empty stack; **mutation-verified** — restoring the active-only scope fails 5 of them, the first with `expected 1000 to be 2000` (the repaid loan's principal vanishing, exactly the reported symptom). Typecheck / lint / build PASS; full Playwright suite at its documented baseline (**30 passed / 1 failed** = BUG-39). A throwaway spec, deleted and never committed, seeded a real database with one settled (1,000 / 0) and one fresh loan (1,000 / 1,000) and the Loans screen rendered **"1 active • 1 settled • 50% repaid"** where it previously showed 0%. Note for whoever picks this up: `totalRecovered` still has no UI consumer (grepped) — it was fixed because it is part of the `LoanStack` contract, not because anything renders it.
- **Lesson (recorded because it cost a cycle):** the first version of the throwaway assertion used `getByText('0% repaid')`, which **substring-matches "50% repaid"** and failed against perfectly correct code. Negative text assertions must be anchored (`/^0% repaid$/`). The DOM snapshot, not guesswork, is what showed the app was right.

---

## BUG-41: Transactions damaged before the BUG-24 fix are never re-validated (the approved detection half)

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-17 (during: reviewing the fixed findings against the audit's "Decisions needed" list; scope corrected twice the same day — after tracing the boot path, then after checking the schema)
- **Location:** write path `src/infrastructure/database/SQLiteDatabaseService.ts` (`saveTransaction`/`updateTransaction` → `validateTransaction`); boot path `src/main.tsx:90` → `recalculateBalances` (`:1485`) → `computeBalances`/`diffBalances` (`src/infrastructure/database/computeBalances.ts`); new scan `src/core/domain/transactionIntegrity.ts` + `findInvalidTransactions()` (end of `SQLiteDatabaseService`); surfaced in Settings → Backup & Storage → Data Integrity (`src/presentation/components/settings/sections/IntegrityRow.tsx`)
- **Description:** The approved decision for BUG-24 was **Option B**: *detect and report* records already damaged before the fix, never silently rewrite them. Only the prevention half had shipped. Building the detector produced **two corrections of record**, both of which weaken the original finding:
  **(1) "Nothing compares a stored balance against a replay of the transactions" was false.** `main.tsx:90` runs `recalculateBalances()` on **every boot** and it silently `UPDATE`s any account whose balance disagrees with the replay (`diffBalances` → `UPDATE`, `:1502-1512`). Balance-level divergence is therefore silently corrected at every launch rather than reported — closer to the Option C that was ruled out than to Option B. That replay is deliberate and load-bearing (`SetupWizard.tsx:114-117` and BUG-19's fix depend on it), which is why it stayed as-is and is tracked as Scope B below rather than changed here.
  **(2) "An edit could store amount `0`/NaN" was false.** Every shape the `transactions` table has ever had — the initial `SCHEMA`, and both rebuilds in `_migrate()` (`transactions_v2` `:309`, `transactions_v3` `:362`) — declares `amount REAL NOT NULL CHECK(amount > 0)`, so such a write is refused by SQLite on any database this app created. What BUG-24 could still persist and leave behind is an **empty description**, an **invalid date**, and above all a **link violation**: an expense/repayment whose source or destination account was nulled or crossed. That last case is the one that matters — the row survives, the app's replay **skips a row with no account**, so the money never moved in any balance, total or report, and nothing else in the app can see it, because a replay-mismatch check *agrees with the damage by construction*. The balance divergence left by a rejected edit (the old transaction's effect is reversed at `:1278` before the write throws at `:1280`) is repaired by the next boot's replay, so the audit's word "permanent" was too strong: the balance is wrong only until the next launch.
  Severity was therefore **lowered from medium to low** at fix time: amount corruption is impossible on current schemas, and what remains is record hygiene plus the rarer link case. The scan's value is as much **insurance** — a future guard bypass, an imported file, or a synced row that never passed through the guard — as it is a fix for existing damage.
- **Root Cause:** the BUG-24 fix was scoped to the write path and the detection half was left as follow-up instead of being logged; the boot replay does detect balance-level divergence but repairs silently, and it structurally cannot see damage stored inside a transaction row.
- **Fix Approach:** user-approved (**Scope A**, report-only; recommended over Scope B, which is kept open below) — a read-only validity scan over stored transactions that reuses the write path's own rules, surfaced in Settings. Never writes: Option B's rule.
- **Resolved:** 2026-10-17 — on `fix/calculation-audit` (not merged yet). New `src/core/domain/transactionIntegrity.ts` (`scanTransactions`) calls the same `validateTransactionFields`/`validateTransactionLinks` the guard uses; the account-link type sets and pairing messages were extracted into `transactionRules.ts` so the scan cannot drift from the write path it checks. `IDatabaseService.findInvalidTransactions()` (implemented at the end of `SQLiteDatabaseService`, reusing the replay's column set and ordering, never writing) feeds a new **Data Integrity** row in Settings → Backup & Storage, wired through `useBackupState` with the scan's failure caught so a broken scan can never take the backup card down. Evidence: 10 new pure unit tests (**145 total**, was 135); typecheck / lint / build PASS; the full Playwright suite at its documented baseline (**30 passed / 1 failed** = BUG-39, unchanged); and a throwaway spec — deleted, never committed — drove the real database end to end: healthy seed → *"All 12 records check out"*; seed damaged three ways (nulled source account, emptied description, unparseable date) → *"3 of 12 records need attention"* with each reason listed. That same spec re-verified **BUG-24 live after this refactor**: clearing the amount in the edit modal still shows "Amount must be a positive number" and keeps the modal open. `impact(validateTransaction)` came back **HIGH** (2 direct callers, 4 processes) — the guard's control flow, throw order and messages were kept identical and only its duplicated type lists and message strings were swapped for the shared helpers; `detect_changes` **high**, boot and write processes in scope.
- **Still open as Scope B:** make the boot replay *report* what it is about to correct instead of correcting silently. Separate decision — it touches load-bearing boot code (`SetupWizard`, BUG-19) and on its own finds nothing the scan would not.

---

## BUG-22: Member report "closing" shows the live balance instead of the period-end balance

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/reports/application/MemberReportService.ts:112-155` (`closing: acct.balance` at :155; `summaryClosing` at :163)
- **Description:** `opening` is derived by unwinding ALL transactions (`impliedOpening = acct.balance - netFull`) while the per-row `running` balance stops at the last in-period row, yet `closing` is set to the live `acct.balance` regardless of the selected range. For any range that ends before the last transaction, Opening + Credit − Debit ≠ Closing, and the report summary inherits the same error. Expected: closing = period-end running balance, so the statement's own arithmetic balances.
- **Root Cause:** `closing` was wired to the account row instead of to `running` at the end of the period; existing tests only cover ranges ending at the final transaction, where both definitions coincide.
- **Fix Approach:** user-approved — make the statement's own arithmetic the rule. `closing` is now the **period-end running balance** (`running` after the last in-period row) instead of the live `acct.balance`. `opening` already back-computes from the live balance, which is what keeps the unfiltered case exact: when the range reaches the last transaction, the period-end balance and the live balance are the same number, so only ranges that end early change. `summaryClosing` inherits the fix automatically because it sums the section closings. The class doc comment that claimed "live `account.balance` is the closing truth" was corrected too — it described the bug rather than the rule.
- **Resolved:** 2026-10-17 — on `fix/calculation-audit` (not merged yet). New regression test that ends the range **before** the newest transaction (the case the old suite never covered) plus a per-section invariant assertion (`closing = opening + totalCredit − totalDebit`). **Mutation-verified:** reverting `closing: running` back to `closing: acct.balance` fails the new test with `expected 1100 to be 1400` while the other 9 tests stay green — exactly the blindness that let the bug through. `npm test` 14 files / 135 tests pass; typecheck PASS, lint 0 PASS, build PASS. `impact` LOW (0 direct callers, 0 processes) — note the index does not resolve the chained `new MemberReportService(…).generateReport(…)` call, so the real call site is `MemberReportScreen.tsx:86`; the value's consumers are `ReportSections.tsx:41`, `memberReportPdf.ts:111` and the summary stat at `MemberReportScreen.tsx:206`. `detect_changes` risk low, 0 processes.

---

## BUG-20: Linked Accounts modal shows 0 BDT while dashboard shows the real total

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-17 (during: mobile UI audit — BEFORE the BUG-19 reload, Dashboard "Total in Banks" read 28,000 in the same session)
- **Location:** `src/presentation/screens/memberProfile/AccountsSection.tsx` (Linked Accounts modal, route `/member/:id`); same data also shown by `src/presentation/modals/SelectAccountModal.tsx` and the desktop dropdown
- **Description:** The Linked Accounts modal lists "City Bank — 0 BDT Available Balance" and "Cash Wallet — 0 BDT Available Balance" while the dashboard reports "Total in Banks 28,000 BDT" for the same two accounts in the same session. Expected: the modal shows each account's current balance.
- **Root Cause:** diagnosed 2026-10-17 — not a separate defect: the same two faces of BUG-19. Those accounts carried a balance no transaction backed (the pre-BUG-19 wizard wrote the raw number onto the account row). Boot's `recalculateBalances()` recomputes every account balance from the transaction stream and rewrites unbacked rows to the replayed sum (0). The Linked Accounts modal re-reads those rows, while the dashboard metric renders the in-store value through `useAnimatedValue` — inside that window the same accounts read 0 in the modal and 28,000 on the dashboard. Every other balance writer was checked and cannot produce an unbacked balance: `AddAccountModal` and the fixed wizard write an `isOpeningBalance` income transaction, `EditAccountModal` cannot change a balance, `LoanService` creates counterparty accounts at 0.
- **Fix Approach:** user-confirmed (Option A — close as resolved-by-BUG-19, add a regression guard; no production code change warranted for a symptom that no longer exists) — re-verified live on the reported data set (City Bank + Cash Wallet): dashboard, members list, profile hero, mobile modal and desktop dropdown all read the same per-account values before and after a reload; NEW Playwright regression test pins dashboard ↔ Linked Accounts parity across a reload.
- **Resolved:** 2026-10-17 — resolved by `eff4d6c` (BUG-19 wizard fix) + regression test on `dev`; verified live (mobile modal + desktop dropdown + dashboard, before and after reload).

---

## BUG-38: `npm test` can never pass — vitest collects the Playwright specs

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-17 (during: BUG-20 verification — running the unit-test gate before pushing `dev`)
- **Location:** `package.json:12` (`"test": "vitest run"`) — no `vitest.config.*` / `test.include` existed
- **Description:** `npx vitest run` reported `Test Files 21 failed | 13 passed (34)` with `Tests 113 passed (113)`: every file under `e2e/` (all 21 `*.spec.ts`) was collected by vitest and died with "Playwright Test did not expect test() to be called here", so the process exited 1. The 113 real unit tests all passed. Expected: the unit gate exits 0 by itself, so "unit tests green" is a real signal instead of a known-red command.
- **Root Cause:** default vitest `include` (`**/*.{test,spec}.?(c|m)[jt]s?(x)`) matches the Playwright spec directory; nothing told vitest to skip it.
- **Fix Approach:** user-confirmed (fix the verification gate before starting the calculation-audit work) — vitest `test.include` pinned to `src/**/*.{test,spec}.{ts,tsx}` in `vite.config.ts`, with a `/// <reference types="vitest/config" />` so Vite's `defineConfig` accepts the `test` key. A single config file was chosen deliberately over a separate `vitest.config.ts`: vitest would use the latter *instead of* `vite.config.ts`, silently dropping the React plugin, the `__APP_VERSION__`/`__GOOGLE_CLIENT_ID__` defines and the `@` alias for any unit test that later needs them. An `include` (allow-list) was preferred over `exclude: ['e2e/**']` so any future stray spec outside `src/` is skipped by default rather than silently collected.
- **Resolved:** 2026-10-17 — on `fix/calculation-audit`; `npm test` now reports `Test Files 13 passed (13)`, `Tests 113 passed (113)`, exit 0. typecheck PASS, lint 0 PASS, build PASS. `detect_changes` risk low (0 changed symbols — config-only).

---

## BUG-24: `updateTransaction` bypasses validation, so edits can corrupt account balances

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/infrastructure/database/SQLiteDatabaseService.ts:1274-1283` (`updateTransaction`) vs `:1267-1272` (`saveTransaction` → `validateTransaction` at :1213-1254); UI entry `src/presentation/modals/TransactionEditModal.tsx:61,85` + `src/presentation/components/FormField.tsx:80-87`
- **Description:** The create path validates amount/description/date/accounts/source≠dest, but the update path never calls `validateTransaction`, and the edit modal posts `Number(amount)` from an unsanitized free-text input. Reachable through normal UI: blank amount → `0`, non-numeric → `NaN`, negative amounts, empty description, unparseable date, inactive accounts, and `source === dest`. `applyBalanceChange` (`:1305-1317`) then writes that delta straight into `accounts.balance`, so a single edit can permanently poison a balance (NaN/NULL survives the flush). Expected: edits enforce the same rules as creates.
- **Root Cause:** validation lives in `saveTransaction` only; `updateTransaction` was written as a direct write path.
- **Fix Approach:** user-confirmed (Option A1 + B1, chosen over A2/B2): one shared rules module — `src/core/domain/transactionRules.ts` (`validateTransactionFields`, `sanitizeAmountInput`, `parseAmountInput`) — is now the single source of truth used by the database guard, the edit modal and the create form. The edit modal validates *before* writing, shows each message against the offending field (reusing the existing `FormField` error slot, so no new error pattern or CSS), and stays open when a field fails. It also reads back the store's recorded error after the awaited save, because `useTransactionStore.updateTransaction` rolls back and logs instead of throwing — without that read-back a refused save still closed the modal. `SQLiteDatabaseService.updateTransaction` now calls `validateTransaction` before it touches any balance row, and the create form got the same read-back so a refused create no longer closes the form silently. A1 was preferred over A2 (make the store rethrow and handle it in every caller, incl. `TagLedgerScreen`) to keep the blast radius inside the two forms, with the database check left as the backstop for future callers. B1 was preferred over B2 (patch the missing check only) because the audit found three divergent copies of these rules. No maximum amount was introduced: the app has never enforced one, and inventing a ceiling is a product decision rather than a bug fix.
- **Resolved:** 2026-10-17 — on `fix/calculation-audit` (not merged yet). New `src/core/domain/transactionRules.ts` plus 17 unit tests in `src/core/domain/__tests__/transactionRules.test.ts` (zero / NaN / negative / Infinity amounts, empty and over-length descriptions, unparseable dates, all-broken-fields-at-once, sanitizer edge cases). `npm test` now reports 14 files / 130 tests pass (was 113); typecheck PASS, lint 0 PASS, build PASS. `detect_changes` risk **medium** — 9 changed symbols, 7 files, all presentation entry points; the 4 affected processes are the `HandleSave → …` chains. **Scope note:** this closes the *prevention* half only. The approved Option B also required *detecting and reporting* records already damaged before the fix — that half was not built and is now tracked as **BUG-41**.

---

## BUG-31: Amount entry rules differ between create and edit forms

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/presentation/modals/TransactionFormModal.tsx:171-174` (strips `[^0-9]`, `parseInt`) and `:119,125` vs `src/presentation/modals/TransactionEditModal.tsx:23,61,85` + `src/presentation/components/FormField.tsx:80-87` (`inputMode="decimal"`, no sanitizing)
- **Description:** The create wizard accepts whole numbers only (all non-digits stripped, `parseInt`), while the edit modal accepts arbitrary free text and converts with `Number(amount)` — so a value that cannot be created can be produced by editing an existing transaction, and there is no maximum bound in either path. Expected: one shared amount rule for both forms.
- **Root Cause:** two independent amount inputs (custom numpad vs shared `AmountInput`) with no shared sanitizer/validator.
- **Fix Approach:** user-confirmed — folded into the BUG-24 fix rather than patched separately, because it is the same root cause. `sanitizeAmountInput` lives in the shared rules module and is now applied by *both* amount inputs: `AmountInput` in `src/presentation/components/FormField.tsx` (edit modal + Add Account initial balance) and `TransactionFormModal.handleAmountChange` (create). Both therefore accept digits plus at most one decimal separator and at most two decimals, and both are checked by the identical rule; `transactionForm/validation.ts` now delegates amount/description to the shared module and keeps only its own "Amount is required" wording for an empty box (so "required" still reads differently from "invalid"). `useSubmit` switched from `parseInt` to `parseAmountInput`, so two-decimal values survive a create instead of being truncated, and the create screen's grouped display preserves the decimals as typed instead of showing `100` for a typed `100.50`. Left explicitly unchanged: neither path enforces a maximum amount — no ceiling has ever existed in the app, so adding one is a product decision. Also unchanged (reported, not fixed): `TransactionEditModal.module.css` still contains pre-existing hardcoded hex fallbacks that predate this workstream.
- **Resolved:** 2026-10-17 — same commit as BUG-24 on `fix/calculation-audit` (see above); covered by the same 17 new unit tests, which assert that sanitizing and validating are one implementation shared by both forms.

---

## BUG-23: Loan overpayment is dropped from the loan record but booked in full as a repayment

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-17 (during: calculation-logic audit of all modules)
- **Location:** `src/loans/application/LoanService.ts:104-127` (`recordRepayment`) + `src/loans/infrastructure/LoanDatabase.ts:168-190`
- **Description:** `applied = Math.min(remaining, loan.outstanding)` clamps the amount applied per loan and the leftover `remaining` is silently discarded, but the created transaction still carries the full `params.amount`. The loan stack therefore reports 100% settled while the ledger records more repaid than was lent, and no warning is shown. `LoanService.generateReport` derives outstanding from the transaction stream and can go negative (asserted at `src/loans/application/__tests__/LoanService.generateReport.test.ts:49`, `-2000`) while the stack clamps at `Math.max(0, …)` — two surfaces disagreeing about the same loan. Expected: either reject/warn on overpayment, or record the excess explicitly so both views agree.
- **Root Cause:** clamping was added to the loan rows without a matching rule for the transaction amount or user feedback.
- **Fix Approach:** user-confirmed **Option A**, read as "refuse the excess and tell the user" (the other half of that wording — booking the remainder as its own transaction — is a prepayment *feature* with its own statement treatment, so it was not invented here). `LoanService.recordRepayment` now totals the active outstanding across the loans it could pay down and throws a new `OverpaymentError{attempted, maximum}` **before any write**, so a refused repayment leaves every loan untouched instead of half-applied. `OverpaymentError` (`src/loans/domain/errors.ts`, re-exported from the `src/loans` public API) carries numbers rather than a sentence because the service has no locale/currency; the create form formats it with the user's own settings (`Only … is still outstanding for this borrower — reduce the amount.`) in the loan tab's existing `catch`, which already kept the form open. The ceiling is the borrower's **total** active outstanding, not the targeted lender's, because spillover onto other lenders is deliberate and covered by an existing test. Not done here: the same silent clamp reachable by **editing** a repayment upward is logged as BUG-40.
- **Resolved:** 2026-10-17 — on `fix/calculation-audit` (not merged yet). 4 new tests in `src/loans/application/__tests__/lenderRepayment.test.ts` (refuses above the total and writes nothing, reports the true ceiling while ignoring settled loans, still accepts paying off exactly everything, same guard on a targeted lender). `npm test` 14 files / 134 tests pass (was 130); typecheck PASS, lint 0 PASS, build PASS. `detect_changes` risk medium (changed symbol `recordRepayment`; affected processes `SettleLoanStack → LoanService`, `DeleteLoanStack → LoanService` — neighbouring paths surfaced by the class-level edit, not behaviour changes).

---

## BUG-19: Setup Wizard starting balances silently erased on next reload

- **Status:** fixed
- **Severity:** critical
- **Found:** 2026-10-17 (during: mobile UI audit — fresh guest profile, seeded accounts, reload)
- **Location:** `src/presentation/screens/SetupWizard.tsx:103` (`handleAddAccount` — `new Account(..., Number(accountDraft.balance))`) + `src/infrastructure/database/computeBalances.ts` / `SQLiteDatabaseService.recalculateBalances` (T-171 boot pass)
- **Description:** Wizard step 2 stores the "Starting balance" value directly on `accounts.balance` without creating an opening-balance transaction (the normal `AddAccountModal` flow, by contrast, saves the account with balance 0 and adds an `income` transaction tagged `isOpeningBalance: true`). On the next reload, boot's `recalculateBalances()` computes expected balances purely from the transaction stream (0 for a fresh account), sees 25,000 ≠ 0, and rewrites the row to 0. Observed: City Bank 25,000 + Cash Wallet 3,000 ("Total in Banks 28,000 BDT") → after one reload every surface (dashboard, member ledger, linked-accounts modal) reads 0 BDT. Expected: starting balances survive reload like normal-creation accounts. Severity = silent first-run data-wipe for every user who types a starting balance during setup.
- **Root Cause:** wizard saves starting balance as a raw account row field; boot balance math only replays transactions and treats the field as stale.
- **Fix Approach:** user-confirmed via deferred decision (user unresponsive; audit recommendation applied) — wizard `handleAddAccount` now saves the account with balance 0 and creates the `isOpeningBalance` income transaction exactly like `AddAccountModal`; boot replay then reproduces the balance, so nothing is rewritten. Live-verified: seeded 25,000 + 3,000 → reload → all surfaces still show 28,000 + both Opening Balance rows.
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, scoped lint clean, unit 113/113 PASS, build PASS.

---

## BUG-18: False sync conflict on a single device

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-17 (during: user report — conflict dialog while editing on one device only, no real data difference; mentions timestamp)
- **Location:** `decideSyncAction` + all four conflict-raising paths (`_maybeCloudSync`, `_cloudBootPull`, `reconcileAfterSignIn`, `checkRemoteUpdate` in `SQLiteDatabaseService.ts`) + `CloudUpdatePrompt.tsx` dialog copy
- **Description:** "Sync conflict — another device changed data" appears although only one device edits and both sides look the same. Expected: single-device states never raise a both-sides-moved choice.
- **Root Cause:** diagnosed 2026-10-17 (single tab + during-normal-use answers rule out multi-tab disagreement and sign-in/data-clear fingerprint loss): unconfirmed upload → stale fingerprint. An upload can land server-side while the client records failure (slow-network timeout on the response, stale verification read — BUG-15 timeouts made hangs fail, but a timed-out-while-successful upload still leaves meta stale). Next cycle the identical content triple-differs (local ≠ fingerprint, remote ≠ fingerprint) and `decideSyncAction` returns `conflict` — it never checks that local and remote are actually identical. The dialog's "Saved {time}" is then the user's own upload time, which is why the timestamp looks suspicious but meaningless.
- **Fix Approach:** user-confirmed (convergence guard) — `decideSyncAction` returns `idle` when local and remote hashes are identical regardless of fingerprint staleness; `_maybeCloudSync` heals the fingerprint + clears a same-state conflict on that path (conflict early-return moved after); NEW `healIfConverged()` re-verifies before `checkRemoteUpdate` re-alarms; sign-in reconcile refreshes stale fingerprints too; healed conflicts dismiss their own dialog. Genuine both-sides-moved states still ask.
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, full lint 0 PASS, unit 113/113 PASS (convergence tests), build PASS.

---

## BUG-17: Sync asks to sign in again on every app open

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-17 (during: user report — every Sync-now tap after opening the app demands Google sign-in)
- **Location:** `src/infrastructure/database/GoogleAuth.ts` (`getValidToken` persistence + silent renewal) + `CloudSyncSection.handleSyncNow` fallback
- **Description:** Each fresh app open followed by Sync now pops the Google sign-in instead of reusing the previous session. Expected: within the token lifetime (and whenever silent renewal can succeed) sync proceeds with no popup.
- **Root Cause:** diagnosed 2026-10-17 (hours-later + same-URL answers rule out storage loss): the GIS implicit-flow token lives ~1h; on reopen the saved token is expired and silent `prompt:'none'` renewal fails, so every old session falls through to the interactive popup. Silent path is fragile by construction — GIS opens a real popup even for `none` (see BUG-15), so popup blockers kill the gesture-less boot attempt and third-party-cookie/FedCM blocks kill the Google-session reuse. Environmental checks (cookies, popup allow, test-user status) may restore silent renewal on their own.
- **Fix Approach:** user-confirmed (stretch + smooth) — `requestToken` now returns the real `expires_in` lifetime instead of assuming 1h (all three grant paths); NEW `renewBeforeExpiry()` silently renews inside the final 10-min window (activation-gated, throttled, backoff-honoring, expired delegates to the normal path); NEW `ensureProactiveRenewal()` activity listener wired once in `AppLayout`. Long-idle reopens still need one tap (implicit-flow platform limit, no backend).
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, full lint 0 PASS, unit 112/112 PASS (5 new BUG-17 tests), build PASS.

---

## BUG-16: Google popup auto-closes with no callback; Sync-now bar stuck at 75%

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-16 (during: user report — header sync tap opened Google popup that auto-closed; Settings Sync now progress stuck half-done)
- **Location:** `src/infrastructure/database/GoogleAuth.ts` (`signIn`, `getValidToken`, `refreshInteractive`, `loadGis`) + `src/presentation/components/settings/CloudSyncSection.tsx:93` (`handleSyncNow` stage)
- **Description:** Tapping sync opens the Google sign-in popup which closes by itself without signing in. Tapping Sync now in Settings then leaves the progress bar stuck at 75% ("Syncing your data…") forever — no error, no recovery without reload. Expected: a closed/cancelled popup always settles into an error message and clears the bar.
- **Root Cause:** GIS token promises (`new Promise` around `requestAccessToken`) have no timeout and assume the callback always fires; `loadGis()` likewise never times out. When the popup dies without a callback (unauthorized origin, blocker/FedCM kill, dead-session edge), the await hangs forever so `setStage(null)` never runs. BUG-15 added network timeouts but NOT GIS-callback timeouts — this is the remaining hole. Trigger-side candidates: opened URL not in Google Console authorized origins, popup/FedCM blocking, third-party cookies off.
- **Fix Approach:** user-confirmed (timeouts + config check) — shared `requestToken` helper races every GIS callback against a timer (60s interactive, 10s silent; script load 15s); silent timeout settles as backoff-null, interactive timeout rejects so the bar always clears; sign-in timeout maps to an actionable origin/blocker error instead of the cancel copy.
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, full lint 0 PASS, unit 107/107 PASS (3 new BUG-16 timeout tests), build PASS.

---

## BUG-10: Nested collapsed disclosure leaks content (Google Drive Sync sliver)

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-16 (during: settings refresh S-2 verification, user report "Drive option going behind")
- **Location:** `src/presentation/components/settings/SettingsDisclosure.module.css:111` (`.trayOpen .trayInner`); visible in `BackupCard.tsx` (Google Drive Sync nested inside Backup & Storage card)
- **Description:** The collapsed Google Drive Sync section shows a clipped sliver of its body text ("Online sync is not set up…", cut mid-line) spilling into the Engine Health area. Top-level collapsed cards measure 0px; the nested tray measures ~29px. Expected: collapsed = 0px, nothing visible.
- **Root Cause:** `.trayOpen .trayInner` is a descendant selector — the open outer card's rule also matches the nested closed disclosure's trayInner, giving it open padding (12/16/16). The padding inflates the `0fr` grid track so one text line leaks. Any future nested disclosure would hit the same.
- **Fix Approach:** user-confirmed — scope the selector to `.trayOpen > .trayInner` (direct child) so open padding never reaches nested closed trays.
- **Resolved:** 2026-10-16 — one-selector fix on `feature/setup-settings-refresh`; verified live (nested Drive tray 29px → 0px, top-level trays unaffected); CHANGELOG entry deferred to `dev` merge.

---

## BUG-15: Background silent renewals spam blocked popups; Sync now bar sticks

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-16 (during: user report — Sync-now progress never finishes + console shows 6× `GSI_LOGGER: Failed to open popup window … prompt=none … Maybe blocked by the browser?`)
- **Location:** `GoogleAuth.getValidToken()` silent path (called from boot/flush background paths) + `CloudSync` Drive fetches (no timeouts)
- **Description:** (1) Every background silent renewal opens a REAL popup even with `prompt:'none'`; outside user gestures the blocker kills it, so after the hourly token dies the app spams doomed popups on every flush/poll instead of settling into 'reconnect'. (2) `syncNow`'s Drive fetches have no timeout — on a hanging network the Sync-now progress bar sticks at 75% forever instead of failing into an error state.
- **Root Cause:** silent GIS renewal retried unconditionally per call with no per-session backoff; network layer assumes failure, never hangs.
- **Fix Approach:** (1) per-session silent-renewal backoff in `getValidToken` — one failure stops background GIS attempts until explicit sign-in/refresh succeeds or sign-out (explicit taps always attempt); (2) 30s `fetchWithTimeout` on all 6 Drive calls + profile fetch, so hangs surface as errors and the bar always completes.
- **Resolved:** 2026-10-16 — on `feature/setup-settings-refresh`; typecheck + scoped lint clean, unit 94/94 (backoff + timeout tests), e2e cloud-sync 4/4; CHANGELOG entry deferred to `dev` merge.

---

## BUG-14: Next-morning re-auth popup opens then closes by itself

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-16 (during: user report — signed in last night, morning Sync-now shows Google popup that auto-closes)
- **Location:** `src/infrastructure/database/GoogleAuth.ts:215` (`signIn`) + `:324` (`refreshInteractive`) — both `requestAccessToken({ prompt: '' })`
- **Description:** Access tokens live ~1h (GIS implicit flow, no refresh tokens); overnight the persisted token expires and silent `prompt:'none'` renewal fails (dead Google session / blocked third-party cookies). The explicit-tap fallback opens the popup with `prompt:''`, which fails closed (instant error, popup auto-closes) instead of offering the account chooser. Expected: tapping Sign in / Sync now always presents the chooser.
- **Root Cause:** `prompt:''` lets Google attempt silent issuance inside the popup and die with no UI; explicit user taps need `prompt:'select_account'`.
- **Fix Approach:** explicit taps (`signIn`, `refreshInteractive`) now request `prompt:'select_account'` — chooser always offered; silent `prompt:'none'` path untouched for background callers.
- **Resolved:** 2026-10-16 — on `feature/setup-settings-refresh`; typecheck + scoped lint clean, unit 92/92 (prompt assertions added/updated); CHANGELOG entry deferred to `dev` merge.

---

## BUG-13: Splash progress bar vanishes mid-splash, never shows completion

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-16 (during: user report — bar shows "Starting…" then nothing until app loads)
- **Location:** `src/presentation/components/SplashScreen.tsx:80` (`{!ready && showProgress && ...}`)
- **Description:** On boots slower than 600ms the progress bar appears, but unmounts the instant `ready` fires — while the splash lingers ~800ms more for typing + fade. Users see a frozen "Starting…" flash, never staged progress or completion. Expected: bar stays through fade-out showing 100%.
- **Root Cause:** `!ready` in the render gate unmounts the bar (and its final 100%/Finalizing paint, batched with `ready`) before the fade completes. ProgressBar itself applies every update (T-165) — it just never stays mounted to show them.
- **Fix Approach:** render gate `{showProgress && ...}` with `ready ? 100/'Ready' : percent/status` — bar stays mounted through typing + fade showing completion.
- **Resolved:** 2026-10-16 — one-condition fix on `feature/setup-settings-refresh`; NEW e2e `17-splash` green (delayed engine → staged labels → Ready visible through fade → app loads); CHANGELOG entry deferred to `dev` merge.

---

## BUG-12: Startup timed out — recovery screen after dev restart / sign-out-erase window

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-16 (during: user manual test — Database Error "Startup timed out. Your data may need recovery." with restore auto-backup / Start Fresh options)
- **Location:** boot init path (`getDatabase`/`initDatabase`, splash watchdog) — possibly connected to sign-out-erase `resetStorage()` on `feature/setup-settings-refresh`
- **Description:** App boots into the Database Error recovery screen instead of normal startup. Observed after the dev-server restart / sign-out-erase testing window. Expected: normal boot to dashboard/wizard.
- **Triage 2026-10-16:** loaded `/` read-only via probe — boots clean to dashboard, all 5 members + balances present, 0 console errors. Data is NOT wiped (rules out a completed sign-out-erase) and current boot is healthy. Server responds 200; repeat probe also clean — failure is isolated to the user's browser tab (hung boot / stale service worker / stuck recovery screen), not server or data. Awaiting what the tab shows.
- **Triage 2026-10-16 (2):** user confirms Playwright (clean profile) loads perfectly, normal Chrome errors repeatedly → profile-specific stored state (their OPFS/IDB/SW), not server or code. Error text is the watchdog ("Startup timed out") = a >15s HANG, not a thrown init error. Next: user tries Restore Latest Backup (safe) + shares console errors + storage size.
- **Triage 2026-10-16 (3):** restore completed (console clean) but after minutes-long load the app shows the SETUP WIZARD = restored DB has no members (+ setupComplete false). Mechanism: `restoreNewestSnapshot()` restores slot 0 = newest ring entry — and `resetStorage()`/empty flushes snapshot the EMPTY db into slot 0, so newest ≠ good data. Older slots may still hold the real data. Also user's dev server is DOWN (vite WS "server connection lost" in their console) — must restart and leave running. Next: snapshot inventory from their console (slots/times/sizes + settings flag), then restore the correct older slot; DO NOT enter wizard data yet (new snapshots rotate the ring).
- **Root cause 2026-10-16 (4, user-confirmed trigger: AFTER my sign-out-erase):** two defects in my path: (1) `resetStorage()` flushes the empty schema THROUGH the snapshot ring — slot 0 becomes an empty snapshot, so any later "Restore Latest Backup" lands on an empty DB → wizard. The sign-out wipe itself worked (e2e green); (2) recovery screen offers ONLY newest slot, no way to pick an older one. Fix: suppress snapshot during reset flush + exact-slot restore + slot picker UI + watchdog message names the stalled stage. Server flapping (repeated :3000 kills) explains the hangs/load delays.
- **Root Cause:** (unknown until diagnosed — candidates: OPFS state left by `resetStorage().clearAll()` + re-init; splash watchdog firing on slow ID-less/GIS boot; unrelated OPFS corruption)
- **Fix Approach:** user-confirmed direction (make recovery work + app loads to wizard): (1) `resetStorage()` suppresses the snapshot ring while flushing the empty schema — slot 0 can never be an empty snapshot again; (2) NEW `restoreSnapshotExact()` on the port/service (no fallback, per-slot errors); (3) recovery screen lists every slot with time + exact restore buttons + truthful Start Fresh copy ("resets to empty"); (4) watchdog message names the stalled boot stage.
- **Resolved:** 2026-10-16 — full computer restart cleared it; hosted + dev apps both load normally. Root cause was OS/machine-level (stale loopback sockets, zombie `vite`/Chrome processes from repeated :3000 kills, or a hung profile network service) — never app code or data: clean profiles always booted, and no data was lost. All hardening shipped along the way stays (slot picker, exact restore, no empty snapshots, boot/storage timeouts, busy states, guest sync entry, sign-out-erase). Lesson: after 2–3 kill/restart cycles, reboot before blaming the app. CHANGELOG entries ride with the `dev` merge.

---

## BUG-11: Primary Member uses native select (design mismatch); effect is invisible
- **Verification 2026-10-16:** typecheck PASS, scoped lint clean, NEW e2e `16-recovery` green (forced engine failure → Database Error UI + actions, slot list degrades without crashing), fresh-profile boot lands on the 4-step wizard with 0 errors. User action still needed: restart dev (was down), reload normal Chrome — expect the wizard (device was wiped by their sign-out, as requested) — then sign in / re-setup; older slots only help if they predate the wipe.
- **Root cause 2026-10-16 (4, from pasted screen):** stall was at boot stage `Starting…` = the sql.js engine file never finished loading (dead/restarting server), and Start Fresh silently no-ops without the engine (needs storage+SQL) → dead-end loop. Fixed: `wipePersistedStorage()` engine-free wipe (OPFS files + LS keys + cloud-sync IDB; auth/settings kept) wired to Start Fresh + `setupComplete:false` + reload; engine download now has a 10s timeout with an actionable message ("is the dev server running?") instead of a 15s mystery hang.
- **Triage 2026-10-16 (5):** user confirms MCP (clean profile) loads, normal Chrome still fails → 100% profile-local (SW/OPFS/IDB/extensions), server+code exonerated. Discriminator: incognito load test + exact current message (new code names the stalled stage).
- **Triage 2026-10-16 (6):** all 4 profile steps exhausted (single tab, hard refresh, SW unregistered, extensions off), other browsers fine → remaining suspect is the origin storage APIs themselves hanging (no error, just pending) — the one boot path with zero timeout. Fixed: 12s `withStorageTimeout` around adapter init + main read + snapshot recovery + slot-list load; hung origin now fails fast into the working Start Fresh instead of the 15s watchdog loop.
- **Triage 2026-10-16 (7):** user clarifies device is empty (expects wizard) but recovery buttons appear dead. Cause: recovery actions had no busy feedback and could hang silently on the same poisoned storage (wipe awaited hung stores forever; restore loop uncapped). Fixed: per-store 8s timeouts with a `WipeReport` (opfs/local/cloudMeta) + manual-clear guidance naming failed stores; all restore paths capped; Restoring…/Wiping… busy states; actions mutually disabled while one runs.
- **Triage 2026-10-16 (8):** hosted STABLE version also fails in the SAME single Chrome profile, works in user's other profiles. Different origin (separate OPFS/IDB/SW/cache) + released code (no branch changes) → exonerates dev server, all recent code, AND origin site data. Remaining suspects are profile-global: extensions, flags/policies, GPU/WASM environment. Next: exact hosted failure text + console, extension list diff.
- **Triage 2026-10-16 (9):** hosted shows the same 15s watchdog on OLD released code → hang is in long-stable paths (engine/storage/balances), profile does it to every origin. Per-profile network layer is now prime suspect: Chrome proxy and Secure-DNS settings are per-profile (a dead proxy / dead DNS provider hangs every fetch on every site, matching both origins). Extension-disable still unconfirmed. Next: confirm extensions all-off, proxy + SecureDNS state, chrome://version command line.

---

## BUG-11: Primary Member uses native select (design mismatch); effect is invisible

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-16 (during: settings refresh, user report "dropdown not matching + function not working")
- **Location:** `src/presentation/components/settings/sections/MoneyRegionFields.tsx:47` (native `<select>`)
- **Description:** The Primary Member dropdown is a browser-native select while every other picker in the app uses the modal-picker pattern (DESIGN_IDENTITY §9 deprecates native selects) — popup styling/behavior doesn't match. Separately, setting it changes nothing visible: it only attributes new transactions' memberId (`transactionForm/useSubmit.ts:52`), so users can't tell it worked.
- **Root Cause:** (design) native select never migrated when T-155 established the picker pattern; (perception) no helper copy and no visible confirmation of what Primary Member does.
- **Fix Approach:** user-confirmed modal picker — NEW `MemberPicker` (trigger + overlay + list, own tokens-only CSS, reduced-motion guard) in `MoneyRegionFields`, plus "New transactions belong to this member." helper.
- **Resolved:** 2026-10-16 — on `feature/setup-settings-refresh`; verified live (open → pick Namira → Save → id persisted + trigger label updates; reset to null after); CHANGELOG entry deferred to `dev` merge.

---

## BUG-9: Big amounts clipped on the left in Recent Transactions

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-02 (during: `feature/ui-polish` verification, page feedback)
- **Location:** `src/presentation/screens/Dashboard.module.css` `.txAmount`; `LedgerTable.module.css` `.debit/.credit/.balance`
- **Description:** Long amounts (e.g. 7+ digits + arrow + currency) exceed the fixed 100px amount cell; the cell can't shrink and content is nowrap right-aligned, so digits overflow to the left and get cut. Expected: full amount always visible.
- **Root Cause:** Fixed-width amount column sized for small numbers; ledger cells were additionally center-aligned so overflow clipped both sides with no readable anchor.
- **Fix Approach:** owner-approved scope (dashboard + ledgers) — dashboard cell `width` → `min-width` (grows, description flexes); ledger amount cells `center` → `right` so leading digits + ellipsis stay readable. NOTE: `minmax` tracks were considered for ledgers but rejected — header and rows are separate grids sharing the template, so content-sized tracks would misalign them.
- **Resolved:** 2026-10-02 — two CSS-only edits on `feature/ui-polish`; build + typecheck green; impact LOW (LedgerTable: 3 render-only consumers).

---

## BUG-8: Dashboard "New Transaction" icon + label wrap to two lines

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-02 (during: app-wide button-animation rollout verification, page feedback on `/`)
- **Location:** `src/presentation/screens/Dashboard.tsx:54` (`actBtn actPrimary`)
- **Description:** The "New Transaction" button shows its plus icon and label stacked on two lines instead of one row. Expected: icon + label side by side with the 8px flex gap.
- **Root Cause:** The rollout wrapped the svg + text in a single `.anim-target` span inside the row-flex `.actBtn` (`gap: 8px`) → flex gap lost, inline content wraps.
- **Fix Approach:** split into two `.anim-target` spans sharing one replay key (same pattern as the MemberList/OtherLedgersIndex card fix).
- **Resolved:** 2026-10-02 — split spans committed on `feature/ui-polish`; tree-wide audit confirms no other svg+text single-span wrappers; typecheck + eslint clean.

---

## BUG-5: Account card text unreadable in light mode (+ missed on-primary whites)

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-02 (during: Phase 17 follow-up, user report)
- **Location:** `AccountCard.module.css` `.card`/`.actions`; filter/add buttons in `OtherLedgerDetail`, `GroupLedgerScreen`, `GroupsListScreen`, `MemberProfile`
- **Description:** Account cards keep their fixed dark gradients in light mode, but `.name`/`.balance`/`.type` inherit theme ink → dark text on dark card. Card action buttons use theme-secondary (same failure). Separately, several solid-primary buttons still use hardcoded white (`filterPillActive`, `addBtn:hover`, `obBtn`, `filterIconBox`) — missed in the T-137 on-primary sweep, breaking under gold/teal accents. Also `.card:active` paints a wash that stomps the gradient (same pattern as BUG-4).
- **Root Cause:** Card chrome never declared its own ink color (relied on dark-mode body text); sweep only covered gradient backgrounds, not solid-primary ones.
- **Fix Approach:** owner-approved option A (dark cards, white ink) — `.card` pins `color:#fff`, actions go white/white-hover, `:active` becomes press-scale instead of wash; missed solid-primary whites swept to `var(--color-text-on-primary)`.
- **Resolved:** 2026-10-02 — fix commit on `feature/theme-accent`; verified live on demo.db (light mode: real card gradient bg + all-white text via computed styles). CHANGELOG entry deferred to `dev` merge.

---

## BUG-3: Accounts list shows stale balance (0) right after Add-Account

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-08-24 (during: BUG-2 reproduction testing)
- **Location:** `AddAccountModal.tsx` handleSave → `useAccountStore.accounts`
- **Description:** After creating an account with an initial balance, the in-memory accounts store still reported the pre-transaction snapshot (balance 0) because only the transactions store was updated; the UI corrected itself on next remount/refetch.
- **Root Cause:** Modal awaited `saveAccount` + `addTransaction` but never re-fetched accounts.
- **Fix Approach:** owner-approved — call `fetchAccounts()` after the opening-balance transaction in `handleSave`.
- **Resolved:** 2026-08-24 — commit adds `await fetchAccounts()`; verified live (immediate balance 777 visible post-save, no reload).

---

## BUG-4: Dashboard "+ New Transaction" label unreadable on hover in light mode

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-02 (during: Phase 16 light-mode verification, user report)
- **Location:** `src/presentation/screens/Dashboard.module.css` `.actBtn:hover` vs `.actPrimary`
- **Description:** In light mode, hovering the gradient "+ New Transaction" button washes the label out. Observed: hover background turns near-white while the label stays white. Expected: gradient persists on hover with a glow/opacity shift, label stays readable.
- **Root Cause:** `.actBtn:hover` (specificity 0,2,0) sets a wash `background`, which beats `.actPrimary`'s gradient (0,1,0); `.actPrimary:hover` only sets `opacity`, so it never restores the background. In dark mode the wash-over-dark stayed readable, which hid the defect.
- **Fix Approach:** owner-approved option A (scoped variant hover) — `.actPrimary:hover` re-asserts the primary gradient + opacity/glow, matching every other gradient button.
- **Resolved:** 2026-10-02 — fix commit on `feature/theme-accent`; verified live (light-mode hover keeps gradient + white label, screenshot + computed-style check). CHANGELOG entry deferred to `dev` merge.

---

## BUG-2: App "restarts" while creating a new account under a member

- **Status:** wontfix
- **Severity:** high
- **Found:** 2026-08-24 (during: user manual test report)
- **Location:** Add-Account flow (MemberProfile → AddAccountModal)
- **Description:** App appeared to restart while creating an account under a member.
- **Root Cause:** Could not reproduce in current build (v1.0.0+): scripted E2E run created an account under a member with **no reload** (page marker survived), correct member link, and correct persistence (opening balance 500 + Opening Balance transaction verified after reload). Strongest explanation: Vite dev-server auto-restarts/full-reloads during the recent heavy editing sessions — browser tabs auto-refreshed mid-action, which looks exactly like an app restart. Production/PWA builds have no such trigger.
- **Fix Approach:** none required for the app. If it recurs outside dev-server sessions, capture the time + console state and reopen.
- **Resolved:** 2026-08-24 — closed as dev-environment artifact; see BUG-3 for the real (minor) issue found during this investigation.

---

## BUG-1: Real family names and financial PDF persist in tracked docs and git history

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-08-24 (during: full-project PII name audit requested by owner)
- **Location:** `Project_plan/Financial_Review.md` (25 hits), `Project_plan/*.md`, `DESIGN_FILES/*.html`, `DESIGN.md`, `docs/PRD.md`, `AGENTS.md`, `session_log.md`, and **git history**: PDF blob added in `f9f802a`, removed at HEAD by `68f3771`, still reachable from `master`
- **Description:** SECURITY.md §5 forbids real person names tied to financial figures. Full names were present across 14+ tracked files and an exported loan-ledger PDF remained extractable from history. Runtime code was already clean.
- **Root Cause:** Scaffolding docs authored from the family's real spreadsheet audit; mockups reused real member names; data PDF slipped into one fix commit before `.gitignore` covered `USER_DATA/`.
- **Fix Approach:** owner-approved Option B2 — full `git filter-repo` rewrite on a mirror clone: USER_DATA paths purged + all family/counterparty names replaced with role placeholders across every commit; all refs force-pushed.
- **Resolved:** 2026-08-24 — history rewrite (all SHAs replaced; pre-rewrite backup bundle `C:\Dev_Projects\moneyflows-backup-pre-rewrite.bundle`; post-rewrite scan shows 0 tracked files with real names). Residual platform caveat documented in `docs/audit/PII_NAMES_AUDIT_2026-08-24.md` §7.

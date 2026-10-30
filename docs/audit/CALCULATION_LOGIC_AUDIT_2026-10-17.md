# MoneyFlows — Calculation & Logic Audit

**Date:** 2026-10-17
**Scope:** All calculation-bearing modules — balance engine, loans, other ledgers, reports, dashboard, member profile/ledger, groups, recycle bin, write paths
**Method:** Static read of source (manual code review, line-level verification of every claim). No tooling/gates run — this was a read-only audit, no code was changed.
**Git state at time of report:** branch `dev`, HEAD `14105ee`
**Findings register:** every finding below is logged in `docs/BUGS.md` as **BUG-21 … BUG-37**

**Reading order:** §0 explains every finding in plain language for a non-technical reader. §1 onwards is the technical detail (file/line references, code snippets, evidence) for whoever does the fixing.

---

## 0. In plain language (read this first)

### The big picture

The app keeps two sets of records that must always agree:

- **The receipt book** — every transaction entered (income, expense, transfer, loan).
- **The wallet balances** — what each account currently holds.

Every time something is added, edited, or deleted, both must be updated together. Almost everything below is a case where the two drifted apart, or where a number on screen is calculated from the wrong ingredients.

**What was found: 17 issues.** 4 serious, 4 moderate, 9 minor. Only **one** of the 17 can quietly corrupt saved data — the rest are wrong numbers on screen: annoying, but not destructive.

**How they were found:** by *reading the code*, not by clicking through the app. Before fixing the two most serious ones, they should be reproduced live to be certain.

### The four serious issues

**1. The Edit screen lets nonsense through** → BUG-24

When a transaction is *created*, the app checks it carefully: the amount must be a real positive number, the description can't be empty, the date must be valid, money can't be sent to the same account it came from. When an existing transaction is **edited, none of those checks happen.**

*What you'd notice:* clear the amount box on an edit and press Save → it saves as **0**. Type letters → a "not a number" value is stored. That broken value gets added into the account balance, and from then on **that account's balance is ruined permanently** — it survives reloads and spreads into totals, reports and the dashboard.

*How bad:* the one real data-corruption risk. It takes a deliberate mistake (clearing the box, typing text), so it won't happen by accident — but when it does, a single wrong edit damages otherwise-fine data.

*The fix:* make Edit go through the same checks as Create. No visible change when the app is used correctly.

**2. Overpaying a loan quietly loses the extra money** → BUG-23

Lend someone 10,000 and they repay 12,000: the app correctly marks the loan "fully settled", but **silently throws away the extra 2,000** in the loan record, while the money ledger records the full 12,000.

*What you'd notice:* the loan screen says "fully repaid", but the loan report says more was recovered than was lent — the same loan tells two different stories. There is also **no warning** when overpaying; it is just accepted.

*How bad:* nothing is corrupted, but the loan report can't be trusted whenever someone overpays.

*The fix:* needs a **business decision** (see §0 "Decisions needed" below) — block it, warn and trim, or record the extra.

**3. Monthly statements don't add up (for past months)** → BUG-22

A statement must obey one rule: **opening + money in − money out = closing.** When a report is run for a period that has already passed, the *closing* figure is taken from today's live balance instead of the balance at the end of that period.

*What you'd notice:* run a member report for, say, last March. The rows stop at March, but "Closing" includes everything that happened *after* March — so the arithmetic visibly doesn't balance, and the bottom line is wrong.

*Why it went unnoticed:* the automated tests only cover reports ending at the most recent transaction — exactly the case where the wrong method accidentally gives the right answer.

*The fix:* use the period-end balance as closing.

**4. Dashboard trend arrows compare the wrong things** → BUG-21

Each dashboard card (Cash in Hand, Total in Banks, Active Loans, Total Assets) shows a percentage labelled **"vs last month"**. The four cards don't use the same formula — two compare against *this month's* activity, two against *last month's* — and "Active Loans" subtracts income/expenses from a loan total, which are unrelated quantities.

*What you'd notice:* the percentages look plausible but don't mean what the label says. If an account had a zero or negative baseline, the card silently shows **0.0%**, which reads as "no change" when it really means "couldn't be worked out".

*The fix:* one definition applied to all four cards, labelled honestly.

### The four moderate issues

**5. Loans are counted as spending and income** → BUG-25 — Lending money out is counted as an *expense* and a repayment as *income*. But lending isn't spending: the money didn't leave the family, it changed form (cash → a debt owed to you). This distorts the monthly summary and feeds the trend arrows in issue 4. *You'd notice* monthly totals looking worse than reality in a month where money is lent out.

**6. "Total Income" and "Total Expenses" aren't measuring the same things** → BUG-26 — Income counts *only* income transactions; expenses count expenses **plus** loan issuance and lending. The two numbers shown side by side on a member's page aren't a fair comparison. *You'd notice* a skewed member summary.

**7. Loan repayment progress bar ignores finished loans** → BUG-27 — In a stack where one loan is fully paid off and another is new, the progress bar reports close to 0%, because it only measures loans still open. *You'd notice* a borrower who repaid most of their debt showing almost no progress.

**8. Group PDF exports only the rows visible on screen** → BUG-28 — A group with 40 transactions exports a PDF containing **only the first 10**, silently. *You'd notice* a shared statement missing most of the history.

### The nine minor issues

| Plain language | Ref |
|---|---|
| **Recycle Bin "Total Amount" adds unlike things** — transaction amounts + account balances + ledger opening balances summed into a single figure, which is meaningless as a total (and puts a minus sign in front of positive balances). | BUG-29 |
| **Deleted ledgers are labelled "Account", but the Accounts tab never shows them** — visible under "All Items", unreachable by tab. | BUG-30 |
| **Decimals are blocked when creating but allowed when editing** — creating forces whole numbers, editing accepts `100.50`. | BUG-31 |
| **A hidden balance bug** — viewing all accounts together (none specifically chosen) would show a wrong running balance. *Invisible today* because that column is hidden in that view, but the wrong calculation still runs underneath. | BUG-32 |
| **Balance column isn't formatted** — shows `1234567.8912` instead of a grouped, readable number, unlike every other screen. | BUG-33 |
| **A fully-paid loan can be labelled "on track"** — the wording means "repaying on schedule", but the app uses it for "finished". | BUG-34 |
| **Technical: editing one ledger entry touches every entry in that ledger** — harmless today; creates churn that sync features may notice later. | BUG-35 |
| **Unused leftover loan-creation code, with a trap** — one unused function, if ever switched on, would record a loan you *received* as one you *gave out* (reversed meaning). | BUG-36 |
| **An unused summary function with wrong labels** — counts mobile-wallet and business balances as "active loans". Nothing uses it today; a loaded gun if something does. | BUG-37 |

### Recommended order of work

| Order | What | Why this order |
|---|---|---|
| 1 | **BUG-24** (edit validation) + **BUG-23** (overpayment) | The only two that affect *stored data* |
| 2 | **BUG-22** (statement closing balance) | Wrong bottom lines on statements shown to people |
| 3 | **BUG-21** + **BUG-25** (dashboard math) | Misleading trend numbers on the main screen |
| 4 | **BUG-26**, **BUG-27**, **BUG-28** | Skewed summaries and incomplete PDFs |
| 5 | The nine minor ones | Tidy-up; several fold into earlier fixes (BUG-31 is fixed by the same change as BUG-24) |

### Decisions needed from the user

Only three things require a judgement call rather than a technical choice:

1. **Overpayment (BUG-23)** — block it, warn and trim, or record the extra? This is a business rule.
2. **Data already damaged (BUG-24)** — if an edit already stored a broken amount, that damage is already in the database. Fix forwards only, or add a startup check that *detects and reports* suspect records, or detect **and** auto-repair by recalculating balances? Recommended: **detect and report first** — never silently rewrite financial records.
3. **Scope of the first step** — suggested start: **BUG-24**, with BUG-31 riding along (same root cause).

---

## 1. Summary

| | Count |
|---|---|
| Findings total | 17 |
| High | 4 |
| Medium | 4 |
| Low | 9 |
| Verified non-defects (examined, no action) | 3 |
| Fixes applied | **0** (user requested the report first) |

| ID | Sev | Module | Issue |
|---|---|---|---|
| BUG-21 | high | Dashboard | Metric chips use two different formulas behind one "vs last month" label |
| BUG-22 | high | Reports | `closing` is the live balance, not the period-end balance |
| BUG-23 | high | Loans | Overpayment dropped from the loan record but booked in full as a repayment |
| BUG-24 | high | Write path | `updateTransaction` bypasses validation → edits can corrupt balances |
| BUG-25 | medium | Dashboard | Loan movements counted as income/expense, distorting every "net" figure |
| BUG-26 | medium | Member profile | "Total Income" and "Total Expenses" are not comparable |
| BUG-27 | medium | Loans | Repayment progress / total recovered exclude settled loans |
| BUG-28 | medium | Groups | Ledger PDF exports only the visible page of rows |
| BUG-29 | low | Recycle Bin | "Total Amount" sums incomparable quantities |
| BUG-30 | low | Recycle Bin | Other-ledger rows labelled "Account" but unreachable via the Accounts tab |
| BUG-31 | low | Write path | Amount entry rules differ between create and edit forms |
| BUG-32 | low | Member profile | Running balance wrong without an account selected *(latent)* |
| BUG-33 | low | Member profile | Balance column rendered without locale formatting |
| BUG-34 | low | Loans | `on_track` status actually means "fully repaid" |
| BUG-35 | low | Other ledgers | `recomputeBalances` rewrites `updated_at` on every entry |
| BUG-36 | low | Loans | Unused loan-store methods, one with inverted semantics |
| BUG-37 | low | Data layer | `getFamilySummary` mislabels account types as loans; unused |

---

## 2. Dashboard — metric trend math

### BUG-21 · HIGH — Four cards, two different formulas, one label

`src/presentation/screens/dashboard/useDashboardData.ts:42-52` + `sections.tsx:23,28,33,41`

```ts
prevAssets = totalAssets  - thisMonthNet     // this month's net
prevCash   = cashInHand   - thisMonthNet     // this month's net
prevBanks  = totalInBanks - lastMonthNet     // last month's net
prevLoans  = activeLoansOutstanding - lastMonthNet
```

- `Total Assets` and `Cash in Hand` use **this month's** net as the numerator; `Total in Banks` and `Active Loans` use **last month's** net. All four chips are labelled `"vs last month"`.
- `loansChange` subtracts an income/expense net from a loan *stock* (outstanding) — a flow of one quantity minus a stock of another. The number is dimensionally meaningless.
- `thisMonthNet` / `lastMonthNet` are family-wide but applied to single buckets (`Cash in Hand`, `Total in Banks`), so an expense paid from a bank account also moves the *cash* baseline it never touched.
- `prevX > 0 ? … : 0` → a zero or negative baseline silently reports `0.0%`, which reads as "no change" rather than "not applicable".

**Impact:** every trend chip on the dashboard is either the wrong period or an invalid quantity; only the +/- sign is partly meaningful.

### BUG-25 · MEDIUM — Loan movements counted as income/expense

`useDashboardData.ts:11-12`

`INCOME_TYPES` includes `loan_repayment`, `repay`, `loan_received`; `EXPENSE_TYPES` includes `loan_issue`, `lend`, `loan_paidback`. Lending money out is an asset conversion (cash → receivable), not an expense; a repayment is not income. These sets feed `thisMonthNet`/`lastMonthNet` (and therefore every chip in BUG-21) plus the `MonthSummary` panel.

---

## 3. Member profile & ledger

### BUG-26 · MEDIUM — "Total Income" vs "Total Expenses" are not comparable

`src/presentation/screens/memberProfile/useMemberData.ts:57-58` (rendered by `ProfileHero.tsx:70-71`)

```ts
totalIncome   = t.type === 'income'
totalExpenses = t.type === 'expense' || t.type === 'loan_issue' || t.type === 'lend'
```

Income counts only raw `income` (which includes opening-balance transactions), while expenses also swallow lending and loan issuance. Nothing is counted on the income side for `repay` / `loan_repayment` / `loan_received`. The two hero stats sit side by side as if symmetric.

### BUG-32 · LOW — Running balance is wrong whenever no account is selected *(latent)*

`useMemberData.ts:84-99`, duplicated in `pdfExport.ts:14-18`

```ts
if (loanLike.has(tx.type)) return tx.destAccount === selectedAccountId;
```

With `selectedAccountId === null` this is always `false`, so every transfer/loan is treated as a debit and an internal transfer subtracts *both* legs from the running balance. Currently masked because `showBalance = !!selectedAccountId` (`MemberProfile.tsx:27`) hides the column — so it is latent, but the arithmetic is still executed and the same predicate is reused by the PDF path.

### BUG-33 · LOW — Balance rendered unformatted

`useMemberData.ts:99` → `balance: String(balance)` → `LedgerTable` renders it verbatim. Every other surface uses `formatAmount()`; this one prints `1234567.8912` with no grouping or locale digits. Also a divergence from the DESIGN_IDENTITY no-hardcoded-formatting rule.

---

## 4. Reports

### BUG-22 · HIGH — Closing balance is the live balance, not the period-end balance

`src/reports/application/MemberReportService.ts:112-155`

```ts
const netFull = full.reduce(...);            // all transactions, no period filter
const impliedOpening = acct.balance - netFull;
let running = impliedOpening + prePeriod;
...
closing: acct.balance,                       // ← always the current balance
```

`opening` is derived by unwinding *all* transactions, while `running` stops at the last in-period row. So for any range that ends before the last transaction:

**Opening + Credit − Debit ≠ Closing** — and `summaryClosing` (`:163`) inherits the error.

**Why the tests are green:** `MemberReportService.test.ts` only exercises ranges ending at the final transaction, where the two definitions coincide.

---

## 5. Loans

### BUG-23 · HIGH — Overpayment is dropped from the loan record but booked in full

`src/loans/application/LoanService.ts:104-127` + `src/loans/infrastructure/LoanDatabase.ts:168-190`

```ts
const applied = Math.min(remaining, loan.outstanding);
loan.outstanding -= applied; remaining -= applied;
...
const tx = new Transaction(..., 'repay', ..., params.amount, ...);   // full amount
```

Leftover `remaining` is silently discarded while the transaction records the full repayment. Consequence: the loan stack reports 100% settled while the ledger shows more repaid than was lent, and no warning is shown.

`LoanService.generateReport` derives outstanding from the transaction stream and can go **negative** (asserted at `LoanService.generateReport.test.ts:49`, `-2000`) while the stack clamps at `Math.max(0, …)` — two surfaces disagreeing about the same loan.

### BUG-27 · MEDIUM — Repayment progress excludes settled loans

`LoanDatabase.ts:164-202`

Settled loans are moved out of `activeLoanItems` *before* `totalActiveAmount` / `totalActiveRecovered` are computed, so `progressPercent` (`:202`) and `totalRecovered` (`:201`) describe only the still-open loans. A stack with one loan fully repaid and one freshly issued reports ~0% progress and understates money actually recovered.

### BUG-34 · LOW — `on_track` means the opposite of what it sounds like

`LoanDatabase.ts:171-178` — a loan with `outstanding <= 0` but `status !== 'settled'` is mapped to `on_track`. That label reads as "paying on schedule" but means "paid off".

### BUG-36 · LOW — Unused loan-store methods, one with inverted semantics

`src/loans/presentation/stores/useLoanStore.ts:41-43, 195-259` — `createGivenLoan`, `createReceivedLoan`, `recordPayback` have no UI caller. `createReceivedLoan` is a line-for-line copy of `createGivenLoan` (identical `lenderAccountId: params.sourceAccount` mapping, and it is missing the `throw err` that `createGivenLoan` has), so if it were ever wired up, a loan you *received* would be recorded as a loan you *gave out* — an inverted balance effect.

---

## 6. Data integrity — write paths

### BUG-24 · HIGH — `updateTransaction` bypasses all validation

`src/infrastructure/database/SQLiteDatabaseService.ts:1274-1283` vs `:1267-1272`
UI entry: `src/presentation/modals/TransactionEditModal.tsx:61,85` + `src/presentation/components/FormField.tsx:80-87`

The create path calls `validateTransaction` (`:1214`: positive finite amount, description 1–200 chars, parseable date, existing active accounts, source ≠ dest). The **update path never calls it**, and the edit modal posts `Number(amount)` from an unsanitized free-text input.

Reachable through normal UI:

| Input | Result |
|---|---|
| blank amount | `0` |
| non-numeric | `NaN` |
| negative amount | accepted |
| empty description | accepted |
| invalid date | accepted |
| inactive account | accepted |
| `source === dest` | accepted |

`applyBalanceChange` (`:1305-1317`) then writes that delta straight into `accounts.balance`, so **a single edit can permanently poison a balance** (NaN/NULL survives the flush).

### BUG-31 · LOW — Amount entry rules differ between create and edit

Create (`TransactionFormModal.tsx:171-174`) strips every non-digit and uses `parseInt` — whole numbers only, decimals untypeable. Edit (`FormField.tsx:80-87`, `inputMode="decimal"`, no sanitizing) accepts decimals and garbage. So a value that cannot be created can be produced by editing an existing transaction, and there is no maximum bound in either path.

---

## 7. Recycle Bin

### BUG-29 · LOW — "Total Amount" sums incomparable quantities

`SQLiteDatabaseService.ts:1415-1426` maps: transaction → `amount`, account → `balance`, other ledger → `opening_balance`, other entry → `debit + credit`. `RecycleBin.tsx:49-52` then adds them all into one headline figure, and `:169` prefixes every value with `-` (so a positive deleted account balance renders as a negative number).

### BUG-30 · LOW — Tab labels and counts don't match the set

`RecycleBin.tsx:38,46` filter on `type === 'account'`, but `:165-168` label *anything* non-transaction as `"Account"` with a bank icon. Deleted `other_ledger` / `other_entry` rows therefore appear under **All Items** as "Accounts" yet never appear under the **Accounts** tab.

---

## 8. Groups & other ledgers

### BUG-28 · MEDIUM — Group ledger PDF exports only the visible page

`GroupLedgerScreen.tsx:102-106, 235-316` — `searchFilteredTxs` is the `displayLimit` page slice (default 10 rows), and the PDF is built from it. Rows beyond the first page are silently omitted, and the exported opening/net figures are page-scoped.

### BUG-35 · LOW — `recomputeBalances` rewrites `updated_at` on every entry

`OtherLedgerService.ts:163-171` (called from `addEntry` :140, `updateEntry` :151, `deleteEntry` :160) — each add/edit/delete touches `balance` **and** `updatedAt` for every row in the ledger, even when the balance is unchanged. Harmless to the arithmetic, but it is row churn that any `updated_at`-keyed digest/sync logic will observe.

---

## 9. Unused code with wrong semantics

### BUG-37 · LOW — `getFamilySummary()` mislabels account types and is unused

`SQLiteDatabaseService.ts:1456-1462` (port: `core/ports/IDatabaseService.ts:181`) — sums `mobile_wallet` + `business` balances into the `activeLoans` field, ignores the real loan stacks entirely, and excludes `counterparty` accounts from every bucket while `totalAssets`/`netWorth` are built from the same partial set. No UI consumer today (the dashboard uses `loanStacks`), so nothing visibly breaks — but the port is public and any future caller receives wrong figures.

See also **BUG-36** in §5.

---

## 10. Verified as *not* defects

Examined and cleared — recorded so a future session does not re-litigate them:

- **`GroupLedgerScreen` running balance** — `netChange` is computed over the same slice as the rows, so it is internally consistent. (Only the PDF scope is wrong: BUG-28.)
- **`OtherLedgerDetail` balance / currentBalance** — read from the sorted stored balances, correct by construction.
- **`computeBalances.ts` / `recalculateBalances`** — correctly mirror `applyBalanceChange` per transaction type; replay order verified.

---

## 11. Test-coverage gaps behind these findings

| Gap | Hides |
|---|---|
| `MemberReportService.test.ts` never uses a range ending before the last transaction | BUG-22 |
| No test asserts the update path validates, or that overpayment is rejected/flagged | BUG-24, BUG-23 |
| Nothing covers dashboard trend math | BUG-21, BUG-25 |

Existing coverage lives at `src/infrastructure/database/__tests__/computeBalances.test.ts`, `src/loans/application/__tests__/{LoanService.generateReport,loanDisplay,lenderRepayment,computeRunningBalances}.test.ts`, `src/reports/application/__tests__/MemberReportService.test.ts`.

---

## 12. Recommended priority

| Order | Findings | Rationale |
|---|---|---|
| 1 | **BUG-24**, **BUG-23** | The only two that corrupt or contradict *stored* data |
| 2 | **BUG-22**, **BUG-21**, **BUG-25** | Wrong numbers shown on primary screens |
| 3 | **BUG-26**, **BUG-27**, **BUG-28** | Misleading summaries/exports |
| 4 | **BUG-29**, **BUG-30**, **BUG-31**, **BUG-33** | Cosmetic / consistency |
| 5 | **BUG-32**, **BUG-34**, **BUG-35**, **BUG-36**, **BUG-37** | Latent, dead, or naming only |

**Status:** all 17 findings are `open` in `docs/BUGS.md` with **no fix approach** — each awaits an explicit user decision on the approach before any code is touched (AGENTS.md §3.10).

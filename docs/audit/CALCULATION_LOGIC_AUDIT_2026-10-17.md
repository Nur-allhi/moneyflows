# MoneyFlows — Calculation & Logic Audit

**Date:** 2026-10-17
**Scope:** All calculation-bearing modules — balance engine, loans, other ledgers, reports, dashboard, member profile/ledger, groups, recycle bin, write paths
**Method:** Static read of source (manual code review, line-level verification of every claim). No tooling/gates run — this was a read-only audit, no code was changed.
**Git state at time of report:** branch `dev`, HEAD `14105ee`
**Findings register:** every finding below is logged in `docs/BUGS.md` as **BUG-21 … BUG-37**

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

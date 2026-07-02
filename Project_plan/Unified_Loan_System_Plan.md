# Unified Loan System — Revamp Plan

**Version:** 2.0
**Status:** Approved

---

## 1. Executive Summary

The current loan system suffers from two confirmed bugs and four systemic design issues:

**Bugs:**
1. **Premature settlement** — repaying 2000 against a 3000-active loan settles it because a previous 5000-repayment (from a settled loan) is double-counted against it
2. **"Unknown" in From/To** — Transaction Detail Modal shows "Unknown" for counterparty accounts while also showing a correct "Debtor: Name" row

**Design issues:**
- 4 transaction types × 2 directions = needless complexity
- Internal vs external loans handled as separate UI code paths
- Repayments never linked to a specific loan (`loanRef: ''` everywhere)
- Loan code scattered across 12+ directories in 3 layer folders

---

## 2. Bug Root Causes

### Bug 1 — `LoanService.ts:145-178`

```
recordRepayment({ loanRef: '' })          // TransactionFormModal.tsx:316,341
  → _updateLoanOutstanding('', cpId)      // no loanRef → recalculates ALL loans for cp
    → _recalculateLoan(loan1, cpId)       // settled loan: outstanding re-inflates to 5000
    → _recalculateLoan(loan2, cpId)       // active loan: 5000_old + 2000_new = 7000 counted → settled
```

The `allRepayments` query (`getTransactions({ accountId: cpId, type: 'loan_repayment' })`) returns ALL repayments involving the counterparty. Each active loan gets the **full sum** of all untagged repayments counted against it independently.

### Bug 2 — `TransactionDetailModal.tsx:88-113`, `114-153`

Two separate sections render simultaneously:
- Lines 88-113: "From Account: Unknown" / "To Account: Unknown" — uses `accountMap`, fails when counterparty not in store
- Lines 114-153: "Debtor: Name" — uses separate resolution logic, works correctly

The user sees conflicting information.

---

## 3. Folder Restructure — Vertical Slice

### Why change from Clean Architecture layers?

| Factor | Current (by layer) | Proposed (vertical slice) |
|--------|-------------------|--------------------------|
| Agent productivity | Open 5+ folders to understand one feature | Open one `src/loans/` folder |
| Cohesion | Loan types in core/domain, logic in core/application, queries in infrastructure, UI in presentation | All loan code in one module |
| Discoverability | Must know the entire folder map | Just look in `src/loans/` |
| Refactoring | Touch 12+ files across 3 layers | Touch files in one folder tree |
| Public API | No module boundary — anything can import anything | `src/loans/index.ts` is the single entry point |

### New structure

```
src/
├── loans/                               ← NEW: entire loan system
│   ├── domain/
│   │   └── types.ts                     ← Loan, LoanStack, LoanItem
│   ├── application/
│   │   └── LoanService.ts              ← All loan business logic (rewritten)
│   ├── infrastructure/
│   │   └── LoanDatabase.ts             ← All loan-specific DB queries
│   ├── presentation/
│   │   ├── screens/
│   │   │   ├── LoansScreen.tsx         ← Loan list view
│   │   │   └── LoansScreen.module.css
│   │   ├── components/
│   │   │   ├── LoanDetailView.tsx      ← Detail for one borrower
│   │   │   ├── LoanDetailView.module.css
│   │   │   ├── LoanForm.tsx            ← Create/repay unified form
│   │   │   ├── LoanForm.module.css
│   │   │   ├── LoanCard.tsx            ← Borrower card in list
│   │   │   ├── LoanCard.module.css
│   │   │   ├── AddCounterparty.tsx     ← Inline create counterparty
│   │   │   └── AddCounterparty.module.css
│   │   ├── stores/
│   │   │   └── useLoanStore.ts         ← Zustand store
│   │   └── constants.ts                ← Loan labels/icons
│   └── index.ts                        ← Public API
│
├── core/
│   ├── domain/
│   │   ├── Transaction.ts              ← Shared (income/expense/transfer)
│   │   ├── Account.ts                  ← Shared
│   │   └── Member.ts                   ← Shared
│   └── ports/
│       └── IDatabaseService.ts         ← Loan methods removed; basic CRUD only
│
├── infrastructure/
│   ├── database/
│   │   ├── SQLiteDatabaseService.ts    ← Loan queries removed; table schema stays
│   │   └── getDatabase.ts              ← Shared DB singleton
│   └── ...
│
└── presentation/
    ├── modals/
    │   └── TransactionDetailModal.tsx   ← Loan logic delegated to loans/
    ├── components/
    │   ├── LedgerTable.tsx             ← Shared component
    │   ├── Modal.tsx                   ← Shared component
    │   └── ...
    ├── screens/
    │   ├── Dashboard.tsx               ← Imports from loans/index.ts
    │   └── ...
    └── stores/
        └── ...
```

### Architecture rules

| Rule | Reason |
|------|--------|
| `loans/` can import from `core/` and `infrastructure/` | Shared types and DB singleton are universal |
| `core/` must NOT import from `loans/` | Prevents circular deps |
| `presentation/` imports from `loans/index.ts` only | Clean public API |
| `loans/infrastructure/LoanDatabase.ts` uses `getDatabase()` | Same shared SQLite instance |
| `loans/index.ts` exports: `useLoanStore`, `LoanService`, `types` | Single entry point |

---

## 4. Unified Loan System — Data Model

### Schema (replaces current `loans` table)

```sql
CREATE TABLE loans (
  id                  TEXT PRIMARY KEY,
  lender_account_id   TEXT NOT NULL REFERENCES accounts(id),
  borrower_account_id TEXT NOT NULL REFERENCES accounts(id),
  principal           REAL NOT NULL CHECK(principal > 0),
  outstanding         REAL NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'settled')),
  description         TEXT DEFAULT '',
  metadata            TEXT DEFAULT '{}',
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at          TEXT
);

CREATE INDEX idx_loans_lender ON loans(lender_account_id);
CREATE INDEX idx_loans_borrower ON loans(borrower_account_id);
CREATE INDEX idx_loans_status ON loans(status);
```

### Transaction types

| Current (4 types) | New (2 types) | Direction |
|-------------------|---------------|-----------|
| `loan_issue` | `lend` | lender_account → borrower_account |
| `loan_repayment` | `repay` | borrower_account → lender_account |
| `loan_received` | (removed — use `lend` with swapped accounts) | — |
| `loan_paidback` | (removed — use `repay` with swapped accounts) | — |

Keep old types in the CHECK constraint for backward compat (data is test data per user).

### Domain types

```typescript
// src/loans/domain/types.ts

export interface Loan {
  id: string;
  lenderAccountId: string;
  borrowerAccountId: string;
  principal: number;
  outstanding: number;
  status: 'active' | 'settled';
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LoanStack {
  borrowerId: string;
  borrowerName: string;
  totalOutstanding: number;
  totalRecovered: number;
  progressPercent: number;
  settledCount: number;
  activeCount: number;
  loans: LoanItem[];
  isSettled?: boolean;
}

export interface LoanItem {
  id: string;
  fundingSource: string;
  amount: number;
  recovered: number;
  status: 'active' | 'settled';
  date: string;
}
```

---

## 5. Service API

```typescript
class LoanService {
  constructor(
    private db: IDatabaseService,
    private loanDb: LoanDatabase,
  ) {}

  createLoan(params: {
    lenderAccountId: string;    // any account in the system
    borrowerAccountId: string;  // any account (auto-create counterparty if needed)
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<{ loan: Loan; tx: Transaction }>;

  recordRepayment(params: {
    loanId: string;             // REQUIRED — always links to a specific loan
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<{ tx: Transaction }>;

  getLoanById(id: string): Promise<Loan | null>;

  getLoansByBorrower(borrowerAccountId: string): Promise<Loan[]>;

  getLoanStacks(): Promise<LoanStack[]>;

  createCounterparty(name: string): Promise<Account>;

  settleLoan(loanId: string): Promise<void>;

  deleteLoan(loanId: string): Promise<void>;
}
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| `recordRepayment` takes `loanId`, not `counterpartyId` | Eliminates untagged repayment problem entirely. Every repayment belongs to exactly one loan. |
| `createLoan` takes two account IDs, no "direction" | Direction is implicit in which account is lender vs borrower. Internal/external is irrelevant at data level. |
| One loan = one lend tx + N repay txs | Simple, auditable, no splitting or allocation needed. |
| Outstanding = principal - sum(repayments) | O(1) per repayment. No iteration over other loans. |
| Settled loan rejects new repayments | Prevents data corruption. User must re-open the loan if needed. |

---

## 6. UI — Unified Loan Form

### Current problem: two separate paths

```
Internal loan flow:
  Loans.tsx → handleOpenRepay() → TransactionFormModal(internalAction='repay')
  → recordRepayment(source=borrower, dest=lender)

External loan flow:
  Loans.tsx → handleOpenRepay() → TransactionFormModal(loanMode='repay')
  → LoanFormSection → recordRepayment(source=debtor, dest=myAccount)
```

### New: one unified form

```
┌──────────────────────────────────────┐
│         Loan Action                  │
├──────────────────────────────────────┤
│  ○ Lend money   ○ Record repayment  │
│                                     │
│  From account:  [▼ Select account]  │  ← all accounts (member + counterparty)
│                                     │
│  To account:    [▼ Select account]  │  ← all accounts + "Create new..."
│                                     │
│  Amount:        [______________]    │
│  Description:   [______________]    │
│  Date:          [____-__-__]        │
│                                     │
│  [Confirm]                           │
└──────────────────────────────────────┘
```

**When "Record repayment" is selected:**
- "From account" pre-fills with the borrower's account
- A loan selector appears to pick which active loan to repay
- "To account" pre-fills with the lender's account

**When "Create new counterparty" is chosen in the account dropdown:**
- An inline form expands: "Name:" + [Create] button
- Creates a `counterparty`-type account on the fly
- Selects it immediately

### Transaction Detail Modal — fixed

Current (broken):
```
From Account: Unknown    ← shows 'Unknown' when counterparty not in store
To Account: Efty's Cash
Debtor: John             ← separate section, correctly resolved
```

New (clean):
```
┌──────────────────────────────────────┐
│         Lend Transaction             │
├──────────────────────────────────────┤
│  Lender:   Efty's Cash – Efty       │
│  Borrower: John (Debtor)            │
│  Amount:   3,000 BDT                │
│  Date:     Thu, 1 Jan 2026          │
│  Status:   Active (1,000 remaining) │
└──────────────────────────────────────┘
```

- "From Account" / "To Account" rows are suppressed for `lend` and `repay` types
- Replaced with "Lender" / "Borrower" (for `lend`) or "Payer" / "Recipient" (for `repay`)
- Counterparty resolved from the account store; if not found, shows `[account_id] (deleted)`

---

## 7. Ledger display — simplified

### Current

```typescript
// 6 conditions to determine debit/credit:
const isDebit = tx.type === 'loan_issue' || tx.type === 'loan_paidback';
const isCredit = tx.type === 'loan_repayment' || tx.type === 'loan_received';

// Label depends on counterparty type:
const labels = {
  debtor: { loan_issue: 'Loan Issued', loan_repayment: 'Repayment Received' },
  creditor: { loan_received: 'Loan Received', loan_paidback: 'Repayment Sent' },
};
```

### New

```typescript
// 2 conditions:
const isDebit = tx.type === 'lend';
const isCredit = tx.type === 'repay';

// 2 labels, same for everyone:
const label = type === 'lend' ? 'Lent' : 'Repayment';
```

---

## 8. Implementation Sequence

### Phase A — Scaffold + Move (files only, no logic change)

| # | Task | Files |
|---|------|-------|
| A-1 | Create `src/loans/` folder structure | All subdirectories |
| A-2 | Move `core/domain/Loan.ts` → `loans/domain/types.ts` | Update imports |
| A-3 | Copy `application/LoanService.ts` → `loans/application/LoanService.ts` | Keep old for reference until rewrite |
| A-4 | Move `stores/useLoanStore.ts` → `loans/presentation/stores/` | Update imports |
| A-5 | Move `screens/Loans.tsx` → `loans/presentation/screens/LoansScreen.tsx` | Split LoanDetailView into separate file |
| A-6 | Move `components/LoanStack.tsx` → `loans/presentation/components/` | |
| A-7 | Move `components/LoanFormSection.tsx` → `loans/presentation/components/` | |
| A-8 | Extract loan labels from `constants/labels.ts` → `loans/presentation/constants.ts` | |
| A-9 | Create `loans/infrastructure/LoanDatabase.ts` | Move loan queries from SQLiteDatabaseService |
| A-10 | Remove loan methods from `IDatabaseService` and `SQLiteDatabaseService` | Only table schema + migrations remain |
| A-11 | Create `loans/index.ts` | Re-export all public API |
| A-12 | Update all imports in `presentation/` to use `loans/index.ts` | |

### Phase B — Rewrite core logic

| # | Task | Detail |
|---|------|--------|
| B-1 | Rewrite `LoanService.ts` | New `createLoan()`, `recordRepayment()` with mandatory `loanId`, per-loan O(1) recalculation |
| B-2 | Update `LoanDatabase.ts` | New schema queries, drop old direction/counterparty_id references |
| B-3 | Update `types.ts` | `Loan` now has `lenderAccountId` + `borrowerAccountId` instead of `direction` + `counterpartyId` |
| B-4 | Update DB schema in `SQLiteDatabaseService.ts` | New `loans` table DDL |
| B-5 | Update transaction type CHECK | Add `'lend'` and `'repay'`, keep old types |
| B-6 | Update `applyBalanceChange()` | Handle `'lend'` and `'repay'` types |

### Phase C — Rewrite UI

| # | Task | Detail |
|---|------|--------|
| C-1 | Build unified `LoanForm.tsx` | Single form for lend/repay, account picker with "Create new counterparty" |
| C-2 | Build `AddCounterparty.tsx` | Inline form in the account dropdown |
| C-3 | Update `LoansScreen.tsx` + `LoanDetailView.tsx` | Use new LoanForm, simplified ledger logic |
| C-4 | Update `TransactionDetailModal.tsx` | Suppress From/To for loan types; show Lender/Borrower |
| C-5 | Update `LoanCard.tsx` | Works for any account type (internal, debtor, creditor) |
| C-6 | Update `useLoanStore.ts` | Simplified actions matching new LoanService API |

### Phase D — Cleanup

| # | Task | Detail |
|---|------|--------|
| D-1 | Delete old `core/domain/Loan.ts` | Replaced by `loans/domain/types.ts` |
| D-2 | Delete old `application/LoanService.ts` | Replaced |
| D-3 | Delete old `stores/useLoanStore.ts` | Replaced |
| D-4 | Delete old `screens/Loans.tsx` + `components/LoanStack.tsx` + `components/LoanFormSection.tsx` | Replaced |
| D-5 | Remove loan labels from `constants/labels.ts` | Moved to `loans/presentation/constants.ts` |

---

## 9. Verification

After each phase:

```bash
npm run build         # TypeScript compiles without errors
npm run lint          # No lint warnings
# Manual test flows:
# 1. Create a loan (Efty's Cash → John, 5000)
# 2. Verify "Lend" transaction appears in ledger
# 3. Create another loan (Efty's Cash → Sara's Wallet, 3000)
# 4. Repay John's loan (2000)
# 5. Verify outstanding for John = 3000, Sara unaffected
# 6. Open Transaction Detail Modal → shows "Lender: Efty's Cash" / "Borrower: John"
# 7. Settle John's remaining 3000 → status changes to settled
# 8. Verify Dashboard loan metrics correct
```

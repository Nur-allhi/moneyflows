# MoneyFlows — Technical Architecture Document (TAD)

**Target Skill:** `senior-backend`
**Version:** 2.0 · 2026-08-23
**Reality check:** reflects the codebase as built (Phases 1–9 complete), not the original plan.

---

## 1. Architecture — Clean, Local-First, Client-Only

```
src/
├── core/                    # framework-free domain + use cases + ports
│   ├── domain/              # entities: Transaction, Member, Account, AppSettings...
│   ├── application/         # services orchestrating use cases
│   └── ports/               # IDatabaseService interface (the ONLY DB contract)
├── infrastructure/
│   ├── database/            # SQLiteDatabaseService (sql.js WASM), FolderSync.ts
│   └── repositories/        # repository implementations over the port
├── loans/                   # unified loan system (Phase 7) — self-contained module
│   ├── domain/types.ts      # Loan, LoanItem, LoanStack
│   ├── application/LoanService.ts
│   ├── infrastructure/LoanDatabase.ts
│   └── presentation/        # LoansScreen, LoanDetailView, LoanForm, AddCounterparty, useLoanStore
├── presentation/            # screens, components, modals (lazy registry), stores, hooks, constants, styles
└── components/ui/           # shadcn-style primitives (button, calendar, select)
```

**Rules**
1. UI never imports `sql.js` — everything crosses `IDatabaseService` (port). *(Audit gap: `App.tsx:71` casts `(db as any)` for `purgeExpiredItems` — must move to port, see TICKETS Phase 10.)*
2. Each file ≤300 LOC. Current violations tracked in `docs/audit/FINDINGS.md` HYG-3.
3. One simple solution; write only to spec.

**API routes:** none. The app is client-only and offline-first; there is no server. "Contracts" are TypeScript interfaces (`IDatabaseService`, `LoanService` public methods, Zustand store APIs). Supabase remains a non-goal until a sync phase is approved.

---

## 2. Persistence

Single SQLite database (`money_flows.db`) via `sql.js` in-browser, serialized to localStorage/OPFS on every `save()`. Every mutation path ends in `save()` which additionally: pushes to a ring buffer of restore points (T-060), verifies SHA-256 integrity (T-062), and optionally mirrors to a user-chosen folder via File System Access API (`FolderSync.ts`, T-064).

### 2.1 Core tables

```sql
members(id PK, name, short_name, email, phone, avatar_url,
        is_external INT DEFAULT 0, metadata JSON, created_at, updated_at, deleted_at)

accounts(id PK, member_id FK→members, name,
         type CHECK(type IN ('bank','mobile_wallet','cash','savings','business')),
         balance REAL DEFAULT 0, currency TEXT DEFAULT 'BDT',
         icon, color, is_active INT DEFAULT 1, metadata JSON,
         created_at, updated_at, deleted_at)

transactions(id PK, type CHECK(type IN ('income','expense','transfer',
                     'loan_issue','loan_repayment')),
             description, amount REAL CHECK(amount > 0),
             source_account FK→accounts NULLABLE, dest_account FK→accounts NULLABLE,
             member_id FK→members, debtor_id FK→members NULLABLE,
             loan_ref TEXT NULLABLE,          -- legacy grouping key; unified system uses loans table
             date TEXT NOT NULL,              -- user-entered YYYY-MM-DD
             created_at, updated_at, deleted_at, metadata JSON)

account_groups(id PK, name, sort_order, metadata JSON, deleted_at)
account_group_mappings(account_id FK, group_id FK)
```

Indexes: `member_id`, `date`, `type`, `source_account`, `dest_account`, `debtor_id`, `deleted_at` on transactions; `member_id`/`deleted_at` on accounts/members.

### 2.2 Unified loan tables (Phase 7)

```sql
loans(id PK,
      lender_account_id   FK→accounts NOT NULL,
      borrower_account_id FK→accounts NOT NULL,
      principal REAL NOT NULL,
      outstanding REAL NOT NULL,
      status TEXT NOT NULL,                -- 'active' | 'settled'
      description TEXT DEFAULT '',
      metadata JSON, created_at, updated_at, deleted_at)

-- loan movements are rows in `transactions` with type 'loan_issue' | 'loan_repayment',
-- linked to the loan via metadata.legacy loan_ref OR metadata.loanId (see LoanService.syncLoanTransaction)
```

Legacy types `'lend' | 'repay'` still exist in historical rows and MUST be treated as credits/debits in every balance computation (audit lesson f9f802a: orphan legacy types broke running balance).

### 2.3 Settings

Not in SQLite — `AppSettings` (locale, currency, primaryMemberId, wizard constants) persists to `localStorage` via `useSettingsStore`. `primaryMemberId` is currently written but never read (BUG-2, fix scheduled).

---

## 3. Service Layer Contracts

| Contract | Key methods |
|----------|-------------|
| `IDatabaseService` (port) | getMembers/Accounts/Transactions, saveTransaction, softDelete, restore, purge, purgeExpiredItems*(to add)* |
| `LoanService` | createLoan, recordMovement, syncLoanTransaction(oldAmount→newAmount on edit), generateReport(filter) → summary+rows with runningBalance from FULL history |
| `FolderSync` | chooseFolder(), mirror(dbBytes), verifySha256() |
| Zustand stores | `useTransactionStore`, `useLoanStore`, `useSettingsStore`, `useModalStore` (lazy modal registry: transaction-form/detail/edit, delete-confirm, edit-member, add-account, settings, select-account) |

## 4. Invariants (enforced by review + future tests)

1. **Running balance is computed from ALL transactions of a scope, then filtered for display** — never from the filtered set.
2. Balance floors at 0 via `Math.max(0, …)` only at display time.
3. Deleting a repayment updates loan `outstanding` (057a9b4).
4. Editing amount/type re-syncs the linked loan (`syncLoanTransaction`).
5. Soft-delete everywhere; hard delete only via Recycle Bin purge.
6. Optimistic UI updates; store re-fetches on mount (deliberate pattern).

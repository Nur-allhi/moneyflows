# MoneyFlows — Technical Architecture Document (TAD)

**Target Skill:** `senior-backend`
**Version:** 1.0

---

## 1. Clean Architecture Layers

```
src/
├── core/
│   ├── domain/           # Entities + Value Objects (plain TS classes)
│   ├── application/      # Use cases (TransactionService, LoanService, etc.)
│   └── ports/            # IDatabaseService interface
├── infrastructure/       # Adapters: SQLiteDatabaseService, Repositories
└── presentation/         # React components, Zustand stores, hooks
```

**Rule:** UI never imports `better-sqlite3` directly. All DB access goes through `IDatabaseService`.

---

## 2. Database Schema (SQLite)

### 2.1 `members`

```sql
CREATE TABLE members (
  id          TEXT PRIMARY KEY,          -- UUID v4
  name        TEXT NOT NULL,
  short_name  TEXT,                      -- "Efty", "Abbu", "Ammu"
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  is_external INTEGER NOT NULL DEFAULT 0,-- 1 for debtors (BTC, Pavel, etc.)
  metadata    TEXT DEFAULT '{}',          -- JSON blob (future supabase compat)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT                        -- soft-delete timestamp
);

CREATE INDEX idx_members_deleted ON members(deleted_at);
```

### 2.2 `accounts`

```sql
CREATE TABLE accounts (
  id          TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES members(id),
  name        TEXT NOT NULL,              -- "bKash", "Brac Bank Savings", "Cash"
  type        TEXT NOT NULL CHECK(type IN (
                'bank', 'mobile_wallet', 'cash', 'savings', 'business'
              )),
  balance     REAL NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'BDT',
  icon        TEXT,                       -- icon identifier
  color       TEXT,                       -- hex for gradient
  is_active   INTEGER NOT NULL DEFAULT 1,
  metadata    TEXT DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT
);

CREATE INDEX idx_accounts_member ON accounts(member_id);
CREATE INDEX idx_accounts_deleted ON accounts(deleted_at);
CREATE INDEX idx_accounts_type ON accounts(type);
```

### 2.3 `transactions`

```sql
CREATE TABLE transactions (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL CHECK(type IN (
                    'income', 'expense', 'transfer', 'loan_issue', 'loan_repayment'
                  )),
  description     TEXT NOT NULL,
  amount          REAL NOT NULL CHECK(amount > 0),
  source_account  TEXT REFERENCES accounts(id),
  dest_account    TEXT REFERENCES accounts(id),
  member_id       TEXT NOT NULL REFERENCES members(id),
  -- For loan transactions:
  debtor_id       TEXT REFERENCES members(id),
  loan_ref        TEXT,                    -- grouping key for loan stacks
  -- Timestamps
  date            TEXT NOT NULL,           -- user-entered date (YYYY-MM-DD)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT,
  metadata        TEXT DEFAULT '{}'
);

CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_account ON transactions(source_account);
CREATE INDEX idx_transactions_deleted ON transactions(deleted_at);
CREATE INDEX idx_transactions_debtor ON transactions(debtor_id);
CREATE INDEX idx_transactions_loan_ref ON transactions(loan_ref);
```

### 2.4 `account_groups`

```sql
CREATE TABLE account_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,              -- "Bank Accounts", "Mobile Wallets", etc.
  sort_order  INTEGER NOT NULL DEFAULT 0,
  metadata    TEXT DEFAULT '{}',
  deleted_at  TEXT
);
```

### 2.5 `account_group_mappings`

```sql
CREATE TABLE account_group_mappings (
  id              TEXT PRIMARY KEY,
  account_group_id TEXT NOT NULL REFERENCES account_groups(id),
  account_id      TEXT NOT NULL REFERENCES accounts(id),
  UNIQUE(account_group_id, account_id)
);
```

---

## 3. `IDatabaseService` Interface (Port)

```typescript
interface IDatabaseService {
  // Members
  getMembers(includeDeleted?: boolean): Promise<Member[]>;
  getMemberById(id: string): Promise<Member | null>;
  saveMember(member: Member): Promise<void>;
  softDeleteMember(id: string): Promise<void>;

  // Accounts
  getAccounts(memberId?: string): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | null>;
  saveAccount(account: Account): Promise<void>;
  softDeleteAccount(id: string): Promise<void>;

  // Transactions
  getTransactions(filters?: TransactionFilter): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  saveTransaction(tx: Transaction): Promise<void>;
  softDeleteTransaction(id: string): Promise<void>;

  // Loans
  getLoanStacks(): Promise<LoanStack[]>;
  getLoanStackByDebtor(debtorId: string): Promise<LoanStack>;

  // Recycle Bin
  getDeletedItems(type?: 'transaction' | 'account'): Promise<DeletedItem[]>;
  restoreItem(id: string, type: 'transaction' | 'account'): Promise<void>;
  purgeItem(id: string, type: 'transaction' | 'account'): Promise<void>;
  purgeExpiredItems(): Promise<number>;

  // Aggregations
  getFamilySummary(): Promise<FamilySummary>;
  getMemberBalance(memberId: string): Promise<number>;
  getAccountGroupBalances(): Promise<GroupBalance[]>;
}
```

---

## 4. Domain Entities

```typescript
// core/domain/Member.ts
class Member {
  id: string;
  name: string;
  shortName?: string;
  isExternal: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  deletedAt?: string;
}

// core/domain/Account.ts
class Account {
  id: string;
  memberId: string;
  name: string;
  type: 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'business';
  balance: number;
  currency: string; // 'BDT'
  icon?: string;
  color?: string;
  isActive: boolean;
}

// core/domain/Transaction.ts
class Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'loan_issue' | 'loan_repayment';
  description: string;
  amount: number;
  sourceAccount?: string;
  destAccount?: string;
  memberId: string;
  debtorId?: string;
  loanRef?: string;
  date: string;
}

// core/domain/LoanStack.ts
interface LoanStack {
  debtorId: string;
  debtorName: string;
  totalOutstanding: number;
  totalRecovered: number;
  progressPercent: number;
  loans: LoanItem[];
}

interface LoanItem {
  id: string;
  fundingSource: string;   // account name
  amount: number;
  recovered: number;
  status: 'active' | 'on_track';
  date: string;
}
```

---

## 5. Application Services (Use Cases)

| Service | Key Methods | Responsibility |
|---------|------------|----------------|
| `TransactionService` | `createIncome()`, `createExpense()`, `createTransfer()`, `createLoanIssue()`, `createLoanRepayment()` | Double-entry: updates both account balances + creates transaction record |
| `LoanService` | `getLoanStacks()`, `getDebtorSummary()`, `calculateProgress()` | Aggregates loan transactions into stacks |
| `BalanceService` | `getFamilySummary()`, `getMemberBalance()`, `getGroupBalances()` | Pre-calculated dashboard aggregates |
| `RecycleService` | `getDeletedItems()`, `restoreItem()`, `purgeItem()`, `purgeExpiredItems()` | Manages soft-delete lifecycle |

---

## 6. Zustand Stores (State Management)

| Store | State | Key Actions |
|-------|-------|-------------|
| `useMemberStore` | `members[]`, `activeMemberId` | `fetchMembers`, `setActiveMember` |
| `useAccountStore` | `accounts[]`, `byMember` | `fetchAccounts`, `getByMember` |
| `useTransactionStore` | `transactions[]`, `filters` | `fetchTransactions`, `addTransaction` (optimistic) |
| `useLoanStore` | `loanStacks[]` | `fetchLoanStacks` |
| `useRecycleStore` | `deletedItems[]` | `fetchDeleted`, `restore`, `purge` |

**Optimistic update pattern:** On `addTransaction`, update account balance in-memory + push to DB in background. Rollback on error.

---

## 7. File Organization (≤300 LOC per file)

```
src/
├── core/
│   ├── domain/
│   │   ├── Member.ts
│   │   ├── Account.ts
│   │   ├── Transaction.ts
│   │   ├── AccountGroup.ts
│   │   └── Loan.ts
│   ├── application/
│   │   ├── TransactionService.ts
│   │   ├── LoanService.ts
│   │   ├── RecycleService.ts
│   │   └── BalanceService.ts
│   └── ports/
│       └── IDatabaseService.ts
├── infrastructure/
│   ├── database/
│   │   ├── SQLiteDatabaseService.ts
│   │   ├── schema.sql
│   │   └── seed.ts
│   └── repositories/
│       ├── MemberRepository.ts
│       ├── AccountRepository.ts
│       └── TransactionRepository.ts
└── presentation/
    ├── components/
    │   ├── GlassPanel.tsx
    │   ├── Avatar.tsx
    │   ├── MetricCard.tsx
    │   ├── AccountCard.tsx
    │   ├── AccountRow.tsx
    │   ├── TransactionRow.tsx
    │   ├── LedgerTable.tsx
    │   ├── QuickActionCard.tsx
    │   ├── LoanStack.tsx
    │   ├── ProgressBar.tsx
    │   ├── SegmentedTabs.tsx
    │   ├── FormField.tsx
    │   ├── Numpad.tsx
    │   ├── BottomSheet.tsx
    │   ├── Modal.tsx
    │   ├── TabBar.tsx
    │   └── RecycleRow.tsx
    ├── screens/
    │   ├── Dashboard.tsx
    │   ├── MemberProfile.tsx
    │   ├── Loans.tsx
    │   ├── TransactionWizard.tsx
    │   └── RecycleBin.tsx
    ├── hooks/
    │   ├── useAccounts.ts
    │   ├── useTransactions.ts
    │   └── useLoans.ts
    ├── stores/
    │   ├── useMemberStore.ts
    │   ├── useAccountStore.ts
    │   ├── useTransactionStore.ts
    │   ├── useLoanStore.ts
    │   └── useRecycleStore.ts
    ├── styles/
    │   ├── tokens.css
    │   ├── glassmorphism.css
    │   ├── typography.css
    │   └── reset.css
    ├── App.tsx
    └── main.tsx
```

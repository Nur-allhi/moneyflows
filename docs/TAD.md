# MoneyFlows — Technical Architecture Document (TAD)

**Target Skill:** `senior-backend`
**Version:** 3.0 · 2026-08-24
**Reality check:** reflects the codebase as built (Phases 1–11 complete), not the original plan.

---

## 1. Architecture — Clean, Local-First, Client-Only

```
src/
├── core/                    # framework-free domain + use cases + ports
│   ├── domain/              # Transaction, Member, Account, AppSettings...
│   ├── application/         # services orchestrating use cases
│   └── ports/               # IDatabaseService interface (the ONLY DB contract)
├── infrastructure/
│   ├── database/
│   │   ├── SQLiteDatabaseService.ts  # SQL logic + flush lifecycle
│   │   ├── FolderSync.ts             # File System Access folder backup
│   │   ├── getDatabase.ts            # singleton factory (memoized init)
│   │   └── storage/                  # persistence adapters (Phase 11)
│   │       ├── types.ts              # IPersistenceAdapter, SnapshotRecord, typed errors
│   │       ├── opfsAdapter.ts        # OPFS backend (+ optional LS transition mirror)
│   │       ├── localStorageAdapter.ts# hardened fallback
│   │       ├── sha256.ts             # digest: crypto.subtle → FNV fingerprint fallback
│   │       ├── bytes.ts              # base64 helpers
│   │       └── index.ts              # createStorageAdapter(): pick backend + migration
├── loans/                   # unified loan system module (domain/application/infra/presentation)
├── presentation/            # screens, components, modals (lazy registry), stores, hooks, constants
└── components/ui/           # shadcn-style primitives
```

**Rules**
1. UI never imports `sql.js` or the storage adapters directly — everything crosses `IDatabaseService`.
2. Each file ≤300 LOC. Violations tracked in TICKETS.md (T-092 deferred splits).
3. One simple solution; write only to spec.

**API routes:** none. Client-only, offline-first. Contracts are TypeScript interfaces (`IDatabaseService`, `LoanService`, Zustand store APIs). Supabase remains a non-goal until a sync phase is approved.

---

## 2. Persistence Engine

Single SQLite database via `sql.js` in-browser.

### 2.1 Write lifecycle (Phase 11)

| Step | Behavior |
|------|----------|
| Mutate | `run()` marks dirty; a microtask-coalesced `flush()` follows (N statements → 1 write) |
| Durability point | every public mutating op `await flush()` before its promise resolves |
| Session end | `visibilitychange(hidden)` / `pagehide` best-effort flush |
| Failure | quota → prune oldest snapshots → retry once → throw `StorageWriteError` (never silent); health flag set |

### 2.2 Backends (`IPersistenceAdapter`)

| Backend | Main DB | Snapshots | Notes |
|---|---|---|---|
| **OPFS** (default when supported) | `money_flows.db` binary file | `snapshots/N.db` + `N.json` meta | disk-pool quota; exclusive writes; `navigator.storage.persist()` requested |
| **localStorage** (fallback) | base64 under `STORAGE_KEY` | JSON `{data,hash,time}` slots | hardened: no silent give-up, per-slot guards |

`createStorageAdapter()` picks OPFS if available and runs the one-time migration: OPFS empty + legacy LS data decodable → import main DB + newest hash-valid snapshot → enable transition mirror (OPFS writes also refresh LS until mirror removal ships). Fresh installs skip the initial empty-schema flush so mirrors can never be clobbered with empty data.

Integrity digest: SHA-256 via `crypto.subtle`; on insecure origins a deterministic FNV fingerprint (`f:` prefix) keeps corruption detection working (non-cryptographic by design — plain http is outside the threat model).

### 2.3 Core tables

```sql
members(id PK, name, short_name, email, phone, avatar_url,
        is_external INT DEFAULT 0, metadata JSON, created_at, updated_at, deleted_at)

accounts(id PK, member_id FK→members, name,
         type CHECK(type IN ('bank','mobile_wallet','cash','savings','business','counterparty')),
         balance REAL DEFAULT 0, currency TEXT DEFAULT 'BDT',
         icon, color, is_active INT DEFAULT 1, metadata JSON,
         created_at, updated_at, deleted_at)

transactions(id PK, type CHECK(type IN ('income','expense','transfer','loan_issue',
                     'loan_repayment','loan_received','loan_paidback','lend','repay')),
             description, amount REAL CHECK(amount > 0),
             source_account FK→accounts NULLABLE, dest_account FK→accounts NULLABLE,
             member_id FK→members, debtor_id FK→members NULLABLE,
             loan_ref TEXT NULLABLE,                -- legacy grouping key
             date TEXT NOT NULL,                    -- user-entered YYYY-MM-DD
             created_at, updated_at, deleted_at, metadata JSON)

account_groups(id PK, name, sort_order, metadata JSON, deleted_at)
account_group_mappings(id PK, account_group_id FK, account_id FK, UNIQUE(group,account))
```

### 2.4 Unified loan table (Phase 7)

```sql
loans(id PK, lender_account_id FK→accounts NOT NULL, borrower_account_id FK→accounts NOT NULL,
      principal REAL NOT NULL CHECK(principal > 0), outstanding REAL DEFAULT 0,
      status CHECK(status IN ('active','settled')), description TEXT DEFAULT '',
      metadata JSON, created_at, updated_at, deleted_at)
```

Movements are transactions of type `loan_issue`/`loan_repayment` linked via metadata. Legacy `lend`/`repay` rows persist and MUST count as credits/debits in every balance computation.

### 2.5 Settings

Not in SQLite — `AppSettings` persists to `localStorage` via `useSettingsStore`.

---

## 3. Service Layer Contracts

| Contract | Key methods |
|----------|-------------|
| `IDatabaseService` (port) | CRUD + softDelete/restore/purge per entity · `purgeExpiredItems(days)` · `getSnapshots(): Promise<SnapshotInfo[]>` · `restoreSnapshot(i)` · `restoreNewestSnapshot()` · `resetStorage()` · `getStorageHealth()` · `importFromBytes(data)` · `getFamilySummary/getMemberBalance/getAccountGroupBalances` · `exportToFile/importFromFile/recalculateBalances` |
| `LoanService` | createLoan, recordMovement, syncLoanTransaction(old→new on edit), generateReport(filter) — runningBalance from FULL history via shared util |
| Storage internals | `computeRunningBalances/sortLoanTransactions` (loans/application), `withStorageLock` (Web Locks single-writer guard) |
| Zustand stores | `useTransactionStore`, `useLoanStore`, `useSettingsStore`, `useModalStore`; lazy modal registry |

## 4. Invariants (enforced by review + tests)

1. Running balance computed from ALL transactions of a scope, then filtered for display.
2. Negative balances render as-is; no clamping except where product explicitly wants it.
3. Deleting/editing loan-linked transactions re-syncs loan `outstanding`.
4. Soft-delete everywhere; hard delete only via Recycle Bin purge / expiry.
5. Persistence never silently fails: flush errors propagate to store error state + storage-health warning.
6. Boot cannot block on dialogs; watchdog guarantees an actionable screen ≤15 s.
7. Optimistic UI updates; stores re-fetch on mount (deliberate pattern).

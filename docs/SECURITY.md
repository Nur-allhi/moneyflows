# MoneyFlows — Security & Access Document

**Target Skills:** `senior-backend`, `code-reviewer`
**Version:** 1.0

---

## 1. Threat Model

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Local SQLite DB file theft | Full financial data exposure | OS-level file permissions; `money_flows.db` in user app data directory; no cloud storage |
| SQL injection via form fields | DB corruption / data leak | Parameterized queries only in `SQLiteDatabaseService`; never concatenate SQL strings |
| XSS via description/name fields | Script execution in UI | React auto-escapes JSX; CSP headers if packaged in Tauri; sanitize on read |
| Accidental permanent data loss | Irrecoverable financial records | Soft-delete on all entities (30-day auto-purge window); Recycle Bin |
| Balance corruption from partial writes | Incorrect financial state | Transactions wrapped in `BEGIN/COMMIT` for double-entry writes; rollback on error |
| Tampering with `deleted_at` timestamps | Data integrity bypass | Application-layer enforcement; no direct DB writes from UI |
| Race condition on concurrent writes (Electron/Tauri) | Stale balance reads | Wrapped DB operations; serialize writes via SQLite WAL mode |

---

## 2. Authorization Levels

This is a single-device family app with no user authentication. Authorization is **role-based by convention**:

| Level | Scope | Who |
|-------|-------|-----|
| **Admin** | Full CRUD: members, accounts, transactions, loans, recycle bin | Efty (hardcoded as primary user) |
| **Viewer** | Read-only: dashboard, member profile, loan stacks | Azam, Nahar (family viewers) |

**Implementation:**
- `activeProfile` stored in Zustand (`useAuthStore`), persist to localStorage.
- Admin actions (delete, restore, purge, add/remove members) check `activeProfile.role === 'admin'` before rendering action buttons.
- Viewer mode hides: delete buttons, edit triggers, recycle bin purge, member add/remove.
- No password gate in v1 (local-only app; future Supabase auth for Phase 2).

---

## 3. Data Guardrails

### 3.1 Soft-Delete System

```
┌─────────────────────────────────────────────┐
│  Every DELETE from UI sets deleted_at = now  │
│  Queries filter WHERE deleted_at IS NULL     │
│  Recycle Bin queries WHERE deleted_at NOT NULL│
│  Auto-purge after 30 days (cron on app start) │
└─────────────────────────────────────────────┘
```

- All tables: `members`, `accounts`, `transactions`, `account_groups` have `deleted_at TEXT`.
- `IDatabaseService.getMembers(includeDeleted?)` — default `includeDeleted=false`.
- `RecycleService.purgeExpiredItems()` runs on app startup and deletes items where `deleted_at < datetime('now', '-30 days')`.

### 3.2 Double-Entry Transaction Integrity

```
createExpense(tx):
  BEGIN TRANSACTION
    INSERT INTO transactions (...) VALUES (...)
    UPDATE accounts SET balance = balance - tx.amount WHERE id = tx.source_account
  COMMIT
```

- Every `TransactionService` method wraps balance updates + transaction insert in one SQLite transaction.
- `source_account` balance decreases for expense; `dest_account` balance increases.
- For transfers: both accounts updated in same transaction.
- For loan issue: source_account balance decreases; debtor's loan aggregate increases (no separate balance table — computed from transactions).
- **Validation** before write: source account must exist, must be active, must have sufficient balance (for expense/transfer/loan_issue).

### 3.3 Input Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| `amount` | `> 0`, `isFinite()`, not NaN | "Amount must be a positive number" |
| `description` | `length >= 1 && length <= 200` | "Description is required (max 200 chars)" |
| `source_account` | Required for expense/transfer/loan_issue; must exist and be active | "Select a source account" |
| `dest_account` | Required for income/transfer; must differ from source (transfer only) | "Select a destination account" |
| `date` | Valid ISO date string; `<= now` | "Date cannot be in the future" |
| `member_id` | Required; must reference valid member | "Select a member" |
| `debtor_id` | Required for loan_issue/loan_repayment; must be external member | "Select a debtor" |

All validation runs **client-side** (immediate feedback) and **server-side** (in `TransactionService` before DB write).

### 3.4 Metadata JSON Safety

- `metadata` column stores arbitrary JSON for future Supabase compat.
- Always validated: `JSON.parse()` on read; `JSON.stringify()` on write.
- Default: `'{}'`.
- Never query by metadata values (no indexed JSON fields in SQLite).

---

## 4. Secure Coding Checklist (for code-reviewer)

- [ ] All SQL queries use `?` parameterized placeholders — no string interpolation
- [ ] `DELETE` is never used on core entities; only `UPDATE deleted_at = now`
- [ ] Transaction writes wrapped in `BEGIN/COMMIT/ROLLBACK`
- [ ] Balance checks happen inside the same transaction as the write
- [ ] No secrets, API keys, or tokens in client-side code
- [ ] `localStorage` only stores UI preferences (active profile, theme) — never raw transaction data
- [ ] `parseInt/parseFloat` with radix; validate `isFinite` on all numeric inputs
- [ ] React components sanitize on render (JSX auto-escapes); no `dangerouslySetInnerHTML`
- [ ] File permissions on `money_flows.db`: owner read/write only (OS-level)
- [ ] Zustand stores never cache deleted/sensitive raw data beyond session scope

---

## 5. Future Security Roadmap (Phase 2 — Supabase)

- Row-Level Security (RLS) policies on all tables
- Supabase Auth with email/password per family member
- Audit log table for all admin actions
- Encrypted `metadata` fields (client-side encryption key)
- Rate limiting on sync API

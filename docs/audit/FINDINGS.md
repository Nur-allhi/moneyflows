# Findings Register — Audit 2026-08-23

Companion to [PROJECT_ANALYSIS_2026-08-23.md](./PROJECT_ANALYSIS_2026-08-23.md).
Status legend: `OPEN` → `IN PROGRESS` → `FIXED` → `VERIFIED`.

---

## Bugs

### BUG-1 — Conditional hook call (CRITICAL) · Status: OPEN
**Location:** `src/presentation/modals/TransactionEditModal.tsx:35-37`

```tsx
if (!transaction) return null;          // line 35 — early return
const handleSave = useCallback(...)     // line 37 — hook AFTER return
```

**Impact:** Violates rules of hooks. Hook order changes between renders. If `transaction`
transitions defined→undefined (transaction deleted while edit modal open, store
rehydration, recycle-bin restore edge cases), React throws
*"Rendered fewer hooks than expected than during the previous render"* → crash.

**Fix sketch:** move the early return below all hooks (compute `handleSave` unconditionally),
or guard inside `handleSave` with `if (!transaction) return;` and drop the pre-hook return.

---

### BUG-2 — Hardcoded `'Admin'` + dead setting (HIGH) · Status: OPEN
**Location:** `src/presentation/modals/TransactionFormModal.tsx:237-240`

```ts
const txMemberId = members.find((m) => !m.isExternal && m.shortName === 'Admin')?.id
  ?? members.find((m) => !m.isExternal)?.id ?? members[0]?.id ?? '';
```

**Evidence of dead code:**
- `AppSettings.primaryMemberId` exists (`core/domain/AppSettings.ts:7`)
- Written by: `presentation/components/SettingsModal.tsx:29,61,165,201`
- Read by: **nothing** (grep across src confirms zero consumers)

**Impact:** T-043/T-046 dynamic-config goal bypassed for the most important consumer.
Any user whose primary member isn't named "Admin" gets transactions attributed to an arbitrary member.

**Fix sketch:** read `primaryMemberId` from `useSettingsStore`, resolve member by id,
fall back to first non-external member only if unset/stale.

---

### BUG-3 — Silent counterparty creation failure (MEDIUM) · Status: OPEN
**Location:** `src/presentation/modals/TransactionFormModal.tsx:224-232`

```ts
} catch { }   // lint error E4 (no-empty)
```

**Impact:** If `createCounterparty()` rejects (validation, DB error), UI shows nothing:
modal stays open, field silently clears nothing, user believes it worked or is confused.

**Fix sketch:** surface error via existing error state (`setErrors({ destination: ... })`)
or a toast; keep modal open on failure.

---

### BUG-4 — DB port bypass with `as any` (LOW) · Status: OPEN
**Location:** `src/App.tsx:68-73`

```ts
if ('purgeExpiredItems' in db) {
  (db as any).purgeExpiredItems(30).catch(() => {});
}
```

**Impact:** Duck-typing past the port interface defeats strict mode and Clean-Architecture
boundary (lint error E2). Feature-flag-style existence check belongs behind the port.

**Fix sketch:** add optional `purgeExpiredItems?(days: number): Promise<void>` to the
database port interface; remove cast and `'in'` check.

---

### BUG-5 — Stale currency in MemberProfile memo (LOW/MED) · Status: OPEN
**Location:** `src/presentation/screens/MemberProfile.tsx:286` (+ related 179/184/193 patterns in Dashboard)

**Impact:** useMemo omits `currency`/locale-derived deps → formatted amounts can show old
currency after a settings change until another dep changes. Cosmetic but user-visible.

**Fix sketch:** add missing deps (accepting recompute cost) or derive formatting values
outside memo.

---

## Lint Warnings Inventory (21)

All are `react-hooks/exhaustive-deps` unless noted:

| File:Line | Missing deps |
|---|---|
| App.tsx:66 | searchOpen |
| LoanDetailView.tsx:44 | fetchTransactions |
| LoanDetailView.tsx:278 | accountById, memberById |
| LoansScreen.tsx:27 | fetchAccounts, fetchLoanStacks |
| useAnimatedValue.ts:35 | current |
| TransactionEditModal.tsx:66 | onClose |
| TransactionFormModal.tsx:130 | fetchAccounts, fetchLoanStacks, fetchMembers |
| Dashboard.tsx:120 | fetchAccounts, fetchLoanStacks, fetchMembers, fetchTransactions |
| Dashboard.tsx:179 / 184 / 193 | incomeTypes / expenseTypes / both |
| GroupLedgerScreen.tsx:210 | displayedTxs |
| MemberList.tsx:27 | fetchAccounts, fetchMembers |
| MemberProfile.tsx:75 / 82 / 100 / 543 | fetchMembers / fetchAccounts+fetchTransactions / searchParams / selectedAcct |
| RecycleBin.tsx:27 | fetchDeleted |

Fast-refresh warnings (benign): `button.tsx:58`, `main.tsx:12`.

Fetch-on-mount warnings are a pattern choice (deliberate one-shot loads); the actionable
ones for correctness are MemberProfile:286 (→ BUG-5) and Dashboard:179/184/193.

---

## Hygiene Findings

### HYG-1 — Sensitive files unprotected (HIGH privacy risk) · Status: OPEN
Untracked + not gitignored:
- `USER_DATA/*.pdf` — exported loan ledger containing real member names/amounts
- `db_b64.txt` — full base64 database dump (284 KB)
- `dashboard`, `view_db.cjs` — debug artifacts

Precedent: `68f3771` removed an accidentally committed PDF already. Fix: extend `.gitignore`
(see report §4).

### HYG-2 — Uncommitted verified fix · Status: OPEN
Running-balance fix (`LoanService.ts`, `LoanDetailView.tsx`) complete but not committed.
Commit before starting bug fixes.

### HYG-3 — LOC limit violations (8 files >300) · Status: OPEN
See report §6 table. Worst: MemberProfile.tsx (764). Split candidates when touched next.

### HYG-4 — Inline-style regression · Status: OPEN
`TransactionEditModal.tsx:78-102` toggle buttons use inline styles (T-049 cleanup missed
this file). Fold into BUG-1 fix since same file.

### HYG-5 — Zero test coverage · Status: OPEN
No test runner configured. Recommend Vitest + tests for `LoanService.generateReport()`
balance math and `useLoanStore` flows before further ledger changes.

### BUG-6 - In-place sort mutated shared tx array (CRITICAL) · Status: FIXED 2026-08-23
**Location:** LoanDetailView.tsx mobileFilteredTxs memo
**Root cause:** let result = sortedTxs (no copy) + esult.sort(desc) mutated the shared
array whenever no filter was active, so ledgerRows/PDF computed balances over a REVERSED
array. This - not the balance math - is why T-084-era fixes never resolved the user's symptom.
**Lesson:** balance math was verified correct in isolation twice; aliasing bug hid it.
Contract test added (sortLoanTransactions must not mutate input).
**Fix:** commit 3921f1e on dev; verified end-to-end via Playwright against real DB
(Home EXP: 34230/35230/44230/49230/54230/39230/41230).

### BUG-7 - PWA freeze on delete: splash screen hangs forever (CRITICAL) · Status: IN PROGRESS (Phase 11)
**Reported:** deleting a transfer transaction froze installed PWA; only killing tab recovered.
**Root-cause cluster:** (1) run() persists entire DB per SQL statement -> churn + quota pressure;
(2) save() silently gives up on QuotaExceededError and snapshot shift-loop is unguarded ->
partial/corrupt persisted state; (3) boot recovery calls blocking window.confirm() which is
invisible in standalone PWA -> main thread blocked forever behind splash overlay;
(4) crypto.subtle missing on insecure origins silently disables integrity layer.
**Fix plan:** docs/plans/STORAGE_OPFS_MIGRATION.md (OPFS migration, coalesced writes,
typed-error recovery with splash watchdog, SHA-256 fallback).

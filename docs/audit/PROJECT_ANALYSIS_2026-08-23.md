# MoneyFlows — Full Project Analysis Report

**Date:** 2026-08-23
**Scope:** Whole-project audit (architecture, health checks, bug hunt, hygiene)
**Tooling:** tsc, eslint, vite build, GitNexus graph analysis, manual code review
**Git state at time of report:** branch `ui-ux-polish` (per recent history), HEAD `68f3771`, uncommitted running-balance fix in working tree

---

## 1. Project Overview

Offline-first personal/family finance and loan ledger.

| Aspect | Detail |
|---|---|
| Stack | React 18.3, TypeScript 5.6 (strict), Vite 6, Zustand 5 |
| Persistence | SQLite via `sql.js` (WASM), ring-buffer auto-backup + SHA-256 integrity hash + File System Access folder sync |
| Styling | CSS Modules + CSS custom properties, Tailwind 4 present for shadcn/ui primitives |
| Routing | react-router-dom 6 |
| PDF export | jspdf + jspdf-autotable (+ html2canvas) |

### Architecture (Clean Architecture)

```
src/
├── core/                  domain entities, application services, ports (interfaces)
├── infrastructure/        SQLiteDatabaseService (592 LOC), FolderSync, repositories
├── presentation/
│   ├── screens/           Dashboard, MemberList, MemberProfile, Groups*, RecycleBin
│   ├── components/        Header, Sidebar, LedgerTable, SettingsModal, FormField...
│   ├── modals/            registry.ts (lazy modal registry) + form/detail/edit modals
│   ├── stores/            useTransactionStore, useSettingsStore, useModalStore...
│   ├── hooks/ constants/ utils/ styles/
├── loans/                 unified loan system (Phase 7) — own domain/application/
│                          infrastructure/presentation layers
├── components/ui/         shadcn-style primitives (button, calendar, select...)
└── lib/                   shared utils
```

### Progress Context

- Phases 1–9 complete: 83 tickets (T-001–T-083). Phase 9 = mobile screen UI.
- Recent sessions fixed loan-ledger running balance; that fix is **uncommitted**.
- Next phase: TBD.

---

## 2. Health Checks

| Check | Result | Notes |
|---|---|---|
| Typecheck (`tsc --noEmit`) | PASS | zero errors |
| Production build (`vite build`) | PASS | built in 8.45s; largest chunk jspdf autotable 427 kB |
| ESLint (`--max-warnings 0`) | FAIL | **4 errors, 21 warnings** |
| Circular imports (GitNexus cycles) | PASS | 0 cycles across 1,786 nodes / 3,620 edges |
| Unit / integration tests | FAIL | **no test files, no test runner configured** |
| GitNexus index freshness | refreshed | was 81 commits stale; re-analyzed during this audit |

### Lint errors

| # | Location | Rule | Severity |
|---|---|---|---|
| E1 | `src/presentation/modals/TransactionEditModal.tsx:37` | `react-hooks/rules-of-hooks` | **Critical** — conditional hook call |
| E2 | `src/App.tsx:71` | `@typescript-eslint/no-explicit-any` | Low |
| E3 | `src/presentation/modals/registry.ts:13` | `@typescript-eslint/no-explicit-any` | Low |
| E4 | `src/presentation/modals/TransactionFormModal.tsx:231` | `no-empty` | Medium — silent catch |

Full warning list (21 × `react-hooks/exhaustive-deps` + fast-refresh warnings): see FINDINGS.md F-05.

---

## 3. Bugs Found (priority order)

Details, root cause, and fix sketches in [FINDINGS.md](./FINDINGS.md).

| ID | Priority | Title | Location |
|---|---|---|---|
| BUG-1 | CRITICAL | Conditional hook call → React crash when transaction vanishes mid-render | `TransactionEditModal.tsx:35-37` |
| BUG-2 | HIGH | Hardcoded `'Admin'` member fallback; `primaryMemberId` setting is dead code (written by SettingsModal, read nowhere) | `TransactionFormModal.tsx:237` |
| BUG-3 | MEDIUM | Counterparty creation failure silently swallowed — no user feedback | `TransactionFormModal.tsx:231` |
| BUG-4 | LOW | DB port bypassed with `(db as any)` for `purgeExpiredItems` | `App.tsx:71` |
| BUG-5 | LOW/MED | Stale formatting risk: `MemberProfile.tsx:286` useMemo missing `currency` dep | `MemberProfile.tsx` |

---

## 4. Privacy / Repo-Hygiene Risk ⚠️ HIGH

Untracked files in repo root, **none covered by `.gitignore`**:

| Path | Contents | Risk |
|---|---|---|
| `USER_DATA/loan_ledger_..._father_2026-07-15 (1).pdf` | Real user financial data (exported ledger PDF) | Privacy leak if committed |
| `db_b64.txt` | 284 KB base64 dump = **entire database contents** | Full financial-data leak if committed |
| `dashboard` | debug artifact | clutter |
| `view_db.cjs` | debug script | clutter |

Precedent: commit `68f3771` already removed an accidentally committed user PDF once. Any blanket `git add .` will re-introduce these.

**Recommended:** add to `.gitignore`:
```
USER_DATA/
db_b64.txt
view_db.cjs
dashboard
```

---

## 5. Uncommitted Work

The loan-ledger running-balance fix from session 2026-07-15 is complete, coherent, and verified but **not committed**:

- `LoanService.generateReport()` — pre-computes balances from ALL sorted loan txs into a `Map<id, balance>`, applies type filter only for display rows.
- `LoanDetailView.tsx` — same pattern in `ledgerRows` useMemo and `downloadPdf`; deps updated to include `sortedTxs`.

Recommendation: commit first (before any bug fixes) to keep the checkpoint clean.

---

## 6. Convention Violations (AGENTS.md §3.3)

**File length ≤300 LOC rule — 8 violations:**

| File | LOC |
|---|---|
| `presentation/screens/MemberProfile.tsx` | 764 |
| `presentation/modals/TransactionFormModal.tsx` | 734 |
| `infrastructure/database/SQLiteDatabaseService.ts` | 592 |
| `presentation/screens/Dashboard.tsx` | 487 |
| `loans/presentation/components/LoanDetailView.tsx` | 404 |
| `presentation/screens/GroupsListScreen.tsx` | 357 |
| `presentation/screens/GroupLedgerScreen.tsx` | 338 |
| `presentation/components/SettingsModal.tsx` | 324 |

**Inline-style regression (T-049 cleanup missed it):**
- `TransactionEditModal.tsx:78-102` — income/expense toggle buttons use inline `style={{...}}`.
- Known remaining exception: shadcn `select.tsx` (documented as acceptable).

---

## 7. Structural Notes

- **No test suite at all.** No `*.test.*`/`*.spec.*` files, no `test` script. Highest-leverage future investment would be Vitest around `LoanService` (balance math has now caused 3+ consecutive bug-fix sessions).
- Modal system is a lazy-loaded registry (`modals/registry.ts`) — good code-splitting; bundle shows per-screen chunks working.
- Settings store adoption is strong (locale/currency consumed in 12+ files); only `primaryMemberId` is orphaned (BUG-2).
- Loan module (`src/loans/`) is cleanly layered post-Phase-7 refactor; no circular deps with core.

## 8. Recommended Action Plan

1. Commit pending running-balance fix (clean checkpoint).
2. Patch `.gitignore` with data/debug artifacts (§4).
3. Fix BUG-1 (crash), BUG-2 ('Admin' → settings), BUG-3 (error feedback), BUG-4 (port method), BUG-5 (memo deps).
4. Clear remaining lint warnings to restore `--max-warnings 0` gate.
5. Optional hardening: extract oversized files (§6); add Vitest + regression tests for loan balance math.

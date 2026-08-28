# Cleanup & Optimization — Lean Combo (1A+2A+3A) — Detailed Plan

**Version:** 1.0 · 2026-08-27
**Trigger:** User approved lean combo (`1A` full T-092 splits + `2A` full hygiene + `3A` bundle/mirror) but requested *proper plan → tickets → new repo/branch per REPO_RULES* before building.
**Base branch:** `dev` at `v1.5.0` (`cf58598`) — all prior phases (Other Ledgers v1, Setup Wizard) green.
**Target branch:** `feature/cleanup-optimization` (per REPO_RULES §1 `feature/<short-name>` → `dev`; lowercase, hyphenated).
**Gates per ticket:** `typecheck` PASS · `lint --max-warnings 0` PASS · `build` PASS · `vitest 19/19` (exclude `e2e`) · `detect_changes()` before commit.

---

## 1. Goals (what we optimize for)

1. **Readability:** No file >300 LOC (`AGENTS.md §3.3`, `T-092`); no copy-paste helpers; one responsibility per file.
2. **Hygiene:** `git status` clean on fresh clone; no `dist/`/`*.bundle`/`USER_DATA/` tracked; `session_log.md` not bloat.
3. **Optimization:** Smallest `304k` main chunk without sacrificing `OPFS` safety; single storage code path (remove mirror).

---

## 2. Scope — Lean Combo Breakdown

### 2A — Hygiene Sweep (`2A` full)
*Why:* `dist/` is build output (regenerated in `7s`), `*.bundle` is backup of rewritten history, `USER_DATA/` is PII — none belong in git. Clean repo = faster clone, correct `.gitignore`.
*Files:* `.gitignore:4` (`dist/` already), verify `*.bundle`, `test-results/`, `playwright-report/`; `git rm --cached dist/` if tracked (currently not tracked, verified `git ls-files --error-unmatch dist` returns error); `depcheck` + `npm prune` (check unused `shadcn`, `agentation`, `autoprefixer`).
*Risk:* Low — no code change, only index.

### 2B — Optimization (`3A`)
*Bundle polish:* `SetupWizard` already lazy, but `OtherLedgerDetail` + `GroupLedgerScreen` still import `jsPDF`/`html2canvas` eagerly only on PDF click — already lazy via `import('jspdf')`? Check — currently `import jsPDF from 'jspdf'` is eager (`23k` + `426k`). Change to `dynamic import()` inside `downloadPdf` → shave `~30k` from main chunk + `Calendar` (`lucide`) tree-shake.
*Mirror removal (`OPEN-A`):* `src/infrastructure/database/storage/opfsAdapter.ts` holds `localStorage` transition mirror (`mirrorWrite`, `mirrorRead`). Since `v1.4.0` → `v1.5.0` is one tagged release past `OPFS` ship (`T-093..T-101`), per `TICKETS.md OPEN-A` “after next tagged release” we can delete mirror block + `localStorage` fallback test that asserts mirror. Single storage path thereafter.
*Risk:* Medium — storage path change needs `T-101` E2E re-verify (`migration → delete-persist → corrupt-boot`).

### 2C — Readability (`1A` full T-092 splits)
*Measured today (max 300):*

| File | LOC | Split Into |
|------|-----|------------|
| `src/presentation/screens/MemberProfile.tsx` | 887 | `profileHero.tsx` (hero + stats) + `accountsSection.tsx` (dropdown + `AccountCard` grid) + `ledgerSection.tsx` (toolbar `LedgerSearch`/`SegmentedTabs` + `LedgerTable` + `MobileLedger`) + `hooks/useLedgerBalance.ts` (shared `balMap` logic) |
| `src/presentation/modals/TransactionFormModal.tsx` | 898 | `formFields.tsx` (amount + date + description) + `pickers.tsx` (`source`/`destination`/`tag`/`borrower` `pickerOverlay`) + `validation.ts` (pure `validateForm`) + keep `TransactionFormModal.tsx` as orchestrator (<250) |
| `src/infrastructure/database/SQLiteDatabaseService.ts` | 739 | `membersRepo.ts` / `accountsRepo.ts` / `transactionsRepo.ts` / `otherLedgersRepo.ts` (each <150, share `query`/`run` helpers via `dbHandle.ts`) + `SQLiteDatabaseService.ts` delegates to repos (port `IDatabaseService` unchanged) |
| `src/presentation/screens/Dashboard.tsx` | ~390 | `dashboardMetrics.tsx` + `dashboardBalances.tsx` + keep `Dashboard.tsx` as shell |
| `src/presentation/screens/GroupLedgerScreen.tsx` | 397 (just over) | `groupLedgerToolbar.tsx` + keep screen <300 |

*Why split `vs` leave `T-092` deferred:* Next agent’s `impact()`/`context()` will be precise per file, `DESIGN_IDENTITY §17` gate is per-file, and `MemberProfile` is touched every ledger fix (ledger balance bugs). Deferred means every future ticket pays the 887-line tax.
*Risk:* High — ~20 import rewrites, must keep `IDatabaseService` contract stable; needs `detect_changes --compare master` before merge to `dev`.

---

## 3. Tickets Raised (Phase 15 — Cleanup & Optimization)

> Next free numbers after `T-123` (Other Ledgers V2 future) are `T-124`… — used here. Each ticket is atomic, ≤300 LOC per file, one logical change per commit.

| Ticket | Title | Skill | Effort | Depends | Acceptance |
|--------|-------|-------|--------|---------|------------|
| **T-124** | Hygiene: verify `.gitignore` + remove tracked `dist`/`*.bundle` if any + `depcheck`/`prune` | `code-reviewer`, `senior-backend` | S | — | `git ls-files | grep -E "dist|\.bundle|USER_DATA" == 0`, `git status` clean, `build` still green |
| **T-125** | Optimization: lazy-load `jspdf`/`autotable`/`html2canvas`/`Calendar` (dynamic `import()`) | `senior-frontend` | S | T-124 | Main chunk `index-*.js` `-30k`, `PDF` still works on click, `typecheck/lint/build` green |
| **T-126** | Remove OPFS `localStorage` transition mirror (`OPEN-A`) + mirror tests | `senior-backend` | M | T-124 | `opfsAdapter.ts` no `localStorage` refs, `storage.test.ts` 9→8 tests, `E2E T-101` (migration, delete-persist, corrupt-boot) still passes, `OPFS` is sole path |
| **T-127** | Split `MemberProfile.tsx` 887 → 4 files | `senior-frontend`, `ui-ux-pro-max` | L | T-124 | `MemberProfile.tsx` ≤250, new files ≤200 each, `typecheck/lint/build` green, ledger balance still correct (vitest 19) |
| **T-128** | Split `TransactionFormModal.tsx` 898 → 4 files | `senior-frontend` | L | T-124 | `TransactionFormModal.tsx` ≤250, `pickers.tsx` etc ≤250, wizard still opens/validates/saves, `build` green |
| **T-129** | Split `SQLiteDatabaseService.ts` 739 → repos | `senior-backend` | L | T-124 | `SQLiteDatabaseService.ts` delegates, repos <150 each, `IDatabaseService` unchanged, `recalculateBalances` still passes, `build` green |
| **T-130** | Split `Dashboard.tsx` + `GroupLedgerScreen.tsx` + de-dupe `ledgerGradient` | `senior-frontend`, `frontend-design` | M | T-124 | Both screens ≤300, `constants/gradients.ts` single source, `build` green |
| **T-131** | Docs: archive `session_log.md` tail + de-dupe `TICKETS.md` duplicate `T-107` | `skill-creator` | S | T-127…T-130 | `session_log.md` ≤400 lines (rest to `docs/audit/session_log.archive.md`), `TICKETS.md` no duplicate, `build` green |

Dependencies: `T-124 → (T-125 ∥ T-126) → (T-127 ∥ T-128 ∥ T-129 ∥ T-130) → T-131`. Only `T-124` blocks the rest.

---

## 4. Branching per REPO_RULES

1. `git checkout dev` (green at `cf58598` `v1.5.0`)
2. `git checkout -b feature/cleanup-optimization` (new repo/branch — per §1 `feature/<short-name>`)
3. Work on `feature/cleanup-optimization` → atomic commits per ticket (`chore(repo): hygiene` / `perf(bundle): lazy` / `refactor(member-profile): split` …)
4. Before each commit: `npm run typecheck && npm run lint -- --max-warnings 0 && npm run build` + `npm run test -- --exclude e2e` + `detect_changes()`
5. After branch green: `PR feature/cleanup-optimization → dev` (squash-merge per §3.4, keep branch per user preference)
6. Then `dev → master` (user-approved, §3.12) with `CHANGELOG [Unreleased]` curated, tag `v1.6.0` (minor — `refactor` + `perf`, no breaking).

---

## 5. What We Will NOT Do Here

- No `Supabase`/`V2 dual-post` — stays in `OTHER_LEDGERS_FUTURE_V2.md` `T-119..T-123`.
- No `PWA toast` (`OPEN-B`) — deferred to next PWA batch.
- No `S-5 DB LIKE` (`transactions >1000`) — deferred.
- No UI redesign — only splits, no pixel changes (`DESIGN_IDENTITY` gates unchanged).

---

## 6. Rollback Plan

If any split breaks `vitest` or `E2E T-101`, we revert that ticket’s commit on the feature branch (`git revert <sha>`) and keep the other tickets — hygiene (`T-124`) and mirror removal (`T-126`) are independent.

---

**Next action (awaiting your “build” confirmation):** Create branch `feature/cleanup-optimization` and start `T-124` hygiene. No code has been changed yet — this plan is the only new file.

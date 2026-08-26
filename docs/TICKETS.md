# MoneyFlows — Feature Ticket List

**Version:** 3.0 · 2026-08-24
All tickets T-001…T-101 (Phases 1–11) are **complete**. Full historical specs live in git history (`git log -- docs/TICKETS.md`); audit context in `docs/audit/FINDINGS.md`.

---

## Completed Phases Index

| Phase | Theme | Tickets |
|-------|-------|---------|
| 1 | Foundation — schema, DB service, shell, dashboard, members, loans v1, wizard, recycle bin | T-001–T-030 |
| 2 | Groups, budgets/goals, polish | T-031–T-042 |
| 3 | Dynamic Configuration & Hardening (settings store, locale/currency, constants) | T-043–T-050 |
| 4 | Unified Loan System rewrite (`src/loans/`) | T-051–T-059 |
| 5 | Data Backup & Safety (restore points, integrity, FolderSync) | T-060–T-064 |
| 6 | Mobile Screen UI (bottom sheets, nav, responsive) | T-065–T-083 |
| 7 | Audit Remediation & Hardening (BUG-6, gates → `--max-warnings 0`, vitest) | T-084–T-091 |
| 8 | Storage Overhaul — OPFS migration, write coalescing, BUG-7 freeze fix | T-093–T-101 |
| 9 | v1.0.0 release + Account Edit/Delete + What's New modal | T-102–T-106 |

## Completed — Phase 12 (v1.1.0): UX Completeness Batch (2026-08-24)

### T-102 - App version in Settings — **Complete**
`__APP_VERSION__` injected via Vite define from package.json; muted footer line. Crash-safe read via `constants/appVersion.ts`.

### T-103 - What's New modal on update — **Complete**
Auto-opens once per version change (`lastSeenVersion` in AppSettings); plain-English bullets in `constants/whatsNew.ts`; top-left cross close; re-openable from Settings row; first installs included.

### T-104 - Account edit & delete UI — **Complete**
Pencil action on every account card (desktop grid + mobile selector) opens `EditAccountModal`: rename / change type / danger-zone delete with transaction & loan-movement counts and two-step confirm. Soft-delete → Recycle Bin (restorable 30 days).

### T-105 - Deleted-account labeling — **Complete**
Ledgers, detail modals, group screens, loan reports and PDFs render "(deleted account)" instead of raw IDs for history rows referencing a deleted account.

### T-106 - BUG-3 fix — **Complete**
Add-Account refreshes the accounts store so the new balance displays immediately.

### T-107 - Wizard pre-fills open ledger account — **Complete** (v1.1.1)
All four transaction-form entry points in MemberProfile pass `initialSource=selectedAccountId`; Income/Expense/Transfer pills also pin their tab. Verified: Bkash ledger → wizard opens with Source=Bkash.

### T-108 - Loan-ledger PDF export detail chooser — **Complete**
Download PDF opens a radio chooser (All details / Just description); choice persists via `settings.reportDetailMode`. Verified: both modes export, content checked, chooser readable on opaque panel.

### T-109 - Transaction tags: create + edit with autocomplete — **Complete**
Single optional tag stored in `metadata.tags`; typed with datalist suggestions from the persisted tag registry (`useTagStore`); editable in TransactionEditModal. Loan-movement tabs untagged for now.

### T-110 - Member ledger tag filter — **Complete**
Tag dropdown in the ledger toolbar (options = registry ∪ tags present in view); filters rows only, balance math untouched.

### T-111 - Family-wide tag browser (`/tags`, `/tags/:tag`) — **Complete**
Cross-member ledger per tag with member/account/description/amount and In/Out totals; reachable from the member toolbar once a tag is selected and via the new sidebar **Tags** nav item.

### T-112 - Tag management UI on the Tags page — **Complete** (v1.1.1)
Create / rename / delete directly on `/tags`: inline create row, per-card ✎ rename (rewrites the tag across all carrying transactions) and 🗑 two-step delete (strips it from transactions). Removed the interim Settings chips section. Sidebar gains a Tags item under Loans.

### T-107 - Wizard pre-fills open ledger account — **Complete** (v1.1.1)
All four transaction-form entry points in MemberProfile pass `initialSource=selectedAccountId`; Income/Expense/Transfer pills also pin their tab. Verified: Bkash ledger → wizard opens with Source=Bkash.


## Deferred / Open Items

| ID | Title | Skill(s) | Trigger |
|----|-------|----------|---------|
| T-092 | Split oversized files >300 LOC (MemberProfile 764, TransactionFormModal ~740, SQLiteDatabaseService ~650, Dashboard ~490) | `senior-frontend`, `ui-ux-pro-max` | touch when next edited |
| OPEN-A | Remove localStorage transition mirror once one release cycle has shipped on OPFS storage | `senior-backend` | after next tagged release |
| OPEN-B | PWA "update ready" toast instead of silent worker claim | `senior-frontend`, `ui-ux-pro-max` | next PWA-focused batch |

## Next Phase — Search Expansion: Global + Ledger-Scoped (S-1…S-5)

Plan: `docs/plans/SEARCH_PLAN.md` (approved 2026-08-26). Dashboard search → all transactions + highlight; ledger search → that ledger only, widened fields + highlight; DB LIKE deferred.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| S-1 | Highlight primitive + `--color-primary-mark` token | `ui-ux-pro-max`, `frontend-design` | S | **Complete** |
| S-2 | Dashboard: search ALL transactions + highlight (fix slice-before-filter, `matchesTx`, debounced) | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** |
| S-3 | Ledgers: widen fields (amount/account/tag/date) + highlight + pagination fix (`MemberProfile` `GroupLedger` `LoanDetail` `TagLedger`) | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** |
| S-4 | Groups/Loans: decouple from global `useSearchStore` (`effectiveSearch = mobileSearch \|\| global` → local only) + highlight | `senior-frontend` | S | **Complete** |
| S-5 | (Deferred) DB `LIKE` on `description`/`metadata.tags` + index — trigger when `transactions.length > 1000` | `senior-backend` | S | Deferred |

Dependencies: S-1 → (S-2 ∥ S-3) → S-4 → S-5. **S-1..S-4 done on dev — highlight + global all-transactions + ledger-scoped widen + pagination fix.**

## Following Phase

Candidates after search: Supabase sync groundwork, budgets/goals expansion, CSV export. Nothing else ticketed until the user picks a direction.

## Ticket Template (use for all new work)

```markdown
### T-<id> - <title>
**Skill:** <primary skill(s)>
**Effort:** S | M | L | XL
**File(s):** <paths>
**Content:**
1. …numbered, concrete steps…
**Acceptance:** <observable, testable outcome>
```

Rules: bite-sized & atomic · one logical change per commit · run typecheck/lint/test/build before done · `detect_changes()` before commit for code tickets.

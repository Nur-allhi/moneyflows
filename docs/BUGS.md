# MoneyFlows — Bug Tracker

Living queue of known issues. Maintained per the BUG TRACKING PROTOCOL (AGENTS.md §3.11).

## Ordering rules (maintain this file exactly so)

1. `open` and `in-progress` bugs always sort above `fixed` and `wontfix`.
2. Within the same status, sort by severity: `critical` → `high` → `medium` → `low`.
3. Within the same status + severity, sort by found date, oldest first.
4. `fixed`/`wontfix` entries stay at the bottom as history, in the same severity/date order.

## Entry template

```markdown
## BUG-<sequential-id>: <short title>

- **Status:** open | in-progress | fixed | wontfix
- **Severity:** critical | high | medium | low
- **Found:** YYYY-MM-DD (during: <what surfaced it>)
- **Location:** <file(s)/component/route affected>
- **Description:** What's wrong; observed vs. expected behavior.
- **Root Cause:** (unknown until diagnosed)
- **Fix Approach:** (only after user confirms the approach)
- **Resolved:** YYYY-MM-DD — commit/PR reference
```

---

## BUG-3: Accounts list shows stale balance (0) right after Add-Account

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-08-24 (during: BUG-2 reproduction testing)
- **Location:** `AddAccountModal.tsx` handleSave → `useAccountStore.accounts`
- **Description:** After creating an account with an initial balance, the in-memory accounts store still reported the pre-transaction snapshot (balance 0) because only the transactions store was updated; the UI corrected itself on next remount/refetch.
- **Root Cause:** Modal awaited `saveAccount` + `addTransaction` but never re-fetched accounts.
- **Fix Approach:** owner-approved — call `fetchAccounts()` after the opening-balance transaction in `handleSave`.
- **Resolved:** 2026-08-24 — commit adds `await fetchAccounts()`; verified live (immediate balance 777 visible post-save, no reload).

---

## BUG-4: Dashboard "+ New Transaction" label unreadable on hover in light mode

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-02 (during: Phase 16 light-mode verification, user report)
- **Location:** `src/presentation/screens/Dashboard.module.css` `.actBtn:hover` vs `.actPrimary`
- **Description:** In light mode, hovering the gradient "+ New Transaction" button washes the label out. Observed: hover background turns near-white while the label stays white. Expected: gradient persists on hover with a glow/opacity shift, label stays readable.
- **Root Cause:** `.actBtn:hover` (specificity 0,2,0) sets a wash `background`, which beats `.actPrimary`'s gradient (0,1,0); `.actPrimary:hover` only sets `opacity`, so it never restores the background. In dark mode the wash-over-dark stayed readable, which hid the defect.
- **Fix Approach:** owner-approved option A (scoped variant hover) — `.actPrimary:hover` re-asserts the primary gradient + opacity/glow, matching every other gradient button.
- **Resolved:** 2026-10-02 — fix commit on `feature/theme-accent`; verified live (light-mode hover keeps gradient + white label, screenshot + computed-style check). CHANGELOG entry deferred to `dev` merge.

---

## BUG-2: App "restarts" while creating a new account under a member

- **Status:** wontfix
- **Severity:** high
- **Found:** 2026-08-24 (during: user manual test report)
- **Location:** Add-Account flow (MemberProfile → AddAccountModal)
- **Description:** App appeared to restart while creating an account under a member.
- **Root Cause:** Could not reproduce in current build (v1.0.0+): scripted E2E run created an account under a member with **no reload** (page marker survived), correct member link, and correct persistence (opening balance 500 + Opening Balance transaction verified after reload). Strongest explanation: Vite dev-server auto-restarts/full-reloads during the recent heavy editing sessions — browser tabs auto-refreshed mid-action, which looks exactly like an app restart. Production/PWA builds have no such trigger.
- **Fix Approach:** none required for the app. If it recurs outside dev-server sessions, capture the time + console state and reopen.
- **Resolved:** 2026-08-24 — closed as dev-environment artifact; see BUG-3 for the real (minor) issue found during this investigation.

---

## BUG-1: Real family names and financial PDF persist in tracked docs and git history

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-08-24 (during: full-project PII name audit requested by owner)
- **Location:** `Project_plan/Financial_Review.md` (25 hits), `Project_plan/*.md`, `DESIGN_FILES/*.html`, `DESIGN.md`, `docs/PRD.md`, `AGENTS.md`, `session_log.md`, and **git history**: PDF blob added in `f9f802a`, removed at HEAD by `68f3771`, still reachable from `master`
- **Description:** SECURITY.md §5 forbids real person names tied to financial figures. Full names were present across 14+ tracked files and an exported loan-ledger PDF remained extractable from history. Runtime code was already clean.
- **Root Cause:** Scaffolding docs authored from the family's real spreadsheet audit; mockups reused real member names; data PDF slipped into one fix commit before `.gitignore` covered `USER_DATA/`.
- **Fix Approach:** owner-approved Option B2 — full `git filter-repo` rewrite on a mirror clone: USER_DATA paths purged + all family/counterparty names replaced with role placeholders across every commit; all refs force-pushed.
- **Resolved:** 2026-08-24 — history rewrite (all SHAs replaced; pre-rewrite backup bundle `C:\Dev_Projects\moneyflows-backup-pre-rewrite.bundle`; post-rewrite scan shows 0 tracked files with real names). Residual platform caveat documented in `docs/audit/PII_NAMES_AUDIT_2026-08-24.md` §7.

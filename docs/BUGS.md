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

## BUG-1: Real family names and financial PDF persist in tracked docs and git history

- **Status:** open
- **Severity:** high
- **Found:** 2026-08-24 (during: full-project PII name audit requested by owner)
- **Location:** `Project_plan/Financial_Review.md` (25 hits), `Project_plan/Project_Brief.md`, `Project_plan/System_Design.md`, `Project_plan/Unified_Loan_System_Plan.md`, `Project_plan/Project_Plan.md`, `DESIGN_FILES/*.html` (~40 hits across mockups), `DESIGN.md`, `docs/PRD.md`, `AGENTS.md`, `session_log.md`, and **git history**: PDF blob `USER_DATA/loan_ledger_home_exp_-_father_2026-07-15 (1).pdf` added in `f9f802a`, removed at HEAD by `68f3771`, still reachable from `master`
- **Description:** SECURITY.md §5 forbids real person names tied to financial figures in the repo. Full names present include "Admin", "Father", "Mother", "Mother", plus external counterparties (External Debtor A, External Debtor B, External Debtor C, External Debtor D). Worst offender: `Financial_Review.md` ties full real names directly to account balances and loan amounts. Additionally, an exported loan-ledger PDF containing a real name and amounts was accidentally committed (`f9f802a`) and, though deleted at HEAD (`68f3771`), remains extractable from history on `master`. Runtime code is clean — `src/` has zero name hardcodes since T-087.
- **Root Cause:** Original scaffolding documents were authored from the family's real spreadsheet audit; design mockups reused real member names as sample data; a data PDF slipped into one fix commit before `.gitignore` covered `USER_DATA/`.
- **Fix Approach:** pending owner decision (options in `docs/audit/PII_NAMES_AUDIT_2026-08-24.md` §Remediation)
- **Resolved:** —

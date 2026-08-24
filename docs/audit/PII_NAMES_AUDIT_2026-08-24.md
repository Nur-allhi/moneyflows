# PII / Hardcoded-Name Audit — Full Project Scan

**Date:** 2026-08-24 · **Requested by:** owner ("is any hardcoded family person's name available?")
**Method:** case-insensitive pattern scan (`admin|father|father|mother|mother|father|external debtor a|external debtor b|external debtor c|bagdad|<owner>`) across every tracked file, filenames, and git pickaxe history probes; plus manual review of untracked local artifacts.
**Companion register:** `docs/BUGS.md` BUG-1.

---

## 1. Executive Summary

| Question | Answer |
|---|---|
| Hardcoded names in **runtime code** (`src/`)? | **NO — clean.** Zero hits; last one ('Admin') removed in T-087/`2cb2fdb`. |
| Names in **tracked docs/design files**? | **YES — extensive** (~90+ occurrences across 14 tracked files), incl. full real names tied to real account balances. |
| Names in **git history**? | **YES — worst finding:** the exported loan-ledger PDF `USER_DATA/loan_ledger_home_exp_-_father_2026-07-15 (1).pdf` (real name + amounts) was committed in `f9f802a`, deleted at HEAD by `68f3771`, but the blob remains **reachable from `master`** (`git rev-list master -- USER_DATA/*` → 2 commits). |
| App-facing surfaces (manifest, package.json, index.html, sw.js)? | Clean — generic "MoneyFlows" only. |
| Untracked local artifacts with data? | Yes: `USER_DATA/*.pdf`, `db_b64.txt` (full DB dump), `demo.db` (212 KB DB copy), `view_db.cjs`, `dashboard` — all gitignored since Phase 10; local-only. |

Full names present: **Admin**, **Father** (father), **Mother** (mother — full real name), **Mother**, plus external counterparties **External Debtor A, External Debtor B, External Debtor C, External Debtor D (BTC)**.

---

## 2. Findings Matrix — tracked files (all reachable from `master`)

### 🔴 High sensitivity — names tied to financial figures

| File | Hits | What's exposed |
|------|------|----------------|
| `Project_plan/Financial_Review.md` | 25 | Full names (**Father**, **Mother**) mapped to specific accounts, balances and loan ledgers from the original spreadsheet |
| `USER_DATA/…father….pdf` | blob in history | Real-name PDF export with loan ledger amounts — extractable via `git show f9f802a:...` |
| `session_log.md:336` | 1 | Full 8-member roster incl. "Father", "Mother" |

### 🟠 Medium sensitivity — names as narrative/sample data (no amounts attached)

| File | Hits | Notes |
|------|------|-------|
| `DESIGN_FILES/*.html` (~9 files) | ~40 | Mockups use real family names as sample members (Admin/Father/Mother avatars, member lists, settings dropdowns) |
| `DESIGN.md` | 1 | "Member-specific gradients: Admin (violet), Father (teal), Mother (pink)" |
| `docs/PRD.md` | 4 | Users table (v3.0 — written before this audit; violates SECURITY §5.5) |
| `Project_plan/Project_Brief.md` | 4 | Users + debtor list |
| `Project_plan/System_Design.md`, `Unified_Loan_System_Plan.md`, `Project_Plan.md` | 2/5/1 | Sample references |

### 🟡 Low sensitivity — code-history mentions

| File | Hits | Notes |
|------|------|-------|
| `AGENTS.md:136` | 1 | Historical ticket note "Removed hardcoded `'Admin'`…" (documents a fix) |

### ✅ Verified clean

`src/**` (zero hits — all screens/stores/tests) · `public/*` (manifest/sw/icons) · `package.json` · `index.html` · `db_b64.txt` (never tracked) · `.gitignore` itself.

### 📁 Local-only (untracked, gitignored — not in remote)

`USER_DATA/*.pdf` (the same PDF, local copy) · `db_b64.txt` (284 KB full-DB dump) · `demo.db` (212 KB SQLite copy) · `view_db.cjs`, `dashboard` (debug tools).

---

## 3. Git History Evidence

```bash
git log --all --oneline --diff-filter=A -- "USER_DATA/*"
# → f9f802a  (PDF added, inside a fix commit)
git log --oneline -- USER_DATA db_b64.txt demo.db
# → 68f3771  (PDF removed at HEAD)
git rev-list master --count -- "USER_DATA/*"   # → 2  (blob still reachable from master)
git log --all -S "Father"               # → d5290b3, 1c1ebcc (doc scrub left history traces)
```

Remote: `github.com/<owner>/moneyflows`. Exposure depends on repo visibility (private vs public) — **owner to confirm**; if public or ever made public, §3 history becomes an active leak.

---

## 4. Risk Assessment

| Risk | Level | Rationale |
|---|---|---|
| PDF blob in master history | **HIGH** | Real name + complete loan ledger, one command away for anyone with clone access |
| `Financial_Review.md` on master | HIGH | Full names ↔ balances/loans mapping in plain markdown |
| PRD/session_log/mockup names | MEDIUM | Identity exposure without amounts; accumulates into a profile when combined |
| Local untracked artifacts | LOW | Gitignored; risk only via careless `git add -f` or shared machine |

---

## 5. Remediation Options (decision required — nothing executed yet)

**Option A — Going-forward scrub only**
Replace all real names in current HEAD docs/design files with neutral placeholders (e.g., "Admin", "Father", "Mother", "Debtor A–D"); keep history untouched.
✅ Fast (~1 session), no force-push, SHAs stable. ❌ PDF + old content remain extractable from history forever.

**Option B — Scrub + history rewrite (filter-repo)**
Option A plus `git filter-repo` to purge the USER_DATA pdf blob (and optionally rewrite names across all history), then force-push `master`+`dev`.
✅ Only complete fix for the PDF leak. ❌ Rewrites all SHAs (open PRs/clones break), needs coordinated re-clone, tags/notes must be re-tagged. My lean: **B**, executed once, carefully — the PDF is real financial data.

**Option C — Access control stopgap**
Confirm/set the GitHub repo to private regardless of A/B; revisit if the project ever goes public.
✅ Instant risk reduction. ❌ Not a substitute for either above; relies on GitHub settings discipline.

Recommended sequence: **C immediately → A in next docs pass → B as its own approved operation.**

---

## 6. Re-run commands (appendix)

```bash
git grep -i -n -E "admin|father|father|mother|mother|father|external debtor a|external debtor b|external debtor c|bagdad" -- .
git grep -i -c -E "…" -- Project_plan
git log --all --oneline --diff-filter=A -- "USER_DATA/*"
git rev-list master --count -- "USER_DATA/*"
```

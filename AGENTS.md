# MoneyFlows — Agent Configuration

## 1. Available Skills

| Skill | Purpose |
|-------|---------|
| `frontend-design` | CSS architecture, glassmorphism, visual design tokens, responsive layout |
| `code-reviewer` | Code quality, security audit, test coverage, performance review |
| `ui-ux-pro-max` | UI component design, interaction states, animations, design system |
| `senior-backend` | Database schema, API design, data access layer, services |
| `senior-frontend` | React components, Zustand stores, routing, TypeScript patterns |
| `skill-creator` | PRD, workflow docs, project planning |
| `gitnexus` | Git workflow, branching, PR management |

## 2. Project Structure

```
money_flows_v0.4/
├── Project_plan/
│   ├── Project_Brief.md
│   └── Project_Plan.md
├── docs/
│   ├── PRD.md               — Product Requirement Document
│   ├── TAD.md               — Technical Architecture Document
│   ├── SECURITY.md           — Security & Access Document
│   ├── FRONTEND_SPEC.md      — Frontend Spec Document
│   ├── DESIGN_IDENTITY.md    — Canonical design rules (must pass §17 to merge)
│   ├── VERSIONING.md         — Version bump rules (agent auto-applies §2→§3)
│   ├── TICKETS.md            — Feature Ticket List
│   ├── REPO_RULES.md          — Repo Management Document (branch/commit/merge rules)
│   ├── plans/
│   │   ├── OTHER_LEDGERS_PLAN.md       — Other Ledgers v1 (approved, next to build)
│   │   └── OTHER_LEDGERS_FUTURE_V2.md  — Other Ledgers V2 dual-post (complete, v2.2.0)
│   └── audit/                 — Project audit reports + findings register
├── src/
│   ├── core/
│   │   ├── domain/
│   │   ├── application/
│   │   └── ports/
│   ├── infrastructure/
│   │   ├── database/
│   │   └── repositories/
│   └── presentation/
│       ├── components/
│       ├── screens/
│       ├── hooks/
│       ├── stores/
│       └── styles/
├── DESIGN.md                — Design system reference (derived from DESIGN_FILES/)
├── DESIGN_FILES/            — Visual design source of truth (HTML mockups for all screens)
│   ├── brand-spec.md        — Brand tokens extracted from design brief
│   ├── DESIGN-MANIFEST.json — Machine-readable screen map
│   ├── index.html           — Launcher / overview page
│   ├── screen-1-dashboard.html
│   ├── screen-2-member.html / screen-2-member-desktop.html
│   ├── screen-3-loans.html
│   ├── screen-4-transaction.html / screen-4-transaction-desktop.html
│   └── screen-5-recycle.html
├── AGENTS.md
├── session_log.md
└── ... (vite, tsconfig, package.json, etc.)
```

## 3. Workflow Rules

### 3.1 Skill Assignment
- Each ticket in `docs/TICKETS.md` has a `**Skill:**` field — use that skill when working on the ticket.
- Use `skill` tool to load the skill instructions before starting work.

### 3.2 Design Reference
- **`DESIGN_FILES/`** is the visual source of truth. Each HTML file in that folder is the exact pixel spec for its screen.
- `DESIGN.md` at the project root is the derived design system reference — keep it in sync with `DESIGN_FILES/`.
- **`docs/DESIGN_IDENTITY.md`** is the canonical, review-enforceable ruleset for scaling the UI (tokens, surfaces, interactive states, modals/sheets/dropdowns, icons, motion, responsive, checklist). **Every new component, modal, dropdown, icon, or screen MUST satisfy `DESIGN_IDENTITY.md` §17 before merge** — a failing checklist blocks merge. Treat divergences as defects.
- When building a screen, open its corresponding HTML file in `DESIGN_FILES/` first to match layout, colors, spacing, typography, and component states, then validate against `docs/DESIGN_IDENTITY.md`.

### 3.3 Document Conventions
- All docs live in `docs/` folder.
- File length limit: each code file ≤300 LOC.
- Write code only to spec. Minimum, not maximum. One simple solution. Clarify, don't assume.

### 3.4 Code Style
- TypeScript strict mode.
- CSS Modules + CSS custom properties (no runtime CSS-in-JS).
- React functional components with hooks.
- Clean Architecture: UI never imports the SQLite driver (`sql.js`) directly.
- Design identity: no `style={{}}` (except shadcn), no hex/literal spacing, no hardcoded currency/locale — see `docs/DESIGN_IDENTITY.md` §2, §14, §16.
- Versioning: `package.json:4` is the single source — `docs/VERSIONING.md` §2→§3 tells the agent when/how to bump it (four files in one commit) so `Settings` + `whatsNew` + `CHANGELOG` stay in sync.

### 3.5 Session Start Ritual
- **At the start of EVERY session**, read `session_log.md` (last entry for current position) and this file §5 (current ticket).
- This ensures you always know what was built, what failed, and what's next — even after a fresh start.

### 3.6 Context Management
- Monitor context usage. When context is approaching ~80%, STOP work immediately.
- Before stopping: stage all changes, `git commit`, update `session_log.md`, update this file §5 to the next ticket.
- This enables the user to always start a fresh session from a clean checkpoint.

### 3.7 Session Logging
- Append to `session_log.md` after every change.
- Format: `## Session YYYY-MM-DD HH:MM` → `### Changes` → `### Skill(s) Used` → `### Status`
- Each entry MUST clearly state what was completed and what the next ticket is.
- This is the primary handoff mechanism for fresh sessions — make it thorough.

### 3.8 Merge Restriction
- All coding and fixes happen **outside master** (on `dev` or feature branches).
- Committing and pushing to those branches is permitted without asking.
- **Merging to `master` is NEVER permitted without explicit user approval.**
- This applies to every merge, even fast-forward merges — always ask first.

### 3.9 AGENTS.md Management
- Check this file (§3 and §5) at the start of every conversation.
- Update if new conventions or files are introduced.

### 3.10 Decision-Making & Confirmation Protocol
- Whenever a choice exists (architecture, library, pattern, data model, naming, UI approach), do NOT silently pick one: surface the decision with at least 2 genuinely viable options — what it is, why it could be right, its main downside — and state which you'd lean toward and why. Final call is the user's.
- No file is created/edited/deleted, no code written or refactored, no dependency added until the user explicitly confirms the specific approach ("yes, go with X"). Silence or topic-change is NOT confirmation.
- Confirm the overall approach once per task; re-confirm before any NEW decision point not already agreed.
- Minor mechanical actions within an approved task need no re-confirmation.

### 3.11 Bug Tracking Protocol
- The moment a bug is identified/reported/discovered, log it in `docs/BUGS.md` BEFORE anything else (discussion is not a substitute for logging).
- Do not fix in the same breath as finding: log first, then follow §3.10 to agree a fix approach — unless the user explicitly says fix immediately.
- Entry format and ordering rules live at the top of `docs/BUGS.md`. Keep `open`/`in-progress` sorted above `fixed`/`wontfix`; within same status sort severity (`critical→low`) then found-date (oldest first). Fixed entries stay as history at the bottom.
- Every session touching a bug logs a line in `session_log.md` referencing the BUG-<id>.
- A merged bug fix updates, in the SAME commit: CHANGELOG `Fixed`, BUGS.md Status/Resolved fields.

### 3.12 Merge Confirmation
- Merges into `dev` or `master` ALWAYS require explicit user confirmation at merge time — even when all REPO_RULES criteria are satisfied (criteria make a merge *eligible*, not *approved*).
- Before requesting confirmation, summarize: what's being merged, ticket(s) closed, included README/CHANGELOG updates.
- Update §5 to the next ticket after completing each ticket.

## 4. Session Logs

See `session_log.md` for complete session history.

## 5. Current Ticket / Next Up

**All 42 original tickets done.** Now in Phase 6 — Dynamic Configuration & Hardening.

**Completed Phase 6 thus far:**
- T-043: App settings store (`useSettingsStore.ts` + `AppSettings.ts`) with locale, currency, primary member, constants persisted to localStorage
- T-044: Dynamic currency from settings — `formatAmount()` utility + replaced all hardcoded `'BDT'` in all screens
- T-045: Dynamic locale from settings — `useFormatNumber()` hook + replaced all raw `Intl.NumberFormat` calls in TransactionWizard, all screens use `formatAmount()` with locale from store
- T-046: Removed hardcoded `'Admin'` from Loans screen — reads actual lender name via account→member lookup
- T-047: Extracted duplicated MONTH/day arrays into `src/presentation/constants/dates.ts` — `shortDate()` now locale-aware via `Intl.DateTimeFormat`, 4 duplicate definitions removed
- T-048: Extracted account type / transaction type labels into `src/presentation/constants/labels.ts` — `ACCOUNT_TYPE_LABEL`, `ACCOUNT_TYPE_GRADIENT`, `ACCOUNT_TYPE_ACCENT`, `TX_TYPE_ICON`, `displayType()`; replaced 6+ hardcoded maps across components and screens
- T-049: Replaced all inline `style={{...}}` with CSS module classes or CSS custom properties — 12 files updated, only shadcn/ui `select.tsx` remains
- T-050: Extracted magic number constants into `src/presentation/constants/config.ts` — defaults and min/max bounds for descriptionMaxLength, numpadMaxDigits, dashboardTxLimit

**All 50 tickets complete.** Phase 6 — Dynamic Configuration & Hardening is finished.

**Phase 7: Unified Loan System** — 9 tickets (T-051–T-059). See `docs/TICKETS.md` for full details.

| Ticket | Description | Status |
|--------|-------------|--------|
| T-051 | Scaffold `src/loans/` folder + move types + public API | **Complete** |
| T-052 | Rewrite loan schema + database layer | **Complete** |
| T-053 | Rewrite `LoanService.ts` — unified core logic | **Complete** |
| T-054 | Rewrite `useLoanStore.ts` | **Complete** |
| T-055 | Build unified `LoanForm.tsx` + `AddCounterparty.tsx` | **Complete** |
| T-056 | Rewrite `LoansScreen.tsx` + `LoanDetailView.tsx` | **Complete** |
| T-057 | Update `TransactionDetailModal` + simplify `TransactionFormModal` | **Complete** |
| T-058 | Update routing, Dashboard, MemberProfile, cross-references | **Complete** |
| T-059 | Delete all old loan code and obsolete files | **Complete** |

**All 59 tickets complete.** Phase 7 — Unified Loan System is finished.

**Phase 8: Data Backup & Safety** — 5 tickets (T-060–T-064). See `docs/TICKETS.md` for full details.

| Ticket | Description | Status |
|--------|-------------|--------|
| T-060 | Ring buffer auto-backup in `save()` | **Complete** |
| T-061 | Restore Points UI in SettingsModal | **Complete** |
| T-062 | Integrity hash verification (SHA-256) | **Complete** |
| T-063 | Build `FolderSync.ts` — File System Access API module | **Complete** |
| T-064 | Wire FolderSync into `save()` + Settings UI | **Complete** |

**All 64 tickets complete.** Phase 8 — Data Backup & Safety is finished.

**Phase 9: Mobile Screen UI** — 19 tickets (T-065–T-083). All **Complete**.

**Phase 10: Audit Remediation & Hardening** (source: `docs/audit/FINDINGS.md`)

| Ticket | Description | Status |
|--------|-------------|--------|
| T-084 | Commit running-balance fix | **Complete** (`90355e0`) |
| T-085 | Gitignore sensitive/debug artifacts | **Complete** (`8af1417`) |
| T-086 | TransactionEditModal hooks crash + inline styles | **Complete** (`37af73a`) |
| T-087 | primaryMemberId wiring + typed modal registry | **Complete** (`2cb2fdb`, `fba9a81`) |
| T-088 | Surface counterparty creation errors | **Complete** (`2cb2fdb`) |
| T-089 | purgeExpiredItems on DB port, drop `as any` | **Complete** (`2b60181`) |
| T-090 | Clear all lint warnings → `--max-warnings 0` green | **Complete** (`87d5328`) |
| T-091 | Vitest foundation + loan-balance regression tests | **Complete** (10 tests) |
| T-092 | Split oversized files (>300 LOC) | Deferred — touch when next edited |

**Extra (not ticketed):** BUG-6 root cause fixed — `mobileFilteredTxs` sorted the shared
array in place, reversing it before balances were computed; this masked all earlier
balance fixes. Service worker switched to network-first (v2) so updates reach clients.
Merged to `master` as `02ce3cf` and pushed; branches kept.

**Phase 11: Storage Overhaul — OPFS Migration & BUG-7 Freeze Fix** (source: `docs/plans/STORAGE_OPFS_MIGRATION.md`)

| Ticket | Description | Status |
|--------|-------------|--------|
| T-093 | Plan doc + FINDINGS BUG-7 + CHANGELOG | **Complete** |
| T-094 | Persistence adapter abstraction + hardened LS adapter | **Complete** |
| T-095 | OpfsAdapter + one-time migration + transition mirror | **Complete** |
| T-096 | Write coalescing (flush lifecycle) | **Complete** |
| T-097 | Typed recovery + 15s splash watchdog + dbError actions | **Complete** |
| T-098 | Digest fallback (FNV on insecure origins) + tests | **Complete** |
| T-099 | Snapshot ring via adapters, quota prune-retry | **Complete** |
| T-100 | Storage health row in SettingsModal | **Complete** |
| T-101 | E2E verification (migration, delete-persist, corrupt-boot) | **Complete** |

**Extra hardening:** init-promise memoization (StrictMode race), mirror activates only
after verified load, fresh installs skip empty-schema initial flush.
Persistence now: OPFS primary (`money_flows.db` + `snapshots/`), localStorage fallback;
19 vitest tests; all gates green.

**Phase 13: Other Ledgers v1 — Manual Registers** (shipped 2026-08-27 — `docs/plans/OTHER_LEDGERS_PLAN.md` `2c8957c`, future V2 in `OTHER_LEDGERS_FUTURE_V2.md`)

Sidebar: **Other Ledgers**. Decision: Member OR Other person, separate tables `other_ledgers`+`other_ledger_entries` with `linkedTransactionId NULL` (standalone v1, dual-post ready). Routes `/other-ledgers` + `/other-ledgers/:id` live.

| Ticket | Description | Status |
|--------|-------------|--------|
| T-113 | Schema + migration: `other_ledgers` / `other_ledger_entries` (linkedTransactionId NULL) | **Complete** (`2c8957c`) |
| T-114 | Domain + OtherLedgerService + useOtherLedgerStore | **Complete** (`2c8957c`) |
| T-115 | OtherLedgersIndex `/other-ledgers` — card grid, global + picker, search | **Complete** (`2c8957c`) |
| T-116 | OtherLedgerDetail `/other-ledgers/:id` — hero + Date|Desc|Debit|Credit|Balance table, per-ledger + | **Complete** (`2c8957c`) |
| T-117 | CreateLedgerModal + AddEntryModal (edit/delete, validation, tags) | **Complete** (`2c8957c`) |
| T-118 | Wiring: Sidebar/BottomNav/routeTitles/Recycle Bin/Search/PDF | **Complete** (`2c8957c`) |

**Phase 15: Cleanup & Optimization (Lean Combo 1A+2A+3A)** — **CLOSED 2026-11-02 by user decision.** T-124/T-125/T-126/T-130/T-131 shipped on `feature/cleanup-optimization` (merged into `dev`) and hygiene is verified clean on v2.2.0. Remaining oversized-file splits (T-127/T-128/T-129 — SQLiteDatabaseService 1,473 LOC being the real one) **declined for app stability**: they touch storage/money-math paths and the payoff is tidiness, not behavior. 300-LOC rule stays "split when next edited" (T-092).

**Phase 20 (2026-11-02): Other Ledgers V2 — dual-post account linking — COMPLETE, merged and released as v2.2.0 (`4fbc898`)** — spec `docs/plans/OTHER_LEDGERS_FUTURE_V2.md`, commits T-119 `5d98eb8`, T-120 `7a8c38e`, T-121 `b4cce91`, T-122 `a8bf1be`, T-123 `65c6b87`, bump `3644e3d`. Wizard "Also post to Other Ledger" toggle → atomic dual-post (`saveTransactionWithLedgerEntry`), ↔ cross-navigating badge + "Also posted to" in tx detail, edit prompt (Yes/No/Unlink) + delete checkbox, retro-link picker, purge cuts dangling links explicitly, All/Debit/Credit/Linked/Standalone pills + link-text search. Unit suite **244**; Playwright **31/31** pre-merge (after BUG-49 fix).

**Phase 14: Mobile Screen Refinements (M-01..M-09)** — merged into `beta_v2.0` as `2ae487d` and released there as **v2.0.0** (renamed from the interim 1.18.2 PATCH at the user's call; atomic bump `83d1dfe` + rename commit, 2026-10-31). `beta_v2.0` line now numbers **all future updates from 2.0.x**. All 9 mobile-representation tickets from `docs/plans/MOBILE_UI_REFINEMENTS_PLAN.md` complete; `feature/mobile-refinements` deleted in the 2026-11-02 worktree cleanup (merged).

**Phase 16: Theme (Light/Dark) + Accent Color (A1+B1)** — **merged to `dev`** (+ Phase 17 background presets, BUG-4/BUG-5 fixed, + Phase 18 type overhaul: Manrope + Inter-tnum + Anek Bangla self-hosted). `feature/theme-accent` deleted in the 2026-11-02 worktree cleanup (merged).

**Phase 19: Online Sync via Google Drive — COMPLETE, user-verified on the released app (2026-11-02).** All 9 tickets (T-145..T-153) shipped through `dev` and ride every release since **v1.17.0**, including v2.2.0 (`master`). Google sign-in → `Settings → Backup & Storage` → autosync + Sync now, boot-pull, "New data available" prompt, conflict keep-mine/keep-remote, wizard sign-in gate. The sync code needs `GOOGLE_CLIENT_ID` baked in at build time (gitignored `.env.local`); user confirmed sign-in works on their build 2026-11-02. Old branch `google_signin_backup` deleted in the 2026-11-02 worktree cleanup — history lives in `master`.

**T-174 (2026-11-01): tag-overview sorting** — card grid on `/tags` gets a **Most used / Name A–Z / Z–A** pill group (default unchanged); alphabetical sorts use `localeCompare` with a count-desc tie-break, and the pills reuse the detail ledger's `sortPill` styles, shown when more than one tag exists. `feat:` → **MINOR bump to 2.1.0** on `beta_v2.0` per `VERSIONING.md` §2→§3 (T-174 ticket in TICKETS.md; feature commit `8322c74`, release commit `dbf4c47`, session log `a28d252`).

**Branch map (2026-11-11):** `master` = releases only, `0b3448f` = merge of `dev`, **v2.4.3** (Tags ledger matched to the other registers — BUG-58; typecheck/lint/build + **248 unit + 35/35 e2e from a cold server**; **tag `v2.4.3` pushed**). `dev` = `5c2b206` (docs commit) + the 2026-11-11 setup commits — **active development branch**; `master` is releases only and is never merged into without explicit user approval (§3.8 / §3.12). `beta_v2.0` = `a28d252` (v2.1.0, behind dev). `fix/calculation-audit` kept at `5a4904c`. Open question: retro-tag releases v2.0.0/v2.0.1/v2.1.0 on master?

**Dev-box setup (2026-11-11) — read before running anything:**
- **Port 3000 is taken by OpenChamber's own web server** (`@openchamber/web serve --port 3000`). The dev port is therefore env-overridable: **`PORT=5173 npm run dev`** for the app, **`E2E_PORT=5173 npm run e2e`** for the suite. Both default to 3000 so the repo stays portable. Playwright's `reuseExistingServer` will otherwise attach the suite to the *OpenChamber* UI and every spec fails on a missing dashboard (it did, once — root cause recorded in `session_log.md`).
- **Remote testing goes through Tailscale Serve**, not a raw port. `tailscale serve` proxies OpenChamber at `https://home-lab.tail2e98a8.ts.net` (443) — **do not touch that rule** — and MoneyFlows at **`https://home-lab.tail2e98a8.ts.net:8443`** (8443 → `http://127.0.0.1:5173`). The dev server itself stays bound to loopback, so nothing is exposed to the LAN. The Serve rule lives in tailscaled's state and survives a reboot; **the dev server process does not** — restart it with `npm run dev:remote`.
- **Run the dev server like this** (all three vars matter):
  ```bash
  HOST=127.0.0.1 PORT=5173 ALLOWED_HOSTS=home-lab.tail2e98a8.ts.net npm run dev
  # or, same thing:
  npm run dev:remote
  ```
  `HOST=127.0.0.1` — Vite's default `host: 'localhost'` resolves to **IPv6 `::1` on this box**, but Tailscale Serve proxies over IPv4, so the default leaves the proxy with a dead connection. `ALLOWED_HOSTS` — Vite 403s any Host header it does not recognise (DNS-rebinding protection); the tailnet hostname has to be allowed explicitly, and no other host is.

- `node_modules` installed (`npm ci`), Playwright chromium installed, GitNexus re-indexed (5,581 nodes / 475 flows) via the global `gitnexus` CLI — npm 11 blocks its install scripts, so the grammar postinstall was run by hand.
- `.env.local` exists with the `GOOGLE_CLIENT_ID` line **commented out** — Google Drive sync is therefore *not configured*; the app is fully functional and local-first without it. Uncomment + paste the ID to enable Drive sync (authorized origin must match the dev port).



**Open bug (next up):** none — **BUG-58 is fixed and released in v2.4.3 (2026-11-10)**. The Tags ledger (`/tags/:tag`) was the last register still capped at 1100px and drawn with its own plain `<table>`; it now uses the shared `LedgerTable` at 1240px on desktop (`Date | Type | Description | Member | Account | Debit | Credit`, `showBalance={false}` because a tag spans accounts). The Member column is a new **opt-in** `showMember` prop on `LedgerTable` (defaults off, desktop-only) shown only at **≥1280px**, so the other five callers are byte-identical — re-measured on the member report. The `noBalance` desktop grid also lost its legacy 260px Account track (1100 was clipping because of it). Phones deliberately keep the compact scrollable table: the shared mobile grid needs ~450px and the page only gives ~302px at 390. Verified at 1920/1440/1280/1279/1100/1024/390, parity-checked against `/other-ledgers/:id`, 0 page overflow. See `docs/BUGS.md` BUG-58.

**Context rule reminder:** At ~80% context, STOP → stage → commit → update session_log + this file → hand off for fresh session.

**BUG-20 (linked-accounts modal 0 BDT vs dashboard total):** closed 2026-10-17 as **resolved-by-BUG-19** — diagnosed live, not reproducible on current code (dashboard/members list/profile hero/mobile modal/desktop dropdown all agree, before and after reload). Regression guard added in `e2e/flows/03-accounts.spec.ts` (mutation-verified). No production code change, no version bump.

**BUG-50 (Other Ledgers index long-name overflow):** fixed 2026-11-04 on `dev` (commit `b299f69`). A long ledger name now wraps to fit its card instead of pushing the balance out / forcing page horizontal scroll; verified at 1864/1280/1024/768/390, gates green (tsc/eslint/vitest 14/14/e2e 2/2). See docs/BUGS.md and session log for details. No version bump (release decision separate).

**Calendar month/year dropdown restyled** — merged to `dev` (commit `4012e0c`); was on branch `fix/calendar-dropdown-month-year` (2026-11-05): the calendar's month/year menus now use the app's dropdown vocabulary — `src/components/ui/calendar.tsx` + new `calendar.module.css` (trigger chip → frosted anchored panel → 3-col grid, wash hover, primary-gradient active, Esc/outside-click close, selected year auto-scrolled). Root cause of the old "generic" look: `reset.css` styles `button`/`*` unlayered, so Tailwind utilities for bg/border/color/font (on `<button>`) and padding (everywhere) were dead — hence the CSS module. `e2e/calendar-dropdown.spec.ts` is now a real 5-test guard (it used to pass without the calendar opening). A `PATCH` bump (2.3.1) applies at release.

**BUG-51 (report filters → Custom date pickers never open the calendar):** **fixed 2026-11-05**, merged to `dev` (commit `4012e0c`); lean call-site fix (user's call). The `DatePicker` sat inside a `<label>` in `ReportFilterSheet.tsx`, and the label's implicit control was the Popover trigger `<button>` — a press activated it twice, toggling the popover open→closed within one turn so no popover node ever mounted. The two labels are now `<div>` + `<span>` captions (the visual-only label pattern `FormField` uses); `DatePicker` is untouched. `e2e/report-calendar.spec.ts` was rewritten into a working guard (opens via the calendar icon → asserts the calendar mounts → picks a day → asserts the input holds `YYYY-MM-DD`), so the suite is now **35/35 green** — the last red test is gone. No open bugs remain in `docs/BUGS.md`.

**Harness defects — both closed 2026-10-30.** BUG-38 **fixed** (`1ee794d`): `vite.config.ts` `test.include` pinned to `src/**/*.{test,spec}.{ts,tsx}`, so `npm test` runs the unit suite and exits 0. BUG-39 **fixed**: the stale `e2e/search.smoke.spec.ts` case now asserts the header global search (dashboard input is long gone) instead of failing forever. BUG-44 **fixed as a gate**: `playwright.config.ts` runs `fullyParallel: false` / `workers: 1` — full suite is **31 passed / 0 failed in ~1.9 min**, the first genuinely green baseline; the *cause* of the parallel flakiness is still undocumented (candidates in the BUGS entry), so option (b) readiness waits remain a follow-up.

**Calculation-logic audit workstream** (`docs/audit/CALCULATION_LOGIC_AUDIT_2026-10-17.md`; branch `fix/calculation-audit`, **merged into `beta_v2.0` on 2026-10-30 and released there as v1.18.0**; `master`/`dev` sit at v1.17.3 and do not contain it): 17 audit findings logged as BUG-21…BUG-37, plus follow-ons BUG-40 (repayment edit path silently clamps) and BUG-41 (integrity scan shipped; Scope B declined 2026-10-30), plus new findings BUG-42 (group ledger "Expense" tab differed between mobile and desktop — **fixed 2026-10-30** through one shared `matchesLedgerTab`: lending counts as an expense, per BUG-25), BUG-43 (bare `dashboard` gitignore pattern silently ignored `src/presentation/screens/dashboard/`, so a new file there never got committed — anchored as `/dashboard` and fixed 2026-10-30, it blocked the BUG-21 commit), BUG-44 (full Playwright runs were flaky under parallel load — `03-accounts` ×2 and `15-cloud-sync` failed intermittently as "element not found", each passed in isolation — **gate fixed 2026-10-30**: `fullyParallel: false` / `workers: 1`, suite green at 31/0 in ~1.9 min; the cause itself is still undiagnosed), BUG-45 (a fully repaid loan whose flag is still `active` counted as "active" in the Loans filter/card — **fixed 2026-10-30**: `isLoanRunning`/`splitStack`/`stackIsSettled` let the balance decide, so a stale flag cannot outvote "0 BDT left"), BUG-46 (a loan write made *after* an earlier save could be dropped on reload — high, found and fixed while verifying BUG-40) and BUG-47 (a repayment stores no loan reference, so editing one never reaches the loan — the allocation question BUG-40 sidestepped; logged and fixed 2026-10-18). **Fixed so far (16 of the 17 audit findings, plus follow-ons BUG-40, BUG-46 and BUG-47):** BUG-22 (report closing = range end), BUG-23 (overpayment refused, not clamped), BUG-24 + BUG-31 (one shared transaction-rules module; the edit path validates), BUG-26 (one shared income/expense classification for the dashboard and the member profile), BUG-27 (stack progress counts settled loans), BUG-28 (group PDF exports the whole ledger, not the on-screen page — one shared `withRunningBalances` walk for table and PDF), BUG-29 + BUG-30 (Recycle Bin: per-tab totals and honest row amounts; one `DELETED_KIND` map drives row labels and tab filtering, plus a Ledgers tab), BUG-32 + BUG-33 (member ledger: one `memberLedgerDelta` sign rule shared by the table and the PDF — a received repayment was shown as a debit in the All Accounts view — and the balance column is locale-formatted), BUG-34 + BUG-35 (loan state renamed `on_track` → `repaid` behind one `loanItemStatus` rule; other-ledger `recomputeBalances` reuses the display walk and writes only rows whose balance moved, with the same ISO timestamp as every other write), BUG-36 + BUG-37 (both deleted rather than repaired: the loan store's three unused back-compat methods — one of which would have recorded a loan you *received* as one you *gave out* — and `getFamilySummary`, which counted mobile-wallet/business balances as "active loans"), BUG-40 (editing a repayment upward is refused with the numbers *before* anything is written — never clamped; `loans/domain/repaymentEdit.ts` + typed `RepaymentEditError`), BUG-46 (every write is now persisted: the coalesced-flush flag is cleared as the flush starts, and `LoanDatabase` announces its writes through a now-public `markDirty()` — a loan edit used to survive in memory and vanish on reload) and BUG-47 (a repayment records the split it applied in `metadata.allocations`; an edit reverses that split exactly and re-applies it over the same loans, refusing a raise the loans cannot carry — before, an app-created repayment carried no link, so editing one silently left the loans untouched) and BUG-21 (one definition behind the four dashboard chips — each compares with its own value at the end of last month, off the shared `core/domain/balanceEffect.ts` sign rule that `computeBalances` also uses, with a currency fallback when a percentage of the baseline would be meaningless). **Open:** none — BUG-39, BUG-42, BUG-44 and BUG-45 were fixed on 2026-10-30 (released as v1.18.1), and BUG-41 Scope B was declined by decision. Unit tests 113 → 227 → **235**, and the Playwright suite is **31 passed / 0 failed**. **The audit is complete: 16 of the 17 findings fixed, the 17th (BUG-25) closed by product decision (2026-10-30)** — loan movements keep counting as income/expense, and `core/domain/transactionCategory.ts` is where that decision lives; those totals now feed only the Month Summary and plain income/expense sums, not the chips. Contains a `feat:` commit, so the merge was a **MINOR** — released as **v1.18.0** on `beta_v2.0` (`73fa27f`), with the CHANGELOG's 1.18.0 section split out from what had already shipped in 1.17.3.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **moneyflows** (5581 symbols, 12968 relationships, 475 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "master"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "master" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/moneyflows/context` | Codebase overview, check index freshness |
| `gitnexus://repo/moneyflows/clusters` | All functional areas |
| `gitnexus://repo/moneyflows/processes` | All execution flows |
| `gitnexus://repo/moneyflows/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

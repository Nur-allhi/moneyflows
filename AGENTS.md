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

**Next phase TBD.**

**Context rule reminder:** At ~80% context, STOP → stage → commit → update session_log + this file → hand off for fresh session.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **moneyflows** (1786 symbols, 3620 relationships, 134 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/moneyflows/context` | Codebase overview, check index freshness |
| `gitnexus://repo/moneyflows/clusters` | All functional areas |
| `gitnexus://repo/moneyflows/processes` | All execution flows |
| `gitnexus://repo/moneyflows/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

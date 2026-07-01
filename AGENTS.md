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
│   └── TICKETS.md            — Feature Ticket List
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
- When building a screen, open its corresponding HTML file in `DESIGN_FILES/` first to match layout, colors, spacing, typography, and component states.

### 3.3 Document Conventions
- All docs live in `docs/` folder.
- File length limit: each code file ≤300 LOC.
- Write code only to spec. Minimum, not maximum. One simple solution. Clarify, don't assume.

### 3.4 Code Style
- TypeScript strict mode.
- CSS Modules + CSS custom properties (no runtime CSS-in-JS).
- React functional components with hooks.
- Clean Architecture: UI never imports `better-sqlite3` directly.

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

### 3.8 AGENTS.md Management
- Check this file (§3 and §5) at the start of every conversation.
- Update if new conventions or files are introduced.
- Update §5 to the next ticket after completing each ticket.

## 4. Session Logs

See `session_log.md` for complete session history.

## 5. Current Ticket / Next Up

**All 42 original tickets done.** Now in Phase 6 — Dynamic Configuration & Hardening.

**Completed Phase 6 thus far:**
- T-043: App settings store (`useSettingsStore.ts` + `AppSettings.ts`) with locale, currency, primary member, constants persisted to localStorage
- T-044: Dynamic currency from settings — `formatAmount()` utility + replaced all hardcoded `'BDT'` in all screens
- T-045: Dynamic locale from settings — `useFormatNumber()` hook + replaced all raw `Intl.NumberFormat` calls in TransactionWizard, all screens use `formatAmount()` with locale from store
- T-046: Removed hardcoded `'Efty'` from Loans screen — reads actual lender name via account→member lookup
- T-047: Extracted duplicated MONTH/day arrays into `src/presentation/constants/dates.ts` — `shortDate()` now locale-aware via `Intl.DateTimeFormat`, 4 duplicate definitions removed
- T-048: Extracted account type / transaction type labels into `src/presentation/constants/labels.ts` — `ACCOUNT_TYPE_LABEL`, `ACCOUNT_TYPE_GRADIENT`, `ACCOUNT_TYPE_ACCENT`, `TX_TYPE_ICON`, `displayType()`; replaced 6+ hardcoded maps across components and screens
- T-049: Replaced all inline `style={{...}}` with CSS module classes or CSS custom properties — 12 files updated, only shadcn/ui `select.tsx` remains
- T-050: Extracted magic number constants into `src/presentation/constants/config.ts` — defaults and min/max bounds for descriptionMaxLength, numpadMaxDigits, dashboardTxLimit

**All 50 tickets complete.** Phase 6 — Dynamic Configuration & Hardening is finished.

**Context rule reminder:** At ~80% context, STOP → stage → commit → update session_log + this file → hand off for fresh session.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **money_flows_v0.4** (1278 symbols, 2537 relationships, 78 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
| `gitnexus://repo/money_flows_v0.4/context` | Codebase overview, check index freshness |
| `gitnexus://repo/money_flows_v0.4/clusters` | All functional areas |
| `gitnexus://repo/money_flows_v0.4/processes` | All execution flows |
| `gitnexus://repo/money_flows_v0.4/process/{name}` | Step-by-step execution trace |

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

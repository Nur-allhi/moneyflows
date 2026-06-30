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

**Complete.** All 42 tickets across 5 phases are finished.
- All screens, components, data layer, navigation, stores, polish, and QA are done.
- Production build: 232.98 kB JS + 53 kB CSS (gzip ~86 kB initial).
- Next: See `docs/ROADMAP.md` for future enhancements, or review `docs/TICKETS.md` for completed work.

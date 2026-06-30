# MoneyFlows — Feature Ticket List

**Version:** 1.0
**Estimate:** ~42 atomic tickets across 5 phases

---

## Phase 0: Foundation (8 tickets)

### T-001 — Scaffold Vite + React project
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/` structure, `package.json`, `tsconfig.json`, `vite.config.ts`
**Acceptance:** `npm run dev` starts dev server; folder layout matches TAD section 7.

### T-002 — Install and configure dependencies
**Skill:** `senior-frontend`
**Effort:** S
**Deps:** `zustand`, `better-sqlite3`, `uuid`, `date-fns`, `react-router-dom`, `eslint`, `prettier`
**Acceptance:** `npm install` succeeds; all imports resolve in a test file.

### T-003 — Create CSS design tokens (`tokens.css`)
**Skill:** `ui-ux-pro-max`, `frontend-design`
**Effort:** M
**File(s):** `src/presentation/styles/tokens.css`
**Content:** Color tokens, spacing scale (`4px` base), radius tokens, shadow tokens, breakpoint custom properties.
**Acceptance:** All tokens from FRONTEND_SPEC §1.2 defined as CSS custom properties under `:root`.

### T-004 — Build glassmorphism utility classes (`glassmorphism.css`)
**Skill:** `frontend-design`
**Effort:** M
**File(s):** `src/presentation/styles/glassmorphism.css`
**Content:** `.glass-panel`, `.glass-card`, `.glass-input` classes with backdrop blur, semi-transparent bg, thin borders.
**Acceptance:** A `<div class="glass-panel">` renders with frosted glass effect.

### T-005 — Set up typography (`typography.css`)
**Skill:** `ui-ux-pro-max`, `frontend-design`
**Effort:** S
**File(s):** `src/presentation/styles/typography.css`
**Content:** `@import` for Outfit + JetBrains Mono via Google Fonts preconnect; `h1-h6` styles, `.text-mono`, `.text-body`, `.text-label` classes.
**Acceptance:** All font families load correctly; no FOUT on navigation.

### T-006 — Create reset/normalize CSS
**Skill:** `frontend-design`
**Effort:** S
**File(s):** `src/presentation/styles/reset.css`
**Acceptance:** Box-sizing border-box; no default margin/padding; smooth scrolling; tap highlight transparent.

### T-007 — Implement responsive breakpoint system
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** CSS custom properties + utility classes for 9 breakpoints (360–1920px)
**Acceptance:** Layout switches at each defined breakpoint without overflow.

### T-008 — Implement SQLite DDL from schema.sql
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/schema.sql`
**Content:** All 5 tables + indexes + triggers (if any) from TAD §2.
**Acceptance:** `schema.sql` runs against a fresh SQLite DB; `.tables` shows all 5 tables; schema matches TAD.

---

## Phase 0.4: Data Access Layer (4 tickets)

### T-009 — Define `IDatabaseService` interface
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/core/ports/IDatabaseService.ts`
**Acceptance:** Interface covers all methods in TAD §3; TypeScript compiles without errors.

### T-010 — Implement `SQLiteDatabaseService`
**Skill:** `senior-backend`
**Effort:** L
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts`
**Acceptance:** All interface methods implemented with parameterized queries; transactions wrapped in BEGIN/COMMIT/ROLLBACK.

### T-011 — Implement repository layer (Member, Account, Transaction repos)
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/repositories/*Repository.ts`
**Acceptance:** Repositories call `SQLiteDatabaseService`; each returns typed domain entities.

### T-012 — Write data layer unit tests
**Skill:** `senior-backend`, `code-reviewer`
**Effort:** M
**Acceptance:** Tests cover: CRUD for each entity, soft-delete, restore, purge, balance aggregation, double-entry integrity. ≥80% coverage.

---

## Phase 1: Shared Components (6 tickets)

### T-013 — Build `GlassPanel` + `Avatar` + `MetricCard`
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** M
**Design:** `DESIGN_FILES/screen-1-dashboard.html` (metric cards, avatars)
**File(s):** `src/presentation/components/GlassPanel.tsx`, `Avatar.tsx`, `MetricCard.tsx`
**Acceptance:** All 3 components render with proper glassmorphism styling; MetricCard accepts `label`, `value`, `change`, `accent` props; Avatar shows member initial, active ring, size variants (24/36/48/72px).

### T-014 — Build `AccountCard` + `AccountRow` + `TransactionRow`
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** M
**Design:** `DESIGN_FILES/screen-1-dashboard.html` (account rows, tx rows), `DESIGN_FILES/screen-2-member.html` (account card style)
**Acceptance:** AccountCard renders credit-card-style with gradient background, gold chip for cash accounts. AccountRow/TransactionRow show icon + name + balance/amount + accent color.

### T-015 — Build `LedgerTable` + `SegmentedTabs` + `TabBar`
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** M
**Design:** `DESIGN_FILES/screen-2-member.html` (ledger), `DESIGN_FILES/screen-4-transaction.html` (segmented tabs), `DESIGN_FILES/screen-5-recycle.html` (tab bar)
**Acceptance:** LedgerTable renders filterable rows with running balance; SegmentedTabs/TabBar have active pill indicator, count badges, onChange callback.

### T-016 — Build `Numpad` + `FormField` + `BottomSheet` + `Modal`
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** L
**Design:** `DESIGN_FILES/screen-4-transaction.html` (numpad, bottom sheet, form fields), `DESIGN_FILES/screen-4-transaction-desktop.html` (modal)
**Acceptance:** Numpad is 3×4 grid, BDT formatting via `Intl.NumberFormat('en-IN')`, backspace. BottomSheet slide-up animation 300ms, 92vh max, handle bar. Modal fade-in 0.25s, centered 520px max-width.

### T-017 — Build `LoanStack` + `ProgressBar` + `QuickActionCard`
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** M
**Design:** `DESIGN_FILES/screen-3-loans.html` (loan stack, progress bar), `DESIGN_FILES/screen-2-member-desktop.html` (quick action card)
**Acceptance:** LoanStack accordion single-open, chevron rotates. ProgressBar animates width on mount (600ms, ease-out), teal gradient, glossy overlay.

### T-018 — Build `RecycleRow`
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** S
**Design:** `DESIGN_FILES/screen-5-recycle.html`
**Acceptance:** Row renders item icon + name + amount + date + restore/delete buttons. Slide-out animation on action.

---

## Phase 1.2: Navigation (2 tickets)

### T-019 — Implement routing + desktop sidebar + mobile bottom nav
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `App.tsx` + navigation components
**Acceptance:** Routes from FRONTEND_SPEC §2 work; sidebar visible ≥1024px, bottom nav visible ≤768px. Header shows current route title.

### T-020 — Build header bar (logo, date, back button, breadcrumbs)
**Skill:** `senior-frontend`
**Effort:** S
**Acceptance:** Header shows on all screens; back button on nested routes; breadcrumb on desktop member view.

---

## Phase 2: Screen Implementation (8 tickets)

### T-021 — Build Dashboard screen
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** L
**Design:** `DESIGN_FILES/screen-1-dashboard.html`
**File(s):** `src/presentation/screens/Dashboard.tsx`
**Acceptance:** 4 metric cards, avatars, quick actions, combined balances, recent transactions. All states (loading, empty, error). Responsive 4→2→1 col.

### T-022 — Build Member Profile screen (mobile)
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** L
**Design:** `DESIGN_FILES/screen-2-member.html`
**File(s):** `src/presentation/screens/MemberProfile.tsx` (mobile layout)
**Acceptance:** Profile card, account carousel with snap + dots, ledger table with filter tabs.

### T-023 — Build Member Profile screen (desktop)
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** L
**Design:** `DESIGN_FILES/screen-2-member-desktop.html`
**Acceptance:** Sidebar, breadcrumb, hero section, quick action strip, 3-col account grid, split content (ledger 65% + side panel 35%).

### T-024 — Build Loan Receivables screen
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** M
**Design:** `DESIGN_FILES/screen-3-loans.html`
**File(s):** `src/presentation/screens/Loans.tsx`
**Acceptance:** Debtor summary cards, progress bars, expandable loan stacks, responsive column hiding.

### T-025 — Build Transaction Wizard (mobile bottom sheet)
**Skill:** `ui-ux-pro-max`, `frontend-design`, `senior-frontend`
**Effort:** L
**Design:** `DESIGN_FILES/screen-4-transaction.html`
**File(s):** `src/presentation/screens/TransactionWizard.tsx`
**Acceptance:** 4 segmented tabs, dynamic form per tab, numpad with Indian comma formatting, submit button. Slide-up + blur overlay.

### T-026 — Build Transaction Wizard (desktop modal)
**Skill:** `ui-ux-pro-max`, `frontend-design`, `senior-frontend`
**Effort:** M
**Design:** `DESIGN_FILES/screen-4-transaction-desktop.html`
**Acceptance:** Fade-in centered modal (520px), side-by-side selects, Cancel + Save buttons.

### T-027 — Build Recycle Bin screen
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** M
**Design:** `DESIGN_FILES/screen-5-recycle.html`
**File(s):** `src/presentation/screens/RecycleBin.tsx`
**Acceptance:** Stats bar, tabbed items, restore/delete with confirm dialogs, slide-out animation.

### T-028 — Build Launcher / Overview page
**Skill:** `frontend-design`, `ui-ux-pro-max`
**Effort:** S
**Design:** `DESIGN_FILES/index.html`
**Acceptance:** Hero section, 3-column glass card grid, links to each screen.

---

## Phase 3: Data Integration (6 tickets)

### T-029 — Implement Zustand stores (member, account, transaction, loan, recycle)
**Skill:** `senior-backend`, `senior-frontend`
**Effort:** L
**File(s):** `src/presentation/stores/*Store.ts`
**Acceptance:** Each store connects to `IDatabaseService`; `useTransactionStore.addTransaction` uses optimistic update pattern.

### T-030 — Write database seed script from spreadsheet data
**Skill:** `senior-backend`
**Effort:** L
**File(s):** `src/infrastructure/database/seed.ts`
**Acceptance:** All 4 members, 15+ accounts, 500+ transactions, 5+ debtors seeded. Balances match Financial_Review.md audit.

### T-031 — Fix known spreadsheet discrepancies
**Skill:** `senior-backend`, `code-reviewer`
**Effort:** S
**Acceptance:** Prime Savings (34,000 BDT) added to Efty. Master ledger typo fixed (5,000→8,000 BDT on 2026-06-23).

### T-032 — Wire Dashboard to stores
**Skill:** `senior-frontend`
**Effort:** M
**Acceptance:** Dashboard reads real data from Zustand → DB. Metric cards show correct aggregated values.

### T-033 — Wire Member Profile to stores
**Skill:** `senior-frontend`
**Effort:** M
**Acceptance:** Member profile loads correct accounts + ledger. Ledger filter tabs work.

### T-034 — Wire Transaction Wizard to TransactionService
**Skill:** `senior-backend`, `senior-frontend`
**Effort:** M
**Acceptance:** Wizard creates transactions with double-entry; balances update immediately (optimistic) + persist to DB. Form validation prevents invalid submissions.

---

## Phase 4: Polish (6 tickets)

### T-035 — Implement route transitions + motion system
**Skill:** `senior-frontend`, `ui-ux-pro-max`
**Effort:** M
**Acceptance:** Slide transitions between routes (300ms); modal/sheet entry/exit animations; progress bar animates on load.

### T-036 — Add hover/focus/active/disabled states audit
**Skill:** `ui-ux-pro-max`, `frontend-design`
**Effort:** M
**Acceptance:** Every interactive element has 4 states styled per FRONTEND_SPEC §4.

### T-037 — Add loading shimmer + skeleton states
**Skill:** `frontend-design`, `senior-frontend`
**Effort:** M
**Acceptance:** Glass panels show shimmer skeleton while data loads.

### T-038 — Add empty + error states to all screens
**Skill:** `senior-frontend`, `ui-ux-pro-max`
**Effort:** M
**Acceptance:** Every screen has an empty state and error state with retry action.

### T-039 — Implement form validation across wizard
**Skill:** `senior-backend`, `senior-frontend`
**Effort:** M
**Acceptance:** All validation rules from SECURITY.md §3.3 enforced client-side (immediate) + server-side (before DB write).

### T-040 — Add number ticker animation on balance updates
**Skill:** `frontend-design`, `senior-frontend`
**Effort:** M
**Acceptance:** Balance numbers animate (count up/down) when they change after a transaction.

---

## Phase 5: QA & Release (2 tickets)

### T-041 — Responsive testing at all 9 breakpoints
**Skill:** `code-reviewer`, `senior-frontend`
**Effort:** M
**Acceptance:** No horizontal overflow; all interactive elements reachable; layout matches spec at 360, 390, 430, 600, 820, 1024, 1366, 1440, 1920px.

### T-042 — Performance audit + production build
**Skill:** `code-reviewer`, `senior-frontend`
**Effort:** M
**Acceptance:** Bundle size optimized (code-split routes). Virtualized ledger if >100 rows. 60fps animations. Production build succeeds.

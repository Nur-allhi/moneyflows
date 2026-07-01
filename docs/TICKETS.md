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
**Acceptance:** All 4 members, 15+ accounts, 500+ transactions, 5+ debtors seeded. Balances match Project_plan/Financial_Review.md audit.

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

---

## Phase 6: Dynamic Configuration & Hardening (8 tickets)

### T-043 — Create app settings/config store
**Skill:** `senior-backend`, `senior-frontend`
**Effort:** M
**File(s):** `src/presentation/stores/useSettingsStore.ts`, `src/core/domain/AppSettings.ts`
**Content:** New Zustand store + domain entity holding: `currency` (default `'BDT'`), `locale` (default `'en-IN'`), `primaryMemberId` (instead of hardcoded `'Efty'`), `descriptionMaxLength`, `numpadMaxDigits`, `dashboardTxLimit`. Persisted to localStorage.
**Acceptance:** Store initializes with defaults; UI reads currency/locale from store instead of hardcoded values; primary member is configurable in settings UI.

### T-044 — Replace hardcoded `'BDT'` with dynamic currency from settings
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** All 15+ locations in screens and components
**Content:** Create a shared `formatCurrency(amount: number, currency?: string)` utility function that reads currency from `useSettingsStore`. Replace all `'BDT'` string literals in:
- `src/presentation/screens/Dashboard.tsx` (line 16)
- `src/presentation/screens/MemberProfile.tsx` (line 21)
- `src/presentation/screens/MemberList.tsx` (line 12)
- `src/presentation/screens/Loans.tsx` (line 13)
- `src/presentation/screens/RecycleBin.tsx` (line 7)
- `src/presentation/screens/TransactionWizard.tsx` (lines 91, 361, 399, 431)
- `src/presentation/components/FormField.tsx` (line 77)
- `src/core/domain/Account.ts` (line 10 — default currency)
- `src/infrastructure/database/SQLiteDatabaseService.ts` (line 12 — schema default)
- `src/presentation/screens/Launcher.tsx` (lines 62, 86)
**Acceptance:** Currency displays from settings; changing currency updates all displays without page reload.

### T-045 — Replace hardcoded `'en-IN'` locale with dynamic value from settings
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** All 6 locations in screens
**Content:** Create a shared `useFormatNumber()` hook or `fmt()` utility that reads locale from `useSettingsStore`. Replace all `Intl.NumberFormat('en-IN')` and `.toLocaleString('en-IN')` calls in:
- `src/presentation/screens/Dashboard.tsx` (line 13)
- `src/presentation/screens/MemberProfile.tsx` (line 18)
- `src/presentation/screens/MemberList.tsx` (line 10)
- `src/presentation/screens/Loans.tsx` (line 11)
- `src/presentation/screens/RecycleBin.tsx` (line 6)
- `src/presentation/screens/TransactionWizard.tsx` (line 24)
**Acceptance:** Number formatting respects locale from settings; switching locale updates all displays.

### T-046 — Remove hardcoded `'Efty'` from Loans screen
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/screens/Loans.tsx`
**Content:** The `"Funded by Efty — ${name}"` label at line 59 should read the actual lender name from the member store instead of hardcoding `'Efty'`. Look up the funding member by the `memberId` on the loan transactions.
**Acceptance:** Loan stack labels show the actual member name from the database, not the hardcoded string `'Efty'`.

### T-047 — Extract duplicated MONTH/day arrays into a shared constant
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/screens/Dashboard.tsx`, `MemberProfile.tsx`, `Loans.tsx`, `src/presentation/components/Header.tsx`
**Content:** Create `src/presentation/constants/dates.ts` with `MONTHS` and `DAYS` arrays. Also consider using `Intl.DateTimeFormat` with `month: 'short'` for true locale-aware month names instead. Delete all 4 duplicate definitions.
**Acceptance:** Month names display correctly in all screens; no duplicate array definitions remain.

### T-048 — Extract account type / transaction type labels into a config map
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/core/domain/Account.ts`, `src/core/domain/Transaction.ts`, all screens referencing type labels
**Content:** Create a `TYPE_LABELS` map (e.g. `{ bank: 'Bank', mobile_wallet: 'Mobile Wallet', ... }`) in a shared constants file. Replace all hardcoded display labels and gradient maps. Keep the TypeScript union types for type safety but drive display strings from the map.
**Acceptance:** Type labels are defined in one place; all screens and components read from the same map.

### T-049 — Replace inline styles with CSS custom properties
**Skill:** `frontend-design`, `senior-frontend`
**Effort:** M
**File(s):** All files with inline `style={{...}}` props
**Content:** Audit and replace all inline styles in JSX with CSS module classes or CSS custom properties. Key locations:
- `src/presentation/screens/TransactionWizard.tsx` (lines 244, 386, 418, 451)
- `src/presentation/screens/MemberProfile.tsx` (line 209)
- `src/presentation/screens/RecycleBin.tsx` (lines 100, 108, 113-119, 137)
- `src/presentation/components/Avatar.tsx` (line 16 — gradient)
- `src/main.tsx` (line 24 — loading screen)
**Acceptance:** Zero inline `style` props in production JSX; all styling goes through CSS modules or CSS custom properties.

### T-050 — Move all hardcoded limits/constants into a config file
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** New `src/core/config.ts` or similar
**Content:** Extract these scattered magic numbers into named exports:
- `DESCRIPTION_MAX_LENGTH = 200` (TransactionWizard.tsx:57, 469)
- `NUMPAD_MAX_DIGITS = 10` (TransactionWizard.tsx:163)
- `DASHBOARD_TX_FETCH_LIMIT = 10` (Dashboard.tsx:51)
- `DASHBOARD_TX_DISPLAY_LIMIT = 7` (Dashboard.tsx:75)
- `SHORT_NAME_MAX_LENGTH = 4` (MemberList.tsx:117)
- `ANIMATION_DURATION = 600` (useAnimatedValue.ts:7)
- `ACCOUNT_CARD_WIDTH = 280` + `CARD_GAP = 12` (MemberProfile.tsx:15-16)
- `LEDGER_ROW_HEIGHT = 48` + `DESKTOP_ROW_HEIGHT = 52` + `OVERSCAN = 3` (LedgerTable.tsx:26-28)
- `STORAGE_KEY = 'moneyflows_db'` (SQLiteDatabaseService.ts:28)
- `EXPORT_FILENAME_PREFIX = 'moneyflows_'` (SQLiteDatabaseService.ts:90)
**Acceptance:** All constants import from a single config file; no magic numbers remain in component/screen files.

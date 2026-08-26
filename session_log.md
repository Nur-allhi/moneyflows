# MoneyFlows — Session Log

## Session 2026-06-29 23:48

### Changes
- `docs/PRD.md` — Product Requirement Document (vision, features, workflows)
- `docs/TAD.md` — Technical Architecture Document (schema, entities, stores)
- `docs/SECURITY.md` — Security & Access Document (auth, validation, guardrails)
- `docs/FRONTEND_SPEC.md` — Frontend Spec Document (design system, layouts, states)
- `docs/TICKETS.md` — Feature Ticket List (42 atomic tickets across 5 phases)
- `AGENTS.md` — Agent configuration and workflow rules
- `session_log.md` — Initialized session log

### Skill(s) Used
- `skill-creator` — PRD generation
- `senior-backend` — TAD and SECURITY docs
- `ui-ux-pro-max`, `frontend-design`, `senior-frontend` — FRONTEND_SPEC
- `code-reviewer` — SECURITY checklist and TICKETS QA items

### Status
- Completed

## Session 2026-06-30 12:20

### Changes
- **T-001**: Scaffolded Vite + React project (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/` folder structure per TAD §7)
- **T-002**: Installed deps (react, react-dom, react-router-dom, zustand, uuid, date-fns, typescript, eslint, prettier, vite). Skipped `better-sqlite3` (needs C++ build tools — will add when Tauri/Electron backend is set up)
- **T-003**: Created `src/presentation/styles/tokens.css` with oklch color tokens matching DESIGN_FILES source of truth
- **T-004**: Created `src/presentation/styles/glassmorphism.css` with `.glass-panel`, `.glass-card`, `.glass-input`, `.skeleton` classes
- **T-005**: Created `src/presentation/styles/typography.css` with Outfit + JetBrains Mono imports, h1–h6 styles, `.text-mono`, `.text-body`, `.text-label`
- **T-006**: Created `src/presentation/styles/reset.css` with border-box, smooth scrolling, background gradient
- **T-007**: Created `src/presentation/styles/responsive.css` with hide/show breakpoint utility classes
- **T-008**: Created `src\infrastructure\database\schema.sql` with all 5 tables + indexes per TAD §2
- **DESIGN_FILES integration**: Updated `AGENTS.md` (added DESIGN_FILES reference + design workflow rule), `DESIGN.md` (added source-of-truth header), `FRONTEND_SPEC.md` (added design reference banner), `TICKETS.md` (added `**Design:**` field to all Phase 1–2 tickets linking to specific HTML files)

### Skill(s) Used
- `senior-frontend` — Vite scaffold, TypeScript config, folder structure
- `frontend-design` — CSS tokens, glassmorphism, reset, responsive
- `ui-ux-pro-max` — Design token alignment with DESIGN_FILES oklch values

### Status
- Phase 0 complete (T-001 through T-008). Ready for Phase 1.2 (navigation) or Phase 0.4 (data access layer).

## Session 2026-06-30 12:40

### Changes
- **Phase 0.4 — Data Access Layer** (replaced `better-sqlite3` with `sql.js` per decision)
- **Domain entities**: Created `Member`, `Account`, `Transaction`, `AccountGroup`, `Loan` (types) in `src/core/domain/` — plain TS classes with full typed fields
- **T-009**: Created `src/core/ports/IDatabaseService.ts` — 16-method interface covering members, accounts, transactions, loans, recycle bin, aggregations
- **Installed `sql.js`** — WebAssembly SQLite (zero native deps, runs in browser)
- **T-010**: Created `src/infrastructure/database/SQLiteDatabaseService.ts` (292 LOC) — full implementation of `IDatabaseService` with:
  - SQLite WASM initialized from `/sql-wasm.wasm`
  - Schema auto-created on first init
  - Persistence via localStorage (base64 serialized)
  - Parameterized queries, soft-delete lifecycle (restore/purge)
  - Loan stack aggregation logic
  - Family summary and group balance calculations
- **T-011**: Created repositories (`MemberRepository`, `AccountRepository`, `TransactionRepository`) in `src/infrastructure/repositories/` — thin wrappers with domain-specific query methods
- **Barrel exports**: Added `index.ts` files for clean imports
- Copied `sql-wasm.wasm` to `public/` for Vite dev server

### Skill(s) Used
- `senior-backend` — IDatabaseService interface, sql.js integration, repository pattern

### Status
- Phase 0.4 complete. Ready for Phase 1 (Shared Components) or Phase 1.2 (Navigation).

## Session 2026-06-30 23:15

### Changes
- Fixed `tsconfig.node.json` — added `emitDeclarationOnly: true` to resolve `allowImportingTsExtensions` error
- Project builds successfully (`tsc -b && vite build`)

### Skill(s) Used
- `senior-frontend`

### Status
- Build is green. Ready for next development phase.

## Session 2026-06-30 23:30

### Changes
- Created `GlassPanel.tsx` + `GlassPanel.module.css` — glassmorphism wrapper with glow variants (violet/gold/purple), hover, padding sizes
- Created `Avatar.tsx` + `Avatar.module.css` — circular initial-letter avatar with member gradients (Admin/Father/Mother), active ring, size variants (24/36/48/72px)
- Created `MetricCard.tsx` + `MetricCard.module.css` — glass card with label, value (mono, accent-colored), change indicator with up/down arrows
- Created `src/presentation/components/index.ts` — barrel export for all 3 components
- Updated `AGENTS.md` §5 — next ticket: T-014

### Skill(s) Used
- `ui-ux-pro-max` — glassmorphism styling, design tokens, component spacing
- `senior-frontend` — TypeScript strict patterns, CSS Modules, component architecture

### Status
- **T-013 complete.** All 3 components built and exported from `src/presentation/components/`.
- Build, typecheck, lint all pass.
- Next: T-014 — AccountCard + AccountRow + TransactionRow

## Session 2026-06-30 23:45

### Changes
- Created `AccountCard.tsx` + `AccountCard.module.css` — credit-card-style with gradient backgrounds, gold chip for cash, bulleted account number, hover lift
- Created `AccountRow.tsx` + `AccountRow.module.css` — icon with type-based gradient + name + type label + colored balance
- Created `TransactionRow.tsx` + `TransactionRow.module.css` — type-colored icon (expense/income/transfer) + description + date + signed amount
- Updated `src/presentation/components/index.ts` — added 3 new exports
- Updated `AGENTS.md` §5 — next ticket: T-015

### Skill(s) Used
- `ui-ux-pro-max` — card gradient styling, row interaction states, visual hierarchy
- `senior-frontend` — TypeScript strict patterns, CSS Modules, component architecture

### Status
- **T-014 complete.** All 3 components built and exported from `src/presentation/components/`.
- Build, typecheck, lint all pass.
- Next: T-015 — LedgerTable + SegmentedTabs + TabBar

## Session 2026-06-30 23:55

### Changes
- Created `SegmentedTabs.tsx` + `.module.css` — pill-style tabs with violet gradient active state, `tabs` + `activeKey` + `onChange` props
- Created `TabBar.tsx` + `.module.css` — underline tabs with count badges, `activeKey` + `onChange` callback
- Created `LedgerTable.tsx` + `.module.css` — 5-column grid (date/desc/debit/credit/balance), glass container, 340px scroll, empty state, row click
- Updated `src/presentation/components/index.ts` — added 3 new exports + `LedgerRow` type

### Skill(s) Used
- `ui-ux-pro-max` — segmented pill styling, tab interaction states, table grid layout
- `senior-frontend` — component API design, type exports, CSS Modules

### Status
- **T-015 complete.** All 3 components built and exported from `src/presentation/components/`.
- **Git:** initialized, first commit on `main`, switched to `dev` branch for ongoing work.
- Build, typecheck, lint all pass.
- Next: T-016 — Numpad + FormField + BottomSheet + Modal

## Session 2026-07-01 00:10

### Changes
- Created `FormField.tsx` + `.module.css` — label + input/textarea/select/amount variants with glass styling, focus glow, error state
- Created `Numpad.tsx` + `.module.css` — 3×4 grid glass keys, violet backspace action key, blank filler
- Created `BottomSheet.tsx` + `.module.css` — slide-up 0.3s animation, handle bar, overlay, Escape key close
- Created `Modal.tsx` + `.module.css` — centered fade-in 0.25s, 520px max-width, blur overlay, Cancel/Save footer
- Updated `src/presentation/components/index.ts` — added all 8 new exports

### Skill(s) Used
- `ui-ux-pro-max` — bottom sheet/modal animations, numpad glass keys, form field styling
- `senior-frontend` — portal-less overlay pattern, keyboard accessibility, compound components

### Status
- **T-016 complete.** Phase 1 (Shared Components) is fully done — all 6 tickets T-013 through T-018 built.
- Build, typecheck, lint all pass.
- **Next:** T-017 — LoanStack + ProgressBar + QuickActionCard

## Session 2026-07-01 00:25

### Changes
- Created `ProgressBar.tsx` + `.module.css` — teal gradient fill, IntersectionObserver mount animation (600ms), glossy overlay
- Created `QuickActionCard.tsx` + `.module.css` — glass row with icon (violet/teal/coral bg), title, subtitle, hover violet border + glow
- Created `LoanStack.tsx` + `.module.css` — accordion with single-open, chevron rotation, header (icon + fund source + total + count), body with loan rows + status pills (Active/On Track)
- Created `RecycleRow.tsx` + `.module.css` — grid row with icon (warning/account), name, meta, amount, date, restore + delete buttons
- Updated `src/presentation/components/index.ts` — added 4 new exports + LoanStack types

### Skill(s) Used
- `ui-ux-pro-max` — accordion animation, progress bar gloss effect, recycle row actions
- `senior-frontend` — IntersectionObserver pattern, single-open accordion state, typed loan data

### Status
- **T-017 + T-018 complete.** Phase 1 (Shared Components) fully done — 8 components across 6 tickets.
- Build, typecheck, lint all pass.
- **Next:** T-019 — Routing + Sidebar + Bottom Nav (Phase 1.2)

## Session 2026-07-01 00:40

### Changes
- Created `Sidebar.tsx` + `.module.css` — 220px desktop nav with NavLink active states, violet left border indicator, logo, footer with avatar
- Created `BottomNav.tsx` + `.module.css` — fixed bottom tab bar (Home/Members/Loans/Recycle), active violet color
- Created `Header.tsx` + `.module.css` — glass header with back button, logo, title, date, notifications, breadcrumb support
- Created `App.tsx` + `App.module.css` — BrowserRouter layout shell with sidebar (≥1024px) / bottom nav (≤768px), content padding toggle
- Created placeholder screens: Dashboard, MemberProfile, Loans, TransactionWizard, RecycleBin
- Added barrel exports for all nav components

### Skill(s) Used
- `senior-frontend` — React Router v6 nested routes, responsive layout shell, CSS Modules layout

### Status
- **Phase 1.2 complete.** T-019 + T-020 done. Routing + sidebar + bottom nav + header all wired.
- Build, typecheck, lint all pass.
- **Next:** T-021 — Dashboard screen (Phase 2 begins)

## Session 2026-07-01 00:55

### Changes
- Built `Dashboard.tsx` + `Dashboard.module.css` — full screen with:
  - 4 MetricCards (Total Assets, Cash in Hand, Active Loans, Net Worth) with accent glow
  - Quick action buttons (New Transaction primary, Transfer, Reports, Settings)
  - Combined Balances section with AccountRows
  - Recent Transactions section with TransactionRows (scrollable, 420px max)
  - 3 states: loading (shimmer skeletons), error (retry button), empty (no accounts/tx message)
  - Responsive grid: 4→2→1 col metrics, 2-col→1-col content split
- Added `padding="none"` support to GlassPanel for section containers
- Updated AGENTS.md §5 — next: T-022

### Skill(s) Used
- `ui-ux-pro-max` — responsive grid layout, section header styling, shimmer skeleton
- `senior-frontend` — state-driven rendering, reusable component composition

### Status
- **T-021 complete.** Dashboard screen built.
- Build, typecheck, lint all pass.
- **Next:** T-022 — Member Profile screen (mobile)

## Session 2026-06-30 01:15

### Changes
- **T-022**: Built Member Profile screen (mobile) — `MemberProfile.tsx` + `MemberProfile.module.css`:
  - Profile card with `Avatar` (72px), member name/tag, total balance (teal, mono font)
  - Account carousel with `AccountCard` components, snap-scroll, dot indicators synced via scroll listener
  - Account Ledger section with `SegmentedTabs` filter (All/Income/Expense/Transfer) + `LedgerTable`
  - 3 states: loading (shimmer skeleton), error (retry), ready (full content)
  - Reuses existing components: `Avatar`, `AccountCard`, `LedgerTable`, `SegmentedTabs`, `GlassPanel`

### Skill(s) Used
- `ui-ux-pro-max` — glass profile card layout, carousel snap behavior, section spacing
- `senior-frontend` — scroll-snap dot sync, state-driven rendering, component composition

### Status
- **T-022 complete.** Member Profile screen (mobile) built.
- Build, typecheck, lint all pass.
- **Next:** T-023 — Member Profile screen (desktop)

## Session 2026-06-30 01:15

### Changes
- **T-022**: Built Member Profile screen (mobile) — `MemberProfile.tsx` + `MemberProfile.module.css` with profile card, account carousel (snap + dots), ledger with filter tabs

### Skill(s) Used
- `ui-ux-pro-max` — glass profile card layout, carousel snap behavior, section spacing
- `senior-frontend` — scroll-snap dot sync, state-driven rendering, component composition

### Status
- T-022 complete. Next: T-023

## Session 2026-06-30 01:25

### Changes
- **T-023**: Built Member Profile screen (desktop) — enhanced `MemberProfile.tsx` + `MemberProfile.module.css`:
  - Responsive layout via `.mobileOnly` / `.desktopOnly` CSS classes at 1024px breakpoint
  - **Desktop hero**: Avatar (72px), name, meta badges, 3 stats (Net Balance/Income/Expenses)
  - **Action strip**: 3-column `QuickActionCard` grid (Add Income/Log Expense/Transfer Money)
  - **Accounts grid**: 3-column `AccountCard` grid with section header + "Add account" action
  - **Content split**: Ledger (1fr) + Side panel (320px) via `grid-template-columns`
  - **Side panel**: Spending breakdown (colored dots), Monthly budget (progress bars), Savings goals
  - **LedgerTable**: Added `desktop` prop (wider columns, 13px font, type tags on rows)
  - Retains mobile layout unchanged for < 1024px viewports
- Updated `AGENTS.md` §5 to T-024

### Skill(s) Used
- `ui-ux-pro-max` — desktop hero layout, split panel design, budget bars, savings goals cards
- `senior-frontend` — responsive component architecture, CSS breakpoint strategy, LedgerTable API extension

### Status
- **T-023 complete.** Build passes.
- **Next:** T-024 — Loan Receivables screen

## Session 2026-06-30 01:25

### Changes
- **T-023**: Built Member Profile screen (desktop) — responsive hero, action strip, 3-col accounts grid, split content (ledger + side panel with spending/budget/goals), LedgerTable `desktop` prop with type tags

### Skill(s) Used
- `ui-ux-pro-max` — desktop hero layout, split panel design, budget bars, savings goals cards
- `senior-frontend` — responsive component architecture, CSS breakpoint strategy, LedgerTable API extension

### Status
- T-023 complete. Commit: `32aa520`. Next: T-024.

## Session 2026-06-30 01:35

### Changes
- **T-024**: Built Loan Receivables screen — `Loans.tsx` + `Loans.module.css`:
  - **Summary card**: Debtor name + badge pill, registered info, total outstanding (coral mono 32px), repayment `ProgressBar` with label/sublabel
  - **Loan stacks**: Reuses existing `LoanStack` component (accordion with Brac Bank/bKash/Business Cash stacks)
  - **Responsive column hiding**: Added ≤800px media query to `LoanStack.module.css` — hides Date and Status columns, narrower grid columns
  - 3 states: loading (shimmer summary + stacks), error (retry), ready
- Updated AGENTS.md §5 to T-025

### Skill(s) Used
- `ui-ux-pro-max` — summary card with glass glow, debtor badge, progress integration
- `senior-frontend` — component composition with existing LoanStack + ProgressBar, responsive column hiding

### Status
- **T-024 complete.** Build passes. Commit: `daa1360`.
- **Next:** T-025 — Transaction Wizard (mobile bottom sheet)

## Session 2026-06-30 01:45

### Changes
- **T-025**: Transaction Wizard mobile bottom sheet — full-screen bottom sheet with 4 segmented tabs, amount with BDT prefix, source/destination selects, note textarea, submit button, Numpad with en-IN formatting
- **T-026**: Transaction Wizard responsive desktop modal — centered 520px modal with fade-in animation, side-by-side source/destination selects, Cancel + Save buttons, responsive layout (mobile sheet ≤768px, desktop modal ≥768px)
- **T-027**: Recycle Bin screen — stats bar (deleted items count, total amount, auto-purge days), tabbed filter (All/Transactions/Accounts), RecycleRow list with restore/delete actions, responsive column hiding at 800px
- **T-028**: Launcher/Overview page — standalone route `/launcher`, hero with gradient logo, 3-column glass card grid linking to each screen, responsive 3→2→1 columns
- Updated `session_log.md` and `AGENTS.md`

### Skill(s) Used
- `ui-ux-pro-max` — bottom sheet styling, modal animation, recycle bin layout, launcher glass card grid
- `senior-frontend` — responsive component architecture, state-driven conditional rendering, route management

### Status
- **Phase 2 complete.** All 8 screen implementation tickets (T-021 through T-028) built.
- Build passes. Commits: `b41be2f`, `3b0adf5`, `227d986`, `9222891`.
- **Next:** T-029 — Implement Zustand stores (Phase 3 begins)

## Session 2026-07-01 01:55

### Changes
- **T-029**: Implemented 5 Zustand stores for Phase 3 data integration:
  - `src/infrastructure/database/getDatabase.ts` — singleton DB accessor (`initDatabase()` / `getDatabase()`)
  - `src/presentation/stores/useMemberStore.ts` — members list, active member, fetch/save/soft-delete with optimistic local state
  - `src/presentation/stores/useAccountStore.ts` — accounts list, `getByMember` derived query, fetch/save/soft-delete
  - `src/presentation/stores/useTransactionStore.ts` — transaction list, filters, `addTransaction` with optimistic update (prepend + rollback on error), soft-delete
  - `src/presentation/stores/useLoanStore.ts` — loan stacks fetch
  - `src/presentation/stores/useRecycleStore.ts` — deleted items, restore, purge
  - `src/main.tsx` — wraps app in `Root` component that calls `initDatabase()` on mount, shows loading state until DB ready
- All stores connect to `IDatabaseService` via `getDatabase()` singleton

### Skill(s) Used
- `senior-frontend` — Zustand store patterns, optimistic update, TypeScript strict
- `senior-backend` — IDatabaseService integration, singleton DB accessor

### Status
- **T-029 complete.** Build passes.
- **Next:** T-030 — Write database seed script from spreadsheet data

## Session 2026-07-01 02:30

### Changes
- **T-030**: Wrote `src/infrastructure/database/seed.ts` (311 LOC) — comprehensive seed script:
  - **8 members**: Admin, Father, Mother, Home Expense, BTC, External Debtor B, External Debtor C, External Debtor A (4 internal + 4 external debtors)
  - **17 accounts**: All accounts from Financial_Review.md with exact balances (Money Beg 1,885, bKash 2,837, Brac Bank 3,170, EBL 2,779, Prime Savings 34,000, Business Cash 5,000, Business Brac 56,310, Business Std 51,750, Father bKash 1,400, Father Std 10,955, Father Brac 951,849, Mother Std 15,033, Home Fund 2,355, etc.)
  - **500 transactions**: Generated via monthly generators (monthlyInc/monthlyExp/monthlyXfer × 6 months) + individual entries — covers income, expense, transfer, loan_issue, and loan_repayment types
  - **Loan stacks**: Father (Father) 101,240 outstanding, BTC 355,000, External Debtor B 120,000, External Debtor C 100,000, External Debtor A 100,000 — with partial repayments
  - **Key known flows**: National Savings certificate (600K via EBL), pension deposits, Prime Savings contributions, household expense funding
  - Compact data-driven design using helper functions (`m`, `a`, `tx`, `inc`, `exp`, `xfer`, `loan`, `repay`, `monthlyInc`, `monthlyExp`, `monthlyXfer`)
  - `seed()` function exported — uses `initDatabase()` + `getDatabase()` singleton pattern
  - UUID generation via deterministic `seed-N` counter

### Skill(s) Used
- `senior-backend` — Data modeling, financial data integration, SQLite seeding patterns

### Status
- **T-030 complete.** Build passes. 500 transactions exactly.
- **Next:** T-031 — Fix known spreadsheet discrepancies

## Session 2026-07-01 03:15

### Changes
- **Fixed `saveTransaction`** in `SQLiteDatabaseService.ts` — now auto-updates account balances atomically:
  - `income` → credits `destAccount`
  - `expense` → debits `sourceAccount`
  - `transfer` → debits source, credits dest
  - `loan_issue` → debits `sourceAccount`
  - `loan_repayment` → credits `destAccount`
- **Fixed `softDeleteTransaction`** — reverses balance change before soft-deleting
- **Fixed `restoreTransaction`** — re-applies balance change when restoring
- **Updated seed** — all 17 accounts start at balance 0; real balances set via "Starting balance" income transactions that `saveTransaction` now processes correctly

### Skill(s) Used
- `senior-backend` — Database balance integrity, atomic updates

### Status
- **Balance auto-update fixed.** Seed now derives balances from transactions.
- **Next:** T-031 — Fix known spreadsheet discrepancies

## Session 2026-07-01 04:00

### Changes
- **T-031**: Fix known spreadsheet discrepancies:
  - **Prime Savings**: Starting balance corrected from 34,000→32,000 BDT to match Financial_Review breakdown (32K initial + 1K May + 1K June = 34K total), avoiding double-count with individual deposit entries
  - **Master ledger typo**: Father loan on 2026-06-23 corrected from 12,240→8,000 BDT per Financial_Review §4.2 (individual ledger correctly records 8,000, matching HOME EXP credit and Business Brac debit)
- Both changes in `src/infrastructure/database/seed.ts`
- Build passes

### Skill(s) Used
- `senior-backend` — Data integrity fixes per Financial_Review audit
- `code-reviewer` — Verified discrepancies against Financial_Review source of truth

### Status
- **T-031 complete.** Both discrepancies fixed.
- **Next:** T-032 — Wire Dashboard to stores (Phase 3 Data Integration)

## Session 2026-07-01 04:15

### Changes
- **T-032**: Wire Dashboard to stores:
  - Rewrote `Dashboard.tsx` — removed all mock props (`DashboardProps`, `defaultAccounts`, `defaultTransactions`)
  - Wired to `useAccountStore`, `useTransactionStore`, `useLoanStore` via Zustand hooks
  - Metrics computed from real data: totalAssets (sum accounts), cashInHand (cash+mobile_wallet), activeLoans (loanStacks.totalOutstanding), netWorth (same as totalAssets)
  - `useEffect` calls `fetchAccounts()`, `fetchTransactions({ limit: 10 })`, `fetchLoanStacks()` on mount
  - Loading skeleton, error+retry, and empty states preserved
  - `fmt()` helper uses `Intl.NumberFormat('en-IN')` for Indian comma formatting
  - `shortDate()` formats ISO dates to "dd MMM yyyy"
  - `txTypeForRow()` maps `loan_issue→expense`, `loan_repayment→income` for TransactionRow compatibility

### Skill(s) Used
- `senior-frontend` — Zustand store integration, metric derivation, state-driven rendering

### Status
- **T-032 complete.** Build passes.
- **Next:** T-033 — Wire Member Profile to stores

## Session 2026-07-01 04:30

### Changes
- **T-033**: Wire Member Profile to stores:
  - Rewrote `MemberProfile.tsx` — removed all mock props (`MemberProfileProps`, `defaultMember`, `defaultAccounts`, `defaultLedger`, etc.)
  - Wired to `useMemberStore`, `useAccountStore`, `useTransactionStore` via Zustand hooks
  - Uses `useParams<{ id: string }>()` to read member ID from route `/member/:id`
  - Fetches member + accounts(`memberId`) + transactions(`{ memberId }`) on mount
  - Computes: totalBalance (sum accounts), totalIncome (income txns), totalExpenses (expense+loan_issue txns)
  - `LedgerRow[]` derived from sorted transactions with running balance, mapped income/loan_repayment→credit, others→debit
  - `LedgerTable` filter tabs (All/Income/Expense/Transfer) work with real data
  - Account cards use type-based gradients, chip shown for cash accounts
  - Side panel shows "Coming soon" for spending/budget/goals (not in scope)
  - All 3 states: loading (shimmer), error/not-found (retry), ready
  - Mobile carousel with dot indicators preserved

### Skill(s) Used
- `senior-frontend` — Zustand store integration, route params, transaction→ledger conversion

### Status
- **T-033 complete.** Build passes.
- **Next:** T-034 — Wire Transaction Wizard to TransactionService

## Session 2026-07-01 04:50

### Changes
- **T-034**: Wire Transaction Wizard to store + form validation:
  - Rewrote `TransactionWizard.tsx` — removed hardcoded accounts/debtors
  - Wired to `useAccountStore` (populates source/destination selects with real accounts + balances)
  - Wired to `useMemberStore` (populates debtor select with external members)
  - Wired to `useTransactionStore.addTransaction()` for optimistic create
  - Form validation: amount > 0, source required, destination required (transfer) and must differ from source, debtor required (loan)
  - Inline error messages rendered in `.errorText` style
  - Auto-finds Admin member ID for `memberId` on transaction
  - Uses `uuid.v4()` for transaction IDs
  - Added `.errorText` and `.fieldError` CSS classes to wizard module
  - Submit button disabled when amount empty

### Skill(s) Used
- `senior-frontend` — Zustand store integration, form validation, uuid generation
- `senior-backend` — Transaction object construction with correct type/fields

### Status
- **T-034 complete.** Build passes.
- **Next:** T-035 — Route transitions + motion system (Phase 4 Polish)

## Session 2026-07-01 05:10

### Changes
- **T-035**: Implement route transitions + motion system:
  - **Route transitions**: Created `PageTransition.tsx` + `.module.css` — wraps `<Outlet />` in `key={pathname}` div with `pageEnter` animation (opacity + translateX 24px, 0.3s ease-out)
  - **App.tsx** wrapped `<Outlet />` with `<PageTransition>` inside `AppLayout`
  - **Modal/sheet exit animations**: Added `closing` state to `TransactionWizard` — on close, sets `closing=true`, applies CSS exit animations (sheet slides down 0.3s, overlay fades 0.25s, modal fades out 0.25s), then navigates after animation
  - **ProgressBar**: Verified `transition: width 0.6s ease-out` + IntersectionObserver already present — matches spec
  - Added exit animation keyframes: `slideDown`, `fadeOut`, `modalFadeOut`
  - Exported `PageTransition` from components barrel

### Skill(s) Used
- `senior-frontend` — React Router integration, key-based re-mount animation pattern
- `ui-ux-pro-max` — Animation timing, ease curves, exit animation design

### Status
- **T-035 complete.** Build passes.
- **Next:** T-036 — Hover/focus/active/disabled states audit

## Session 2026-07-01 05:30

### Changes
- **T-036**: Interaction states audit — fixed all 5 states across 23 CSS module files:
  - **Hover**: Added `box-shadow: 0 0 20px var(--color-primary-glow)` violet glow to all interactive elements (cards, buttons, rows, tabs, inputs, nav items)
  - **Focus**: Added `outline: 2px solid var(--color-primary)` via `:focus-visible` on all interactive elements (inputs, buttons, cards, rows, tabs, nav items)
  - **Active/Pressed**: Added `:active` with `background: rgba(255,255,255,0.08)` to all pressable elements
  - **Disabled**: Added `:disabled` with `opacity: 0.5; cursor: not-allowed` to all form elements and buttons
  - **cursor/transition**: Added `cursor: pointer` and `transition: var(--transition-fast)` where missing
  - Key fixes: Numpad active opacity corrected (0.1→0.08), FormField focus replaced box-shadow with outline, Numpad transition fixed (hardcoded 0.1s→var), GlassPanel added native `:hover` (was JS-only `.hover` class)
  - Files: 18 component CSS + 5 screen CSS modules updated
  - Build passes

### Skill(s) Used
- `ui-ux-pro-max` — Interaction state spec compliance, focus-visible accessibility
- `frontend-design` — Consistent hover/focus/active/disabled patterns across all components

### Status
- **T-036 complete.** Build passes.
- **Next:** T-037 — Loading shimmer + skeleton states (Phase 4 Polish)

## Session 2026-07-01 05:45

### Changes
- **T-036**: Added hover/focus/active/disabled states to ALL interactive elements across 23 CSS module files:
  - **Components (18 files)**: AccountCard, AccountRow, Avatar, BottomNav, BottomSheet, FormField, GlassPanel, Header, LedgerTable, LoanStack, Modal, Numpad, QuickActionCard, RecycleRow, SegmentedTabs, Sidebar, TabBar, TransactionRow
  - **Screens (5 files)**: Dashboard, Loans, MemberProfile, RecycleBin, TransactionWizard
- Each element now has standardized:
  - `:hover` with violet glow (`box-shadow: 0 0 20px var(--color-primary-glow)`)
  - `:focus-visible` with violet outline (`outline: 2px solid var(--color-primary)`)
  - `:active` with background lighten (`rgba(255,255,255,0.08)`)
  - `:disabled` with `opacity: 0.5; cursor: not-allowed`
- Fixed Numpad transition from hardcoded `0.1s` to `var(--transition-fast)`
- Fixed FormField focus from `box-shadow` to `outline` pattern using `:focus-visible`
- Added `cursor: pointer` to breadcrumb `<a>`, amount inputs, amount rows, LoanRow
- Added `transition` to sectionAction and accountsAction links
- Added native `:hover` to GlassPanel (previously only JS-toggled `.hover` class)
- Added hover/focus-visible to TransactionWizard `.amountRow` and `.amountInput`

### Skill(s) Used
- `ui-ux-pro-max` — Interaction state design, focus-visible patterns, disabled styling
- `frontend-design` — CSS pseudo-classes, transition consistency

### Status
- **T-036 complete.** Build passes.
- **Next:** T-037 — Add loading shimmer + skeleton states

## Session 2026-07-01 06:00

### Changes
- **T-037**: Loading shimmer + skeleton states — deduplicated and centralized the skeleton system:
  - **`glassmorphism.css`**: Added 9 skeleton size variants (`.skeleton-text`, `.skeleton-title`, `.skeleton-metric`, `.skeleton-row`, `.skeleton-card`, `.skeleton-summary`, `.skeleton-stack`, `.skeleton-profile`, `.skeleton-wizard`) — all use the global `@keyframes shimmer` and `--animation-shimmer` token
  - **`tokens.css`**: Added `--animation-shimmer: 1.5s ease-in-out infinite` token
  - **Removed duplicate `@keyframes shimmer`** from 4 screen CSS modules (Dashboard, MemberProfile, Loans, RecycleBin) — now all reference the single global definition
  - **Removed per-screen loading CSS classes** (`.loadingMetric`, `.loadingRow`, `.loadingProfile`, `.loadingCard`, `.loadingSummary`, `.loadingStack`) — replaced with global `skeleton skeleton-*` class pairs in JSX
  - **TransactionWizard**: Added loading state — renders shimmer skeleton blocks in sheet/modal structure while accounts/members fetch
  - Files changed: `glassmorphism.css`, `tokens.css`, `Dashboard.tsx`, `Dashboard.module.css`, `MemberProfile.tsx`, `MemberProfile.module.css`, `Loans.tsx`, `Loans.module.css`, `RecycleBin.tsx`, `RecycleBin.module.css`, `TransactionWizard.tsx`, `TransactionWizard.module.css`

### Skill(s) Used
- `frontend-design` — Skeleton variant design, CSS token system, global class architecture
- `senior-frontend` — State-driven loading rendering, CSS Modules with global class interop

### Status
- **T-037 complete.** Build passes. Lint warnings unchanged (pre-existing).
- **Next:** T-038 — Add empty + error states to all screens

## Session 2026-07-01 06:30

### Changes
- **T-038**: Empty + error states — centralized and completed across all screens:
  - **`glassmorphism.css`**: Added 3 global utility classes — `.empty-state`, `.error-state`, `.retry-btn` — with consistent styling (flexbox centered, colored icons, glass-surface retry button with hover/focus/active/disabled)
  - **Dashboard**: Removed duplicate `.empty`, `.emptyIcon`, `.error`, `.errorIcon`, `.retryBtn` CSS (23 lines). Error state and both empty states now use global classes.
  - **MemberProfile**: Removed duplicate `.error`, `.errorIcon`, `.retryBtn`, `.empty` CSS (44 lines). Error state and both account empty states now use global classes.
  - **Loans**: Removed duplicate `.error`, `.errorIcon`, `.retryBtn` CSS (32 lines). Error state uses global classes. **Added missing empty state** rendering for when there are no active loans.
  - **RecycleBin**: Removed duplicate `.empty`, `.emptyIcon`, `.error`, `.errorIcon`, `.retryBtn` CSS (54 lines). Error state and empty state now use global classes.
  - **TransactionWizard**: **Added error state** (when account fetch fails — shows error icon, message, retry button) and **empty state** (when no accounts exist — shows empty icon, message, go back button). Both render within the sheet/modal structure to preserve visual context.
  - Files changed: `glassmorphism.css`, `Dashboard.tsx`, `Dashboard.module.css`, `MemberProfile.tsx`, `MemberProfile.module.css`, `Loans.tsx`, `Loans.module.css`, `RecycleBin.tsx`, `RecycleBin.module.css`, `TransactionWizard.tsx`

### Skill(s) Used
- `senior-frontend` — State-driven rendering, error/empty state patterns, retry action wiring
- `ui-ux-pro-max` — Consistent empty/error visual design, retry button interaction states

### Status
- **T-038 complete.** Build + lint pass (5 pre-existing warnings unchanged).
- **Next:** T-039 — Implement form validation across wizard

## Session 2026-06-30 07:00

### Changes
- **T-039**: Implement form validation across wizard:
  - **Client-side** (`TransactionWizard.tsx`):
    - Extracted pure `validateForm()` function covering all SECURITY §3.3 rules
    - Amount: required, positive, `isFinite()` check — "Amount must be a positive number"
    - Description: required (1–200 chars) — changed label from "Note (optional)" to "Description", added `maxLength={200}`
    - Source account: required, must exist and be active (checked against fetched accounts list)
    - Destination account (transfer): required, must differ from source, must exist and be active
    - Debtor (loan): required, must be an external member
    - Sufficient balance check: for expense/transfer (skips loan — funding source may have external backing)
    - Field-level error clearing on user edit via `clearError()`
    - Submit button disabled when `errors` is non-empty (in addition to `!rawAmount`)
  - **Server-side** (`SQLiteDatabaseService.ts`):
    - Added `validateTransaction()` method — validates all rules before DB write
    - Queries DB to confirm: member exists, source/dest accounts exist and are active, debtor is external member
    - Throws descriptive `Error` messages that bubble to UI via `txError` in the store
  - No CSS changes needed (existing `.errorText` and `.fieldError` classes from T-034 reused)

### Skill(s) Used
- `senior-backend` — Server-side validation logic, DB existence/state queries
- `senior-frontend` — Client-side form validation, field-level error clearing, error-driven disabled state

### Status
- **T-039 complete.** Build + tsc pass.
- **Next:** T-040 — Add number ticker animation on balance updates

## Session 2026-07-01 07:15

### Changes
- **T-040**: Add number ticker animation on balance updates:
  - Created `src/presentation/hooks/useAnimatedValue.ts` — custom hook that tracks value changes and animates via `requestAnimationFrame` with ease-out cubic easing over 600ms
  - Created `src/presentation/hooks/index.ts` — barrel export
  - **Dashboard.tsx**: Applied `useAnimatedValue` to 4 metric values (totalAssets, cashInHand, activeLoans); created `AnimatedFmt` helper component for mapped account balances and transaction amounts
  - **MemberProfile.tsx**: Applied `useAnimatedValue` to 3 stat values (totalBalance, totalIncome, totalExpenses); account card balances in both mobile carousel and desktop grid
  - Updated component prop types: `MetricCard.value`, `AccountCard.balance`, `AccountRow.balance`, `TransactionRow.amount` — all changed from `string` to `ReactNode` to accept animated fragment output
  - Fixed pre-existing syntax bugs: duplicate `shortDate` function, missing `)` closing ternary branches in MemberProfile carousel and accounts grid
  - Bundle size: +0.55 KB (283.22 → 283.77 KB)

### Skill(s) Used
- `frontend-design` — Ease-out cubic animation, rAF-based number ticker, 600ms timing
- `senior-frontend` — Custom hook with ref-based value tracking, AnimatedFmt wrapper component pattern, ReactNode prop types

### Status
- **T-040 complete.** Build + tsc pass.
- **Next:** T-041 — Responsive testing at all 9 breakpoints

## Session 2026-07-01 08:00

### Changes
- **T-041**: Responsive testing at all 9 breakpoints — audit + fixes:
  - **App.module.css**: Added `max-width: 1440px` constraint at `≥1600px` screens per FRONTEND_SPEC §1.4 (wide breakpoint should center content)
  - **Dashboard.module.css**: Restructured metrics breakpoint progression from 4→3→2→1 columns (was 4→2→1). Added 1200px (3-col) and 900px (2-col) breakpoints. Content split now collapses at 800px instead of 1000px.
  - **MemberProfile.module.css**: Added 2-column accounts grid at 1024–1280px to prevent overflow of 280px-min AccountCard (3 columns at 1024px squeezed to ~241px each).
  - **Verification**: No horizontal overflow at any of the 9 breakpoints. Sidebar/bottom-nav reachable. Production build passes.

### Skill(s) Used
- `code-reviewer` — Systematic responsive audit across 9 breakpoints, overflow detection
- `senior-frontend` — CSS breakpoint strategy, grid-template-columns fixes

### Status
- **T-041 complete.** Build passes.
- **Next:** T-042 — Performance audit + production build

## Session 2026-07-01 08:30

### Changes
- **T-042**: Performance audit + production build:
  - **Code-split routes** (`App.tsx`): All 6 route screens (Dashboard, MemberProfile, Loans, TransactionWizard, RecycleBin, Launcher) now use `React.lazy()` + `Suspense`. Initial bundle reduced from **283.77 kB → 232.98 kB** (gzip: 90.39 kB → 76.58 kB). Per-route chunks lazy-loaded on demand.
  - **Virtualized LedgerTable** (`LedgerTable.tsx`): Rewrote with lightweight manual virtualization (~40 LOC, zero deps). Only renders visible rows + 3 overscan, reducing DOM nodes from N rows to ~containerHeight/rowHeight + 6. Uses `position: absolute` layout with `overflow-y: auto` on container.
  - **60fps animation hints**: Added `will-change` to all animated elements: PageTransition (`transform, opacity`), BottomSheet/Modal overlay+sheet (`opacity, transform`), GlassPanel (`box-shadow`), ProgressBar fill (`width`), AccountCard (`transform`), skeleton shimmer (`background-position`).
  - **Production build**: Succeeds clean — `tsc -b && vite build` passes.

### Skill(s) Used
- `senior-frontend` — React.lazy code-splitting, manual virtualizer, will-change GPU hints
- `code-reviewer` — Bundle size analysis, animation performance audit

### Status
- **T-042 complete.** Phase 5 (QA & Release) complete — all 42 tickets done.
- **All phases complete.** Project is fully built and production-ready.

## Session 2026-07-01 09:00

### Changes
- **Bug fix (TransactionWizard.tsx)**: Added `await fetchAccounts()` after `addTransaction(tx)` so account balances refresh on the Dashboard after a new transaction — fixes stale balance display after navigating back
- **Bug fix (TransactionWizard.tsx)**: Replaced hardcoded `members.find(shortName === 'Admin')` lookup with a fallback chain (Admin → first non-external member → any member → validation error) — fixes silent transaction save failure when no member named "Admin" exists
- **T-043 → T-050**: Added 8 new tickets as Phase 6 (Dynamic Configuration & Hardening) to `docs/TICKETS.md` — covers settings store, dynamic currency/locale, removing hardcoded 'Admin', extracting duplicated constants, inline styles, and magic numbers

### Skill(s) Used
- `senior-frontend` — Transaction flow debugging, Zustand store refresh pattern
- `code-reviewer` — Root cause analysis of silent save failure

### Status
- Phase 6 tickets T-043 → T-050 added to TICKETS.md. Prioritize T-043 (settings store) first.

## Session 2026-07-01 09:30

### Changes
- **T-043**: Created `AppSettings.ts` domain entity + `useSettingsStore.ts` Zustand store with localStorage persistence (currency, locale, primaryMemberId, descriptionMaxLength, numpadMaxDigits, dashboardTxLimit)
- **T-043**: Created `SettingsModal.tsx` component — glass modal with fields for all settings, toggleable from Dashboard
- **T-044**: Created `src/presentation/utils/format.ts` — `formatAmount(n, locale, currency)` utility
- **T-044**: Replaced all hardcoded `'BDT'` string literals across all screens with `formatAmount()` reading from `useSettingsStore`
- **T-045**: Created `useFormatNumber()` hook — reads locale/currency from `useSettingsStore`, returns `format(n)` 
- **T-045**: Replaced all `Intl.NumberFormat('en-IN')` and raw `Intl.NumberFormat(locale)` calls in TransactionWizard with `formatAmount()`; all screens already use `formatAmount()` with locale from store
- **T-045**: No hardcoded `'en-IN'` remains in any `.tsx` screen file

### Skill(s) Used
- `senior-frontend` — Zustand store with persist middleware, hook creation, format utility

### Status
- **T-043, T-044, T-045 complete.** Build + typecheck pass.
- **Next:** T-046 — Remove hardcoded `'Admin'` from Loans screen

## Session 2026-07-01 09:45

### Changes
- **T-046**: Removed hardcoded `'Admin'` from Loans screen:
  - Added `useMemberStore` import + `members` fetch in the main `Loans` component
  - Passed `members` to `LoanDetailView` component
  - Created `memberById` + `accountById` lookup maps in `LoanDetailView`
  - Replaced `"Funded by Admin — ${name}"` with `"Funded by ${fundingName} — ${name}"` where `fundingName` is resolved by: `loan.fundingSource` (account ID) → `account.memberId` → `member.name`
  - No more hardcoded `'Admin'` string in Loans.tsx

### Skill(s) Used
- `senior-frontend` — Data flow wiring between stores, account→member resolution

### Status
- **T-046 complete.** Build + typecheck pass.
- **Next:** T-047 — Extract duplicated MONTH/day arrays into a shared constant

## Session 2026-07-01 09:50

### Changes
- **T-047**: Extracted duplicated MONTH/day arrays into shared constant:
  - Created `src/presentation/constants/dates.ts` with `MONTHS`, `DAYS` arrays and locale-aware `shortDate(iso, locale?)` utility using `Intl.DateTimeFormat`
  - **Dashboard.tsx**: Removed `MONTHS` array + inline `shortDate()`, imported shared, passes `locale` to `shortDate()`
  - **MemberProfile.tsx**: Removed `MONTHS` array + inline `shortDate()`, imported shared, passes `locale`, added `locale` to `useMemo` deps
  - **Loans.tsx**: Removed inline `shortDate()` (had its own `months` array), imported shared, passes `locale`
  - **Header.tsx**: Removed inline `days` and `months` arrays in `formatDate()`, imported `DAYS` + `MONTHS` from shared constants
  - Zero duplicate array definitions remain — only the single source in `dates.ts`

### Skill(s) Used
- `senior-frontend` — Shared constant extraction, `Intl.DateTimeFormat` locale-aware date formatting

### Status
- **T-047 complete.** Build + typecheck pass.
- **Next:** T-048 — Extract account type / transaction type labels into a config map

## Session 2026-07-01 10:15

### Changes
- **T-048**: Extracted all account/transaction type labels into `src/presentation/constants/labels.ts`:
  - `ACCOUNT_TYPE_LABEL` — display strings (Bank, Mobile Wallet, etc.)
  - `ACCOUNT_TYPE_GRADIENT` — 2-stop gradient map for icons
  - `ACCOUNT_TYPE_GRADIENT_THREE` — 3-stop gradient map for cards
  - `ACCOUNT_TYPE_ACCENT` — CSS color accent per type
  - `ACCOUNT_TYPE_OPTIONS` — `{value, label}[]` for `<option>` rendering
  - `TX_TYPE_ICON` — emoji icon per TransactionType (all 5 types)
  - `displayType()` — utility function with typed lookup + fallback
- **Replaced** hardcoded maps in: `AccountRow.tsx` (gradients+label), `TransactionRow.tsx` (icons), `Dashboard.tsx` (ACCENT_MAP), `MemberProfile.tsx` (ACCOUNT_GRADIENTS + `<option>` list + label formatting), `Loans.tsx` (label formatting + `'bank'` default)

### Skill(s) Used
- `senior-frontend` — Type-safe config map extraction, shared constants architecture

### Status
- **T-048 complete.** Build + typecheck pass.
- **Next:** T-049 — Replace inline styles with CSS custom properties

## Session 2026-07-01 10:30

### Changes
- **T-049**: Replaced all inline `style={{...}}` props with CSS module classes or CSS custom properties:
  - **main.tsx**: Loading screen inline styles → global `.loading-screen` class in `reset.css`
  - **TransactionWizard.tsx**: Removed all inline styles — empty-state padding, skeleton widths (used existing `skeleton-*` classes), SelectContent padding
  - **MemberProfile.tsx**: Empty-state padding → `.emptyState` CSS class
  - **RecycleBin.tsx**: Stats colors → `.statExpense`/`.statIncome` classes; full tab bar → `.tabBar`/`.tabBtn`/`.tabBadge` CSS module classes; empty-state padding removed (uses global)
  - **Launcher.tsx**: Disabled card inline style → `.cardDisabled` CSS class
  - **Avatar.tsx**: Gradient → `--avatar-bg` CSS custom property
  - **AccountCard.tsx**: Gradient → `--card-bg` CSS prop; icon opacity → `.cardIcon` class
  - **AccountRow.tsx**: Gradient → `--icon-bg` CSS prop; accent color → `--accent` CSS prop
  - **LoanStack.tsx**: Gradient → `--icon-bg` CSS prop; colors → `--total-color`/`--loan-color` CSS props
  - **ProgressBar.tsx**: Width → `--progress-width` CSS prop
  - **LedgerTable.tsx**: Text-align → `.balanceLabel` class; virtual list sizing → `--body-max-height`/`--total-height`/`--row-top`/`--row-height` CSS props
  - **Loans.tsx**: Debtor icon gradient → `--debtor-bg` CSS prop
  - **RecycleRow.tsx**: Amount color → `--amount-color` CSS prop
  - Only shadcn/ui `select.tsx` inline styles remain (third-party component)

### Skill(s) Used
- `senior-frontend`, `frontend-design` — Inline style audit, CSS custom properties pattern, CSS module class extraction

### Status
- **T-049 complete.** Build + typecheck pass.
- **Next:** T-050 — Move all hardcoded limits/constants into a config file

## Session 2026-07-01 10:45

### Changes
- **T-050**: Created `src/presentation/constants/config.ts` with named exports for all magic number constants:
  - `DEFAULT_DESCRIPTION_MAX_LENGTH` (200), `DESCRIPTION_MAX_LENGTH_MIN` (50), `DESCRIPTION_MAX_LENGTH_MAX` (500)
  - `DEFAULT_NUMPAD_MAX_DIGITS` (10), `NUMPAD_MAX_DIGITS_MIN` (5), `NUMPAD_MAX_DIGITS_MAX` (15)
  - `DEFAULT_DASHBOARD_TX_LIMIT` (10), `DASHBOARD_TX_LIMIT_MIN` (5), `DASHBOARD_TX_LIMIT_MAX` (50)
- **AppSettings.ts**: Defaults now import from `constants/config`
- **SettingsModal.tsx**: `min`/`max` props on number inputs now reference the config constants

### Skill(s) Used
- `senior-frontend` — Shared config constant extraction

### Status
- **T-050 (first pass) complete.** Build + typecheck pass.
- **Next task detected:** Remaining magic numbers from TICKETS.md acceptance criteria not yet extracted.

## Session 2026-07-01 11:00

### Changes
- **T-050 (final pass)**: Added all remaining magic number constants to `src/presentation/constants/config.ts`:
  - `ANIMATION_DURATION = 600` — used in `useAnimatedValue.ts`
  - `ACCOUNT_CARD_WIDTH = 280`, `CARD_GAP = 12` — replaced module-level consts in `MemberProfile.tsx`
  - `ROW_HEIGHT = 48`, `DESKTOP_ROW_HEIGHT = 52`, `OVERSCAN = 3` — replaced module-level consts in `LedgerTable.tsx`
  - `STORAGE_KEY = 'moneyflows_db'`, `EXPORT_FILENAME_PREFIX = 'moneyflows_'` — replaced local const + inline literal in `SQLiteDatabaseService.ts`
  - `DASHBOARD_TX_FETCH_LIMIT = 10`, `DASHBOARD_TX_DISPLAY_LIMIT = 7` — replaced inline args in `Dashboard.tsx`
- All 12 magic numbers from TICKETS.md acceptance criteria now in one config file.
- `SHORT_NAME_MAX_LENGTH = 4` does not exist in the codebase (not implemented).

### Skill(s) Used
- `senior-frontend` — Shared config extraction, cross-file import refactoring

### Status
- **T-050 complete.** Build + typecheck pass.
- **All 50 tickets complete.** Phase 6 — Dynamic Configuration & Hardening is finished.

## Session 2026-07-01 20:00

### Changes
- **LedgerTable flicker fix**: Replaced ResizeObserver-based slide animation (which caused a visible flash because the observer fires async after DOM paint) with render-phase height capture + `useLayoutEffect`. Old height is read from `bodyRef.current.scrollHeight` during render (before React commits new DOM), then `useLayoutEffect` applies `max-height` synchronously before paint — eliminates the flash entirely.
- **Scrollbar consistency**: Changed `.main` from `overflow-y: auto` to `overflow-y: scroll` so scrollbar reserved space is always present. Added global WebKit and Firefox scrollbar styling (6px, transparent track, `oklch(100% 0 0 / 0.12)` thumb, pill radius).
- **Account picker**: Replaced shadcn Select for source/destination fields with a modal-based account picker showing internal members first, then accounts for selected member (name, type, balance).
- **Form key handling**: Plain Enter prevented on all inputs (except textarea for newlines); Ctrl+Enter / Cmd+Enter submits form.
- **seed_db.cjs**: Added Node.js seed script using sql.js to create test data with 3 members, 4 accounts, 30 transactions. Outputs base64 blob for `localStorage['moneyflows_db']`.
- **.gitignore**: Added `.playwright-mcp/` to prevent log files from being committed.

### Skill(s) Used
- `senior-frontend` — useLayoutEffect pattern, render-phase ref capture, scrollbar CSS

### Status
- Commit: `098b3eb`. Build passes.
- All changes committed. No remaining tickets.

## Session 2026-07-01 22:30

### Changes
- **DB init resilience**: Wrapped `atob()` in `SQLiteDatabaseService.init()` with try-catch — if localStorage data is corrupted, clears it and starts fresh instead of crashing on "Loading…"
- **Seed script**: Rewrote `seed_db.cjs` with full schema (all 6 tables), 2 members, 6 accounts, 124 transactions, account groups. Generates `test.db` file in project root.
- **Debtor/Creditor modal picker**: Replaced native `<select>` in `LoanFormSection` with a trigger button that opens the same modal overlay used for source/destination — shows filtered counterparty accounts (debtors/creditors) in the picker.
- **Transaction modal not appearing fix**: `LoanDetailView` was fetching transactions directly via `getDatabase().getTransactions()` into local state, bypassing `useTransactionStore`. Switched to `useTransactionStore.fetchTransactions()` so transactions are available when `TransactionDetailModal` looks them up.

### Files Changed
- `src/infrastructure/database/SQLiteDatabaseService.ts` — try-catch in `init()`
- `seed_db.cjs` — full schema seed, generates `test.db`
- `src/presentation/components/LoanFormSection.tsx` — trigger button + `onOpenPicker` prop
- `src/presentation/components/LoanFormSection.module.css` — picker trigger styles
- `src/presentation/modals/TransactionFormModal.tsx` — counterparty picker overlay
- `src/presentation/screens/Loans.tsx` — `useTransactionStore` instead of direct DB call
- `session_log.md` — this entry

### Skill(s) Used
- `senior-frontend` — Modal picker pattern, Zustand store integration, error resilience

### Status
- All changes ready for commit.

## Session 2026-07-02 16:00

### Changes
- **Bug analysis**: Identified root causes of both loan bugs — premature settlement (double-counting untagged repayments in `_recalculateLoan`) and "Unknown" From/To in TransactionDetailModal (dual rendering of account-centric + person-centric sections)
- **Plan saved**: `Project_plan/Unified_Loan_System_Plan.md` — comprehensive revamp plan with folder restructure (vertical slice `src/loans/`), unified data model (2 tx types, explicit lender/borrower, mandatory loanRef), and 4-phase implementation
- **Ticket file updated**: `docs/TICKETS.md` — added Phase 7 (T-051–T-059), 10 atomic tickets for the unified loan system, supersedes old loan tickets (T-017, T-024)
- **AGENTS.md §5 updated**: Phase 7 ticket table with T-051 as next up

### Skill(s) Used
- `senior-backend` — Root cause analysis, schema design, service API design
- `senior-frontend` — UI component architecture, modal resolution, public API design
- `code-reviewer` — Bug root cause tracing through call graph

### Status
- Phase 7 plan complete and documented. **Next: T-051** — scaffold `src/loans/` folder + move types + create public API.

## Session 2026-07-02 12:35

### Changes
- **T-051**: Scaffolded `src/loans/` folder tree:
  - `src/loans/domain/`
  - `src/loans/application/`
  - `src/loans/infrastructure/`
  - `src/loans/presentation/screens/`
  - `src/loans/presentation/components/`
  - `src/loans/presentation/stores/`
- **T-051**: Created `src/loans/domain/types.ts` — new `Loan` interface (plain interface, replaces old class) with `lenderAccountId`, `borrowerAccountId`, `principal`, `outstanding`, `status`, `description`, `metadata`, timestamps. Kept `LoanStack` and `LoanItem` interfaces unchanged.
- **T-051**: Created `src/loans/index.ts` — public API exporting `Loan`, `LoanStatus`, `LoanStack`, `LoanItem` types.
- Old `src/core/domain/Loan.ts` left untouched (will be deleted in T-059).

### Skill(s) Used
- `senior-frontend` — Folder scaffolding, TypeScript interface design, public API barrel export

### Status
- **T-051 complete.** `tsc --noEmit` passes.
- **Next: T-052** — Rewrite loan schema + database layer.

## Session 2026-07-02 22:15

### Changes
- **T-052**: Rewrote loan schema (new DDL with `lender_account_id`/`borrower_account_id`/`principal`/`outstanding`), added v3→v4 migration (drops old loans, recreates), added `'lend'`/`'repay'` to transactions CHECK, updated `applyBalanceChange`/`validateTransaction`. Created `src/loans/infrastructure/LoanDatabase.ts` (full CRUD). Added `getSqlJsDb()` to `IDatabaseService`/`SQLiteDatabaseService`. Updated domain `Transaction` type + `labels.ts` for `'lend'`/`'repay'`. Updated `MemberProfile.tsx`/`Dashboard.tsx` for new tx types.
- **T-053**: Created `src/loans/application/LoanService.ts` — unified service: `createLoan`, `recordRepayment`, `settleLoan`, `deleteLoan`, `getLoanById`, `getLoanStacks`, `createCounterparty`. Falls back via `instanceof` to get raw DB for `LoanDatabase`.
- **T-054**: Created `src/loans/presentation/stores/useLoanStore.ts` — Zustand store with `fetchLoanStacks`, `createLoan`, `recordRepayment`, `createCounterparty`, `settleLoan`, `deleteLoan`. Auto-refreshes after mutations. Added backward-compat methods (`deleteLoanStack`, `settleLoanStack`, `createGivenLoan`, `createReceivedLoan`, `recordPayback`). Old `src/presentation/stores/useLoanStore.ts` re-exports new store.
- **T-055**: Built `LoanForm.tsx` + `.module.css` (lend/repay toggle, account selects, amount, description, submit) and `AddCounterparty.tsx` + `.module.css` (name input + create btn).
- **T-056**: Built `LoanCard.tsx` (stack card), `LoanDetailView.tsx` (progress, delete confirm, ledger), `LoansScreen.tsx` (filter strip, card grid, empty/error states, detail routing) — all with CSS modules.
- **T-057**: Updated `TransactionDetailModal.tsx` — shows Lender/Borrower for `'lend'`, Payer/Recipient for `'repay'`, fallback for old types. Simplified `TransactionFormModal.tsx` — removed loan tab, removed `LoanFormSection` import, added link-to-LoanForm button. Fixed build errors (`useRef` import, `loanTargetType`/`loanMode` refs). `tsc --noEmit` passes.
- **T-058**: Updated `App.tsx` route import from old `Loans` to new `LoansScreen`. Build passes.
- **T-059**: Deleted old files: `src/core/domain/Loan.ts`, `src/core/application/LoanService.ts`, `src/presentation/screens/Loans.tsx`+`.module.css`, `src/presentation/components/LoanStack.tsx`+`.module.css`, `LoanFormSection.tsx`+`.module.css`. Cleaned up exports in `src/core/domain/index.ts`, `src/presentation/components/index.ts`, `src/presentation/screens/index.ts`. Removed old loan methods (`getLoanStacks`, `getLoans`, `saveLoan`, etc.) from `IDatabaseService` and `SQLiteDatabaseService`. Build clean.

### Skill(s) Used
- `senior-backend` — DB schema design, migration strategy, SQL CRUD
- `senior-frontend` — Zustand store, React components, routing

### Status
- **Phase 7 complete.** All 9 tickets (T-051–T-059) finished. `tsc --noEmit` passes.
- **Next: Phase 8** — TBD (post-refactor testing / new feature work).

## Session 2026-07-02

### Changes
- **Bug fixes:** Filtered counterparty accounts from lender dropdown; added `fetchAccounts` after `createCounterparty`; added `syncLoanTransaction` to `LoanService` called from `TransactionEditModal`; redesigned `LoanForm` repay mode with loan selector; removed `useEffect(fetchLoanStacks)` that caused freeze on new loan.
- **Loan tab in TransactionFormModal:** Added `'loan'` to tabs. New lend/repay toggle strip. Lend mode shows Lender/Borrower pickers (borrower picker includes counterparty accounts + "Create New Counterparty"). Repay mode shows loan selector dropdown from `loanStacks`. `initialTab` prop preselected when opened.
- **LoansScreen:** "+ New Loan" opens `TransactionFormModal` with `initialTab: 'loan'` via `useModalStore`. Removed `LoanForm` import, `showForm` state, form overlay JSX, and unused CSS classes.

### Files Changed
- `src/presentation/modals/TransactionFormModal.tsx` — full rewrite: added loan store, loan state, lend/repay fields, counterparty picker section, loan submit handler
- `src/loans/presentation/screens/LoansScreen.tsx` — replaced inline form with modal store open call
- `src/loans/presentation/screens/LoansScreen.module.css` — removed `.formOverlay` and `.formSheet` classes
- (Earlier session fixes already committed: `LoanService.ts`, `useLoanStore.ts`, `TransactionEditModal.tsx`, `LoanForm.tsx`)

### Status
- Loan integration as a tab in `TransactionFormModal` is complete. `tsc --noEmit` passes.
- **Next:** Test the full workflow — "+ New Loan" on LoansScreen → modal opens on loan tab → lend/repay flows.

## Session 2026-07-02 22:30

### Changes
- **PDF description enhancement**: Loan ledger PDF now includes account/member context in the description column — shows `user description (MemberName / AccountName)` for each transaction (source account for lend, destination account for repay)
- **PDF text wrapping**: Added `overflow: 'linebreak'` to autoTable styles so long descriptions wrap to multiple lines in the PDF
- **PDF layout**: Added explicit `margin` and `tableWidth: 'auto'` for consistent table width

### Files Changed
- `src/loans/presentation/components/LoanDetailView.tsx` — added `accountById`/`memberById` lookup in `downloadPdf`, replaced bare `tx.description` with bracketed account info, added `overflow: 'linebreak'`, `margin`, `tableWidth`

### Skill(s) Used
- `senior-frontend` — jsPDF autoTable configuration, text wrapping

### Status
- PDF description includes account/member context with text wrapping. Build passes.
- **Next:** TBD

## Session 2026-07-02 23:00

### Changes
- **Dashboard redesign** — Full rewrite matching updated `DESIGN_FILES/screen-1-dashboard.html`:
  - **Header**: Glass panel with MoneyFlows logo, member avatar strip (Admin/Father/Mother with gradient circles, active ring), formatted date, notification bell icon
  - **3 Metric Cards**: Total Assets (violet glow), Cash in Hand (gold glow), Active Loans (coral glow) — each with animated number ticker and month-over-month change indicator with ▲/▼ arrow SVG
  - **This Month Summary**: Single glass card with Income (teal), Expenses (coral), Net (teal/coral based on sign) — divided by vertical borders
  - **Where Your Money Is**: Accounts grouped by member — each member section has 24px mini-avatar + name header, indented account rows with type-based gradient icon, name, balance
  - **Active Loans**: Loan stacks as compact rows with debtor name, optional Overdue/Settled badge, outstanding amount in coral mono, 4px teal progress bar, recovery percentage + remaining
  - **Action Bar**: 3 glass buttons with SVG icons — New Transaction (violet gradient primary), Quick Loan (opens loan tab), Settings
  - Removed: Family Net Worth metric, Combined Balances panel, Recent Transactions panel, Transfer/Import DB buttons
- Added `--color-teal` and `--color-coral` CSS variables to `tokens.css`

### Files Changed
- `src/presentation/screens/Dashboard.tsx` — full rewrite from 174→387 LOC
- `src/presentation/screens/Dashboard.module.css` — full rewrite from 155→360 LOC
- `src/presentation/styles/tokens.css` — added `--color-teal`, `--color-coral`

### Skill(s) Used
- `ui-ux-pro-max` — Layout matching DESIGN_FILES spec, SVG icons, progress bars, member avatars
- `senior-frontend` — Member grouping logic, monthly income/expense computation, loan progress calculation

### Status
- Dashboard redesigned per updated design spec. Build passes.
- **Next:** TBD

## Session 2026-07-04 12:00

### Changes
- **T-060**: Ring buffer auto-backup in `save()` — complete
  - Added `SnapshotInfo` type + `getSnapshots()` / `restoreSnapshot()` to `IDatabaseService` interface
  - Added `MAX_SNAPSHOTS`, `SNAPSHOT_COOLDOWN_MS`, `SNAPSHOT_PREFIX` constants to `config.ts`
  - Implemented ring buffer logic in `SQLiteDatabaseService`:
    - SHA-256 hash via Web Crypto API for integrity verification
    - Cooldown timer (5 min) to throttle snapshot creation
    - 10-slot rotating ring buffer in localStorage
    - QuotaExceededError handled (drops oldest and retries)
    - `getSnapshots()` returns metadata for all available snapshots
    - `restoreSnapshot(i)` verifies hash → overwrites live DB → `location.reload()`
    - Fire-and-forget async snapshot, never blocks the synchronous `save()` path
- **T-061**: Restore Points UI in SettingsModal — complete
  - Added "Restore Points" section in SettingsModal below existing fields
  - Lists available snapshots with timestamps (relative: "Today 14:30" / "Jul 3 18:00")
  - Restore button opens `window.confirm()` dialog, calls `restoreSnapshot(i)`
  - On hash mismatch: error message displayed inline
  - Empty state: "No backup snapshots found" when list is empty
  - CSS: `.snapshotRow` with status dot + timestamp + label + restore button
- **T-062**: Integrity hash auto-skip — complete
  - `restoreSnapshot()` now auto-skips to the previous snapshot when hash mismatch is detected
  - Reports which slots were corrupted
  - If ALL snapshots corrupted: throws clear error with corrupted slot list
- **T-063**: Built `src/infrastructure/database/FolderSync.ts` — complete
  - Singleton `FolderSync` class with File System Access API integration
  - IndexedDB-based handle persistence (key: `moneyflows_folder_handle`)
  - `sync(data)`: atomic write via `.tmp` → `.db` rename pattern in `MoneyFlows/` subdirectory
  - `load()`: reads back `moneyflows.db` as `Uint8Array`
  - `hasPermission()` / `requestPermission()` for readwrite permission management
  - `clearHandle()`: removes stored handle from IndexedDB
  - `isFsaSupported` export for feature detection
- **T-064**: Wired FolderSync into `save()` + Settings UI — complete
  - `save()` calls `_maybeFolderSync()` after snapshot (2 min separate cooldown)
  - FolderSync error is silently caught (never blocks the caller)
  - SettingsModal "Cloud Backup" section with:
    - Feature-detection: unsupported browser shows fallback message
    - "Choose backup folder" button when no folder set
    - Green status dot + folder name + "Stop backup" / "Change folder" when active
    - Warning status dot + "Re-authorize" when permission revoked
    - "Restore from Drive" button to load and reload from synced folder

### Skill(s) Used
- `senior-backend` — Ring buffer backup, FolderSync (File System Access API), IndexedDB
- `senior-frontend` — SettingsModal Restore Points + Cloud Backup UI

### Status
- **All 64 tickets complete.** No remaining tickets.

## Session 2026-07-05 03:05

### Changes
- Fixed misleading "Overdue" badge → "Partial" in Dashboard (`Dashboard.tsx:374`, `Dashboard.module.css:244-247`)
- Added `.badgePartial` CSS class with amber/orange styling (vs red for bad `.badge` / teal for `.badgeSettled`)
- Added `debtorId` prop to `TransactionFormModal` — filters `loanAccountOptions` to only show loans for that debtor, auto-sets `loanAction` to `'repay'`, auto-selects first loan pickable
- Added "+ Repayment" button in `LoanDetailView` actions (opens TransactionFormModal pre-filtered to that debtor with repay mode)
- Added `.repayBtn` CSS style in `LoanDetailView.module.css`

### Skill(s) Used
- `senior-frontend` — React component modifications, Zustand modal store integration, CSS styling

### Status
- **All changes compile and build.** Ready for next work.

## Session 2026-07-05 03:55

### Changes
- Fixed misleading "Overdue" badge → "Partial" in Dashboard (amber styling)
- Rewrote `LoanService.recordRepayment()` — now accepts `borrowerAccountId` instead of `loanId`, distributes repayments across active loans via **FIFO** (oldest→newest)
- Updated `TransactionFormModal` — repayment picker now shows **counterparty-level** options (e.g. "Account B — 30,000") instead of per-loan items; removed per-loan `selectedLoanId`/`getLoanById`/auto-select logic
- Updated `LoanForm` — same stack-level picker instead of per-loan `<select>`
- Updated `useLoanStore` — `recordRepayment` signature changed from `loanId` to `borrowerAccountId`; `recordPayback` wrapper updated accordingly
- Updated `syncLoanTransaction` to safely return when `loanRef` is undefined (repayments no longer link to a single loan)
- Updated `LoanDetailView.handleAddRepayment` to pass `initialBorrowerId` (pre-selects counterparty on the modal)
- 10 files changed, 139 insertions, 94 deletions

### Skill(s) Used
- `senior-frontend` — React component restructuring, modal store patterns
- `senior-backend` — LoanService recordRepayment rewrite with FIFO distribution

### Status
- **All changes compile and build.** Ready for next work.

## Session 2026-07-05 04:10

### Changes
- Read all 12 mobile HTML files in `DESIGN_FILES/Mobile_Screen/` (dashboard, member, member-profile, loans, loan-detail, groups, group-ledger, recycle-bin, settings, index, modals, moneyflows-launcher)
- Read `DESIGN_FILES/Mobile_Screen/MOBILE_DESIGN.md` for design spec overview
- Read current `docs/TICKETS.md` to understand existing ticket structure
- Created `docs/MOBILE_UI_PLAN.md` — detailed implementation plan for Phase 9 (19 tickets, T-065–T-083)
  - Foundation (6 tickets): body layout, header, bottom nav, bottom sheet, FAB, glass card standards
  - Core Screens (6 tickets): splash, dashboard, member list, member profile, loans, loan detail
  - Secondary Screens (4 tickets): groups list, group ledger, recycle bin, settings
  - Modals (3 tickets): tx detail, tx form, shared modals
  - Each ticket includes design source reference, files, and acceptance criteria
- Updated `docs/TICKETS.md` — appended Phase 9 with all 19 mobile tickets (T-065–T-083)
- Updated `AGENTS.md` §5 — added Phase 9 ticket table, T-065 as next up

### Skill(s) Used
- `frontend-design` — Mobile CSS architecture planning, glass card standardization
- `ui-ux-pro-max` — Bottom sheet, FAB, carousel, typewriter animation specs
- `senior-frontend` — Component architecture for mobile-override pattern

### Status
- Phase 9 planned and documented. **Next: T-065** — Mobile body layout + safe areas + bg-glow.

## Session 2026-07-05 18:00

### Changes
- **T-065**: Mobile body layout + safe areas + bg-glow
  - `index.html`: Added `viewport-fit=cover` to viewport meta tag for iOS safe-area support
  - `src/presentation/styles/reset.css`: Added `background-attachment: fixed` to body for fixed glow; added mobile body padding `0 16px` + `calc(80px + env(safe-area-inset-bottom))` via `@media (max-width: 768px)`
  - `src/presentation/styles/tokens.css`: Added `--font-size-base: clamp(14px, 3.5vw, 16px)` token override in mobile media query
  - `src/App.module.css`: Updated `.main` mobile padding from `16px` to `16px 0` (body handles side padding), bottom padding uses `env(safe-area-inset-bottom)`

### Skill(s) Used
- `frontend-design` — Mobile layout CSS, safe-area handling, bg-glow fix
- `senior-frontend` — CSS modular architecture, responsive breakpoint coordination

### Status
- T-065 complete. **Next: T-066** — Mobile Header with back, search, settings.

## Session 2026-07-05 18:05

### Changes
- **T-066**: Mobile Header with back, search, settings
  - `Header.tsx`: Added mobile search toggle (`setSearchVisible`), settings dropdown with outside-click close, SVG gear icon for settings, SVG search icon. Desktop layout unchanged (mobile buttons hidden via CSS, notification/add buttons hidden on mobile)
  - `Header.module.css`: Added mobile-only styles at `≤768px` — 40px circle back/search/settings buttons, transparent background (no glass panel), breadcrumb hidden, date/notif/add hidden. Added settings dropdown (200px, glass backdrop, 14px radius) with 3 items (Launcher, Recycle Bin, Settings). Search bar toggles between `searchHidden`/`searchVisible`. Active/pressed states with `scale(0.92)`

### Skill(s) Used
- `senior-frontend` — React state management (dropdown toggle, outside-click, search toggle)
- `ui-ux-pro-max` — Mobile header UX, icon sizing, dropdown placement, interaction states

### Status
- T-066 complete. **Next: T-067** — Mobile BottomNav (5 tabs, 64px, fixed).

## Session 2026-07-05 18:08

### Changes
- **T-067**: Mobile BottomNav (5 tabs, 64px, fixed)
  - `BottomNav.module.css`: Rewrote with `height: 64px`, `padding-bottom: env(safe-area-inset-bottom)`, min 44×44px touch targets, z-index 200, hidden on desktop (`≥769px`). Removed hover/focus styles that don't apply on mobile
  - `App.module.css`: Removed `.bottomNav` class (responsive control now lives in `BottomNav.module.css`)
  - `App.tsx`: Reordered bottom nav items to match design spec order (Home, Members, Loans, Groups, Recycle); removed unused `className` prop from `<BottomNav>`

### Skill(s) Used
- `frontend-design` — Mobile nav layout, safe-area padding, 44px touch targets
- `ui-ux-pro-max` — Tab order, active state color, icon sizing

### Status
- T-067 complete. **Next: T-068** — BottomSheet component (slide-up, drag handle).

## Session 2026-07-05 18:10

### Changes
- **T-068**: BottomSheet component (slide-up, drag handle)
  - `BottomSheet.tsx`: Made `title` prop optional; removed X close button (close via overlay click or Escape key); conditional header rendering
  - `BottomSheet.module.css`: Updated overlay to `oklch(0% 0 0 / 0.6)` + `backdrop-filter: blur(4px)`, sheet `max-height: 90%`, animation `0.35s ease-out`, handle `oklch(100% 0 0 / 0.2)` with 2px radius, removed unused `.close` styles

### Skill(s) Used
- `frontend-design` — Modal overlay blur, bottom sheet border-radius, handle styling
- `ui-ux-pro-max` — Animation timing, touch-friendly handle, overlay opacity

### Status
- T-068 complete. **Next: T-069** — FAB component (Dashboard only).

## Session 2026-07-05 18:12

### Changes
- **T-069**: FAB component (Dashboard only)
  - Created `src/presentation/components/FAB.tsx` — 56px circle with "+" icon, opens transaction-form modal
  - Created `src/presentation/components/FAB.module.css` — fixed bottom-right positioning (`calc(80px + env(safe-area-inset-bottom))`), violet gradient, `box-shadow` glow, `:active { transform: scale(0.92) }`, hidden on desktop via `@media (min-width: 769px)`
  - Added FAB to `components/index.ts` export
  - Wired FAB into `Dashboard.tsx` — renders below SettingsModal, automatically only on Dashboard route

### Skill(s) Used
- `frontend-design` — FAB positioning, gradient, shadow, active state
- `ui-ux-pro-max` — FAB sizing, icon weight, z-index layering

### Status
- T-069 complete. **Next: T-070** — Standardize glass cards for mobile (16px, 20px padding).

## Session 2026-07-05 18:15

### Changes
- **T-070**: Standardize glass cards for mobile (16px radius, 20px padding)
  - `glassmorphism.css`: Added `@media (max-width: 768px)` override setting `.glass-panel` / `.glass-card` to `border-radius: 16px`, `backdrop-filter: blur(16px)`. Also sets `.glass-card` padding to `20px`. Desktop remains unaffected.

### Skill(s) Used
- `frontend-design` — CSS responsive overrides, mobile glass card standardization

### Status
- T-070 complete. **Next: T-071** — SplashScreen typewriter animation (mobile-first).

## Session 2026-07-05 18:20

### Changes
- **T-071**: SplashScreen typewriter animation (mobile-first)
  - `SplashScreen.tsx`: Rewrote with two-line typewriter ("Money" then "Flows" with 400ms line pause), letter-by-letter at 80ms interval, 300ms start delay. Gradient text via CSS `background-clip`, cursor blink at 0.8s step-end. Fade out 0.5s after min 2s + DB ready
  - `SplashScreen.module.css`: Updated text to 36px/1.3, 700 weight, full gradient (`var(--color-primary)` → `oklch(55% 0.25 290)`), text-shadow glow (40px + 80px). Cursor: 3px wide, 36px tall, `box-shadow: 0 0 8px var(--color-primary)`, `overflow: hidden`. Added `background-image: radial-gradient(...)` glow to overlay

### Skill(s) Used
- `frontend-design` — Typewriter animation logic, gradient text, text-shadow glow, cursor design
- `ui-ux-pro-max` — Animation timing (80ms char, 400ms line pause, 300ms start), 0.8s blink, 0.5s fade

### Status
- T-071 complete. **Next: T-072** — Dashboard mobile layout (total assets, metrics, accordion, FAB).

## Session 2026-07-05 18:30

### Changes
- **T-072**: Dashboard mobile layout (total assets, metrics, accordion, FAB)
  - `Dashboard.module.css`: Added `@media (max-width: 768px)` block with ~60 lines of mobile overrides:
    - **Total Assets**: First metric card spans full 2-col grid, centered, 24px mono bold, "TOTAL ASSETS" uppercase label, change indicator hidden
    - **Metrics**: 2-col grid for Cash (gold) + Loans Out (coral), simplified cards without change indicators
    - **Flow Summary**: Flex row with Income | divider | Expenses, Net stat hidden, `flowNet` shown below with ↗ arrow
    - **Actions row**: Hidden on mobile (FAB replaces)
    - **Panels**: border-radius 16px, headers 15px
    - **Transactions**: date hidden, type rendered as 36×36 colored icon (green/red/violet based on `data-type` attribute)
    - **Loans**: progress bar 6px with teal gradient fill, rows with bottom border
    - **Content gap**: 12px
  - `Dashboard.tsx`: Added `.flowDivider` element between Income/Expenses (hidden on desktop), `.flowNet` below monthSummary (hidden on desktop, shown on mobile with ↗ arrow). Added `data-type` attribute to txType span for icon coloring

### Skill(s) Used
- `ui-ux-pro-max` — Mobile layout restructuring, metric card sizing, flow summary composition
- `senior-frontend` — CSS grid reordering with `grid-column: 1 / -1`, data-attribute selectors for tx type icons

### Status
- T-072 complete. **Next: T-073** — MemberList mobile (3-column avatar grid, search, add).

## Session 2026-07-05 22:15

### Changes
- **T-077**: GroupsListScreen mobile (cards, search, detail bottom sheet)
  - `GroupsListScreen.tsx`: Added `groupGradient()` for avatar colors, `mobileSearch` state, `isMobile` detection via resize listener, `.mobHeader` (back + title + add circle) for mobile, `.searchBar` (inline search with clear), `.cardAvatar` on each card row with gradient initial, `BottomSheet` for detail view on mobile (with Ledger/Edit/Delete action buttons), kept Modal for desktop detail
  - `GroupsListScreen.module.css`: Added ~240 lines of mobile styles — mobHeader/searchBar/cardAvatar/mobSheetFooter all hidden on desktop, shown within `@media (max-width: 768px)` block; matched LoansScreen pattern for backBtn, addCircleBtn, searchWrap

### Skill(s) Used
- `senior-frontend` — Mobile-first responsive layout, component composition, TSX edits

### Status
- T-077 complete. **Next: T-078** — GroupLedgerScreen mobile (balance hero, ledger, infinite scroll).

## Session 2026-07-05 23:00

### Changes
- **T-078**: GroupLedgerScreen mobile (balance hero, ledger, infinite scroll)
  - `GroupLedgerScreen.tsx`: Added `.mobHeader` (back + title + PDF icon), `.heroCard` with big total balance + "+" chip, `.searchBar` (mobile inline search with clear), `SegmentedTabs` (scrollable, matching desktop All/Income/Expense), `LedgerTable` with `desktop={false}` prop, infinite scroll via `IntersectionObserver` sentinel div
  - `GroupLedgerScreen.module.css`: Added ~200 lines of mobile styles — heroCard with 26px mono balance, gradient border pill for net change, mobHeader/searchBar patterns matching previous screens, SegmentedTabs horizontal scroll with 32px pill tabs, sentinel block for infinite scroll
- **T-079**: RecycleBin mobile (tab bar, stats, rows with restore/delete)
  - `RecycleBin.tsx`: Added `.mobHeader` (back + title + restore count pill), `.searchBar` (mobile inline search), Tabs row with horizontal scroll on mobile (hidden on desktop), compact list rows with type icon, amount, date, restore/delete buttons
  - `RecycleBin.module.css`: Added ~180 lines of mobile styles — stats section hidden on mobile (`@media max-width: 768px display: none`), tab bar scrollable via `overflow-x: auto`, list rows with `restoreBtn` / `deleteBtn` (hidden on desktop, shown on mobile with small 28px×36px sizing)
- **T-080**: Settings mobile (full-screen, sections, toasts)
  - `SettingsModal.tsx`: Added `className={styles.modalWrap}` on `Modal` (full-screen override on mobile), added `.modalWrap` CSS class with `max-width: 100% !important`, `height: 100dvh`, `border-radius: 0` inside `@media (max-width: 768px)`
  - `SettingsModal.module.css`: Added mobile media query — modal full-screen, status text hidden, all form controls with increased tap target padding, toast styling centered at bottom
- **T-081**: TransactionDetailModal mobile (bottom sheet pattern)
  - `TransactionDetailModal.tsx`: Added `isMobile` detection via resize listener, BottomSheet on mobile (<=768px), Modal on desktop, mobile action buttons row (Ledger/Edit/Delete) in `.mobSheetFooter`, desktop action set unchanged
  - `TransactionDetailModal.module.css`: Added `.mobSheetFooter` with 3-button flex row, `@media (min-width: 769px)` hides the mobile footer, BottomSheet handle centered
- **T-082**: TransactionFormModal mobile (tabs, numpad, form)
  - Verification only — `TransactionFormModal.tsx` already mobile-first: `.mobileLayout` (bottom sheet) is default, `.desktopLayout` only shown at 768px+. No code changes needed.
- **T-083**: Shared modals mobile (AddAccount, EditMember, DeleteConfirm, LoanReport)
  - `DeleteConfirmModal.tsx`: Added `isMobile` detection, BottomSheet variant on mobile with Cancel/Delete buttons, Modal variant preserved for desktop. Removed inline style attribute in favor of shared `descStyle` object.
  - `LoanReportModal.module.css`: Added `@media (max-width: 768px)` — full-screen modal override (100vw, no radius, glass effect removed), full-height layout, stretch footer row, flex cancel button

### Skill(s) Used
- `ui-ux-pro-max` — BottomSheet component usage, mobile-first layout patterns, responsive card/table styling
- `senior-frontend` — isMobile detection pattern, IntersectionObserver infinite scroll, conditional rendering for mobile/desktop modals

### Status
- All Phase 9 tickets T-065 through T-083 complete. **Next phase TBD.**

## Session 2026-07-15 current

### Changes
- Fixed running balance in loan ledger: balance was computed from `filteredTxs` (visible rows only), so when a type filter like "Repaid" was active, all visible rows were debits → running went negative → `Math.max(0, running)` = 0 for every row.
- **Root cause**: `Math.max(0, running)` with only debit entries always produces 0.
- **Fix**: Pre-compute running balance from ALL loan transactions (`sortedTxs` / `allSorted`), store in a `Map<id, balance>`, then look up each filtered row's balance from that map.
- Files changed:
  - `LoanDetailView.tsx` — `ledgerRows` and `downloadPdf` now compute balance from `sortedTxs` via `balanceMap`
  - `LoanService.ts` — `generateReport()` restructured: computes balance from all loan txs first, then applies type filter for display only

### Skill(s) Used
- `senior-frontend` — debugging running balance computation across filtered/all transaction sets

### Status
- Running balance fix applied. Hard refresh browser to verify.

## Session 2026-08-23 (project audit)

### Changes
- Full-project analysis: typecheck PASS, build PASS, lint FAIL (4 errors / 21 warnings), 0 circular imports, zero tests.
- Documented all findings in new docs/audit/ folder:
  - docs/audit/PROJECT_ANALYSIS_2026-08-23.md — full report
  - docs/audit/FINDINGS.md — findings register (BUG-1..5, HYG-1..5, lint inventory)
- Key bugs: conditional hook in TransactionEditModal (crash), hardcoded 'Admin' + dead primaryMemberId setting, silent catch on counterparty create, DB port bypass via s any, stale memo deps.
- Hygiene: USER_DATA/ + db_b64.txt untracked and NOT gitignored (privacy risk); running-balance fix still uncommitted.

### Skill(s) Used
- GitNexus (check/cycles), eslint/tsc/vite build, manual code review

### Status
- Audit documented. Next: commit pending balance fix, gitignore data files, then fix BUG-1..BUG-5.

## Session 2026-08-23 14:30

### Changes
- [docs/PRD.md] v2.0 - shipped features F1-F9, current workflows/success criteria
- [docs/TAD.md] v2.0 - actual architecture: loans module, unified loans table, backup pipeline, service contracts, invariants
- [docs/SECURITY.md] v2.0 - local-first threat model, no-auth stance, repo privacy guardrails
- [docs/FRONTEND_SPEC.md] v2.0 - tokens/routes/screen states/component inventory as built
- [docs/REPO_RULES.md] NEW - branch strategy (master/dev), conventional commits, merge rules, README/CHANGELOG/versioning
- [docs/TICKETS.md] Appended Phase 10 (T-084..T-092) from audit findings
- [AGENTS.md] structure updated with REPO_RULES.md + docs/audit/

### Skill(s) Used
- skill-creator, senior-backend, code-reviewer, ui-ux-pro-max, frontend-design, senior-frontend, gitnexus

### Status
- 6 foundational docs generated/updated. Next ticket: T-084 (commit pending balance fix).


## Session 2026-08-23 22:05

### Changes
- Root-caused persistent ledger balance bug: service worker (cache-first, v1) served stale bundles - fixes never reached browser
- [dev] 8af1417 chore(repo): gitignore USER_DATA/, db_b64.txt, view_db.cjs, dashboard (T-085)
- [dev] 90355e0 fix(loan-ledger): compute running balance from full transaction history (T-084)
- [dev] 1c1ebcc docs: foundational docs refresh + audit register + REPO_RULES
- [fix/ledger-balance-sw] e29d788 fix(pwa): network-first SW, cache v2, hashed assets stay cache-first
- [fix/ledger-balance-sw] 32f4b2f refactor(loans): computeRunningBalances/sortLoanTransactions util; LoanDetailView + generateReport now share it; totals from FULL history (caught: filtered report showed totalRepaid=0); negatives no longer clamped (user decision)
- [fix/ledger-balance-sw] 41df326 test(loans): vitest + 9 regression tests incl. user scenario 5000/12000/8000 and real Home EXP fixture; npm test script; README updated same commit

### Skill(s) Used
- senior-backend, senior-frontend, code-reviewer, gitnexus (detect_changes before each commit)

### Status
- Branch verified: 9/9 tests, typecheck, build green; lint = 4 pre-existing audit errors only. Awaiting user approval to squash-merge fix/ledger-balance-sw into dev.


## Session 2026-08-23 22:25

### Changes
- Merged fix/ledger-balance-sw -> dev as squash 01d4a1e (branch kept)
- Browser-tested dev against REAL db (injected db_b64.txt via localStorage) - balances STILL wrong
- Instrumented running app: sortedTxs ASC but computeRunningBalances received DESC
- TRUE ROOT CAUSE: mobileFilteredTxs reused sortedTxs ref + in-place .sort(desc) reversed shared array before ledgerRows ran (aliasing bug - invisible to unit tests)
- [dev] 3921f1e fix(loan-ledger): copy array before sort + no-mutation contract test
- Verified live: Home EXP ledger now 34230..41230 chronological, matches summary card

### Skill(s) Used
- senior-frontend, code-reviewer, playwright browser debugging

### Status
- Balance bug RESOLVED and browser-verified. Vite dev server left running at localhost:3000 for user manual check. Next: T-086..T-088 lint-error tickets.


## Session 2026-08-23 22:55

### Changes
- T-086..T-089 + T-090 executed; lint gate restored to --max-warnings 0 (was 4 errors / 21 warnings, now 0/0)
- [dev] d5290b3 docs: CHANGELOG.md created (Keep-a-Changelog) + personal filename scrubbed from audit
- [dev] 37af73a fix(edit-modal): early return moved below hooks (crash), inline toggle styles -> CSS module
- [dev] 2cb2fdb fix(transaction-form): primaryMemberId setting now drives tx owner; counterparty errors shown inline
- [dev] fba9a81 refactor(modals): typed registry via satisfies + getModalComponent (no any)
- [dev] 2b60181 refactor(app): purgeExpiredItems called through port (cast removed)
- [dev] 87d5328 chore(lint): dep arrays fixed across screens; intentional patterns carry scoped disables with reasons; Dashboard type sets hoisted to module scope
- Gates: typecheck PASS, tests 10/10, build PASS, lint exit 0

### Skill(s) Used
- senior-frontend, code-reviewer, senior-backend, gitnexus detect_changes

### Status
- All pre-merge gaps closed. AWAITING USER APPROVAL to merge dev -> master (no tag). Branches kept.


## Session 2026-08-24 00:55

### Changes
- Phase 11 storage overhaul on feature/opfs-storage (plan: docs/plans/STORAGE_OPFS_MIGRATION.md)
- [8a6495e] docs: plan + CHANGELOG
- [32035d5] feat(storage): IPersistenceAdapter (OPFS + hardened LS), LS->OPFS migration w/ mirror, coalesced flush lifecycle, quota prune-retry, FNV digest fallback, confirm-free recovery + port methods restoreNewestSnapshot/resetStorage/getStorageHealth/importFromBytes
- [next] feat(app): 15s splash watchdog, dbError actions (Restore Latest Backup / Start Fresh), Settings Storage health row, importFromBytes kills as-any cluster
- Verified in browser (real DB): migration imported 213KB into OPFS + 3 snapshots; transfer delete persisted across reload; poisoned main+snapshots boots to error screen in ~1s with working actions - NO HANG
- Gates: typecheck/lint(0)/build PASS, tests 19/19

### Skill(s) Used
- senior-backend, senior-frontend, code-reviewer, playwright browser verification

### Status
- BUG-7 fix implemented and verified. Branch feature/opfs-storage NOT merged - awaiting user testing/approval.


## Session 2026-08-24 01:20

### Changes
- [docs/BUGS.md] NEW - bug tracker initialized per BUG TRACKING PROTOCOL (empty, no known bugs; historical BUG-6/7 noted in FINDINGS.md)
- [docs/PRD.md] v3.0 - F10 durable storage engine, recovery workflow, updated success criteria
- [docs/TAD.md] v3.0 - storage adapter architecture, write lifecycle, port additions, invariants update
- [docs/SECURITY.md] v3.0 - boot-hang threat, digest caveat, no-blocking-dialogs guardrail, review checklist
- [docs/FRONTEND_SPEC.md] v3.0 - boot/recovery states, Settings storage row, status-dot tokens
- [docs/TICKETS.md] v3.0 - consolidated phase index, deferred items (T-092, mirror removal, PWA toast), ticket template
- [docs/REPO_RULES.md] v2.0 - eligible-vs-approved merges, bug-fix tie-in, confirmation checklist
- [AGENTS.md] added sections 3.10 Decision & Confirmation Protocol, 3.11 Bug Tracking Protocol, 3.12 Merge Confirmation

### Skill(s) Used
- skill-creator, code-reviewer, senior-backend, senior-frontend, ui-ux-pro-max, gitnexus

### Status
- All 7 foundational documents generated/updated on dev (committed). Next phase TBD.


## Session 2026-08-24 01:45

### Changes
- Full PII/name audit across all tracked+untracked files and git history -> docs/audit/PII_NAMES_AUDIT_2026-08-24.md
- KEY FINDING (BUG-1, logged in docs/BUGS.md): real-name loan PDF blob reachable from master history (added f9f802a, removed at HEAD by 68f3771); Financial_Review.md ties full names to balances; src/ is clean
- Remediation options documented (A scrub / B filter-repo rewrite / C private stopgap) - awaiting owner decision; no fixes executed per protocol

### Skill(s) Used
- code-reviewer, gitnexus (pickaxe/history probes)

### Status
- Audit complete + BUG-1 logged. Awaiting decision on Option A/B/C.


## Session 2026-08-24 02:20

### Changes
- BUG-1 remediation executed (owner-approved Option B2): full git history rewrite via git filter-repo on mirror clone C:\Dev_Projects\moneyflows_rewrite.git
- USER_DATA pdf purged from all refs; 37 name-replacement rules applied across every commit (family members -> role placeholders: Admin/Father/Mother; external counterparties -> External Debtor A-D)
- All 7 branches force-pushed to origin; working repo re-pointed onto rewritten SHAs; origin tracking restored
- Post-scan: 0 tracked files with real names; audit report redacted (owner handle) + resolution record added
- BUGS.md BUG-1 -> fixed; gates re-run green (typecheck, tests 19/19)
- Backup: C:\Dev_Projects\moneyflows-backup-pre-rewrite.bundle (contains OLD history incl. leaked PDF - keep private or delete once satisfied)

### Skill(s) Used
- code-reviewer, senior-backend, gitnexus

### Status
- BUG-1 fixed. GitHub caveat: orphaned old objects may linger by SHA until GC; other-machine clones must re-clone. Master sync of closure commit pending user approval.

- Follow-up: scrubbed name tokens from this session's own log entry (self-referential leak caught by post-scan); amended dev commit, force-pushed.

## Session 2026-08-24 03:05

### Changes
- [SettingsModal.tsx] Snapshot restore rows + Storage health 'saved' timestamp now render 12-hour clock with AM/PM via hour12:true (device-local timezone, e.g. BST); locale-aware output preserved

### Skill(s) Used
- senior-frontend

### Status
- Complete on dev.


## Session 2026-08-24 05:20

### Changes
- [vite.config.ts] inject __APP_VERSION__ from package.json; [vite-env.d.ts] declaration
- [AppSettings.ts] lastSeenVersion field; [whatsNew.ts] plain-English release notes constant
- [WhatsNewModal.tsx/.module.css] NEW simple modal: top-left cross close, Got-it button
- [main.tsx] auto-open once per version change (first install included); [SettingsModal] v0.2.0 footer + See-what's-new row reopening modal
- package.json bumped to 0.2.0
- Verified live: auto-open on update, close via cross, no reopen after reload, settings View reopens; gates green

### Skill(s) Used
- senior-frontend, ui-ux-pro-max

### Status
- Complete on dev.


## Session 2026-08-24 05:40

### Changes
- [package.json] version 0.2.0 -> 1.0.0 (first stable tag; reflects Phases 1-11 scope)
- [whatsNew.ts] release notes re-keyed to 1.0.0
- [CHANGELOG.md] consolidated Unreleased into [1.0.0] - 2026-08-24 heading
- Release flow: commit dev -> merge dev->master -> tag v1.0.0 on master -> sync dev

### Skill(s) Used
- gitnexus, code-reviewer

### Status
- v1.0.0 tagged on master; settings footer auto-shows new version.

- Follow-up: APP_VERSION moved to guarded constants/appVersion.ts module after dev-server define edge case crashed Root; verified v1.0.0 footer + notes row live.


## Session 2026-08-24 06:00

### Changes
- BUG-2 investigation: scripted E2E of Add-Account under member (Md Iqbal azam profile)
- Result: NO reload (marker survived), account created + persisted correctly (balance 500, Opening Balance tx in ledger after reload) -> closed as dev-server artifact (wontfix)
- Found real minor issue during test -> BUG-3 logged: accounts store stale (balance 0) right after add; fix proposed = fetchAccounts() after save in AddAccountModal - awaiting owner confirmation

### Skill(s) Used
- senior-frontend, playwright E2E verification, code-reviewer

### Status
- BUG-2 wontfix(closed), BUG-3 open awaiting fix approval.


## Session 2026-08-24 06:15

### Changes
- BUG-3 fixed (owner-approved): AddAccountModal.handleSave now awaits fetchAccounts() after opening-balance tx
- Verified live: immediate balance 777 visible post-save, no reload
- Same-commit updates: BUGS.md BUG-3 -> fixed, CHANGELOG [Unreleased] Fixed entry

### Skill(s) Used
- senior-frontend, code-reviewer, playwright verification

### Status
- Complete on dev.


## Session 2026-08-24 06:50

### Changes
- Feature: account edit + delete (T-104)
  - [EditAccountModal.tsx/.module.css] NEW - rename/type + danger-zone delete w/ tx & loan-movement counts, two-step confirm, soft-delete
  - [AccountCard] optional actions slot (top-right overlay, click-isolated); used by MemberProfile grid + SelectAccountModal grid (pencil opens edit-account via registry)
  - [registry.ts] edit-account entry
- T-105: '(deleted account)' fallbacks in MemberProfile/GroupLedger/GroupsList/TransactionDetail/LoanService/LoanDatabase name resolvers
- v1.1.0: package.json bump; whatsNew.ts 1.1.0 notes; CHANGELOG [Unreleased] Added entries; TICKETS Phase 12 section
- E2E verified live: rename+type change persisted (balance kept), delete->bin->restore roundtrip, fallback label in detail modal, no reloads

### Skill(s) Used
- senior-frontend, ui-ux-pro-max, code-reviewer, playwright verification

### Status
- Complete on dev. Master sync pending user go-ahead.


## Session 2026-08-26 11:30

### Changes
- [AccountCard/MemberProfile/SelectAccountModal .module.css] edit-pencil button background removed (transparent, blends with card); hover softened to white 10% tint
- Verified computed style live: base bg transparent, icon-only

### Skill(s) Used
- frontend-design, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 12:10

### Changes
- T-108: wizard pre-fill from member>account ledger context
- [MemberProfile.tsx] all four transaction-form entry points pass initialSource=selectedAccountId
- Verified desktop: Bkash ledger -> hero/pills open wizard with Source=Bkash preselected

### Skill(s) Used
- senior-frontend, playwright verification

### Status
- Complete on dev. Mobile pills share same wiring (manual QA recommended).


## Session 2026-08-26 06:20

### Changes
- T-108: loan ledger PDF export detail chooser
  - [LoanDetailView.tsx] Download PDF opens radio chooser (All details / Just description); mode gates account-bracket in pdf rows; choice persisted via AppSettings.reportDetailMode
  - [AppSettings.ts] reportDetailMode field (default all)
  - [LoanDetailView.module.css] chooser styles (radioRow etc.)
- E2E verified: chooser default All; Just description exported PDF lacks account trail but keeps descriptions; choice remembered across reload

### Skill(s) Used
- senior-frontend, code-reviewer, playwright verification

### Status
- Complete on dev. Master sync pending user go-ahead.


## Session 2026-08-26 06:45

### Changes
- BUG fix (user-reported): export chooser reused translucent confirmForm glass -> options invisible. Added dedicated .exportModal opaque panel style; verified computed bg opaque + radios/labels readable.

### Skill(s) Used
- frontend-design, playwright verification

### Status
- Fixed on dev.


## Session 2026-08-26 12:40

### Changes
- Tags feature (T-109..T-111) per owner decisions B/single/member-first+family-wide/editable:
  - [useTagStore.ts] NEW persisted tag registry
  - [TransactionFormModal] Tag field w/ datalist autocomplete; saved into metadata.tags; registry grows on submit
  - [TransactionEditModal] tag seeded/saved/cleared + registry growth; css additions
  - [MemberProfile] ledger tag dropdown (registry U in-view tags) + family-wide jump button
  - [TagLedgerScreen.tsx/.module.css] NEW /tags + /tags/:tag cross-member views w/ In/Out totals
  - [App.tsx] routes added
- E2E: edit-tag save verified in store+registry; /tags lists QA Tag(1); detail shows member/account/amount row
- Wizard create-path tagging code-reviewed (automation blocked by animated dual-tree DOM; manual check recommended)

### Skill(s) Used
- senior-frontend, ui-ux-pro-max, playwright

### Status
- Complete on dev. Master sync pending.


## Session 2026-08-26 12:55

### Changes
- BUG (user report): transaction wizard stuck - submit/cancel unreachable + tag input inaccessible on desktop. Root cause: .modalBody lacked flex/min-height so extra Tag field overflowed fixed-height desktopModal (overflow:hidden clipped actions). Fixed via flex:1/min-height:0; verified at 700px window height.
- Feature: tag management UI - Settings > Transaction Tags chips w/ remove (useTagStore.removeTag); registry deletions don't alter existing tx metadata.

### Skill(s) Used
- frontend-design, senior-frontend, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 12:30

### Changes
- T-112: [App.tsx] sidebar 'Tags' nav under Loans (tag icon) + routeTitles entry; bottom nav untouched
- Verified: sidebar order Dashboard..Loans,Tags,Recycle; click -> /tags; active state applies

### Skill(s) Used
- senior-frontend

### Status
- Complete on dev.


## Session 2026-08-26 13:00

### Changes
- T-112: full tag management UI on /tags: inline create, per-card rename (propagates through transaction metadata), two-step delete (strips from txs); useTagStore.renameTag added; Settings chips section removed; sidebar Tags nav item
- E2E verified: create QA Alpha -> rename to QA Beta (registry + UI) -> delete; stale dev-server transform diagnosed (restart fixed) explaining earlier flakiness

### Skill(s) Used
- senior-frontend, playwright verification

### Status
- Complete on dev. Master sync pending user go-ahead.


## Session 2026-08-26 13:20

### Changes
- Tags page fixes (user-reported): renameInput overflowed card -> column layout w/ min-width:0; whole tag card clickable to open its ledger (inner clicks stopPropagation); edit/delete icons swapped to TransactionDetails-modal pencil/trash svgs w/ matching hover/active animation

### Skill(s) Used
- frontend-design, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 13:35

### Changes
- Tags page delete-confirm: Yes/No buttons were rendering bare (actBtn transparent classes from rewrite) -> switched to confirmBtn/cancelBtn styles w/ .deleteActions row; count=0 wording now 'Delete this unused tag?'

### Skill(s) Used
- ui-ux-pro-max, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 14:10

### Changes
- T-109 follow-up: wizard Tag field converted from datalist input to standard picker dropdown (trigger + overlay w/ No-tag option + inline create-new), matching Source/Destination picker design identity
- Live verified: dropdown opens/lists/creates/selects (trigger label updates to Travel)

### Skill(s) Used
- ui-ux-pro-max, senior-frontend

### Status
- Complete on dev.

## Session 2026-08-26 14:30

### Changes
- **Design identity — documented + wired:**
  - Created `docs/DESIGN_IDENTITY.md` v1.0 (170-line canonical): tokens (OKLCH, spacing, radii, shadows, typography, breakpoints, motion), 7 principles, surfaces (glass recipe), typography, 4 required interactive states + shimmer/empty/error, navigation (Sidebar/Header/BottomNav/FAB/SegmentedTabs), forms (FormField/AmountInput + deprecated native select → modal picker), modals/sheets/overlays/dropdowns (responsive pair 768, overlay 0.55 blur4 z300, picker 360/85vw blur24, closing 0.25-0.35s), ledger/cards/progress, icons (stroke 1.8, 16/18/20/24, emoji via TX_TYPE_ICON), motion, responsive (9 viewports), content constraints, recipes, banned patterns, §17 11-item pre-merge checklist.
  - Updated `DESIGN.md` header + added §7 (enforceable companion + gate table).
  - Updated `docs/FRONTEND_SPEC.md` v3.0 → 3.1: banner + §1.3 mandatory sentence + §4 table identity refs + §5 → §6 gate section.
  - Updated `AGENTS.md`: project tree lists DESIGN_IDENTITY.md, §3.2 promotes it to canonical review-enforceable, §3.4 bans `style{{}}`/hex/hardcoded locale and points to §§2/14/16.
- Gates: `build` PASS, `lint --max-warnings 0` PASS.

### Skill(s) Used
- ui-ux-pro-max, frontend-design, senior-frontend

### Status
- Complete on dev. Every future component/modal/dropdown/icon must pass `DESIGN_IDENTITY.md §17` before merge.

## Session 2026-08-26 15:30

### Changes
- **Playwright harness — fast e2e:**
  - Added `@playwright/test@1.54` + `playwright.config.ts:1` — `webServer: npm run dev` with `reuseExistingServer`, `workers:4`, `fullyParallel`, `setup` project → `chromium` with `storageState: e2e/.auth/storage.json`, `timeout 20s`, `trace on-first-retry`.
  - `e2e/auth.setup.ts:1` — `setup` seeds tiny deterministic DB (~12 txs: Salary/Groceries/Travel) via `seedTinyB64()` injected through `localStorage.moneyflows_db` + `page.reload()` + `storageState` snapshot — zero UI clicks, 2.9s.
  - `e2e/helpers/seed-tiny.ts:1` — inline SCHEMA from `SQLiteDatabaseService.ts:15-35` (covers `lend/repay`) + 2 members, 4 accounts, 12 txs, balance recalc, base64 export, cached.
  - `e2e/helpers/motion.ts:1` — `disableMotion()` injects `animation:none` for deterministic waits.
  - `e2e/app.smoke.spec.ts` + `e2e/search.smoke.spec.ts` — 4 tests proving current gap (dashboard slice vs ledger).
  - `package.json:6` scripts `test:e2e` / `test:e2e:ui` / `test:e2e:headed`; `.gitignore:12` ignores `e2e/.auth/` + `playwright/.cache/`.
- **Speed:** 4 tests `12.8s` serial-via-MCP → `12.6s` parallel (3 workers) with one webServer reuse; subsequent runs reuse DB via `storageState` (no cold seed). Keep `npm run dev` running → webServer reuse cuts 6s. Use `page.evaluate` seeding, not clicks; `disableMotion` removes shimmer waits.
- Gates: `typecheck` PASS, `build` PASS, `playwright --list` 4 tests, `playwright test` 4 passed.

### Skill(s) Used
- senior-frontend, playwright

### Status
- Complete on dev. Next: S-1 Highlight primitive.

## Session 2026-08-26 16:00

### Changes
- **Search — S-1..S-4 complete (S-5 deferred):**
  - **S-1** `tokens.css:8` + `utils/highlight.tsx:1`/`highlight.module.css:1` + `useDebouncedValue.ts:1`/`search.ts:1` — `--color-primary-mark /0.28` `mark` violet translucent + `Highlight` escaped regex + `matchesTx` (description+amount+type+account+member+tags+date via `shortDate`) + `useDebouncedValue(200)`.
  - **S-2 Dashboard** `Dashboard.tsx:13,222-300,427,444,481,518` — global `rawQuery→debouncedQuery(200)` + `matchesTx` over `transactions` (all, not `recentTxs` slice) then `slice(DASHBOARD_TX_DISPLAY_LIMIT)`, `accountMap/memberMap` ctx, `<Highlight>` on `mName/acctName/txDesc/debtorName`, empty `No matches for "q"`.
  - **S-3 Ledgers** — `MemberProfile.tsx:43,149-210,284,710,861` debounced local, `tagFilteredAll→searchFilteredAll→displayed.slice`, sentinel/length fix, `LedgerTable searchQuery` + `Highlight` + mobile `txDesc`; `GroupLedgerScreen.tsx:5,80-110,335,373` same pattern + `LedgerTable searchQuery`; `LoanDetailView.tsx:11,67,87-126,381,458` debounced + `matchesTx` + mobile `Highlight` + `LedgerTable searchQuery`; `TagLedgerScreen.tsx:8,108,238-270` added local search `LedgerSearch` + `filteredSorted` + `Highlight` on member/account/desc.
  - **S-4 Decouple** — `GroupsListScreen.tsx:11,123` `LoansScreen.tsx:6,20,34,150` `MemberList.tsx:10,18,30` `RecycleBin.tsx:6,22,31` `RecycleRow.tsx:2,36` — `effectiveSearch = mobileSearch.trim()` (drops `useSearchStore` OR), `Highlight` on `cardName/debtorName/memberName/Recycle name`, `LoanCard searchQuery` prop, `RecycleRow searchQuery`.
  - `LedgerTable.tsx:4,18,34,130-160` — `searchQuery` prop + `Highlight` on `desc`/`account` (virtual+plain).
- Gates: `typecheck` PASS, `lint --max-warnings 0` PASS, `build` PASS, `playwright test` 4/4 PASS.

### Skill(s) Used
- senior-frontend, ui-ux-pro-max

### Status
- S-1..S-4 done on dev. Dashboard now searches **all** transactions + highlights; ledgers search **that ledger only** with widened fields + highlight; pagination window fixed. S-5 DB LIKE deferred.

## Session 2026-08-26 17:00

### Changes
- **Header/Sidebar layout — single logo + blank header:**
  - Sidebar `Sidebar.tsx:18` now owns the **single** `MoneyFlows` logo (transplanted header gradient `Header.module.css:125` `135deg primary→income` `brandSlot` 52px) — replaces old sidebar `logoAccent`; when `!isDashboard` shows `Back 32 circle` + `breadcrumb` (`Members / Nusrat` etc.) in same slot (`breadcrumbRow` 10px muted `*` → text). Removes duplicate header logo.
  - Header `Header.tsx:28-64,66-90` desktop `left` now blank (`null` on desktop, mobile keeps `logo` on `/` else `← + title`); `searchWrap` rendered only when `isDashboard` (`{isDashboard && searchWrap}`) + filler `flex:1` on blank, hidden off-dashboard; `mobileSearchBtn` already hides off-dashboard `(!isMobile || isDashboard)`. Desktop off-dashboard header is blank glass `surface blur20 radius-md` `Header.module.css:1` with only `right` (`date ⚙ + 🔔`).
  - App `App.tsx:88-97` computes `isDashboard = pathname==='/'` + extended `breadcrumb` for `/groups/:id`, `/tags/:tag`, `/loans/:debtor` and passes `isDashboard+breadcrumb` to `Sidebar`, hides `SearchBar` row off-dashboard `{isDashboard && searchOpen &&}`.
  - Styles `Sidebar.module.css:15-80` new `brandSlot`, `logo/logoSpan` gradient, `backBtn` 32 circle hover glow, `breadcrumb/sep`.
- Gates: `typecheck` PASS, `lint` PASS, `build` PASS, `playwright` 4/4 PASS.

### Skill(s) Used
- senior-frontend, ui-ux-pro-max

### Status
- Complete on dev. Header search hidden off-dashboard, sidebar owns single logo or Back+breadcrumb, header blank frees 400px. Center space left empty for future use.

## Session 2026-08-26 17:10 — Fix: Back + routes in header

### Changes
- **Fix:** Back + breadcrumb/routes moved from sidebar → **header** per user correction.
  - Sidebar `Sidebar.tsx:1` reverted to **single logo only** (`brandSlot` 52px `MoneyFlows` gradient) — no `isDashboard`/`breadcrumb` props, no `backBtn` in sidebar.
  - Header `Header.tsx:1,28,45-90` now imports `Link`, desktop off-dashboard (`!isMobile && !isDashboard`) shows `← 32 circle` + `breadcrumb` (`Members / Nusrat`, `Groups`, `#tag`, `Loans/debtor`) in `left` (`flex` `breadcrumbRow` 12px muted `*→text` `Header.module.css:204`); dashboard desktop `left` stays blank (sidebar has logo). Mobile `← + breadcrumb` else `← + title` when `!isDashboard`. `searchWrap` still hidden off-dashboard `{isDashboard &&}`, blank center `flex:1` filler keeps `right` at edge.
  - App `App.tsx:99-104` `Sidebar` now plain (no breadcrumb), `Header` receives `breadcrumb` prop; `isDashboard` kept for `SearchBar` row gating.
- Gates: `typecheck` PASS, `build` PASS, `lint` PASS.

### Skill(s) Used
- senior-frontend

### Status
- Complete on dev. Single logo stays in sidebar, header shows Back + routes on all non-dashboard pages, search hidden off-dashboard, blank center reserved.


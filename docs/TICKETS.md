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

---

## Phase 7: Unified Loan System — Revamp (10 tickets)

**Note:** Tickets T-017 (LoanStack component), T-024 (Loan screen), and loan-related parts of T-029 (stores) are **superseded** by this phase. The new system replaces the old 4-type / 2-direction loan model with a unified `lend`/`repay` model and co-locates all loan code under `src/loans/`.

### T-051 — Scaffold `src/loans/` folder + move types + create public API
**Skill:** `senior-frontend`, `senior-backend`
**Effort:** M
**File(s):**
- NEW: `src/loans/domain/types.ts`
- NEW: `src/loans/index.ts`
- MOVE FROM: `src/core/domain/Loan.ts`
**Content:**
1. Create folder tree: `src/loans/domain/`, `src/loans/application/`, `src/loans/infrastructure/`, `src/loans/presentation/screens/`, `src/loans/presentation/components/`, `src/loans/presentation/stores/`
2. Copy `src/core/domain/Loan.ts` → `src/loans/domain/types.ts` and rewrite `Loan` class to a plain `Loan` interface with:
   - `lenderAccountId: string` (replaces `direction` + `counterpartyId`)
   - `borrowerAccountId: string` (replaces `direction` + `counterpartyId`)
   - `principal: number`
   - `outstanding: number`
   - `status: 'active' | 'settled'`
   - `description`, `metadata`, timestamps
3. Keep `LoanStack` and `LoanItem` interfaces in the same file
4. Create `src/loans/index.ts` exporting: `Loan`, `LoanStack`, `LoanItem` types
5. Keep old `src/core/domain/Loan.ts` for now (deleted in T-058)
**Acceptance:** TypeScript compiles; `src/loans/index.ts` exports all loan types; old `Loan.ts` unchanged.

### T-052 — Rewrite loan schema + database layer
**Skill:** `senior-backend`
**Effort:** L
**File(s):**
- NEW: `src/loans/infrastructure/LoanDatabase.ts`
- EDIT: `src/infrastructure/database/SQLiteDatabaseService.ts` (schema + migration + `applyBalanceChange`)
- EDIT: `src/core/ports/IDatabaseService.ts` (remove loan-specific methods)
**Content:**
1. **Schema change** in `SQLiteDatabaseService.ts`:
   - Replace the old `loans` table DDL with:
     ```sql
     CREATE TABLE IF NOT EXISTS loans (
       id                  TEXT PRIMARY KEY,
       lender_account_id   TEXT NOT NULL REFERENCES accounts(id),
       borrower_account_id TEXT NOT NULL REFERENCES accounts(id),
       principal           REAL NOT NULL CHECK(principal > 0),
       outstanding         REAL NOT NULL DEFAULT 0,
       status              TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'settled')),
       description         TEXT DEFAULT '',
       metadata            TEXT DEFAULT '{}',
       created_at          TEXT NOT NULL DEFAULT (datetime('now')),
       updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
       deleted_at          TEXT
     );
     CREATE INDEX IF NOT EXISTS idx_loans_lender ON loans(lender_account_id);
     CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_account_id);
     CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
     ```
   - Add `'lend'` and `'repay'` to the `transactions.type` CHECK constraint
   - Keep old types (`loan_issue`, `loan_repayment`, etc.) in CHECK for backward compat
2. **Update migration** (`_migrate` method): Add a v3→v4 step that drops old `counterparty_id` + `direction` columns if they exist and creates the new schema
3. **Update `applyBalanceChange`**: Add handling for `'lend'` (deduct source, add dest) and `'repay'` (deduct source, add dest — same as transfer behavior)
4. **Create `src/loans/infrastructure/LoanDatabase.ts`** with methods:
   - `saveLoan(loan: Loan): Promise<void>`
   - `getLoanById(id: string): Promise<Loan | null>`
   - `getLoansByBorrower(borrowerAccountId: string): Promise<Loan[]>`
   - `getLoansByLender(lenderAccountId: string): Promise<Loan[]>`
   - `getLoanStacks(): Promise<LoanStack[]>` — groups by `borrower_account_id`
   - `getLoanStackByBorrower(borrowerId: string): Promise<LoanStack | null>`
   - `softDeleteLoan(id: string): Promise<void>`
   - Uses `getDatabase()` to access the shared SQLite instance; does NOT go through `IDatabaseService`
5. **Remove loan-specific methods** from `IDatabaseService` port interface (`getLoanStacks`, `getLoanStackByDebtor`, `getLoans`, `getLoansByCounterparty`, `getLoanById`, `saveLoan`, `softDeleteLoan`)
6. **Remove loan-specific methods** from `SQLiteDatabaseService` implementation
**Acceptance:** New `loans` table created on app start; `LoanDatabase.ts` has all CRUD methods; `SQLiteDatabaseService.ts` no longer has loan-specific methods.

### T-053 — Rewrite `LoanService.ts` — unified core logic
**Skill:** `senior-backend`
**Effort:** L
**File(s):**
- NEW: `src/loans/application/LoanService.ts` (replaces `src/core/application/LoanService.ts`)
**Content:**
Write a new `LoanService` class with these methods:

```typescript
class LoanService {
  constructor(
    private db: IDatabaseService,
    private loanDb: LoanDatabase,
  ) {}

  async createLoan(params: {
    lenderAccountId: string;    // any account in the system
    borrowerAccountId: string;  // any account (auto-create counterparty if needed)
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<{ loan: Loan; tx: Transaction }>

  async recordRepayment(params: {
    loanId: string;             // REQUIRED — always links to a specific loan
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<{ tx: Transaction }>

  async getLoanById(id: string): Promise<Loan | null>
  async getLoansByBorrower(borrowerAccountId: string): Promise<Loan[]>
  async getLoanStacks(): Promise<LoanStack[]>
  async createCounterparty(name: string): Promise<Account>
  async settleLoan(loanId: string): Promise<void>
  async deleteLoan(loanId: string): Promise<void>
}
```

**Rules enforced in `recordRepayment`:**
- `loanId` is required (throws if empty/undefined)
- Loads the loan, throws if not found or already `settled`
- Creates a `'repay'` transaction with `source=borrower_account_id`, `dest=lender_account_id`, `loanRef=loan.id`
- Updates `loan.outstanding -= amount`
- If `outstanding <= 0`: sets to 0 and status to `'settled'`
- Saves loan + transaction

**Rules enforced in `createLoan`:**
- Creates a `'lend'` transaction with `source=lender_account_id`, `dest=borrower_account_id`, `loanRef=loan.id`
- Initializes `outstanding = principal`
- If `borrowerAccountId` doesn't exist, calls `createCounterparty` first

**Database calls:**
- Uses `IDatabaseService` for generic operations (saveTransaction, saveAccount)
- Uses `LoanDatabase` for loan-specific operations
**Acceptance:** All 7 methods work correctly; `recordRepayment` never accepts empty `loanId`; recalculation touches exactly one loan.

### T-054 — Rewrite `useLoanStore.ts` to match new service API
**Skill:** `senior-frontend`
**Effort:** M
**File(s):**
- NEW: `src/loans/presentation/stores/useLoanStore.ts` (replaces `src/presentation/stores/useLoanStore.ts`)
**Content:**
Rewrite the Zustand store to match the new `LoanService` API:

```typescript
interface LoanState {
  loanStacks: LoanStack[];
  loading: boolean;
  error: string | null;

  fetchLoanStacks: () => Promise<void>;

  createLoan(params: {
    lenderAccountId: string;
    borrowerAccountId: string;
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<void>;

  recordRepayment(params: {
    loanId: string;
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<void>;

  createCounterparty(name: string): Promise<{ accountId: string }>;
  settleLoan(loanId: string): Promise<void>;
  deleteLoan(loanId: string): Promise<void>;
}
```

After each mutation action, refresh: `loanStacks`, transactions (via `useTransactionStore`), and accounts (via `useAccountStore`).
**Acceptance:** Store compiles and exposes all new actions; old actions (`createGivenLoan`, `createReceivedLoan`, `recordPayback`) are removed; auto-refresh works after mutations.

### T-055 — Build unified `LoanForm.tsx` + `AddCounterparty.tsx` components
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** L
**File(s):**
- NEW: `src/loans/presentation/components/LoanForm.tsx`
- NEW: `src/loans/presentation/components/LoanForm.module.css`
- NEW: `src/loans/presentation/components/AddCounterparty.tsx`
- NEW: `src/loans/presentation/components/AddCounterparty.module.css`
- DELETE: `src/presentation/components/LoanFormSection.tsx`
- DELETE: `src/presentation/components/LoanFormSection.module.css`
**Content:**

**`LoanForm.tsx`:**
```
┌──────────────────────────────────────┐
│         Loan Action                  │
├──────────────────────────────────────┤
│  ○ Lend money   ○ Record repayment  │  ← Segmented toggle
│                                     │
│  From account:  [▼ Select account]  │  ← Lists ALL accounts (member + counterparty)
│                                     │
│  To account:    [▼ Select account]  │  ← Lists ALL accounts + "Create new..."
│                                     │
│  Amount:        [______________]    │  ← Numpad input
│  Description:   [______________]    │
│  Date:          [____-__-__]        │
│                                     │
│  [Confirm]                           │
└──────────────────────────────────────┘
```

- Props: `initialAction?: 'lend' | 'repay'`, `initialLenderAccountId?: string`, `initialBorrowerAccountId?: string`, `onClose: () => void`
- Reads all accounts from `useAccountStore`, filters active ones
- "Create new..." option opens `AddCounterparty.tsx` inline
- When `action === 'repay'` and borrower is selected, shows a dropdown of their active loans to pick which one to repay
- On submit: calls `useLoanStore.createLoan()` or `useLoanStore.recordRepayment()`
- Extracted from the loan tab of `TransactionFormModal.tsx` (which will be simplified in T-057)

**`AddCounterparty.tsx`:**
- Inline form: name input + [Create] button
- Calls `useLoanStore.createCounterparty(name)`
- Auto-selects the new counterparty after creation
**Acceptance:** LoanForm creates loans/repayments correctly; "Create new" adds counterparty on the fly; UI matches the spec above.

### T-056 — Rewrite `LoansScreen.tsx` + `LoanDetailView.tsx` to use unified components
**Skill:** `ui-ux-pro-max`, `senior-frontend`
**Effort:** L
**File(s):**
- NEW: `src/loans/presentation/screens/LoansScreen.tsx`
- NEW: `src/loans/presentation/screens/LoansScreen.module.css`
- NEW: `src/loans/presentation/components/LoanDetailView.tsx`
- NEW: `src/loans/presentation/components/LoanDetailView.module.css`
- NEW: `src/loans/presentation/components/LoanCard.tsx`
- NEW: `src/loans/presentation/components/LoanCard.module.css`
- DELETE: `src/presentation/screens/Loans.tsx`
- DELETE: `src/presentation/screens/Loans.module.css`
- DELETE: `src/presentation/components/LoanStack.tsx`
- DELETE: `src/presentation/components/LoanStack.module.css`
**Content:**

**`LoansScreen.tsx`** (replaces the main Loans page):
- Route: `/loans` — list view
- Filter strip: Active / Settled / All / Debtors / Creditors / Internal
- Renders `LoanCard` grid (same card UX as current, but unified for all account types)
- "Add" button opens `LoanForm` in lend mode
- Click card navigates to `/loans/:borrowerId`
- Imports `useLoanStore` from `src/loans/presentation/stores/`
- Uses `formatAmount` from shared utils, `shortDate` from constants

**`LoanDetailView.tsx`** (replaces the detail section in current Loans.tsx):
- Route: `/loans/:borrowerId`
- Shows borrower summary: name, type badge, total outstanding, progress bar
- Action buttons: "Lend More" / "Repay" / "Deactivate" / "Delete"
- "Repay" opens `LoanForm` in repayment mode with borrower/lender pre-filled
- Transaction ledger via `LedgerTable` with simplified logic:
  - `isDebit = type === 'lend'`, `isCredit = type === 'repay'`
  - Labels: "Lent" / "Repayment" (same for internal and external)
- Clicking a ledger row opens `TransactionDetailModal`

**`LoanCard.tsx`** (replaces the card in current Loans.tsx):
- Same visual card as current, works for any account type
- Shows: avatar initial, name, type badge (Debtor/Creditor/Internal), total outstanding, progress percent, active/settled counts
- `stackType` detection: if borrower account is `type === 'counterparty'` → 'debtor' or 'creditor' (from metadata), otherwise 'internal'
- Routing: navigates to `/loans/:borrowerId`

**Unified ledger labels** — add to `src/loans/presentation/constants.ts`:
```typescript
export const TX_TYPE_ICON: Record<string, string> = {
  lend: '💸',
  repay: '💵',
};
export const TX_DISPLAY_LABEL: Record<string, string> = {
  lend: 'Lent',
  repay: 'Repayment',
};
```
**Acceptance:** Loan list loads from new schema; loan detail shows correct ledger; cards, detail view, and ledger work for ALL account types (internal, debtor, creditor).

### T-057 — Update `TransactionDetailModal.tsx` + simplify `TransactionFormModal.tsx`
**Skill:** `senior-frontend`
**Effort:** M
**File(s):**
- EDIT: `src/presentation/modals/TransactionDetailModal.tsx`
- EDIT: `src/presentation/modals/TransactionFormModal.tsx`
**Content:**

**`TransactionDetailModal.tsx` changes:**
- For `'lend'` type: suppress "From Account" / "To Account" rows
  - Show "Lender: [account name] – [member name]" (from `sourceAccount`)
  - Show "Borrower: [account name] – [member name]" (from `destAccount`)
  - If account is a counterparty, append "(Debtor)" or "(Creditor)" badge
- For `'repay'` type:
  - Show "Payer: [account name] – [member name]" (from `sourceAccount` = borrower)
  - Show "Recipient: [account name] – [member name]" (from `destAccount` = lender)
- For old types (`loan_issue`, `loan_repayment`, etc.): keep existing resolution logic for backward compat
- Remove the current "Debtor" / "Creditor" section (lines 114-153) — replaced by the explicit Lender/Borrower/Payer/Recipient rows above
- Remove the dead-code check at line 128-129 (`const isLoanType = ...; if (!isLoanType) return null;`)

**`TransactionFormModal.tsx` changes:**
- Remove the entire `loan` tab (loan-related code at lines 309-356)
- Remove the `loanMode`, `loanTargetType`, `internalAction`, `debtor` state variables
- Remove `LoanFormSection` import and usage
- Replace with a single button/link: "Create or repay a loan →" that opens the new `LoanForm` modal
- Alternatively, keep the loan tab but delegate to the new `LoanForm` component inside it
**Acceptance:** TransactionDetailModal shows "Lender"/"Borrower" for lend and "Payer"/"Recipient" for repay; TransactionFormModal no longer has loan-specific logic (delegated to LoanForm).

### T-058 — Update routing, Dashboard, MemberProfile, and cross-references
**Skill:** `senior-frontend`
**Effort:** M
**File(s):**
- EDIT: `src/App.tsx` — update imports and routes
- EDIT: `src/presentation/screens/Dashboard.tsx` — update loan import
- EDIT: `src/presentation/screens/MemberProfile.tsx` — update loan ledger logic
- EDIT: `src/presentation/constants/labels.ts` — remove loan-specific entries
- EDIT: `src/presentation/stores/useTransactionStore.ts` — update loan type references
**Content:**
1. **`App.tsx`**: Change route imports from `./presentation/screens/Loans` to `./loans/presentation/screens/LoansScreen`. Keep route paths the same (`/loans`, `/loans/:debtorId` → now `/loans/:borrowerId`)
2. **`Dashboard.tsx`**: Update `useLoanStore` import to `src/loans/presentation/stores/useLoanStore`. The `activeLoans` metric already reads from `loanStacks` which still works.
3. **`MemberProfile.tsx`**: Update loan transaction type references. Old code may reference `'loan_issue'` or `'loan_repayment'` — add `'lend'` and `'repay'` alongside them for now.
4. **`labels.ts`**: Remove `TX_TYPE_ICON` and `TX_DISPLAY_LABEL` entries for `loan_issue`, `loan_repayment`, `loan_received`, `loan_paidback`. These now live in `src/loans/presentation/constants.ts`. Keep old entries if the old transaction types still exist in the DB (for backward compat in TransactionDetailModal).
5. **`useTransactionStore.ts`**: Update any loan-type-specific filtering to include new types.
**Acceptance:** All imports resolve; Dashboard shows correct loan metrics; navigation to `/loans` and `/loans/:borrowerId` works; labels display correctly.

### T-059 — Delete all old loan code and obsolete files
**Skill:** `senior-frontend`, `senior-backend`
**Effort:** S
**File(s) to DELETE:**
- `src/core/domain/Loan.ts` — replaced by `src/loans/domain/types.ts`
- `src/core/application/LoanService.ts` — replaced by `src/loans/application/LoanService.ts`
- `src/presentation/stores/useLoanStore.ts` — replaced by `src/loans/presentation/stores/useLoanStore.ts`
- `src/presentation/screens/Loans.tsx` — replaced by `src/loans/presentation/screens/LoansScreen.tsx`
- `src/presentation/screens/Loans.module.css` — replaced
- `src/presentation/components/LoanStack.tsx` — replaced by LoanCard + LoanDetailView
- `src/presentation/components/LoanStack.module.css` — replaced
- `src/presentation/components/LoanFormSection.tsx` — replaced by LoanForm
- `src/presentation/components/LoanFormSection.module.css` — replaced
- Remove old loan entries from `src/presentation/constants/labels.ts` (`TX_TYPE_ICON`, `displayTxType` for loan types, `ACCOUNT_TYPE_GRADIENT_THREE.counterparty` etc.)
**Content:**
1. Delete each file listed above
2. Run `npm run build` and fix any import errors
3. Run `npm run lint` and fix any lint warnings
4. Update `src/loans/index.ts` if any exports are missing that consumers still need
**Acceptance:** `npm run build` succeeds; `npm run lint` passes; all loan functionality works (create, repay, list, detail, detail modal, dashboard metric).
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

---

## Phase 8: Data Backup & Safety (5 tickets)

**Overview:** Three-layer data protection — ring buffer snapshots with integrity hashes (localStorage) + silent export to a user-picked cloud-synced folder (File System Access API). Covers logical corruption, bit rot, and physical/browser data loss.

### T-060 — Ring buffer auto-backup in `save()`
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts`, `src/core/ports/IDatabaseService.ts`
**Content:**
1. Inside `save()`, after the live DB write, check a cooldown timer (5 min default, tracked via in-memory `lastSnapshotTime`)
2. If cooldown elapsed: `db.export()` → Uint8Array → base64 string
3. Compute SHA-256 hash of the base64 string via `crypto.subtle.digest('SHA-256', ...)`
4. Build snapshot object: `{ data: "<base64>", time: "<ISO>", hash: "<hex>" }`
5. Store at `localStorage` key `moneyflows_snap_0` (newest), shift existing slots down (`moneyflows_snap_i → moneyflows_snap_{i+1}`), delete overflow
6. Max 10 slots, configurable via constant `MAX_SNAPSHOTS`
7. Handle `QuotaExceededError` by deleting oldest snapshot and retrying once
8. Add to `IDatabaseService` interface:
   ```ts
   getSnapshots(): { time: string; hash: string }[];
   restoreSnapshot(index: number): Promise<void>;
   ```
9. `restoreSnapshot(i)`: read slot → verify SHA-256 hash → fail with error if mismatch → overwrite `moneyflows_db` → `location.reload()`
**Acceptance:** 10 rotating snapshots created in localStorage after writes; snapshots have timestamps; hash verification catches corruption; restore replaces live DB and reloads; quota errors handled gracefully.

### T-061 — Restore Points UI in SettingsModal
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/presentation/components/SettingsModal.tsx`, `SettingsModal.module.css`
**Content:**
1. Add a "Restore Points" section in Settings after the existing fields, below a separator
2. Call `getDatabase().getSnapshots()` on mount to list available snapshots
3. Render each snapshot as a row:
   ```
   ● Today 14:30 — Auto-backup     [Restore]
   ● Today 09:15 — Auto-backup     [Restore]
   ● Jul 3 18:00 — Auto-backup     [Restore]
   ```
4. "Restore" button opens confirmation dialog: *"Replace all current data with the snapshot from [time]?"*
5. On confirm: `await getDatabase().restoreSnapshot(i)` → `window.location.reload()`
6. If restore throws (hash mismatch): show error toast/snackbar
7. Empty state: "No backup snapshots found" when list is empty
8. Styles: `.snapshotRow` with timestamp + status dot + restore button, matching glassmorphism theme
**Acceptance:** Snapshots list with timestamps; restore works with confirmation; error state shown on corruption; empty state when no snapshots exist.

### T-062 — Add integrity hash to snapshot metadata
**Skill:** `senior-backend`
**Effort:** S
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts`
**Content:**
1. SHA-256 helper function using Web Crypto API:
   ```ts
   async function sha256(str: string): Promise<string> {
     const enc = new TextEncoder().encode(str);
     const buf = await crypto.subtle.digest('SHA-256', enc);
     return Array.from(new Uint8Array(buf))
       .map(b => b.toString(16).padStart(2, '0')).join('');
   }
   ```
2. Hash computed on snapshot creation and stored in snapshot object
3. On `restoreSnapshot()`: recompute hash of `snapshot.data`, compare
   - Match → proceed with restore
   - Mismatch → auto-skip to previous snapshot, report which slot was corrupted
4. If ALL snapshots corrupted: throw with clear error for UI display
**Acceptance:** Hash computed and verified; corrupted snapshot auto-skipped; UI gets actionable error.

### T-063 — Build `FolderSync.ts` for File System Access API
**Skill:** `senior-backend`
**Effort:** L
**File(s):** NEW: `src/infrastructure/database/FolderSync.ts`
**Content:**
Create a standalone module with the following API:

```ts
interface IFolderSync {
  setFolder(handle: FileSystemDirectoryHandle): Promise<void>;
  getFolderHandle(): Promise<FileSystemDirectoryHandle | null>;
  sync(data: Uint8Array): Promise<void>;
  load(): Promise<Uint8Array | null>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  clearHandle(): Promise<void>;
}
```

Implementation details:
1. **Handle persistence:** `FileSystemDirectoryHandle` serialized to IndexedDB (not serializable to localStorage). Use a simple IndexedDB wrapper with key `moneyflows_folder_handle`.
2. **`sync()`:**
   - Create/get `MoneyFlows/` subdirectory inside the picked folder
   - Write `moneyflows.tmp` first (atomic write pattern)
   - Rename to `moneyflows.db` by writing final content
   - Remove `.tmp` file
   - Silently catch all errors (never block the caller)
3. **`load()`:**
   - Read `MoneyFlows/moneyflows.db` from the folder handle
   - Return as `Uint8Array` or `null` if not found
4. **`hasPermission()`:** Check `handle.queryPermission()` — return boolean
5. **`requestPermission()`:** Call `handle.requestPermission()` with `'readwrite'` mode
6. **`clearHandle()`:** Remove IndexedDB entry — used when user wants to unpick the folder
7. **Feature detection:** Export `isFsaSupported: boolean` (checks for `'showDirectoryPicker' in window`)
**Acceptance:** Module compiles; `sync()` writes to folder via atomic rename; `load()` reads back; permission checks work; `clearHandle()` removes the stored handle; `isFsaSupported` correctly reflects browser support.

### T-064 — Wire FolderSync into `save()` + add Settings UI
**Skill:** `senior-frontend`, `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts`, `src/presentation/components/SettingsModal.tsx`, `SettingsModal.module.css`
**Content:**

**Part A — Wire into `save()`:**
1. In `SQLiteDatabaseService`, import `FolderSync` module and create a singleton instance
2. In `save()`, after ring buffer snapshot logic, call:
   ```ts
   if (folderSync.hasPermission()) {
     folderSync.sync(this.db.export()).catch(() => {});
   }
   ```
3. Throttle with separate cooldown (2 min, independent of ring buffer)
4. Never throw/block if sync fails — logged to console only

**Part B — Settings UI:**
1. Add "Cloud Backup" section after Restore Points, with feature detection:
   - If `!isFsaSupported`: show "Cloud backup requires Chrome or Edge" message
   - If supported and no folder set: show **"Choose backup folder"** button
   - If folder set and has permission: show ✅ "Backing up to [folder name]" + **"Change folder"** / **"Stop backup"** buttons
   - If permission revoked: show ⚠️ "Permission needed — click to re-authorize"
2. "Restore from Drive" button: calls `folderSync.load()` → if data exists, confirmation dialog → overwrite live DB → reload
3. Styles: status indicators, icon + text layout, glassmorphism buttons

**Acceptance:** sync fires after writes; Settings shows correct status; folder picker works; restore from Drive works; Firefox/Safari show fallback message; permission changes handled gracefully.


# MoneyFlows — Project Plan

## Phase 0: Foundation (Week 1)

### 0.1 Project Scaffolding
- [x] Create Vite + React project
- [x] Install dependencies: zustand, better-sqlite3, uuid, date-fns
- [x] Configure TypeScript, ESLint, Prettier
- [x] Set up folder structure (clean architecture layers)
- [ ] Configure build tooling & dev server

### 0.2 Design Tokens & CSS Architecture
- [x] Extract tokens from design handoff (../DESIGN_FILES/brand-spec.md) — DONE via DESIGN.md
- [ ] Create `tokens.css` with CSS custom properties
- [ ] Create `glassmorphism.css` utility classes
- [ ] Create `typography.css` with font imports (Outfit, JetBrains Mono)
- [ ] Create `reset.css` / normalize
- [ ] Set up responsive breakpoint mixins (360–1920px matrix)

### 0.3 Database Schema
- [ ] Implement SQLite DDL from System_Design.md
  - [ ] `members` table (with soft-delete, is_external flag, metadata JSON)
  - [ ] `accounts` table (FK → members, type enum, metadata JSON)
  - [ ] `transactions` table (FK → accounts, members; type enum; metadata JSON)
  - [ ] `account_groups` table
  - [ ] `account_group_mappings` table (M:N)
- [ ] Create indexes on date, debtor, source, destination
- [ ] Write seed/migration script from Money Flows.xlsx data

### 0.4 Data Access Layer
- [ ] Define `IDatabaseService` TypeScript interface
- [ ] Implement `SQLiteDatabaseService` class
- [ ] Implement repository methods: `getMembers`, `getAccounts`, `getTransactions`, `getLoans`, `saveTransaction`, `softDelete`, `restore`, `purge`
- [ ] Write unit tests for data layer

---

## Phase 1: Core UI Components (Week 2)

### 1.1 Shared Component Library
Build reusable components from the design system:

| Component | Source Screen | Props |
|-----------|--------------|-------|
| `GlassPanel` | All | `glow?`, `padding?`, `onClick?` |
| `Avatar` | Dashboard, Member | `member`, `size`, `active`, `onClick` |
| `MetricCard` | Dashboard | `label`, `value`, `change`, `accent` |
| `AccountRow` | Dashboard | `account`, `balance`, `onClick` |
| `TransactionRow` | Dashboard, Member | `transaction`, `type` |
| `LedgerTable` | Member | `rows`, `filters`, `onFilterChange` |
| `AccountCard` | Member | `account`, `balance` (credit-card style) |
| `QuickActionCard` | Member | `icon`, `title`, `subtitle`, `onClick` |
| `LoanStack` | Loans | `stack`, `expanded`, `onToggle` |
| `ProgressBar` | Loans | `percent`, `color`, `size` |
| `SegmentedTabs` | Transaction | `tabs`, `active`, `onChange` |
| `FormField` | Transaction | `label`, `type`, `value`, `onChange` |
| `Numpad` | Transaction (mobile) | `onInput`, `onBackspace` |
| `BottomSheet` | Transaction (mobile) | `open`, `onClose`, `children` |
| `Modal` | Transaction (desktop) | `open`, `onClose`, `children` |
| `TabBar` | Recycle | `tabs`, `active`, `counts` |
| `RecycleRow` | Recycle | `item`, `onRestore`, `onDelete` |

### 1.2 Navigation System
- [ ] Desktop sidebar (220–240px, hidden ≤768px)
- [ ] Mobile bottom nav (4 tabs)
- [ ] Header bar with back button, logo, date, notifications
- [ ] Breadcrumb component (desktop member view)
- [ ] Route definitions (React Router)

---

## Phase 2: Screen Implementation (Week 3)

### 2.1 Launcher / Overview
- [ ] Hero section with logo + tagline
- [ ] 3-column responsive glass card grid
- [ ] Badge variants (desktop, mobile, overlay)
- [ ] Links to each screen file

### 2.2 Dashboard (`/`)
- [ ] Header with profile avatars (E, A, N) + active state ring
- [ ] 4 metric cards (Total Assets, Cash in Hand, Active Loans, Net Worth)
- [ ] Quick action buttons (New Transaction, Transfer, Reports, Settings)
- [ ] Combined Balances panel (5 accounts with bank-specific icons)
- [ ] Recent Transactions panel (scrollable feed, color-coded)
- [ ] Responsive: 4→2→1 col metrics, 2-col→1-col content

### 2.3 Member Profile (`/member/:id`)

**Mobile** (screen-2-member):
- [ ] Status bar + profile header with back
- [ ] Profile card (avatar, name, tag, balance)
- [ ] Account cards carousel (horizontal scroll, snap, dots indicator)
- [ ] Carousel scroll-sync with active dot
- [ ] Account ledger table (compact, scrollable)

**Desktop** (screen-2-member-desktop):
- [ ] Sidebar with nav items + active indicators
- [ ] Top bar with breadcrumb + actions
- [ ] Profile hero (72px avatar, name, meta chips, stat items)
- [ ] Quick action strip (Add Income, Log Expense, Transfer Money)
- [ ] Account cards grid (3-col, gradient backgrounds, gold chip)
- [ ] Split content: Ledger (left) + Side panel (right)
- [ ] Side panel: Spending breakdown, Monthly budget bars, Savings goals
- [ ] Ledger filter tabs (All, Income, Expenses, Transfers)
- [ ] Responsive: sidebar hidden ≤768, 1-col cards, stacked layout

### 2.4 Loan Receivables (`/loans/:debtorId`)
- [ ] Summary card: debtor name, badge, total outstanding, progress bar
- [ ] Progress bar: teal gradient, gloss effect, animated width
- [ ] Loan stacks accordion (single-open behavior)
- [ ] Stack header: icon + fund source + total + count + chevron
- [ ] Stack body: ledger-like rows with status pills (Active/On Track)
- [ ] Responsive: summary stacks on mobile, hidden date/status columns

### 2.5 Transaction Wizard

**Mobile** (screen-4-transaction):
- [ ] Background content with blur + overlay
- [ ] Bottom sheet (slide-up animation, handle bar, 92vh max)
- [ ] Segmented tabs (Income, Expense, Transfer, Loan)
- [ ] Amount field with BDT prefix + large mono input
- [ ] Dynamic form fields based on active tab
- [ ] Numeric keypad (3×4 grid, Indian comma formatting)
- [ ] Submit button (violet gradient)

**Desktop** (screen-4-transaction-desktop):
- [ ] Sidebar + top bar + centered modal (520px)
- [ ] Fade-in animation (0.25s ease-out)
- [ ] Same segmented tabs + form
- [ ] Side-by-side Source/Destination selects (form-row)
- [ ] Cancel + Save buttons

### 2.6 Recycle Bin (`/recycle`)
- [ ] Header with logo, Refresh button, Empty Bin (danger pill)
- [ ] Stats bar (items count, total amount, days until auto-purge)
- [ ] Tabs (All Items, Transactions, Accounts) with count badges
- [ ] Item list: icon + name/meta + amount + date + actions
- [ ] Restore action: confirm → fade out → remove
- [ ] Delete action: confirm → fade out → remove
- [ ] Responsive: hidden amount column at ≤800px

---

## Phase 3: Data Integration (Week 4)

### 3.1 State Management (Zustand)
- [ ] `useAuthStore` — active user/profile
- [ ] `useMemberStore` — members list, CRUD, active member
- [ ] `useAccountStore` — accounts by member, balances
- [ ] `useTransactionStore` — transactions, filters, pagination
- [ ] `useLoanStore` — loan stacks, debtors, repayment tracking
- [ ] `useRecycleStore` — deleted items, restore, purge
- [ ] Optimistic update patterns for all mutations

### 3.2 Database Seeding
- [ ] Import all members from spreadsheet
- [ ] Import all accounts with correct balances
- [ ] Import all transactions (500+ entries across 7 sheets)
- [ ] Import loan data with debtor linkages
- [ ] Verify balances match Financial_Review.md audit
- [ ] Fix known discrepancies:
  - [ ] Add Prime Savings (34,000 BDT) to Efty's assets
  - [ ] Fix Master Ledger typo (5,000 → 8,000 BDT on 2026-06-23)

### 3.3 Wire Up Screens
- [ ] Dashboard reads from Zustand → DB service
- [ ] Member profile loads member accounts + ledger
- [ ] Loans screen queries loan stacks by debtor
- [ ] Transaction wizard creates records with double-entry logic
- [ ] Recycle bin queries soft-deleted items, handles restore/purge

---

## Phase 4: Interactions & Polish (Week 5)

### 4.1 Motion System
- [ ] Route transitions (slide right/left, scale)
- [ ] Slide-over detail drawer (300ms, staggered internals)
- [ ] Optimistic balance updates with number ticker animation
- [ ] Hover scale (1.02) on cards
- [ ] Progress bar animation on repayment (600ms)
- [ ] Recycle bin item slide-out + list reflow
- [ ] Modal/sheet entry/exit animations

### 4.2 Interactive States Audit
- [ ] All hover states verified (glass cards → violet glow, rows → light bg)
- [ ] All focus states verified (inputs → violet ring)
- [ ] All active/pressed states verified (numpad → light bg)
- [ ] Disabled states for buttons/inputs
- [ ] Loading states (skeleton shimmer on glass panels)
- [ ] Empty states (no transactions, no deleted items)
- [ ] Error states (DB failure, validation errors)

### 4.3 Form Validation
- [ ] Amount: required, numeric, positive
- [ ] Source/Destination: required for transfer, must differ
- [ ] Description: required, max length
- [ ] Date: valid date, not in future
- [ ] Tab-specific validation (loan: debtor required, income: source optional)

---

## Phase 5: QA & Release (Week 6)

### 5.1 Responsive Testing
Test and fix at all 9 viewports:
- [ ] 360×800 (mobile compact)
- [ ] 390×844 (mobile standard)
- [ ] 430×932 (mobile large)
- [ ] 600×960 (foldable)
- [ ] 820×1180 (tablet portrait)
- [ ] 1024×768 (tablet landscape)
- [ ] 1366×768 (laptop)
- [ ] 1440×900 (desktop)
- [ ] 1920×1080 (wide)

No horizontal overflow, no layout breakage, all interactive elements reachable.

### 5.2 Visual Fidelity Check
- [ ] Screenshot comparison against ../DESIGN_FILES HTML mockups
- [ ] Token accuracy (colors, typography, spacing, radius, shadows)
- [ ] Glassmorphism consistency across all panels

### 5.3 Performance
- [ ] Bundle size audit (code-split routes)
- [ ] Scroll performance on ledger tables (virtualize if >100 rows)
- [ ] DB query optimization (verify index usage)
- [ ] Animation frame rates (60fps on standard hardware)

### 5.4 Release
- [ ] Build for production
- [ ] Package as standalone app (Tauri or Electron? — decision needed)
- [ ] Write user guide
- [ ] Deploy for family testing

---

## Architecture Reference

```
src/
├── core/                    # Clean Architecture layers
│   ├── domain/              # Entities, value objects
│   │   ├── Member.ts
│   │   ├── Account.ts
│   │   ├── Transaction.ts
│   │   ├── AccountGroup.ts
│   │   └── Loan.ts
│   ├── application/         # Use cases / services
│   │   ├── TransactionService.ts
│   │   ├── LoanService.ts
│   │   ├── RecycleService.ts
│   │   └── BalanceService.ts
│   └── ports/               # Interfaces
│       └── IDatabaseService.ts
├── infrastructure/          # Adapters
│   ├── database/
│   │   ├── SQLiteDatabaseService.ts
│   │   └── schema.sql
│   └── repositories/
│       ├── MemberRepository.ts
│       ├── AccountRepository.ts
│       └── TransactionRepository.ts
├── presentation/            # React layer
│   ├── components/          # Shared UI components
│   ├── screens/             # Route-level screens
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   └── styles/              # CSS modules / tokens
├── App.tsx
└── main.tsx
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand | Lightweight, TypeScript-native, optimistic update friendly |
| Database | SQLite (Phase 1) → Supabase (Phase 2) | Local-first with migration path; metadata JSON columns ensure schema flexibility |
| Styling | CSS Modules + CSS custom properties | No runtime CSS-in-JS cost; tokens are plain CSS; easy theming |
| Routing | React Router v6 | Standard, well-supported, nested routes for member/:id patterns |
| Packaging | Tauri (recommended) | Cross-platform desktop with small binary size; native file system for SQLite |
| Number formatting | Intl.NumberFormat('en-IN') | Indian comma system used in Bangladesh (lakh/crore notation) |
| Font loading | Google Fonts via preconnect | Outfit + JetBrains Mono; preconnect for performance |

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Spreadsheet data inconsistencies | Medium | Financial_Review.md audit already found 3 issues; fix in seed script |
| SQLite vs Supabase query differences | Low | IDatabaseService interface abstracts both; test with both drivers |
| Large transaction volume (500+) | Low | Indexes on date, accounts; virtualize ledger if >100 rows |
| Family member churn (add/remove) | Low | Soft-delete + is_external flag handles all cases |
| Design fidelity drift | Medium | Screenshot comparison in Phase 5; pixel-match against HTML exports |

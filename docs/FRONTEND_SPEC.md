# MoneyFlows — Frontend Spec Document

**Target Skills:** `ui-ux-pro-max`, `frontend-design`, `senior-frontend`
**Version:** 2.0 · 2026-08-23

> **Design reference:** `DESIGN_FILES/*.html` are the pixel-perfect source of truth for each screen. `DESIGN.md` derives tokens from them. Match layout, color, spacing, typography, and component states exactly.

---

## 1. Design System

### 1.1 Aesthetic
Premium dark glassmorphism: frosted panels (`backdrop-filter: blur(20px)`), 1px `rgba(255,255,255,0.06)` borders, violet glow on hover, obsidian base `#0a0a12` with radial corner glow. Radius 12px panels / 8px cards / 9999px pills. Depth shadow `0 8px 32px rgba(0,0,0,.4)`.

### 1.2 Tokens (CSS custom properties — no runtime CSS-in-JS)

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#0a0a12` | page |
| `--color-surface` | `rgba(255,255,255,.04)` | glass base |
| `--color-border` | `rgba(255,255,255,.06)` | glass border |
| `--color-primary` / `-glow` | `#8b5cf6` / `rgba(139,92,246,.3)` | accent |
| `--color-income` | `#14b8a6` | teal credit |
| `--color-expense` | `#f43f5e` | coral debit |
| `--color-cash` | `#f59e0b` | gold cash |
| `--color-text` / `-secondary` | `#f1f5f9` / `#94a3b8` | text |

Typography: Outfit (display, 600/700), system-ui (body), JetBrains Mono (all numerics). Breakpoints: mobile-first single column ≤768px (bottom nav + bottom sheets); sidebar + multi-column ≥769px; max-width 1440px at 1920px. Full 9-step matrix in DESIGN.md.

### 1.3 Code conventions
- CSS Modules only; inline `style={{…}}` is banned (sole exception: shadcn `select.tsx`). Regression watchlist: `TransactionEditModal.tsx`.
- Shared constants live in `presentation/constants/`: `dates.ts`, `labels.ts` (account/tx type labels, gradients, icons), `config.ts` (wizard bounds).
- Formatting via `formatAmount()` + `useFormatNumber()` reading locale/currency from settings — hardcoded `'BDT'` forbidden.

## 2. Routes & Navigation

```
/                    Dashboard            (sidebar + header, breadcrumb on member)
/member              Member list
/member/:id          Member profile       (ledger, scroll-load via IntersectionObserver)
/loans               Loan receivables     (debtor stack list)
/loans/:debtorId     Loan detail view     (ledger rows, filters, PDF export)
/recycle             Recycle bin          (tabs All/Txs/Accounts)
/settings            Settings modal overlay
```

Chrome: Sidebar (desktop) / BottomNav (mobile) swap at 768px; Header carries back button, title from `routeTitles`, global search toggle, FAB → transaction wizard.

## 3. Screen Specs (state → behavior)

### Dashboard `/`
Loading skeleton → metrics row (Total Assets, Cash-in-Hand, Active Loans, Net Worth) → grouped balances by account group → recent transactions feed (limit from `config.ts`). Empty state per section. Error = toast + retry.

### Member Profile `/member/:id`
Account cards styled as credit cards (gradient by `ACCOUNT_TYPE_GRADIENT`) → ledger table with type/month filters and **running balance from full history** (BUG-5 memo-deps fix pending) → infinite scroll + explicit button fallback (8d90b1f).

### Loans `/loans`, `/loans/:debtorId`
Debtors as progress-bar stacks (repaid/principal, status pill Active/On Track) → detail: filter chips (All/Lent/Repaid), ledger rows (date, party, description, credit/debit/balance), summary card, Download PDF (jspdf autotable, filename `loan_ledger_<name>_<date>.pdf`). Balance identical rules as Member Profile.

### Transaction Wizard (modal registry key `transaction-form`)
Mobile: bottom sheet w/ drag handle; Desktop: centered modal. Segmented tabs Income/Expense/Transfer/Loan; numpad with Indian comma grouping (`numpadMaxDigits` bound); fields per tab (source⇄dest swap); counterparty inline-create for loans; insufficient-balance warning non-blocking. Submit → optimistic store update → close animation 300ms.

### Detail / Edit modals
Detail: icon+type+amount hero, field grid, actions Ledger/Edit/Delete; Edit: amount/description/date/type-toggle (income⇄expense swaps accounts). **Rules-of-hooks violation pending fix (BUG-1)**: early return currently precedes `useCallback`.

### Recycle Bin `/recycle`
Tabs with counts → rows show type badge, label, deleted-at countdown → Restore / Delete-forever (confirm modal) → auto-purge note (30d).

## 4. Component Inventory (shared)

| Component | Notes |
|-----------|-------|
| `Modal` / `BottomSheet` | responsive pair; sheets ≤768px, modals above; closing animations 200–300ms |
| `LedgerTable` | virtualization not needed at current scale; sticky header |
| `AmountInput`, `FormField`, `Numpad`, `SegmentedTabs` | wizard kit; mono font for amounts |
| `ProgressBar`, `GlassPanel`, `Avatar` | design-system primitives |
| Modal registry (`modals/registry.ts`) | lazy-loaded map keyed `transaction-form/detail/edit`, `delete-confirm`, `edit-member`, `add-account`, `settings`, `select-account`; props typed via discriminated union (removes `any` — T-087) |

## 5. Interaction States (mandatory everywhere)

hover (glow + lift), focus-visible (2px violet ring), active (scale .98), disabled (.5 opacity, no events), loading (skeleton shimmer, never spinners on glass), empty (icon + one-line hint), error (coral text + retry).

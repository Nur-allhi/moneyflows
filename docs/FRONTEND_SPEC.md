# MoneyFlows — Frontend Spec Document

**Target Skills:** `ui-ux-pro-max`, `frontend-design`, `senior-frontend`
**Version:** 3.0 · 2026-08-24

> **Design reference:** `DESIGN_FILES/*.html` are the pixel-perfect source of truth per screen. `DESIGN.md` derives tokens from them.

---

## 1. Design System

### 1.1 Aesthetic
Premium dark glassmorphism: frosted panels (`backdrop-filter: blur(20px)`), 1px `rgba(255,255,255,.06)` borders, violet hover glow, obsidian base `#0a0a12` + radial corner glow. Radius 12px panels / 8px cards / 9999px pills. Shadow `0 8px 32px rgba(0,0,0,.4)`.

### 1.2 Tokens (CSS custom properties — runtime CSS-in-JS banned)

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#0a0a12` | page |
| `--color-surface` | `rgba(255,255,255,.04)` | glass base |
| `--color-border` | `rgba(255,255,255,.06)` | glass border |
| `--color-primary`/-glow | `#8b5cf6` / `rgba(139,92,246,.3)` | accent |
| `--color-income` | `#14b8a6` | teal credit |
| `--color-expense` | `#f43f5e` | coral debit |
| `--color-cash` | `#f59e0b` | gold cash |
| `--color-text`/-secondary | `#f1f5f9` / `#94a3b8` | text |
| status dots | success `#22c55e` · warn `#f59e0b` · danger `#ef4444` | health/backup indicators |

Typography: Outfit display 600/700 · system-ui body · JetBrains Mono numerics. Breakpoints: single column ≤768px (bottom nav + sheets); sidebar + columns ≥769px; max-width 1440px @1920px. Full matrix in DESIGN.md.

### 1.3 Code conventions
CSS Modules only; inline `style={{…}}` banned (exception: shadcn primitives). Shared constants in `presentation/constants/`. Formatting via `formatAmount()`/`useFormatNumber()` from settings — hardcoded `'BDT'` forbidden.

## 2. Routes & Navigation

```
/                    Dashboard
/member              Member list
/member/:id          Member profile (ledger, scroll-load)
/loans               Loan receivables (debtor stacks)
/loans/:debtorId     Loan detail (ledger, filters, PDF export)
/recycle             Recycle bin (tabs All/Txs/Accounts)
/settings            Settings modal overlay
*                    Database Error screen (boot failure state, not a route)
```

Chrome: Sidebar (desktop) ⇄ BottomNav (mobile) at 768px; Header: back button, title from `routeTitles`, global search, FAB → wizard.

## 3. Screen & Overlay Specs

**Dashboard `/`** — skeleton → metrics row → grouped balances → recent feed (`dashboardTxLimit`). Empty/error states per section.

**Member Profile `/member/:id`** — credit-card account cards → ledger with type/month filters, running balance from full history → infinite scroll + button fallback.

**Loans `/loans`, `/loans/:debtorId`** — progress-bar stacks → filter chips, ledger rows, summary card, Download PDF (`loan_ledger_<name>_<date>.pdf`). Balance rules identical to profile.

**Transaction Wizard** (`transaction-form`) — mobile bottom sheet / desktop modal; tabs Income/Expense/Transfer/Loan; numpad w/ Indian comma grouping; source⇄dest swap; counterparty inline-create **with inline error on failure**; insufficient-balance warning non-blocking; optimistic submit → 300 ms close.

**Detail/Edit modals** — Detail: icon+type+amount hero, Ledger/Edit/Delete actions. Edit: hooks-before-early-return ordering (BUG-6 lesson); type-toggle styled via CSS module.

**Recycle Bin** — tabs with counts → deleted-at countdown → Restore/Delete-forever (confirm modal) → 30 d auto-purge note.

### 3.1 Boot & Recovery States

| State | UI |
|---|---|
| Normal boot | Splash: typed wordmark (~400 ms) + fade; auto-dismisses when DB ready |
| Boot stall >15 s | Watchdog forces Database Error screen — never an infinite splash |
| Storage corrupt / init failure | Database Error screen: warning icon, error message, **Restore Latest Backup** (success→reload; none valid→inline message), **Start Fresh** (resetStorage→reload). Previous file stays for manual recovery |
| Storage write failure in-session | store error state + Settings health dot turns warn |

### 3.2 Settings — Storage section (new)

Status row under Cloud Backup: colored dot (ok/fail) + text `OPFS (fast local file)` or `Browser storage` — last save time or failure hint. Read-only indicator; no user action required.

## 4. Component Inventory

| Component | Notes |
|-----------|-------|
| `Modal`/`BottomSheet` | responsive pair ≤/>768px; 200–300 ms close animations |
| `LedgerTable` | virtualized rows; sticky header; balance column optional |
| Wizard kit | `AmountInput`, `FormField`, `Numpad`, `SegmentedTabs`; mono amounts |
| Primitives | `ProgressBar`, `GlassPanel`, `Avatar` |
| Modal registry | lazy map keyed by name; props typed via registry boundary (no `any`) |
| Splash | typed-logo animation; watchdog-aware (see §3.1) |

## 5. Interaction States (mandatory everywhere)

hover (glow + lift) · focus-visible (2px violet ring) · active (scale .98) · disabled (.5 opacity) · loading (skeleton shimmer, never spinners on glass) · empty (icon + one-line hint) · error (coral text + retry).

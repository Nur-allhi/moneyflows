# MoneyFlows — Frontend Spec Document

**Target Skills:** `ui-ux-pro-max`, `frontend-design`, `senior-frontend`
**Version:** 1.0

> **Design reference:** Open the corresponding HTML file in `DESIGN_FILES/` for each screen you implement. The HTML files are the pixel-perfect visual spec — match their layout, colors, spacing, typography, component states, and responsive behavior.

---

## 1. Design System

### 1.1 Visual Style

- **Aesthetic:** Premium dark glassmorphism — frosted glass panels with `backdrop-filter: blur(20px)`, thin 1px `rgba(255,255,255,0.06)` borders, subtle violet glow on hover
- **Background:** Obsidian base (`#0a0a12`), subtle radial gradient corner glow
- **Radius:** `12px` panels, `8px` cards, `9999px` pills/badges
- **Shadows:** `0 8px 32px rgba(0,0,0,0.4)` for glass depth

### 1.2 Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0a0a12` | Page background |
| `--color-surface` | `rgba(255,255,255,0.04)` | Glass panel base |
| `--color-border` | `rgba(255,255,255,0.06)` | Glass borders |
| `--color-primary` | `#8b5cf6` | Violet accent (buttons, active states) |
| `--color-primary-glow` | `rgba(139,92,246,0.3)` | Violet glow on hover |
| `--color-income` | `#14b8a6` | Teal (income, positive) |
| `--color-expense` | `#f43f5e` | Coral (expense, negative) |
| `--color-cash` | `#f59e0b` | Gold (cash accounts) |
| `--color-text` | `#f1f5f9` | Primary text |
| `--color-text-secondary` | `#94a3b8` | Secondary text |
| `--color-success` | `#22c55e` | On Track / recovered |

### 1.3 Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Display / Headings | `'Outfit', sans-serif` | 600 / 700 | `clamp(1.5rem, 4vw, 2.5rem)` |
| Body text | `system-ui, -apple-system, sans-serif` | 400 | `0.875rem` / `1rem` |
| Numeric / Mono | `'JetBrains Mono', monospace` | 500 | `1.25rem` (amounts), `0.875rem` (ledger) |
| Labels / Chips | `system-ui` | 500 | `0.75rem` |

### 1.4 Breakpoints

| Name | Width | Layout Changes |
|------|-------|----------------|
| Mobile compact | 360px | Single col, bottom nav |
| Mobile standard | 390px | Single col, bottom nav |
| Mobile large | 430px | Single col, bottom nav |
| Foldable | 600px | Single col, wider cards |
| Tablet portrait | 820px | Two-col dashboard, sidebar nav |
| Tablet landscape | 1024px | Two-col, sidebar visible |
| Laptop | 1366px | Three-col dashboard, full layout |
| Desktop | 1440px | Three-col + side panels |
| Wide | 1920px | Max-width centered container (1440px) |

---

## 2. Navigation Map

```
/                   → Dashboard
/member/:id         → Member Profile (mobile: screen-per-member)
/loans              → Loan Receivables (debtor list)
/loans/:debtorId    → Loan Stack detail
/transaction        → Transaction Wizard (modal/sheet overlay)
/recycle            → Recycle Bin
```

**Navigation components:**
- **Desktop:** Vertical sidebar (220–240px, fixed left) with icons + labels
- **Mobile (≤768px):** Bottom tab bar (4 tabs: Dashboard, Members, Loans, Recycle)
- **Header bar:** Logo + current date + notifications bell (desktop); back button + title (mobile sub-pages)
- **Routing:** React Router v6 with nested routes for `/member/:id` and `/loans/:debtorId`

---

## 3. Screen Specifications

### 3.1 Dashboard (`/`)

**Layout:**
- Header: Efty + Azam + Nahar avatars (36px, circular, active ring on the selected member)
- Metric row (4 cards in a row → 2 → 1 column on mobile)
  - Total Assets (teal accent)
  - Cash in Hand (gold accent)
  - Active Loans (coral accent)
  - Net Worth (violet accent)
- Quick action strip: New Transaction, Transfer, Reports, Settings (icon+label)
- Combined Balances section: account rows grouped by `account_groups`, each with bank icon + name + balance
- Recent Transactions: scrollable list of last 20, each row: icon + description + amount (colored) + date

**States:** Loading (skeleton shimmer on glass panels), empty (no transactions → "No recent activity"), error (DB error → "Could not load data" + retry button)

### 3.2 Member Profile (`/member/:id`)

**Mobile:**
- Back button + name in header
- Profile card: avatar (48px), name, role tag, net balance
- Account cards: horizontal scroll carousel, credit-card-style, gradient backgrounds per account type, snap scrolling + dot indicators
- Ledger table: compact scrollable rows (date, description, debit/credit columns, running balance)
- Filter tabs: All, Income, Expenses, Transfers

**Desktop (1024px+):**
- Sidebar (hidden ≤768) + breadcrumb top bar
- Profile hero: 72px avatar, name, meta chips (accounts count, member since), stat items
- Quick action strip: 4 buttons (Add Income, Log Expense, Transfer Money, View Loans)
- Account cards: 3-column grid with glass cards, gold chip for cash accounts
- Split content: Ledger (left 65%) + Side Panel (right 35%)
  - Side panel: spending breakdown (pie/donut), monthly budget bars, savings goals list

### 3.3 Loan Receivables (`/loans`, `/loans/:debtorId`)

- Summary card per debtor: avatar, name, "Active" badge, total outstanding amount (large mono), progress bar (teal gradient, glossy)
- Progress bar: animated width on mount/update, 600ms ease-out
- Loan stacks accordion: single-open
  - Stack header: funding source icon + source name + total amount + installment count + chevron
  - Stack body (expanded): ledger rows with date, description, amount, status pill (Active=amber, On Track=green)
- Responsive: on ≤768px, stack body hides date/status columns

### 3.4 Transaction Wizard (`/transaction`)

**Mobile (overlay bottom sheet, 92vh max):**
- Background dims with backdrop blur
- Slide-up from bottom (300ms ease-out), handle bar at top
- Segmented tabs: Income | Expense | Transfer | Loan
- Amount field: large JetBrains Mono input, BDT prefix, placeholder 0
- Dynamic form (fields change per tab):
  - Income: Source member + Amount + Description + Date
  - Expense: Source account + Amount + Description + Date
  - Transfer: Source account + Destination account + Amount + Description + Date
  - Loan: Debtor + Source account + Amount + Description + Date
- Numeric keypad: 3×4 grid (1-9, 0, backspace), Indian comma formatting
- Submit button: violet gradient, full-width, "Add Income" / "Log Expense" etc.

**Desktop (centered modal, 520px max-width):**
- Fade-in overlay (0.25s ease-out)
- Same segmented tabs
- Side-by-side selects for source/destination (form-row)
- Cancel (ghost) + Save (primary gradient) buttons

### 3.5 Recycle Bin (`/recycle`)

- Header: title + Refresh icon + Empty Bin (danger pill button, red)
- Stats bar: "X items | Y total BDT | Auto-purge in Z days"
- Tabs: All Items (count) | Transactions (count) | Accounts (count)
- Item list rows: icon + name/description + amount + date deleted + restore + permanent delete buttons
- Restore action: confirm dialog → item slides out (300ms) → removed from list
- Delete action: confirm dialog → item slides out → removed from list
- Responsive: at ≤800px, hide amount column

---

## 4. Component States

Every interactive component must implement:

| State | Visual | Example |
|-------|--------|---------|
| **Default** | Normal styling | Glass panel with standard opacity |
| **Hover** | Violet glow (`box-shadow: 0 0 20px var(--color-primary-glow)`) | Glass cards, buttons, rows |
| **Focus** | Violet ring (`outline: 2px solid var(--color-primary)`) | Inputs, form fields, numpad keys |
| **Active/Pressed** | Surface lightens (`rgba(255,255,255,0.08)`) | Numpad keys, buttons |
| **Disabled** | Opacity 0.5, cursor not-allowed | Submit button when form invalid |
| **Loading** | Skeleton shimmer: `background: linear-gradient(...)` + `animation: shimmer 1.5s infinite` | Glass panels, metric cards |
| **Empty** | Centered icon + message | "No transactions yet" |
| **Error** | Red border + message | Failed DB operation |

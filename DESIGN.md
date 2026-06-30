# MoneyFlows — Design System

> **Source of truth:** `DESIGN_FILES/` HTML mockups. Each screen's exact pixel layout, spacing, colors, typography, and component states are defined in its corresponding HTML file in that folder. This document is a derived reference — if any detail conflicts, the HTML in `DESIGN_FILES/` wins.

## 1. Design Tokens

### Colors (OKLCH)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `oklch(14% 0.015 260)` | Obsidian base background |
| `--surface` | `oklch(22% 0.02 260 / 0.55)` | Frosted glass surface |
| `--fg` | `oklch(92% 0.008 260)` | Primary text |
| `--muted` | `oklch(60% 0.02 260)` | Secondary text / labels |
| `--border` | `oklch(100% 0 0 / 0.10)` | Subtle borders |
| `--violet` | `oklch(62% 0.22 290)` | Primary accent |
| `--teal` | `oklch(65% 0.15 170)` | Success / income accent |
| `--coral` | `oklch(62% 0.18 30)` | Danger / expense accent |
| `--gold` | `oklch(75% 0.15 85)` | Cash / highlight accent |
| `--purple` | `oklch(55% 0.18 290)` | Loans accent |
| `--success` | `oklch(65% 0.15 150)` | Positive states |
| `--danger` | `oklch(58% 0.18 30)` | Negative states |

### Background Glow

`radial-gradient(ellipse 70% 60% at 50% 20%, oklch(65% 0.04 250 / 0.35), transparent 70%)`

### Typography

| Role | Font Stack | Sizes | Weight |
|------|-----------|-------|--------|
| Display/Headings | `'Outfit', -apple-system, system-ui, sans-serif` | 16px–36px | 600–700 |
| Body/UI | `-apple-system, 'Segoe UI', system-ui, sans-serif` | 12px–15px | 400–500 |
| Monospace/Numerics | `'JetBrains Mono', ui-monospace, monospace` | 12px–32px | 500–600 |

- Base body: 14px / 1.5 line-height
- All-caps labels: `letter-spacing: 0.08em`
- Numerics: `font-variant-numeric: tabular-nums`
- Display negative tracking at 32px+

### Glassmorphism System

| Property | Value |
|----------|-------|
| Panel background | `var(--surface)` — frosty translucent |
| Backdrop blur | `12px–24px` (standard: 16px) |
| Border | `1px solid var(--border)` |
| Glow (accent) | `0 0 20px–24px oklch(accent / 0.12–0.15)` |
| Border-radius (desktop) | `12px` |
| Border-radius (mobile) | `16px` |
| Card radius | `10px–14px` |
| Pill/chip radius | `999px` |

### Shadows

Accent glow box-shadows are applied via utility classes:
- `.glass-glow-violet` — violet glow
- `.glass-glow-gold` — gold glow
- `.glass-glow-purple` — purple glow

### Motion

| Transition | Duration | Easing |
|------------|----------|--------|
| Hover states | `0.15s–0.2s` | ease |
| Modal entry | `0.25s` | ease-out (fadeIn) |
| Bottom sheet | `0.35s` | ease-out (slideUp) |
| Focus ring | `0.2s` | ease |
| Opacity/transform | `0.15s–0.2s` | ease |

---

## 2. Screen Map

| Screen | File | Format | Layout |
|--------|------|--------|--------|
| Launcher / Overview | `index.html`, `moneyflows-launcher.html` | Responsive grid | Hero + 3-col card grid |
| Dashboard | `screen-1-dashboard.html` | Desktop 16:9 | Header + 4 metrics + quick actions + 2-col content |
| Member Profile (Mobile) | `screen-2-member.html` | Mobile 9:16 | Status bar + header + profile card + carousel + ledger + bottom nav |
| Member Profile (Desktop) | `screen-2-member-desktop.html` | Desktop 16:9 | Sidebar + top bar + profile hero + account cards + ledger + side panel |
| Loan Receivables | `screen-3-loans.html` | Desktop 16:9 | Header + summary + expandable loan stacks |
| Transaction Wizard (Mobile) | `screen-4-transaction.html` | Mobile overlay 9:16 | Bottom sheet + segmented tabs + form + numpad |
| Transaction Wizard (Desktop) | `screen-4-transaction-desktop.html` | Desktop 16:9 | Sidebar + centered modal + segmented tabs + form |
| Recycle Bin | `screen-5-recycle.html` | Desktop 16:9 | Header + stats + tabs + list with restore/delete |

---

## 3. Component Library

### Navigation

**Desktop Sidebar** (screen-2, screen-4)
- Fixed 220–240px left panel
- Backdrop blur with right border
- Nav items with icons, left border active indicator (violet)
- Bottom footer with avatar + name/role
- Responsive: hidden at ≤768px

**Mobile Bottom Nav** (screen-2)
- 4 tabs: Home, Accounts, Reports, Settings
- Frosted background with top border
- Active state: violet color

**Header Bar** (shared across screens)
- Back button (circle with border) + logo + actions
- Date display (muted, right-aligned)
- Notification bell / action buttons

**Breadcrumb** (screen-2 desktop)
- `section / <current>` format, muted → fg

### Profile & Avatars

**Avatar** (all screens)
- 32–72px circles with gradient fills
- Member-specific gradients: Efty (violet), Azam (teal), Nahar (pink)
- Active state: 2px violet ring (::after pseudo)
- Hover: violet box-shadow

**Profile Card** (screen-2 mobile)
- Glass panel with avatar, name, tag, and balance
- Balance: mono font, teal color

**Profile Hero** (screen-2 desktop)
- Large avatar (72px) + name + meta chips + stat items
- Stats: net balance, total income, total expenses

### Cards

**Account Cards / Credit Card Style** (screen-2)
- Colored gradient backgrounds (bKash: pink, Brac Bank: indigo, Business Cash: slate)
- Card-chip (gold gradient rectangle)
- Balance in mono, account number with bullets
- Hover: translateY(-2px) lift

**Metric Card** (screen-1)
- Glass panel with label, value (mono), and change indicator
- Accent glow variants: violet, gold, purple
- Change: up (teal ▲), down (coral ▼)

**Quick Action Card** (screen-2 desktop)
- Glass row with icon, title, subtitle
- Hover: violet border + glow

**Launcher Glass Card** (index)
- Glass panel with icon, title, description, badge
- Hover: violet border + glow

### Data Display

**Metrics Row** (screen-1)
- 4-column grid of metric cards
- Responsive: 2-col at ≤1000px, 1-col at ≤600px

**Combined Balances / Account Row** (screen-1)
- Icon with gradient background (bank-specific)
- Name, type label, balance (colored)
- Hover: subtle light background

**Recent Transactions** (screen-1)
- Icon (expense coral, income teal, transfer violet) + description + date + amount
- Hover: subtle light background

**Ledger Table** (screen-2)
- Grid layout with columns: Date, Description, Debit, Credit, Balance
- Date: muted; Description: with color-coded tag (expense/income/transfer)
- Debit (coral), Credit (teal), Balance (right-aligned)
- Filter tabs: All, Income, Expenses, Transfers
- Scrollable body (max 340–360px)

**Account Ledger (Mobile)** (screen-2 mobile)
- Compact 5-column grid, same structure
- Scrollable with max-height

### Loans

**Summary Card** (screen-3)
- Debtor name (large display) + badge + registered info
- Total outstanding (large mono, coral)
- Repayment progress bar (12px height, teal gradient, gloss effect)

**Loan Stack Accordion** (screen-3)
- Expandable/collapsible with single-open behavior
- Header: icon + fund source + total amount + loan count + chevron
- Expanded body: table with loan rows (description, date, amount, remaining, status)
- Status pills: Active (coral), On Track (teal)

### Transaction Wizard

**Segmented Tabs** (screen-4)
- Dark pill background, 3px padding
- Active tab: violet gradient, white text
- Options: Income, Expense, Transfer, Loan

**Form Fields**
- Label (11px uppercase, letter-spacing)
- Input: dark glass background, 10px radius
- Focus: violet border + 3px violet glow ring
- Select with custom chevron (pseudo-element)
- Amount input: large mono font (24px), currency prefix (BDT)

**Numeric Keypad** (screen-4 mobile)
- 3×4 grid, glass keys, mono 22px
- Backspace action key (violet gradient)
- Live amount formatting with Indian comma system

**Bottom Sheet** (screen-4 mobile)
- Slides up from bottom (0.35s ease-out)
- Handle bar (rounded pill)
- Max-height: 92vh, scrollable form body

**Centered Modal** (screen-4 desktop)
- Centered on blurred background content
- Fade-in animation (0.25s)
- 520px wide, 20px radius, dark overlay

### Recycle Bin

**Stats Bar** (screen-5)
- Deleted items count, total amount, days until auto-purge

**Tabs** (screen-5)
- All Items, Transactions, Accounts with count badges
- Active tab: violet underline indicator

**Item List** (screen-5)
- Grid columns: icon + name/type + amount + date + actions
- Action buttons: Restore (teal, ↩) and Delete (coral, 🗑)
- Restore: confirm dialog → fade out → remove
- Hover states on rows and action buttons

### Interactive States

| Element | Hover | Focus | Active |
|---------|-------|-------|--------|
| Glass card | Violet border + glow | — | — |
| Row (account/tx) | `oklch(100% 0 0 / 0.04)` | — | — |
| Nav item | Fg color + light bg | — | Active: violet |
| Input | — | Violet border + 3px glow | — |
| Avatar | Violet shadow ring | — | — |
| Button (ghost) | Light bg | — | — |
| Button (primary) | Opacity 0.9 | — | — |
| Numpad key | — | — | Light bg |
| Tab (segmented) | Fg color (if not active) | — | — |
| Close/action btn | Light bg + fg | — | — |

---

## 4. Layout & Spacing

### Grid System

| Pattern | Screens | Columns | Gap |
|---------|---------|---------|-----|
| Launcher grid | index | 3 → 2 → 1 (at 800/500) | 16px |
| Metrics | dashboard | 4 → 2 → 1 (at 1000/600) | 16px |
| Content split | dashboard | 1.4fr 1fr → 1fr (1000) | 16px |
| Content split | member desktop | 1fr 320px → 1fr (1024) | 24px |
| Account cards | member desktop | 3 → 1 (768) | 16px |
| Action strip | member desktop | 3 → 1 (768) | 14px |
| Side panel | member desktop | 1fr → 2fr → 1fr | 20px |

### Responsive Breakpoints

| Breakpoint | Target | Changes |
|------------|--------|---------|
| ≤500px | Mobile compact | Single column, 16px padding |
| ≤600px | Mobile | Metrics 1-col, header stacked |
| ≤768px | Tablet | Sidebar hidden, padding 16–20px |
| ≤800px | Small | Launcher 2-col, 16px body padding |
| ≤1000px | Tablet landscape | Metrics 2-col, content 1-col |
| 769–1024px | Tablet | Sidebar 200px |

### Padding / Spacing

- Body padding: 24px (desktop), 16px (mobile)
- Card padding: 20–24px
- Section gap: 20px
- Row gap: 4–12px
- List padding: 8–12px items

---

## 5. Responsive Viewport Contract

Test across: 360×800, 390×844, 430×932, 600×960, 820×1180, 1024×768, 1366×768, 1440×900, 1920×1080. No horizontal overflow at any viewport.

---

## 6. Implementation Sequence

1. Extract tokens as CSS custom properties
2. Build reusable components: GlassPanel, Avatar, MetricCard, AccountCard, TransactionRow, LedgerRow, TabBar, Numpad
3. Implement screens as routes: launcher → dashboard → member → loans → transaction → recycle
4. Implement responsive behavior per breakpoint matrix
5. Add JS interactions: tab switching, accordion, numpad input, restore/delete, sheet/modal open-close
6. Validate fidelity across all 9 viewports

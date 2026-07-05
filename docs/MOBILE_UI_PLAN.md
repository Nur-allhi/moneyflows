# Mobile Screen UI — Implementation Plan

**Source:** `DESIGN_FILES/Mobile_Screen/` (12 HTML files + modals.js)
**Status:** Planned
**Total Tickets:** 19 (T-065 to T-083)

---

## Overview

Rewrite the app's mobile layout to match the pixel-perfect designs in `DESIGN_FILES/Mobile_Screen/`. The existing app is desktop-first with responsive fallbacks; this plan establishes a true mobile-first layout with dedicated mobile components and CSS.

**Key design principles** (from all HTML files):
- `body { padding: 0 16px; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }`
- Fixed bottom nav: 64px height, 5 tabs, active = violet
- Header: 40px circle back button + title + icon actions (search, settings)
- Glass cards: `border-radius: 16px`, `padding: 20px`, `backdrop-filter: blur(16px)`
- Bottom sheet modals: slide-up 0.35s, `max-height: 90%`, drag handle bar
- Touch targets: min 44×44px, `:active { transform: scale(0.97) }` on all tappables
- FAB only on Dashboard: 56px circle, bottom-right, gradient violet
- Font: body `--font-size-base` (clamp 14–16px), labels 11–12px

---

## Phase 9: Foundation — Shared Mobile Layout (6 tickets)

### T-065 — Mobile body layout + safe areas
**Files:** `src/App.module.css`, `src/presentation/styles/tokens.css`
**Content:**
- `body { padding: 0 16px; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }`
- Fixed `--bg-glow` background via `background-attachment: fixed`
- `--font-size-base: clamp(14px, 3.5vw, 16px)` token override for mobile
- Override `App.module.css` `.main` padding for mobile
**Design:** All HTML files declare `body { padding:0 16px; padding-bottom:calc(80px + env(safe-area-inset-bottom)); }`

### T-066 — Mobile Header
**Files:** `src/presentation/components/Header.tsx`, `Header.module.css`
**Content:**
- Mobile header: back button (40px circle, border, ← arrow) + title + right actions
- Right actions: search icon (🔍) + settings gear (⚙) icon buttons
- Settings gear opens dropdown: Settings, Recycle Bin, Launcher
- No date display, no notification bell on mobile
- Hide breadcrumb on mobile
- Search bar hidden by default, toggles via search icon
**Design:** `dashboard.html` lines 48-97 (header pattern)

### T-067 — Mobile BottomNav
**Files:** `src/presentation/components/BottomNav.tsx`, `BottomNav.module.css`
**Content:**
- Fixed position: `bottom: 0; left: 0; right: 0`
- Height: 64px, `backdrop-filter: blur(20px)`
- 5 nav items: Home, Members, Loans, Groups, Bin
- Each item: icon (text/emoji) + label, min 44×44px
- Active state: color `var(--violet)`
- `padding-bottom: env(safe-area-inset-bottom)`
**Design:** Nav pattern is identical in all HTML files (e.g. `dashboard.html` lines 361-393)

### T-068 — BottomSheet slide-up animation + drag handle
**Files:** `src/presentation/components/BottomSheet.tsx`, `BottomSheet.module.css`
**Content:**
- Overlay: `background: oklch(0% 0 0 / 0.6)`, `backdrop-filter: blur(4px)`
- Sheet: `max-height: 90%`, `border-radius: 20px 20px 0 0`
- Animation: `slideUp` 0.35s ease-out (translateY 100% → 0)
- Drag handle: 36×4px rounded bar, centered, `background: oklch(100% 0 0 / 0.2)`
- Close on overlay click
**Design:** Modal pattern in all HTML files (e.g. `dashboard.html` lines 409-435)

### T-069 — FAB component for Dashboard
**Files:** NEW: `src/presentation/components/FAB.tsx`, `FAB.module.css`
**Content:**
- Position: fixed, `bottom: calc(80px + env(safe-area-inset-bottom))`, `right: 16px`
- Size: 56×56px circle
- Background: `linear-gradient(135deg, var(--violet), oklch(50% 0.2 290))`
- Shadow: `0 4px 20px oklch(62% 0.22 290 / 0.3)`
- Icon: "+" in 28px white
- `:active { transform: scale(0.92) }`
- z-index: 100
- Only rendered on Dashboard route
**Design:** `dashboard.html` lines 341-358

### T-070 — Standardize glass card radius/padding for mobile
**Files:** `src/presentation/styles/glassmorphism.css`
**Content:**
- Mobile glass card: `border-radius: 16px`, `padding: 20px`
- Consistent `backdrop-filter: blur(16px)`, `border: 1px solid var(--border)`
- Section headers inside glass: 600 weight, 15px, display font
- Ensure all existing `.glass-panel` classes match mobile spec
**Design:** `dashboard.html` `.glass` class (lines 108-115)

---

## Phase 9.2: Core Screens — Mobile Overrides (6 tickets)

### T-071 — SplashScreen typewriter animation
**Files:** `src/presentation/components/SplashScreen.tsx`, `SplashScreen.module.css`
**Content:**
- Typewriter effect: reveal "Money\nFlows" letter by letter on two lines
- Gradient text: `linear-gradient(135deg, var(--violet), oklch(55% 0.25 290))`
- Blinking cursor: 3px wide, `var(--violet)`, `box-shadow: 0 0 8px var(--violet)`
- Min 2s display, then fade out (0.5s)
- Loader bar optional (or tie to DB init progress)
**Design:** `index.html` (full file) + `moneyflows-launcher.html` splash section

### T-072 — Dashboard mobile layout
**Files:** `src/presentation/screens/Dashboard.tsx`, `Dashboard.module.css`
**Content:**
- **Total Assets** card: centered, 24px mono bold, "TOTAL ASSETS" label below
- **2-col Metric Row**: Cash (gold) + Loans Out (coral), side by side
- **Flow Summary**: Income + divider + Expenses, net row below with ↗ arrow
- **Where Your Money Is**: accordion, section header (h3 + chevron), member rows with avatar+name+balance, accounts expandable
- **Active Loans**: loan items with progress bar (100% width, 6px height, teal gradient) + badge + percentage
- **Recent Transactions**: icon + description + signed amount
- **FAB** (bottom-right) replaces top "New Transaction" / "Quick Loan" / "Settings" buttons
- Remove header action button row, replace with settings gear in header
- Search bar toggled from header icon
**Design:** `dashboard.html` (full file, 920 lines)

### T-073 — MemberList mobile — 3-column avatar grid
**Files:** `src/presentation/screens/MemberList.tsx`, `MemberList.module.css`
**Content:**
- 3-column grid, 12px gap
- Each cell: 56px circular avatar (gradient) + name (truncated) + formatted balance
- Last cell is "+" add button (dashed border, centered icon)
- Search bar below header: full-width, rounded 14px, with 🔍 icon
- Empty state: centered icon + title + description + "Add First Member" button
- Add member modal: Name + Initial Balance fields
**Design:** `member.html` (full file, 480 lines)

### T-074 — MemberProfile mobile — hero + pills + carousel + ledger
**Files:** `src/presentation/screens/MemberProfile.tsx`, `MemberProfile.module.css`
**Content:**
- **Hero card**: centered 72px avatar, name 18px bold, balance 28px mono teal
- **Quick action pills**: 3 buttons (Income/Expense/Transfer), each with icon + uppercase label
- **Account carousel**: horizontal snap-scroll, cards with type + name + balance, dots indicator, last card is "+" add
- **Ledger section**:
  - Toolbar: search icon + input + download button
  - Segmented tabs: All/Income/Expense
  - Ledger rows: date | desc+category | amount (3-column grid)
  - Infinite scroll via IntersectionObserver sentinel
- **Detail modal**: icon + "Income"/type label + amount + divider + description/date/category fields + actions
- **Edit member modal**: via shared modals (Name + Short Name)
**Design:** `member-profile.html` (full file, 1006 lines)

### T-075 — LoansScreen mobile — search + pills + cards + badges
**Files:** Rewrite `src/loans/presentation/screens/LoansScreen.tsx`, `LoansScreen.module.css`
**Content:**
- Header: ← Loans + [+] button
- Search bar: full-width, "Search debtor..."
- Filter pills: horizontally scrollable (Active / Settled / All)
- Summary line: "Total Active: ₹8,200"
- Loan cards: avatar+name | outstanding amount | progress bar | badge (active/partial/settled) | percentage
- Empty states: "No active loans" / "Create your first loan"
- Add loan modal: Name + Amount fields
**Design:** `loans.html` (full file, 746 lines)

### T-076 — LoanDetailView mobile — summary + progress + ledger + repayment
**Files:** Rewrite `src/loans/presentation/components/LoanDetailView.tsx`, `LoanDetailView.module.css`
**Content:**
- Header: ← Loans + download icon + report icon
- **Summary card**: type badge "Loan (Lend)", name 20px, amount 28px coral, "Total Outstanding" label
- **Progress section**: 10px track, teal gradient fill, "% repaid — ₹remaining remaining" label
- **Action row**: [+] Repayment (primary) + Delete (outline danger) — hidden when settled
- **Settled badge**: "✓ Settled" pill when loan is settled
- **Ledger**:
  - Toolbar: search + download + filter icons
  - Segmented tabs: All / Issued / Repaid
  - Date filter dropdown (month picker)
  - Ledger rows: date | desc | signed amount (teal/coral)
  - Infinite scroll
- **Repayment modal** (TransactionFormModal pattern):
  - Type tabs (Income/Expense/Transfer/Loan)
  - Amount display (centered, 32px)
  - Form fields: From Account, To (disabled), Date, Description
  - Numpad: 4×4 grid, C/0/./⌫ + submit key
- **Delete confirm modal**: "Move to Recycle Bin" (red) + "Cancel"
- **Tx detail modal**: icon + type + amount + fields + actions
**Design:** `loan-detail.html` (full file, 1091 lines)

---

## Phase 9.3: Secondary Screens (4 tickets)

### T-077 — GroupsListScreen mobile
**Files:** `src/presentation/screens/GroupsListScreen.tsx`, `GroupsListScreen.module.css`
**Content:**
- Header: ← Groups + [+] button
- Search bar: "Search groups..."
- Group cards: icon (44×44 rounded) + name + account count | total balance
- Empty state: icon + "No groups yet" + "Create First Group" button
- **Group detail bottom sheet** (drag-to-dismiss):
  - Handle bar, group name title
  - Total balance section
  - Account list rows: name | balance
  - Action buttons: View Ledger / Edit Group / Delete Group
  - Drag-to-dismiss via touch events (translateY, >80px threshold)
- Create/Edit group modal: Name + Icon select
**Design:** `groups.html` (full file, 749 lines)

### T-078 — GroupLedgerScreen mobile
**Files:** `src/presentation/screens/GroupLedgerScreen.tsx`, `GroupLedgerScreen.module.css`
**Content:**
- Header: ← group name
- **Balance hero**: centered, "TOTAL BALANCE" label, balance 22px bold, "X accounts" sub
- **Ledger**:
  - Toolbar: search + download icon
  - Segmented tabs: All / Income / Expense / Transfer
  - Ledger rows: date | desc+category | signed amount
  - Infinite scroll
- Tx detail modal (same pattern as others)
**Design:** `group-ledger.html` (full file, 627 lines)

### T-079 — RecycleBin mobile
**Files:** `src/presentation/screens/RecycleBin.tsx`, `RecycleBin.module.css`
**Content:**
- Header: ← Recycle Bin
- Search bar: "Search deleted items..."
- **Tab bar**: All / Tx / Accounts (segmented tabs style)
- **Stats bar**: "12 items" + "₹3,450" | "Auto-purge in 24d"
- **Recycle rows**: icon + name + sub | signed amount | "Xd left" | [↩ Restore] [🗑 Delete]
- Empty state: "Nothing here" with description
**Design:** `recycle-bin.html` (full file, 532 lines)

### T-080 — Settings mobile — full-screen page
**Files:** `src/presentation/components/SettingsModal.tsx`, `SettingsModal.module.css`
**Content:**
- Convert to full-screen overlay (not bottom sheet)
- Header: ← Settings
- **General section**: Currency (text), Locale (text), Primary Member (select)
- **Validation section**: Description Max, Numpad Digits, Tx Per Page (number inputs)
- **Backup section**: Restore points list with [Restore] buttons, Drive Sync status + "Set up Drive" button
- Each settings row: label left + input right
- Toast notification for feedback
**Design:** `settings.html` (full file, 365 lines)

---

## Phase 9.4: Modals — Bottom Sheet Pattern (3 tickets)

### T-081 — TransactionDetailModal mobile
**Files:** `src/presentation/modals/TransactionDetailModal.tsx`, `TransactionDetailModal.module.css`
**Content:**
- Bottom sheet with drag handle
- Icon (48px circle, colored by type): ▲ income / ▼ expense / ● transfer
- Type label: "Income" / "Expense" / "Transfer" (11px uppercase)
- Amount: 32px bold, colored by type
- Divider line
- Fields (vertical): Description | Date | Source/Category
- Action buttons row: [Open in Ledger] [Edit] [Delete]
**Design:** `dashboard.html` lines 792-819 (tx detail modal) — same pattern in member-profile, loan-detail, group-ledger

### T-082 — TransactionFormModal mobile
**Files:** `src/presentation/modals/TransactionFormModal.tsx`, `TransactionFormModal.module.css`
**Content:**
- Bottom sheet with drag handle
- Title: "New Transaction"
- Type tabs: Income / Expense / Transfer (3 buttons, colored by type)
- Form fields: Description (text), Amount (number, centered, 20px mono)
- Submit button: full-width, gradient violet
**Design:** `dashboard.html` lines 822-835 (new tx modal)

### T-083 — Shared modals — AddAccount, EditMember, DeleteConfirm, LoanReport
**Files:** Respective modal files in `src/presentation/modals/`
**Content:**
All follow the same bottom sheet pattern:
- Drag handle + title + form fields + submit button
- **AddAccount**: Account Name (text), Type (select), Opening Balance (number), Opening Date (date)
- **EditMember**: Name (text), Short Name (text)
- **DeleteConfirm**: Explanatory text + "Delete" (red) + "Cancel"
- **LoanReport**: Summary card + progress + activity list
**Design:** `modals.js` (full file, 180 lines) + respective HTML files

# Mobile Design Prompts — MoneyFlows

## Core Layout Rules (apply everywhere)

- **Safe areas**: `padding: 16px` left/right, `padding-bottom: calc(80px + env(safe-area-inset-bottom))` on scroll content to clear bottom nav + notch
- **Touch targets**: minimum 44×44px for all tappable elements
- **Stack vertical**: every page is a single-column scroll, no sidebars, no side panels
- **Bottom sheet modals**: all modals slide up from bottom, 90% height, rounded top corners 20px, drag-to-dismiss, backdrop overlay
- **Back**: unified header back button, never page-level back links
- **Cards**: full-bleed (no side margins on the container), card-to-card gap 12px
- **Font**: body `--font-size-base` (clamp 14–16px), labels 11–12px, headings as defined
- **Touch feedback**: `transform: scale(0.97)` on press, `transition: 0.15s`
- **Infinite scroll**: `IntersectionObserver` sentinel at bottom of all ledger lists
- **Search**: full-width input below header, filters in real-time, clear button
- **Pill filters**: horizontally scrollable pill row, no scrollbar
- **FAB**: 56px circle, primary color, shadow, bottom-right, used only on Dashboard
- **Keyboard**: Numpad on all amount inputs, "Done" accessory bar on text inputs

---

## 1. Launcher (`/launcher`)

**Full-screen standalone page** (no sidebar, no header, no bottom nav).

```
┌──────────────────────┐
│                      │
│   MoneyFlows         │  ← Large centered logo, 28px bold
│                      │
│  ┌──────────────────┐│
│  │  Dashboard       ││  ← 4 grid cards, 2×2 layout
│  │  ─────────────  ││     Full-width rounded 16px
│  │  Quick overview  ││     Each has icon + label + short desc
│  └──────────────────┘│
│  ┌────────┐ ┌───────┐│
│  │ Members│ │ Loans ││  ← 2×2 grid, equal width
│  │ View.. │ │ Track ││     gap 12px
│  └────────┘ └───────┘│
│  ┌────────┐ ┌───────┐│
│  │ Recycle│ │ Add   ││
│  │  Bin   │ │ Tx..  ││
│  └────────┘ └───────┘│
│                      │
│  [Enter App]         │  ← Primary CTA button, bottom
│                      │
└──────────────────────┘
```

**States**: initial load shows SplashScreen with typewriter "MoneyFlows" + min 2s delay.

**Touch**: cards are tappable with press scale(0.97) feedback.

**Empty/null**: N/A, always shows grid.

---

## 2. Dashboard (`/`)

**Main financial overview, single scroll column.**

```
┌──────────────────────┐
│ ← MoneyFlows    ⚙️  │  ← Header: title left, settings gear right
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │ $45,230        │  │  ← Total Assets — large number 24px bold
│  │ Total Assets   │  │     label below 11px secondary
│  └────────────────┘  │
│                      │
│  ┌──────┐ ┌──────┐  │
│  │Cash  │ │Loans │  │  ← 2 horizontal metric cards
│  │$12k  │ │$8.2k │  │     side by side, 50% width
│  └──────┘ └──────┘  │
│                      │
│  ┌─Income/Expense──┐ │
│  │ +$5,230 / -$3.1k│ │  ← This month summary row
│  │ ↗ Net $2,130    │ │     green/red colored values
│  └─────────────────┘ │
│                      │
│  ┌─Where Your Money──┐│
│  │ ▼ Dad     $15,200││  ← Collapsible member section
│  │ ▼ Mom     $12,400││     Chevron rotates on tap
│  │ ▼ Me      $8,600 ││     Tap name to expand/collapse
│  └──────────────────┘│     Each shows total balance
│                       │     Expanded: list of accounts
│                       │
│  ┌─Active Loans──────┐│
│  │ Uncle John        ││  ← Loan stack card
│  │ $5,000  │ 65% ██  ││     Name left, amount right
│  │ Partial           ││     Progress bar below
│  └──────────────────┘│     Badge: Active / Partial / Settled
│                       │
│  ┌─Recent Transactions┐│
│  │ 🏪 Grocery  -$45  ││  ← Row: description + amount
│  │ 🏦 Salary  +$2k  ││     Minimal, no date shown
│  └───────────────────┘│     Tap opens TransactionDetailModal
│                        │
│  [+ New Transaction]   │  ← Floating action button
│                        │     bottom-right, 56px circle, primary
└────────────────────────┘
```

**Mobile-specific**:
- No sidebar visible (bottom nav instead)
- Metric cards switch from 3-row to 2-wide grid
- "Where Your Money Is" starts collapsed, one tap expands
- FAB for new transaction instead of top button
- Settings gear in header right
- Global search in header (magnifying glass icon)

**States**: loading shows skeleton shimmer cards.

**Empty/null**: "No transactions yet" with action prompt.

---

## 3. MemberList (`/member`)

**All members, searchable grid.**

```
┌──────────────────────┐
│ ← Members           │  ← Header
├──────────────────────┤
│ 🔍 [Search members]  │  ← Search bar, full-width
├──────────────────────┤
│                       │
│  ┌────┬────┬────┐    │
│  │ 👨 │ 👩  │ 👧 │    │  ← 3-column avatar grid
│  │Dad │Mom │Sis│    │     Circular 56px avatars
│  │$12k│$8k │$2k│    │     Name below, balance below
│  └────┴────┴────┘    │     Tappable → navigate to profile
│  ┌────┬────┬────┐    │
│  │ 👦 │    │    │    │
│  │Bro │  +  │    │    │  ← Last cell is "+" add button
│  │$1k │     │    │    │
│  └────┴────┴────┘    │
│                       │
└──────────────────────┘
```

**Mobile-specific**:
- 3-column avatar grid (vs list on desktop)
- Each cell: avatar circle + name (truncated) + formatted balance
- Last cell is always "+" to add new member
- Search filters by name in real-time

**States**: empty shows "Add your first member" with prompt.

**Touch**: press scale(0.95) on cells.

---

## 4. MemberProfile (`/member/:id`)

**Single member detail, scrollable.**

```
┌──────────────────────┐
│ ← Dad          ✏️   │  ← Header: back + member name + edit icon
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │      👨         │  │  ← Large avatar, centered, 72px
│  │   John Doe     │  │     Name 18px bold
│  │   $12,450      │  │     Total balance 28px bold
│  └────────────────┘  │
│                      │
│  ┌───┐ ┌───┐ ┌───┐  │
│  │Inc│ │Exp│ │Tfr│  │  ← Quick action pills
│  │+$ │ │-$ │ │$  │  │     Income / Expense / Transfer
│  └───┘ └───┘ └───┘  │     Each opens TransactionFormModal
│                      │     with pre-selected member
│                      │
│  ┌─Accounts──────────┐│
│  │ ◄ ○ ○ ○ ►        ││  ← Horizontal scrollable account
│  │ ┌──────────────┐  ││     cards with dot indicators
│  │ │💳 Bk Asia    │  ││     Swipe left/right
│  │ │$5,230        │  ││     Each card: icon + name + balance
│  │ └──────────────┘  ││     Last card: "+" add account
│  └──────────────────┘│
│                       │
│  ┌─Ledger─────────────┐│
│  │ 🔍           📥  ││  ← Filter bar: search + PDF icon
│  │ [All│Inc│Exp│..] ││     Segmented tabs for type filter
│  ├───────────────────┤│
│  │ 15 Jan   Grocery  ││  ← Ledger rows (compact)
│  │          -$45     ││     Date left, desc center, amt right
│  │ 10 Jan   Salary   ││     Tap row → TransactionDetailModal
│  │          +$2,000  ││
│  │ ...               ││  ← Infinite scroll
│  └───────────────────┘│
│                        │
└────────────────────────┘
```

**Mobile-specific**:
- Avatar/name/balance hero section condensed
- Quick action pills instead of header buttons
- Account cards are horizontally swipeable carousel (not dropdown)
- Ledger is the main scrollable content area
- Search + PDF icons inline, PDF label hidden on mobile
- Download as simple icon button, not expand-on-hover

**States**: No accounts → show "Add Account" CTA card. No transactions → empty state.

**Touch**: Account carousel responds to swipe. Ledger rows have active press state.

---

## 5. GroupsListScreen (`/groups`)

```
┌──────────────────────┐
│ ← Groups       [+]  │  ← Header with add button
├──────────────────────┤
│ 🔍 [Search groups]   │
├──────────────────────┤
│                       │
│  ┌──────────────────┐ │
│  │ 📦  Emergency    │ │  ← Group card, full width
│  │     3 accounts   │ │     Icon + name left
│  │     $12,450      │ │     Account count + balance right
│  └──────────────────┘ │     Tap → opens group detail bottom sheet
│                       │
│  ┌──────────────────┐ │
│  │ 📦  Savings      │ │
│  │     2 accounts   │ │
│  │     $8,200       │ │
│  └──────────────────┘ │
│                       │
└──────────────────────┘
```

**Mobile-specific**:
- Cards full width, stacked
- Group detail opens as bottom sheet (90% height)
- Bottom sheet has: group name, account list with balances, actions (View Ledger, Edit, Delete)
- "+" in header to create new group

**States**: Empty → "No groups yet" with create prompt. Search no results → "No groups match" message.

**Touch**: Sheet drag-to-dismiss.

---

## 6. GroupLedgerScreen (`/groups/:groupId`)

```
┌──────────────────────┐
│ ← Emergency         │  ← Header: back + group name
├──────────────────────┤
│ Total: $12,450       │  ← Balance summary, 22px bold
├──────────────────────┤
│ 🔍            📥    │  ← Filter bar
│ [All│Inc│Exp│Tfr│..] │     Segmented tabs
├──────────────────────┤
│                       │
│  ┌─Ledger────────────┐│
│  │ 15 Jan  Grocery  ││
│  │          -$45    ││  ← Same compact rows as MemberProfile
│  │ 10 Jan  Salary   ││     Date | Description | Amount
│  │          +$2k    ││     Tap → TransactionDetailModal
│  │ ...              ││  ← Infinite scroll
│  └──────────────────┘│
│                       │
└──────────────────────┘
```

**Mobile-specific**: Same ledger pattern as MemberProfile. Simplify — no dropdown selector (group is fixed). Compact rows, search, type filter.

---

## 7. LoansScreen (`/loans`)

```
┌──────────────────────┐
│ ← Loans       [+]   │  ← Header + new loan button
├──────────────────────┤
│ 🔍 [Search debtor]   │
├──────────────────────┤
│ [Active│Settled│All] │  ← Filter pills, horizontally scrollable
├──────────────────────┤
│ Total Active: $8,200 │  ← Summary line
├──────────────────────┤
│                       │
│  ┌──────────────────┐ │
│  │ 👤 Uncle John    │ │  ← Loan card
│  │ Outstanding      │ │     Name top-left
│  │   $5,000         │ │     Outstanding amount right, bold
│  │ ████████░░ 65%   │ │     Progress bar full width
│  │ Partial          │ │     Badge: Active/Partial/Settled
│  └──────────────────┘ │     Tap → LoanDetailView
│                       │
│  ┌──────────────────┐ │
│  │ 👤 Friend Alex   │ │
│  │ Outstanding      │ │
│  │   $3,200         │ │
│  │ ██████████ 100%  │ │
│  │ Settled          │ │
│  └──────────────────┘ │
│                       │
└──────────────────────┘
```

**Mobile-specific**: Cards full width. Progress bar spans full card. Badge compact. Filter pills scroll horizontally.

**States**: Active filter + no loans → "No active loans". Empty all → "Create your first loan" CTA.

---

## 8. LoanDetailView (`/loans/:debtorId`)

**Partner view for one debtor.**

```
┌──────────────────────┐
│ ← Loans       📥    │  ← Header: back + PDF icon
├──────────────────────┤
│                       │
│  ┌─Summary Card──────┐│
│  │ 📄 Loan (Lend)   ││  ← Type badge
│  │ Uncle John       ││     Name 20px bold
│  │ $5,000           ││     Amount 28px bold
│  │ Total Outstanding││
│  └──────────────────┘│
│                       │
│  ████████░░ 65%      │  ← Progress bar full-width
│  65% repaid - $1.7k  │     Label below
│    remaining          │
│                       │
│  [+ Repayment] [Delete]│  ← Two buttons side by side
│                         │     Repayment primary (purple)
│                         │     Delete text button (grey)
│                         │
│  ┌─Ledger──────────────┐│
│  │ 🔍          📥 📁 ││  ← Search + PDF + Filter icons
│  │ [All│Issued│Repaid]││     Type filter pills
│  │ ▾ Month: [Jan]     ││     Date filter dropdown
│  ├────────────────────┤│
│  │ Jan 15  Loan Issue ││
│  │          +$5,000  ││  ← Compact ledger rows
│  │ Feb 10  Repayment  ││     Incoming = green
│  │          -$500    ││     Outgoing = red tint
│  │ ...               ││
│  └────────────────────┘│
│                         │
└─────────────────────────┘
```

**Mobile-specific**: Summary card compact but prominent. No "← All Loans" button (deleted — header handles back). Repayment/Delete as row. Ledger same pattern with search + filter pills + date dropdown.

**States**: Settled stack → shows "Settled" badge instead of buttons. No ledger entries → empty state.

---

## 9. RecycleBin (`/recycle`)

```
┌──────────────────────┐
│ ← Recycle Bin       │  ← Header
├──────────────────────┤
│ 🔍 [Search items]    │
├──────────────────────┤
│ [All│Tx│Accounts]    │  ← Tab bar
├──────────────────────┤
│ 12 items · $3,450    │  ← Stats bar
│ Auto-purge in 24d    │
├──────────────────────┤
│                       │
│  ┌──────────────────┐ │
│  │ 🛒 Grocery      │ │  ← Recycle row
│  │ -$45 · 5d left  │ │     Description + amount + days left
│  │ [↩ Restore][🗑] │ │     Two action buttons
│  └──────────────────┘ │
│                       │
└──────────────────────┘
```

**Mobile-specific**: Full-width rows. Restore + Delete buttons side by side at row bottom. Compact stats bar.

---

## 10. TransactionFormModal (modal)

**Bottom sheet, slides up from bottom.**

```
┌──────────────────────┐
│ ← New Transaction    │  ← Handle bar + title
├──────────────────────┤
│                       │
│  [Income│Expense│     │  ← Segmented tabs, scrollable
│   Transfer│Loan]      │     Active tab underlined/highlighted
│                       │
│  ┌─Amount────────────┐│
│  │                   ││  ← Large amount display
│  │    $ 0.00         ││     32px bold, centered
│  └───────────────────┘│
│                       │
│  ┌─Account───────────┐│
│  │ From: [Pick acct ▼]││  ← Account selectors
│  │ To:   [Pick acct ▼]││     Change based on tab
│  │ Date: [15 Jan ▼]  ││
│  │ Desc: [__________] ││  ← Textarea for description
│  └───────────────────┘│
│                       │
│  ┌───Numpad──────────┐│
│  │ 1  2  3           ││
│  │ 4  5  6           ││  ← 4×4 grid numpad
│  │ 7  8  9           ││     Each key 48×48px minimum
│  │ C  0  .  ⌫       ││
│  └───────────────────┘│
│                       │
│  [Save Transaction]   │  ← Primary CTA, full width
│                       │
└──────────────────────┘
```

**Mobile-specific**: Full bottom sheet with numpad. Account pickers are bottom sheet inline selects (not dropdowns). Form fields stack. Large touch-friendly numpad.

**States**: Validation errors show inline below each field.

---

## 11. TransactionDetailModal

```
┌──────────────────────┐
│ ─── (handle)         │  ← Drag handle
├──────────────────────┤
│                       │
│              💳       │  ← Type icon, centered, 40px
│           Income      │     Type label below
│                       │
│        $2,000.00      │  ← Amount, 32px bold, colored
│                       │     (green for income, red for expense)
│                       │
│  ═══════════════════  │
│                       │
│  Description           │  ← Label
│  Monthly salary       │     Value
│                       │
│  Date                  │
│  Jan 15, 2026         │
│                       │
│  From                  │
│  Dad → Bk Asia        │
│                       │
│  ═══════════════════  │
│                       │
│  [Open in Ledger]     │  ← Secondary button
│  [Edit]  [Delete]     │     Row of action buttons
│                       │
└──────────────────────┘
```

**Mobile-specific**: Bottom sheet, 70% height or more for content. Clean vertical info layout. Actions at bottom.

---

## 12. Settings (opens as full-screen overlay)

```
┌──────────────────────┐
│ ← Settings           │  ← Full-screen overlay with header
├──────────────────────┤
│                       │
│  ┌─General───────────┐│
│  │ Currency: [BDT]   ││  ← Text input
│  │ Locale:  [bn-BD]  ││  ← Text input
│  │ Primary: [Dad ▼]  ││  ← Select/dropdown
│  └───────────────────┘│
│                       │
│  ┌─Validation────────┐│
│  │ Desc max: [60]    ││  ← Number inputs
│  │ Numpad max:[9]    ││
│  │ Tx limit: [50]    ││
│  └───────────────────┘│
│                       │
│  ┌─Backup────────────┐│
│  │ Restore Points    ││  ← List of backups
│  │  • 2 Jan 2026     ││     Each has Restore button
│  │  • 1 Jan 2026     ││
│  │ Drive: [Not set]  ││  ← FolderSync status
│  │ [Set up Drive]    ││
│  └───────────────────┘│
│                       │
└──────────────────────┘
```

**Mobile-specific**: Opens as a full-screen page overlay (not bottom sheet — too much content). Back in header closes and returns to previous screen.

---

## 13. AddAccountModal / EditMemberModal / DeleteConfirmModal / TransactionEditModal / LoanReportModal

**All follow the same bottom sheet pattern:**

```
┌──────────────────────┐
│ ─── (handle)         │  ← Drag handle
├──────────────────────┤
│  ← Modal Title       │  ← Header with close
├──────────────────────┤
│                       │
│  (form fields stack)  │  ← Vertical form layout
│                       │     Labels above inputs
│                       │     12px gap between fields
│                       │
│  [Primary Action]     │  ← CTA button, full width, at bottom
│                       │
└──────────────────────┘
```

**Each modal's specific fields:**

| Modal | Fields | CTA |
|-------|--------|-----|
| AddAccount | Account Name (text), Type (select: bank/cash/mobile_wallet/counterparty/credit_card/savings/investment), Opening Balance (amount), Opening Date (date) | "Add Account" |
| EditMember | Name (text), Short Name (text) | "Save" |
| DeleteConfirm | Explanatory text about 30-day recycle | "Delete" (red) |
| TransactionEdit | Amount (num input), Description (text), Date (date), Type toggle (Income/Expense) | "Save" |
| LoanReport | Full loan report viewer (read-only) | "Close" |

---

## 14. SplashScreen (first load only)

```
┌──────────────────────┐
│                      │
│                      │
│                      │
│       Money          │  ← Typewriter reveal, letter by letter
│       Flows          │     Inter/Outfit font, 36px
│                      │     Purple glow (#8b7cf7)
│                      │
│                      │  ← No spinner, no subtitle
│                      │     Min 2s display
│                      │     Fade out → Dashboard
│                      │
│                      │
└──────────────────────┘
```

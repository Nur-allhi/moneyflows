# MoneyFlows — Product Requirement Document (PRD)

**Target Skill:** `skill-creator`
**Version:** 1.0

---

## 1. Product Vision

A privacy-first, dark-glassmorphism family finance app that replaces a fragile multi-sheet Excel workbook with a structured, real-time, and beautifully crafted personal finance tracker for the Bengali family. All data lives locally. No cloud dependency. No spreadsheets.

---

## 2. Target Users

| Persona | Role | Detail |
|---------|------|--------|
| **Efty** (Admin) | Primary user | Manages 6 personal/business accounts; issues/recover loans; oversees family finances |
| **Azam (Abbu)** | Father | 4 accounts (Brac Bank 951K, Standard Bank, bKash, loans) |
| **Nahar (Ammu)** | Mother | Standard Bank personal account |
| **External Debtors** | Borrowers | BTC, Pavel, Sharif, Mainul — tracked with `is_external=true` |

---

## 3. User Stories & Target Workflows

### 3.1 Dashboard — Family Financial Snapshot
- **As Efty**, I want to see total family assets, cash-in-hand, active loans, and net worth at a glance so I know our financial position in 5 seconds.
- **As Efty**, I want to see combined balances grouped by account type (Bank, Mobile Wallet, Cash, Savings) with group totals.
- **As Efty**, I want a scrollable feed of the last 20 global transactions, color-coded by type (teal=income, coral=expense).
- **As any member**, I want to tap a profile avatar to navigate to my account details.

### 3.2 Member Profile — Per-Person Ledger
- **As Efty**, I want to see each family member's linked accounts rendered as premium credit-card-style glass cards with balances.
- **As Efty**, I want a full debit/credit ledger with running balance, filterable by (All, Income, Expenses, Transfers).
- **As Efty**, I want quick action buttons: Add Income, Log Expense, Transfer Money.
- **On desktop**, I want a side panel showing spending breakdown, monthly budgets, and savings goals.

### 3.3 Loan Receivables — Debtor Management
- **As Efty**, I want a summary card per debtor: name, total outstanding, repayment progress bar.
- **As Efty**, I want loan stacks grouped by funding source, expandable to see individual installments with status (Active / On Track).
- **As Efty**, I want the progress bar to animate when a repayment is logged.

### 3.4 Transaction Wizard — Single Entry Point
- **As Efty**, I want a single modal/sheet to log any transaction in under 10 seconds.
- **As Efty**, I want 4 segmented tabs: Income, Expense, Transfer, Loan — form fields change per tab.
- **As Efty**, I want a 3×4 numeric keypad with Indian comma formatting (Intl.NumberFormat 'en-IN').
- **As Efty**, I want source/destination fields that auto-filter to valid accounts (transfer requires different accounts).

### 3.5 Recycle Bin — Soft-Delete Safety Net
- **As Efty**, I want to review all soft-deleted items in one place, tabbed by type (All, Transactions, Accounts).
- **As Efty**, I want to restore or permanently delete items with confirmation.
- **As Efty**, I want to see auto-purge countdown and an option to empty the bin.

---

## 4. Non-Functional Requirements

| # | Requirement | Target |
|---|-------------|--------|
| NFR1 | Local-first architecture | All core features work fully offline; SQLite `money_flows.db` |
| NFR2 | Responsive | 9 breakpoints (360px→1920px), no horizontal scroll |
| NFR3 | Performance | Route code-splitting; virtualized ledger if >100 rows; 60fps animations |
| NFR4 | Data integrity | Soft-delete on members, accounts, transactions, groups; audit log |
| NFR5 | Migration path | JSON `metadata` columns on all tables for future Supabase sync |
| NFR6 | File size per spec | Each code file ≤300 LOC |
| NFR7 | Currency | BDT only (v1). Indian comma format via `Intl.NumberFormat('en-IN')` |

---

## 5. Out of Scope (v1)

- Multi-currency support
- Cloud sync / Supabase (Phase 2)
- Push notifications
- Recurring transactions / auto-scheduling
- PDF/bank statement import
- User authentication (single-device, single-user family app)

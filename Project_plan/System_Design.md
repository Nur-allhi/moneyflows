# MoneyFlows: System Design & Database Schema

This document outlines the system architecture, database schema, and operational logic for the **MoneyFlows** personal finance and loan tracking application.

---

## 🏗️ 1. System Architecture

The application is designed using a **Clean Architecture** model to separate user interface elements from data access layers. This separation ensures that the frontend is completely decoupled from the specific database engine, making the future transition from a local SQLite database to Supabase (PostgreSQL) seamless.

```
┌────────────────────────────────────────────────────────┐
│                      Vite + React                      │
│      (Components: Dashboard, Ledgers, Reports, Bin)    │
└───────────────────────────┬────────────────────────────┘
                            │ Hooks / State
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Zustand State Store                  │
│       (Holds in-memory cache for instant UI updates)   │
└───────────────────────────┬────────────────────────────┘
                            │ Calls Interface Methods
                            ▼
┌────────────────────────────────────────────────────────┐
│            IDatabaseService Interface                  │
│      (Defines: getTransactions, saveTransaction, etc)   │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼ (Phase 1: Local)              ▼ (Phase 2: Online)
┌───────────────────────┐       ┌────────────────────────┐
│     SQLite Driver     │       │      Supabase Client   │
│  (money_flows.db file)│       │   (Cloud PostgreSQL)   │
└───────────────────────┘       └────────────────────────┘
```

### Key Architectural Layers:
1. **Presentation Layer (React)**: Handles views, interactive forms, ledger rendering, dynamic slide-over transaction detail drawers, and reporting charts.
2. **State Management Layer (Zustand)**: Acts as the source of truth for the active UI. By holding the loaded database in memory, it performs **optimistic updates**—reflecting new transactions or edits in the UI instantly before the disk write completes.
3. **Data Access Layer (Repository Pattern)**: Defines an abstract interface `IDatabaseService`. All frontend components fetch data from this interface rather than querying a database directly.
4. **Database Layer (SQLite)**: Stores all data in a single, local file: `money_flows.db`.

---

## 💾 2. Relational Database Schema (SQLite DDL)

Below is the complete database structure. It includes strict types for financial and relational fields, cascading constraints to prevent orphan data, soft-delete flags, and dynamic JSON metadata columns to allow future upgrades without changing the tables.

```sql
-- Enable foreign key constraint enforcement in SQLite
PRAGMA foreign_keys = ON;

-- 1. MEMBERS Table
-- Tracks internal family/business profiles and external debtors (e.g. BTC, Sharif)
CREATE TABLE members (
    id TEXT PRIMARY KEY,                       -- UUID string
    name TEXT NOT NULL,                        -- Name of the member or debtor
    is_external BOOLEAN NOT NULL DEFAULT 0,    -- 0 = Internal member (Efty, Azam), 1 = External debtor (BTC, Sharif)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,    -- Soft-delete flag
    deleted_at TIMESTAMP DEFAULT NULL,         -- When it was moved to Recycle Bin
    metadata TEXT DEFAULT '{}'                 -- JSON string for future expansion
);

-- 2. ACCOUNTS Table
-- Tracks cash, mobile, and bank wallets owned by internal members
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,                       -- UUID string
    member_id TEXT NOT NULL,                   -- Owner of the account
    name TEXT NOT NULL,                        -- e.g. "Brac Bank", "bKash"
    type TEXT NOT NULL,                        -- "cash", "bank", "mobile_wallet", "savings"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,    -- Soft-delete flag
    deleted_at TIMESTAMP DEFAULT NULL,
    metadata TEXT DEFAULT '{}',                -- JSON string for details (e.g. account numbers)
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 3. TRANSACTIONS Table
-- The single source of truth for all cash flows. Double-entry transactions are linked via source/destination.
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,                       -- UUID string
    date TEXT NOT NULL,                        -- ISO 8601 date string (YYYY-MM-DD HH:MM:SS)
    amount REAL NOT NULL,                      -- Real/Decimal amount (BDT)
    type TEXT NOT NULL,                        -- "income", "expense", "transfer", "loan_issue", "loan_repayment"
    description TEXT NOT NULL,                 -- Transaction particulars
    category TEXT NOT NULL,                    -- "home_expenses", "salary", "medical", "business", etc.
    source_account_id TEXT DEFAULT NULL,       -- Outgoing account (NULL for external deposits)
    destination_account_id TEXT DEFAULT NULL,  -- Incoming account (NULL for external payments)
    loan_debtor_id TEXT DEFAULT NULL,          -- Links to members(id) if transaction is a loan issue or repayment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,    -- Soft-delete flag
    deleted_at TIMESTAMP DEFAULT NULL,
    metadata TEXT DEFAULT '{}',                -- JSON string for receipts, linked transaction IDs, interest calculations
    FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (loan_debtor_id) REFERENCES members(id) ON DELETE SET NULL
);

-- 4. ACCOUNT GROUPS Table
-- Allows users to merge and aggregate account balances (e.g. "Brac Bank Combined")
CREATE TABLE account_groups (
    id TEXT PRIMARY KEY,                       -- UUID string
    name TEXT NOT NULL,                        -- Name of the group
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,    -- Soft-delete flag
    deleted_at TIMESTAMP DEFAULT NULL
);

-- 5. ACCOUNT GROUP MAPPINGS Table (Many-to-Many)
-- Links accounts to custom user-defined balance groups
CREATE TABLE account_group_mappings (
    group_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    PRIMARY KEY (group_id, account_id),
    FOREIGN KEY (group_id) REFERENCES account_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance & query optimization
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_debtor ON transactions(loan_debtor_id) WHERE loan_debtor_id IS NOT NULL;
CREATE INDEX idx_transactions_source ON transactions(source_account_id) WHERE source_account_id IS NOT NULL;
CREATE INDEX idx_transactions_destination ON transactions(destination_account_id) WHERE destination_account_id IS NOT NULL;
CREATE INDEX idx_accounts_member ON accounts(member_id);


---

## 🎨 3. UI/UX Animation & Interaction Specification

To deliver a premium, native-feeling user experience, the interface will feature a coordinated motion system built on performance-optimized CSS animations and transitions.

### A. Core Motion Architecture
* **Timing Functions**: 
  * Standard Ease: `cubic-bezier(0.4, 0, 0.2, 1)` (used for standard slide/fade)
  * Decelerate Ease: `cubic-bezier(0.0, 0, 0.2, 1)` (used for entering elements)
  * Accelerate Ease: `cubic-bezier(0.4, 0, 1, 1)` (used for exiting elements)
* **Duration Tokens**:
  * Micro-interactions (hovers, taps): `150ms`
  * Drawer/Modal transitions: `300ms`
  * Route slide animations: `400ms`

### B. Route Transitions (Navigation Stack Animation)
When transitioning between routes (e.g., from Dashboard to Member Profile), the views animate using a hardware-accelerated transform:
* **Forward Navigation**: The incoming route slides in from the right (`transform: translateX(100%)` to `0`), while the exiting route scales down slightly (`scale(1.0)` to `scale(0.95)`) and fades out.
* **Backward Navigation (Pop Stack)**: The exiting route slides off to the right (`0` to `translateX(100%)`), revealing the parent route which scales up and fades in.

### C. Slide-Over Detail Drawer Animation
When a user clicks on any ledger transaction entry:
1. **Backdrop Fade**: A full-screen overlay backdrop (`backdrop-filter: blur(8px)`) fades in smoothly (`opacity: 0` to `1` in `300ms`).
2. **Drawer Slide**: The drawer slides out from the right screen edge (`transform: translateX(100%)` to `0` in `300ms`).
3. **Internal Stagger**: The transaction details and "Loan Position" panel fade in with a staggered animation delay (`+50ms` each) to create a visual sequence.

### D. Optimistic Balance Updates (Number Tickers)
* When a user adds a transaction, the balance card does not jump instantly.
* A **CSS keyframe pulse animation** triggers on the balance card container, highlighting the change.
* The balance text executes a **counting transition** (e.g. using a requestAnimationFrame ticker script or CSS tabular-nums counting effect) to animate the digits rolling from their old value to the new value over `500ms`.

### E. Micro-interactions & Tactile States
* **Hover Scaling**: Interactive cards (Member cards, Loan Stacks) scale up by `scale(1.02)` and cast a deeper shadow (`box-shadow`) on hover to indicate clickability.
* **Repayment Progress Progressions**: When a repayment is recorded, the loan repayment progress bar animates from its old percentage width to the new width (`transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1)`).
* **Recycle Bin Animation**: When an item is restored or deleted permanently from the Recycle Bin, it slides left and fades out simultaneously, causing the rows below it to slide up smoothly.


# MoneyFlows — Project Brief

## 1. Executive Summary

MoneyFlows is a family personal finance application for tracking income, expenses, bank accounts, mobile wallets, and loan receivables across multiple family members. It replaces a manual Excel spreadsheet with a modern, premium dark-glassmorphism UI backed by a structured database. The app is BDT-focused and designed for the financial workflows of a Bengali family.

## 2. Problem Statement

The family currently manages finances via a complex Excel workbook with 7 sheets tracking 15+ accounts and loans across 4 members. This causes: hardcoded dashboard values, formula errors (3,000 BDT master ledger typo found), omitted accounts (Prime Savings 34K BDT missing), and no mobile access. A dedicated app eliminates spreadsheet fragility while adding real-time access, structured data, and a premium UX.

## 3. Project Vision

A beautifully crafted, privacy-first family finance app that makes tracking money flows as intuitive as messaging. Dark glassmorphism aesthetics meet clean-architecture reliability — for the family, by the family.

## 4. Target Users

| Role | Description |
|------|-------------|
| **Efty** | Family admin & primary user. Manages personal accounts (bKash, Brac Bank, EBL, Prime Savings), business funds (Brac Bank, Standard Bank, Business Cash), and loan issuance/recovery. |
| **Azam (Abbu)** | Father. Manages Brac Bank (951K BDT), Standard Bank, bKash, and loan relationships. |
| **Nahar (Ammu)** | Mother. Manages Standard Bank personal account. |

External debtors (BTC, Pavel, Sharif, Mainul) are tracked as members with `is_external = true`.

## 5. Core Features

1. **Dashboard** — Family overview with total assets, cash-in-hand, active loans, net worth. Combined balances by account group. Recent global transaction feed.
2. **Member Profile** — Per-member view with linked account cards (styled as physical credit cards), account ledger with debit/credit/running balance, spending breakdown, monthly budgets, and savings goals.
3. **Loan Receivables** — Debtor summary with repayment progress bar. Expandable "loan stacks" grouped by funding source. Status tracking (Active / On Track).
4. **Transaction Wizard** — Bottom sheet (mobile) / centered modal (desktop) with segmented tabs (Income, Expense, Transfer, Loan). Dynamic form fields per type. Numeric keypad with Indian comma formatting.
5. **Recycle Bin** — Soft-deleted items with restore/permanent delete. Tabbed by type (All, Transactions, Accounts). Auto-purge countdown.

## 6. Financial Data Scope (from Spreadsheet Audit)

- **Family Total Assets**: ~1,136,969 BDT across 4 members
- **Total Outstanding Loans**: 776,240 BDT across 5 debtors
- **Accounts tracked**: 15+ (bank, mobile wallet, cash, savings)
- **Members**: 4 internal, 5+ external debtors

## 7. Design Direction

- **Style**: Premium dark glassmorphism — frosted glass panels, backdrop blur, thin glowing borders, subtle radial glow background
- **Colors**: Obsidian base, violet primary accent, teal (income), coral (expense), gold (cash)
- **Typography**: Outfit (display), system-ui (body), JetBrains Mono (numerics)
- **Responsive**: Mobile-first with desktop variants; 9 viewport breakpoints from 360px to 1920px

## 8. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React |
| State | Zustand (optimistic updates, in-memory cache) |
| Data Access | `IDatabaseService` interface (Repository Pattern) |
| Database (Phase 1) | SQLite via `sql.js` (WASM, runs in-browser; persisted to localStorage) |
| Database (Phase 2) | Supabase (PostgreSQL) |
| Architecture | Clean Architecture — UI decoupled from data layer |

## 9. Constraints & Assumptions

- Local-first: all data lives in a single `money_flows.db` file (Phase 1)
- Currency: BDT only (no multi-currency support in v1)
- Offline-capable by design (no cloud dependency for core features)
- Future sync to Supabase must not require schema migration — JSON `metadata` columns on all tables
- Soft-delete enforced on all core entities (members, accounts, transactions, groups)

## 10. Success Criteria

1. All 5 screens implemented with pixel-fidelity to the design handoff
2. No horizontal scroll at any of the 9 target viewports
3. Spreadsheet data fully migrated to database with 100% balance accuracy
4. Transaction wizard correctly handles all 4 types (income, expense, transfer, loan)
5. Recycle bin supports restore, permanent delete, and auto-purge tracking
6. All interactive states (hover, focus, active, disabled, loading) preserved

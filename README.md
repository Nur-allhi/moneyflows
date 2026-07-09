<h1 align="center">💸 MoneyFlows</h1>

<p align="center">
  <b>Privacy-first, local-first family finance tracker</b><br/>
  A beautiful dark-glassmorphism app that replaces a fragile spreadsheet with a structured, real-time view of your family's money.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18"/>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/SQLite-sql.js-003B57?logo=sqlite&logoColor=white" alt="sql.js"/>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License"/>
</p>

---

## ✨ What it does

MoneyFlows is a **single-device, single-user family finance app**. Everything runs in your browser — there is no server, no login, and no cloud sync. Your financial data is stored locally with an in-browser SQLite database (`sql.js` compiled to WebAssembly) and persisted to `localStorage`.

| Feature | Description |
|--------|-------------|
| **Dashboard** | Family financial snapshot: total assets, cash-in-hand, active loans, and net worth. Balances grouped by account type, plus a color-coded recent-transaction feed (teal = income, coral = expense). |
| **Member Profiles** | Per-person ledger with credit-card-style glass account cards, a running-balance transaction ledger, and quick actions. On desktop, a side panel shows spending and budgets. |
| **Groups** | Bundle related accounts into collections and view a consolidated group ledger. |
| **Loans** | Unified loan system: per-debtor/creditor summary cards, loan stacks grouped by funding source, and animated repayment progress for internal and external counterparties. |
| **Transaction Wizard** | One fast modal to log any transaction, with segmented tabs (Income / Expense / Transfer / Loan) and a numeric keypad with locale-aware formatting. |
| **Recycle Bin** | Soft-delete safety net for transactions and accounts — restore, permanently delete, or let items auto-purge after 30 days. |
| **Data Safety** | Automatic restore-point backups on save, SHA-256 integrity verification, and optional off-device Folder Sync via the File System Access API. |
| **Dynamic Settings** | Configure currency, locale, primary member, and input limits — applied consistently across the whole app. |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| UI | React 18, React Router 6 |
| State | Zustand |
| Styling | Tailwind CSS 4, CSS Modules + CSS custom properties |
| Database | `sql.js` (SQLite compiled to WebAssembly, runs in-browser) |
| Build | Vite 6 |
| Icons / Fonts | lucide-react, Geist |
| Export | jsPDF + jsPDF-autotable |

---

## 🏗️ Architecture

MoneyFlows follows **Clean Architecture**. The UI never imports the database engine directly — all data access goes through the `IDatabaseService` port, which is implemented by `SQLiteDatabaseService`.

```
src/
├── core/
│   ├── domain/           # Entities & value objects (Member, Account, Transaction, ...)
│   ├── application/      # Use cases / services (TransactionService, LoanService, ...)
│   └── ports/            # IDatabaseService interface
├── infrastructure/
│   └── database/         # SQLiteDatabaseService, schema.sql, FolderSync, getDatabase
├── loans/                # Unified loan module (domain + presentation)
└── presentation/
    ├── components/       # Reusable UI (Sidebar, Header, BottomNav, ...)
    ├── screens/          # Route screens (Dashboard, MemberProfile, RecycleBin, ...)
    ├── modals/           # Modal renderer + transaction forms
    ├── hooks/            # Custom hooks
    ├── stores/           # Zustand stores (useMemberStore, useModalStore, ...)
    ├── constants/        # Labels, dates, config
    └── styles/           # Design tokens & shared CSS
```

**Data model** (SQLite, soft-delete on every table via `deleted_at`):

- **members** — family members and external debtors/creditors (`is_external`)
- **accounts** — typed accounts (`bank | mobile_wallet | cash | savings | business`) owned by a member
- **transactions** — `income | expense | transfer | loan_issue | loan_repayment`
- **account_groups** / **account_group_mappings** — account collections
- **loans** — unified loan records

All tables also carry a JSON `metadata` column reserved for future migration compatibility.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install & run

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (default `http://localhost:5173`).

### Build & preview

```bash
npm run build     # type-check + production build
npm run preview   # preview the production build
```

### Quality gates

```bash
npm run lint       # ESLint (max-warnings 0)
npm run typecheck  # tsc --noEmit
```

---

## 📂 Project Layout

```
money_flows_v0.4/
├── docs/                 # PRD, TAD, SECURITY, frontend & mobile specs, tickets
├── DESIGN_FILES/         # Visual source of truth (HTML mockups per screen)
├── DESIGN.md             # Derived design-system reference (OKLCH tokens)
├── Project_plan/         # Planning & phase docs
├── src/                  # Application source (see Architecture)
└── AGENTS.md             # Development workflow & conventions
```

Product and technical specs live in `docs/` (`PRD.md`, `TAD.md`, `SECURITY.md`, `FRONTEND_SPEC.md`, `TICKETS.md`). The pixel-level UI spec lives in `DESIGN_FILES/`, with `DESIGN.md` as the derived design-system reference.

---

## 📐 Conventions

- Every source file is kept **≤ 300 lines**.
- TypeScript strict mode; React functional components with hooks.
- Styling via CSS Modules + CSS custom properties (no runtime CSS-in-JS).
- Clean Architecture boundaries are enforced — presentation depends on ports, never on adapters.

---

## 🔒 Privacy & Security

- **No network calls.** All data is created, read, and stored locally in the browser.
- **No authentication.** This is a single-device, single-user app — anyone with device access has full control.
- **Soft-delete everywhere.** Nothing is destroyed immediately; deleted items sit in the Recycle Bin and auto-purge after 30 days.
- **Backups.** Save operations create restore points with SHA-256 integrity checks; Folder Sync can mirror data off-device.

See [`docs/SECURITY.md`](docs/SECURITY.md) for the full threat model and secure-coding checklist.

---

## 🗺️ Scope

**In scope (v1):** local-first offline operation, responsive layout (mobile → desktop), soft-delete + recycle bin, internal & external loans, data backup/restore, dynamic currency & locale.

**Out of scope (v1):** multi-currency switching at transaction level, cloud sync, push notifications, recurring/scheduled transactions, statement import, and user authentication (planned for a future Phase 2 with Supabase).

---

<p align="center">
  Made as a portfolio project · Built with React + TypeScript + Vite
</p>

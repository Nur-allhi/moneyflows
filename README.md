<h1 align="center">💸 MoneyFlows</h1>

<p align="center">
  <b>Privacy-first, local-first family finance tracker</b><br/>
  Structured, real-time visibility of your family's money — dashboards, per-member ledgers, loan stacks and manual registers — in a glassmorphism app that replaces a fragile spreadsheet.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-10B981" alt="v2.0.0"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18"/>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/SQLite-sql.js-003B57?logo=sqlite&logoColor=white" alt="sql.js"/>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License"/>
</p>

---

## ✨ What it does

MoneyFlows runs entirely in your browser as an installable app (PWA). There is no server and no login: your data lives in a real SQLite database file (`sql.js` compiled to WebAssembly) inside your browser's **Origin Private File System (OPFS)**, with automatic restore-point snapshots and a one-time localStorage fallback for older installs.

| Feature | Description |
|--------|-------------|
| **Dashboard** | Family financial snapshot: cash in hand, banks, active loans, total assets — each with a "vs last month" trend line. Balance groups by account type and a live month summary (income, expense, net). |
| **Member Profiles** | Per-person ledger with a running-balance transaction table, income/expense splits, and a credit-card-style glass account list. |
| **Accounts & Groups** | Typed accounts (`bank | mobile_wallet | cash | savings | business`) owned by a member, bundled into collections with a consolidated group ledger. |
| **Loans** | Unified loan module: give-take direction, per-counterparty cards, loan stacks grouped by funding source, and repayment progress. Overpaying is refused with your numbers shown — nothing is silently clamped, and repayment edits reverse and re-apply their loan splits exactly. |
| **Other Ledgers** | Free-form manual registers for any person or purpose (rent, business, personal IOUs): debit/credit/balance entries with tags, search and PDF export — same table pattern as the member ledger. |
| **Transaction Wizard** | One fast form for any movement, segmented by type, with a numeric keypad and locale-aware formatting. |
| **Search** | Global search from the app header across transactions, accounts and members. |
| **Recycle Bin** | Soft-delete safety net for transactions, accounts, other-ledgers and their entries — per-tab totals, restore, or auto-purge after 30 days. |
| **Themes** | Light/dark mode, accent color and background presets; typography is Manrope with Inter numerals and self-hosted Anek Bangla for Bangla text. |
| **Data Safety** | Restore-point ring on every save, SHA-256 (or FNV digest on insecure origins) integrity verification, a **Data Integrity** scan in Settings, and a Database Error screen that can restore any auto-backup. |
| **Settings** | Currency, locale, primary member and input limits — one source of truth, applied across every screen. Five collapsible cards, live status badges. |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 (strict mode) |
| UI | React 18, React Router 6 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4, CSS Modules + OKLCH design tokens |
| Database | `sql.js` 1.14 (SQLite compiled to WebAssembly, in-browser) |
| Storage | OPFS adapter (primary), localStorage adapter (fallback), write coalescing |
| Build | Vite 6 |
| Fonts | Manrope, Inter (`tnum` numerals), Anek Bangla (self-hosted via Fontsource) |
| Icons | lucide-react |
| Export | jsPDF 4 + jsPDF-autotable |
| Testing | Vitest 4 (unit), Playwright (browser flows) |

---

## 🏗️ Architecture

MoneyFlows follows **Clean Architecture**. The UI never imports the database engine directly — all data access goes through the `IDatabaseService` port, which is implemented by `SQLiteDatabaseService`.

```
src/
├── core/
│   ├── domain/           # Entities & value objects (Member, Account, Transaction, ...)
│   ├── application/      # Use cases / services (TransactionService, ..., balanceEffect, transactionCategory)
│   └── ports/            # IDatabaseService interface
├── infrastructure/
│   ├── database/         # SQLiteDatabaseService, schema.sql, storage adapters (OPFS/localStorage), migrations
│   └── repositories/
├── loans/                # Unified loan module (domain, application, presentation)
├── otherLedgers/         # Manual registers module (domain, application, presentation)
└── presentation/
    ├── components/       # Reusable UI (Sidebar, Header, BottomNav, GlassPanel, ...)
    ├── screens/          # Route screens (Dashboard, MemberProfile, RecycleBin, SetupWizard, ...)
    ├── modals/           # Modal renderer + transaction forms
    ├── hooks/            # Custom hooks
    ├── stores/           # Zustand stores (useMemberStore, useSettingsStore, ...)
    ├── constants/        # Labels, dates, config
    └── styles/           # Design tokens & shared CSS
```

**Data model** (SQLite, soft-delete on every table via `deleted_at`):

- **members** — family members and external debtors/creditors (`is_external`)
- **accounts** — typed accounts owned by a member
- **transactions** — `income | expense | transfer | loan_issue | loan_repayment`
- **account_groups** / **account_group_mappings** — account collections
- **loans** — unified loan records with repayment metadata
- **other_ledgers** / **other_ledger_entries** — manual debit/credit registers

Every table also carries a JSON `metadata` column reserved for forward compatibility.

**Persistence:** writes are coalesced (flush on idle), verified by integrity digest, and snapshotted into a restore-point ring (`snapshots/`) next to `money_flows.db`. A one-time migration moves legacy localStorage installs to OPFS on first boot.

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

The build output is a full **PWA** (`manifest` + hand-rolled service worker in `public/sw.js`, network-first so updates land on the next reload).

### Quality gates

```bash
npm run test        # Vitest unit suite (235 tests)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint, max-warnings 0
npm run e2e         # Playwright browser suite (31 scenarios, single worker)
```

---

## 📂 Project Layout

```
money_flows_v0.4/
├── docs/                 # PRD, TAD, SECURITY, specs, audit reports, plans, tickets, BUGS
├── DESIGN_FILES/         # Visual source of truth (HTML mockups per screen)
├── DESIGN.md             # Derived design-system reference (OKLCH tokens)
├── Project_plan/         # Planning & phase docs
├── src/                  # Application source (see Architecture)
└── AGENTS.md             # Development workflow & conventions
```

Product and technical specs live in `docs/` (`PRD.md`, `TAD.md`, `SECURITY.md`, `FRONTEND_SPEC.md`, `TICKETS.md`). The pixel-level UI spec lives in `DESIGN_FILES/`, with `DESIGN_IDENTITY.md` as the review-enforceable design ruleset.

---

## 📐 Conventions

- Every source file is kept **≤ 300 lines**.
- TypeScript strict mode; React functional components with hooks.
- Styling via CSS Modules + CSS custom properties — no runtime CSS-in-JS, no inline `style={{}}`, no hard-coded currency, locale or hex values.
- Currency, locale and version each have **one source of truth** (settings store + `package.json`), injected at build time.
- Clean Architecture boundaries are enforced — presentation depends on ports, never on adapters.

---

## 🔒 Privacy & Security

- **No network calls.** All data is created, read, and stored locally in the browser.
- **No authentication.** This is a single-device, single-user app — anyone with device access has full control.
- **Soft-delete everywhere.** Nothing is destroyed immediately; deleted items sit in the Recycle Bin and auto-purge after 30 days.
- **Backups.** Save operations create restore points with integrity checks; the Data Integrity scan in Settings audits every transaction against today's rules and reports (never repairs) anything unusual.

See [`docs/SECURITY.md`](docs/SECURITY.md) for the full threat model and secure-coding checklist.

---

<p align="center">
  Made as a portfolio project · Built with React + TypeScript + Vite
</p>

# MoneyFlows — Product Requirement Document

**Target Skill:** `skill-creator`
**Version:** 2.0 · 2026-08-23
**Source of truth:** `Project_plan/Project_Brief.md`, `DESIGN_FILES/`

---

## 1. Vision

A beautifully crafted, privacy-first family finance app that makes tracking money flows as intuitive as messaging. Premium dark-glassmorphism aesthetics meet clean-architecture reliability — for the family, by the family. Replaces a fragile 7-sheet Excel workbook (15+ accounts, 4 members, 5+ external debtors, ~1.14M BDT assets, ~776K BDT outstanding loans) with structured data and real-time UX.

## 2. Users

| Role | Description |
|------|-------------|
| **Admin** | Family admin. Personal + business accounts; issues and recovers loans. |
| **Father (Father)** | Father. Brac Bank, Standard Bank, bKash; loan relationships. |
| **Mother (Mother)** | Mother. Standard Bank personal. |
| **External debtors** | BTC, External Debtor B, External Debtor C, External Debtor A — members with `is_external = true`. |

Single-device, single-admin app (see SECURITY.md). No multi-user auth in v1.

## 3. Core Features (shipped)

| # | Feature | Status |
|---|---------|--------|
| F1 | Dashboard — total assets, cash-in-hand, active loans, net worth, grouped balances, recent feed | ✅ |
| F2 | Member Profile — account cards (credit-card style), ledger with running balance, scroll-load | ✅ |
| F3 | Loan Receivables — debtor stacks by funding source, progress bars, status | ✅ |
| F4 | Unified Loan System — one `loans` table; lend/borrow both directions; ledger per stack; PDF export | ✅ |
| F5 | Transaction Wizard — Income / Expense / Transfer / Loan tabs, numpad, insufficient-balance warning | ✅ |
| F6 | Recycle Bin — soft-delete all entities, restore, permanent delete, auto-purge (30d) | ✅ |
| F7 | Backup & Safety — ring-buffer restore points, SHA-256 integrity hash, folder sync (File System Access API) | ✅ |
| F8 | Settings — locale-aware formatting, dynamic currency, primary member, wizard constants | ✅ |
| F9 | Mobile-first UI — bottom sheets, bottom nav, responsive tables/cards at ≤768px | ✅ |

## 4. Target Workflows

1. **Record a transaction** → Wizard (FAB/header) → type tab → amount (numpad) → description/date → submit → balances update optimistically.
2. **Issue / track a loan** → Loans screen → unified LoanForm (lender, borrower counterparty, principal) → stack appears with progress bar → repayments logged from same form.
3. **Monthly review** → Dashboard totals → drill into member profile → ledger filters (type/month) → export PDF report.
4. **Recover mistakes** → Recycle Bin → restore or purge → auto-purge after 30 days.
5. **Disaster recovery** → Settings → Restore Points list → restore from ring buffer or synced folder copy; integrity verified via SHA-256 before load.

## 5. Non-Goals (v1)

- Multi-currency (BDT default, but currency is now a setting — no conversion engine)
- Cloud sync / Supabase (schema keeps JSON `metadata` columns for future migration)
- Multi-user auth & roles
- Budgets/goals beyond what exists in Member Profile

## 6. Success Criteria

1. Pixel fidelity to `DESIGN_FILES/*.html` at all 9 breakpoints (360–1920px), zero horizontal scroll.
2. All balance math correct under filtering (running balance computed from full history — see audit BUG-5 lesson).
3. Zero data loss: every destructive action reversible via recycle bin or restore point.
4. App usable one-handed on 360px viewport; desktop layouts unchanged ≥769px.
5. Lint/typecheck/build gates green (`--max-warnings 0`).
6. No user financial data ever committed to git (see SECURITY.md §5).

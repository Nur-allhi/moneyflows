# MoneyFlows — Product Requirement Document

**Target Skill:** `skill-creator`
**Version:** 3.0 · 2026-08-24
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
| F7 | Backup & Safety — ring-buffer restore points, integrity digests, folder sync (File System Access API) | ✅ |
| F8 | Settings — locale-aware formatting, dynamic currency, primary member, wizard constants | ✅ |
| F9 | Mobile-first UI — bottom sheets, bottom nav, responsive tables/cards at ≤768px | ✅ |
| F10 | Durable storage engine — OPFS-backed database + snapshots (localStorage fallback), write coalescing, boot watchdog with recovery actions, storage health indicator | ✅ |

## 4. Target Workflows

1. **Record a transaction** → Wizard → type tab → amount (numpad) → description/date → submit → balances update optimistically.
2. **Issue / track a loan** → Loans screen → unified LoanForm (lender, borrower counterparty, principal) → stack appears with progress bar → repayments logged from same form.
3. **Monthly review** → Dashboard totals → member profile → ledger filters (type/month) → export PDF report.
4. **Recover mistakes** → Recycle Bin → restore or purge → auto-purge after 30 days.
5. **Disaster recovery** → If storage is corrupt or boot stalls: Database Error screen offers **Restore Latest Backup / Reload / Start Fresh** — never a silent hang. Settings shows storage backend + last save time.

## 5. Non-Goals (v1)

Multi-currency conversion engine · cloud sync/Supabase (JSON `metadata` columns kept for future migration) · multi-user auth & roles · budgets beyond Member Profile scope.

## 6. Success Criteria

1. Pixel fidelity to `DESIGN_FILES/*.html` at all 9 breakpoints (360–1920px), zero horizontal scroll.
2. All balance math correct under filtering — running balance computed from full history.
3. Zero data loss: every destructive action reversible via recycle bin, restore point, or backup folder; persistence survives force-kill and reload.
4. Boot can never hang silently: watchdog + visible recovery actions within seconds.
5. App usable one-handed at 360px; desktop layouts unchanged ≥769px.
6. Lint/typecheck/build/test gates green (`--max-warnings 0`, vitest suite).
7. No user financial data ever committed to git (SECURITY.md §5).

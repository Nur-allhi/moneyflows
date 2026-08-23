# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Vitest test runner (`npm test`) with a 10-test regression suite locking loan-ledger
  balance math: user scenario (5,000 → 12,000 → 8,000), real Home EXP fixture,
  backdated-repayment negatives, and no-mutation contract for `sortLoanTransactions`.
- `computeRunningBalances` / `sortLoanTransactions` shared loan-ledger utilities —
  single source of truth used by the ledger UI, PDF export, and report generation.
- Repo management docs: `docs/REPO_RULES.md`, audit register (`docs/audit/`),
  refreshed PRD / TAD / SECURITY / FRONTEND_SPEC / TICKETS (Phase 10 remediation list).

### Changed
- Service worker now uses a **network-first** strategy for pages and scripts with an
  offline cache fallback; only content-hashed `/assets/*` stay cache-first. Cache
  bucket bumped to `moneyflows-v2` so previously installed clients receive updates.
- Loan ledger running balance is computed from the **full transaction history** and
  then filtered for display (previously computed from visible rows only).
- Negative intermediate balances are shown as-is instead of being clamped to zero.
- Report summaries (`totalLent` / `totalRepaid` / outstanding) are derived from full
  history regardless of type filters.

### Fixed
- **Loan ledger row-wise Balance column mismatching** — root cause: the mobile ledger
  filter memo reused the shared sorted array and sorted it descending in place,
  reversing it before balances were computed. Balances in the UI and exported PDF now
  match row-by-row (credit adds, debit subtracts) and agree with the summary card.
- Report totals showed `totalRepaid = 0` when a type filter was active.
- `.gitignore` now covers user data exports and debug artifacts (`USER_DATA/`,
  `db_b64.txt`, `view_db.cjs`, `dashboard`) to prevent accidental commits of real
  financial data (see `docs/SECURITY.md` §5).

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **OPFS-backed storage layer** (`src/infrastructure/database/storage/`): database and
  auto-backup snapshots now persist as real files in the Origin Private File System
  (Chrome/Edge/Android), with automatic one-time migration from the legacy
  localStorage copy (which is kept as a transition mirror). Falls back to hardened
  localStorage on browsers without OPFS.
- Boot **watchdog**: a hung startup now shows a Database Error screen with
  *Restore Latest Backup* / *Start Fresh* actions instead of an endless splash.
- Storage health row in Settings → backend type, last save time, failure warning.
- Vitest suites for the storage adapters and digest helpers (19 tests total).

### Changed
- Persistence is **write-coalesced**: mutations mark the store dirty and flush once
  per tick (plus explicit flush at the end of every mutating operation and on page
  hide) instead of serializing the whole database after every SQL statement.
- Snapshot integrity uses SHA-256 where `crypto.subtle` exists, with a deterministic
  FNV fingerprint fallback on insecure origins so corruption detection keeps working.
- Boot recovery no longer uses blocking `window.confirm()`; failures surface in the
  error screen. Restore/import success refreshes from the calling UI.

### Fixed
- **BUG-7 (CRITICAL)**: deleting transactions could permanently freeze an installed
  PWA on the splash screen — caused by per-statement full-database saves exhausting
  quota (silently swallowed), leaving corrupt persisted state that triggered an
  invisible blocking dialog during boot recovery. Full analysis:
  `docs/plans/STORAGE_OPFS_MIGRATION.md`, `docs/audit/FINDINGS.md` BUG-7.

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

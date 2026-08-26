# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Account editing and deletion** (T-102/T-103): pencil action on every account card
  (desktop + mobile selector) opens an edit modal — rename, change type, or delete.
  Deletion is a soft-delete into the Recycle Bin with an inline confirm that shows how
  many transactions/loan movements reference the account; restorable for 30 days.
- Deleted-account fallback: ledgers, reports and detail views now render
  "(deleted account)" instead of raw IDs for history rows.

### Fixed
- Add-Account: new account's balance now shows immediately after saving (accounts store
  is refreshed instead of waiting for the next remount).

## [1.0.0] - 2026-08-24

First stable release. Family finance ledger with unified loan tracking, mobile-first
glassmorphism UI, local-first SQLite persistence hardened with OPFS storage, automatic
restore points and folder sync, PWA support, and a full regression test suite.

### Added
- **OPFS-backed storage layer** (`src/infrastructure/database/storage/`): database and
  auto-backup snapshots persist as real files in the Origin Private File System, with a
  one-time migration from the legacy localStorage copy (kept as transition mirror) and an
  automatic fallback for browsers without OPFS.
- Boot **watchdog**: hung startups show a Database Error screen with *Restore Latest
  Backup* / *Start Fresh* actions instead of an endless splash.
- Storage health row in Settings → backend type, last save time, failure warning.
- App version footer in Settings plus a "What's New" modal shown once per release,
  re-openable anytime from Settings.
- Vitest suite (19 tests) covering loan-ledger balance math, storage adapters, digests,
  and the no-mutation contract for shared sort helpers.
- Unified loan system: per-debtor stacks, repayment progress, ledger with running
  balance from full history, PDF export.
- Mobile-first UI across all screens (bottom sheets, bottom nav, responsive tables).
- Data safety: ring-buffer restore points on save, integrity digests, optional folder
  sync via the File System Access API.

### Changed
- Service worker uses a **network-first** strategy for pages and scripts with offline
  cache fallback; only content-hashed `/assets/*` stay cache-first (`moneyflows-v2`).
- Loan ledger running balance is computed from the **full transaction history**, then
  filtered for display; negative intermediates render as-is.
- Persistence is **write-coalesced** (per-tick flush + explicit op-end flush) instead of
  serializing the database after every SQL statement.
- Snapshot digests use SHA-256 where `crypto.subtle` exists, falling back to a
  deterministic FNV fingerprint on insecure origins.

### Fixed
- **BUG-7**: deleting transactions could permanently freeze an installed PWA on the
  splash screen (quota-swallowing saves + invisible blocking dialog during recovery).
- Loan-ledger row-wise Balance mismatch — shared array was sorted in place before
  balances were computed; totals also lied under filters.
- Edit-modal hooks-order crash; hardcoded member fallback now honors the primary-member
  setting; counterparty creation errors surface inline.

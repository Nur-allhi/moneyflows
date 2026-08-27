# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Placeholder for upcoming changes.

## [1.4.0] - 2026-08-27

### Added
- **Other Ledgers v1** — new section `/other-ledgers` with ledger index and detail — create ledger (name 3–50, starting date, owner Member or Other person, opening balance), grouped by owner on the index (avatar + count · total per owner), two entry points (global + picker with ledger dropdown and per-ledger + pre-locked), `Date|Description|Debit|Credit|Balance` table with running balance from full history, search, `SegmentedTabs` All/Debit/Credit, `MobileLedger` on mobile, PDF export, Recycle Bin, and `OPFS` persistence. Schema `other_ledgers` + `other_ledger_entries` (incl. `linkedTransactionId` NULL for future dual-post V2 — see `docs/plans/OTHER_LEDGERS_FUTURE_V2.md`).
- Loan ledger now grouped into **Internal** and **External** glass containers (same as Other Ledgers) with sort via picker `Alphabetically / Last transaction / Last repayment` — avatars now use the same `ledgerGradient` as Other Ledgers.
- Group ledger page now mirrors the Other Ledger detail — same header (`LedgerSearch` + `Download PDF` hover-expand + filters) and `MobileLedger` structure.

### Changed
- Other Ledger index header: title removed, short search + Entry + New Ledger in one right-aligned line; ledger count left.
- Other Ledger detail header: second back button removed (banner back remains), `Download PDF` and `+ Add Entry` now `30px` circles expanding to pills on hover (same as account ledger `pdfBtn`), filter redesigned to glass pills with icons, three header icons now same `30px` size.
- Entry form: description field taller (`textarea rows=3 minHeight 88px`), Date now `DatePicker` (`Popover` + `Calendar` `PPP`) same as transaction wizard, Tag now centered `pickerOverlay/pickerModal` (was absolute dropdown).

### Fixed
- Header breadcrumb for `Groups/<id>` and `Other Ledgers/<id>` now shows names (`Groups/<Group Name>`, `Other Ledgers/<House Rent>`) instead of raw UUIDs — `AppLayout` now reads `OtherLedgerStore` + `getAccountGroupsWithMembers()`.

## [1.3.0] - 2026-08-26

### Added
- Dedicated Settings page `/settings` with sub-navigation — General, Dashboard, Activity, Backup, Storage, About — like any other page (not a modal), gear `18px` in header right navigates there.
- Dashboard visibility toggles in Settings → Dashboard — show/hide *Where Your Money is*, *Recent Transactions*, *Active Loans*; hidden panels free space via `data-cols` `3fr 6fr 3fr → 1fr 1fr → 1fr`.
- Activity log in Settings → Activity — last `1000` user actions, paginated `10` per page in `320px` scroll container (`logContainer`), `Prev/Next`.
- App log backdoor in Settings → About — `Detailed logs` switch (`Verbose` → `Detailed logs`), `Export Logs` NDJSON download, `Clear Logs`, paginated `10` per page with `level/cat`.

### Changed
- Dashboard action bar now shows two buttons only — *New Transaction* + *Quick Loan* share `50/50` (`flex:1`); Settings entry removed (header gear is entry).
- Settings page duplicate title removed — header already shows `Back + Settings` breadcrumb.

## [1.2.0] - 2026-08-26

### Added
- Unified search: dashboard searches **all** transactions (`description + amount + type + account + member + tags + date`) via shared `matchesTx`, debounced `200ms`, with violet `Highlight` (`<mark>`). Each ledger (`MemberProfile`, `GroupLedger`, `LoanDetail`, `TagLedger`) has its own ledger-scoped search (same fields, highlighted) with pagination fixed (search **before** slice so no hidden hits). Groups/Loans/Members/Recycle lists decoupled from global `useSearchStore` (`effectiveSearch = mobileSearch` only) and highlight their names.
- Shared search utils: `highlight.tsx` + `search.ts` + `useDebouncedValue.ts`; token `--color-primary-mark` `/0.28`.
- Single app logo: header `MoneyFlows` gradient transplanted into sidebar `brandSlot`; header off-dashboard shows `Back + breadcrumb` (header owns navigation, sidebar owns brand).
- Splash `36px` now matches sidebar `22px` logo (`135deg primary→income` gradient `Money` + `500` secondary `Flows`).

### Changed
- Playwright harness: `@playwright/test 1.54`, `playwright.config.ts` with `reuseExistingServer`, `workers:4`, `auth.setup.ts` tiny deterministic DB (`12` txs) via `seedTinyB64`, `storageState` reuse — `12s` parallel vs `2min` MCP serial.
- Layout gaps tightened so every section gets more room: outer frame `24→16`, header→content & content children `24→12`, dashboard duplicate date column removed (desktop hides `txType` badge, keeps `shortDate`).
- Header search hidden off-dashboard (`isDashboard && searchWrap`), blank center `flex:1` filler keeps `right` at edge.

## [1.1.0] - 2026-08-24

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

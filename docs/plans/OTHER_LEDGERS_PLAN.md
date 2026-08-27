# Other Ledgers — V1 Plan (Approved 2026-08-27)

**Status:** Approved — next to build (Phase 13, T-113..T-118)
**Nav name:** `Other Ledgers` (Sidebar: `Loans → Other Ledgers → Tags`; mobile: More sheet)
**Owner model:** Member OR free-text Other person (Option B)
**Storage:** Separate tables `other_ledgers` + `other_ledger_entries` with `linkedTransactionId NULL` forward-compat for V2 dual-post (see `OTHER_LEDGERS_FUTURE_V2.md`)
**Behavior v1:** Standalone — entries do NOT affect account balances (Decision 3A)

---

## 1. Vision

A manual register book inside the app. User creates named ledgers (e.g., "House Rent", "Shop Due — Jamal") owned by a family member or an external person, then posts Debit/Credit rows themselves. Running Balance is computed oldest→newest, just like Member/Loan ledgers.

---

## 2. Data Model (v1)

```sql
CREATE TABLE other_ledgers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 3 AND 50),
  owner_type TEXT NOT NULL CHECK(owner_type IN ('member','external')),
  owner_member_id TEXT REFERENCES members(id) NULL,
  owner_name TEXT NULL,
  starting_date TEXT NOT NULL,
  opening_balance REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL
);

CREATE TABLE other_ledger_entries (
  id TEXT PRIMARY KEY,
  ledger_id TEXT NOT NULL REFERENCES other_ledgers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL CHECK(length(description) BETWEEN 1 AND 200),
  debit REAL NOT NULL DEFAULT 0 CHECK(debit >= 0),
  credit REAL NOT NULL DEFAULT 0 CHECK(credit >= 0),
  balance REAL NOT NULL DEFAULT 0,
  linkedTransactionId TEXT NULL REFERENCES transactions(id) ON DELETE SET NULL, -- NULL in v1
  metadata JSON, -- { tags: string[] }
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL,
  CHECK(debit = 0 OR credit = 0),
  CHECK(debit + credit > 0)
);
CREATE INDEX idx_other_entries_ledger_date ON other_ledger_entries(ledger_id, date);
CREATE INDEX idx_other_entries_link ON other_ledger_entries(linkedTransactionId);
```

Domain: `src/otherLedgers/domain/types.ts` — `OtherLedger`, `OtherLedgerEntry` interfaces.

---

## 3. Routes & Navigation

```
/other-ledgers            Index — card grid of all ledgers
/other-ledgers/:id        Detail — header + Date|Description|Debit|Credit|Balance table
```

Sidebar: `Dashboard → Members → Loans → Other Ledgers → Tags → Recycle` (tag-icon variant, `stroke 1.8`). Header `routeTitles` entry. BottomNav `More` sheet includes Other Ledgers.

---

## 4. Screens (v1)

### Index `/other-ledgers`
- Header with `+ Add New Ledger` button (desktop) / FAB-style `+` (mobile) → opens `Create Ledger` modal.
- Card grid: Name, Owner (avatar if member, initial circle if external with `ACCOUNT_TYPE_GRADIENT`-style fallback), Starting Date (`shortDate`), Current Balance (mono, coral/teal), Entry count, Last updated.
- Empty: "No ledgers yet — create your first register".
- **Global +** on index header: opens `Add Entry` modal with **Ledger picker** (choose which ledger to post to).
- Search bar (ledger-scoped): filters cards by name/owner.

### Detail `/other-ledgers/:id`
- Hero: Name, Owner, Starting Date, Current Balance (large mono), Entry count.
- **Per-ledger +** in header: opens `Add Entry` pre-locked to this ledger (no picker).
- Table: `Date | Description | Debit | Credit | Balance` — virtualized like `LedgerTable`, running Balance from full history then filtered.
- Toolbar: search (description/amount/date/tags), type filter not needed (Debit/Credit are the type), date range optional.
- Row actions: Edit (pencil) → edit modal, Delete (trash) → confirm → soft-delete → Recycle Bin.
- Footer: `Export PDF` (same `jspdf` pattern as LoanDetail).
- Empty: "No entries yet — tap + to add first row".

### Create Ledger Modal
Fields: `Ledger Name` (3–50), `Starting Date` (date picker, default today), `Whose ledger is this?` (Member picker OR Other person free text with name input), `Opening Balance` (number, default 0). Validation client+DB.

### Add/Edit Entry Modal
Fields: `Date` (≥ Starting Date), `Description` (1–200), `Type` toggle `Debit | Credit` + `Amount` (AmountInput + Numpad, `>0`), `Tags` (optional, reuses `useTagStore` picker). Edit pre-fills.

---

## 5. Service & Store

- `IDatabaseService` additions: `getOtherLedgers()`, `getOtherLedgerById(id)`, `saveOtherLedger(l)`, `deleteOtherLedger(id)` (soft), `getOtherLedgerEntries(ledgerId)`, `saveOtherLedgerEntry(e)`, `deleteOtherLedgerEntry(id)` + `purgeExpiredItems` covers them.
- `OtherLedgerService` (`src/otherLedgers/application/OtherLedgerService.ts`): `createLedger`, `createEntry` (computes Balance), `updateEntry`, `deleteEntry`, `getLedgerWithEntries`, `computeRunningBalances` (shared util, no in-place sort).
- `useOtherLedgerStore` (Zustand): `ledgers`, `entriesByLedger`, `fetchLedgers()`, `fetchEntries(ledgerId)`, `createLedger()`, `createEntry()`, `updateEntry()`, `deleteEntry()` — optimistic, re-fetch on mount.

---

## 6. Integration

- **Backup:** Both tables in same SQLite file → automatic OPFS + snapshots + FolderSync coverage. No extra adapter work.
- **Recycle Bin:** New tab `Other Ledgers` + entries appear under `All`. Restore/purge via `deleted_at`.
- **Search:** `search.ts` `matchesEntry()` for Other Ledger entries (description/amount/date/tags/ledgerName) + `Highlight` violet mark.
- **Design Identity:** Every new component passes `DESIGN_IDENTITY.md §17` — glass cards 16px/20px mobile, modal/sheet pair at 768, overlay `oklch 0.55 blur4 z300`, picker `360/85vw blur24`, `stroke 1.8` icons, `0.2–0.35s` motion, 9 viewports no overflow.
- **File size:** Each file ≤300 LOC, CSS Modules + custom props, no `style={{}}`.

---

## 7. Tickets (Phase 13)

See `docs/TICKETS.md` Phase 13 — T-113..T-118. Build order: T-113 → T-114 → T-115 → T-116 → T-117 → T-118.

---

## 8. Acceptance (v1 done when)

1. Create ledger with Member or Other person → appears in index with correct owner display.
2. Add Debit 5,000 then Credit 12,000 → table shows Date|Description|Debit|Credit|Balance with running Balance 5,000 → -7,000? (negative allowed, no clamp) — chronological.
3. Global + (with picker) and per-ledger + (pre-locked) both work; edit/delete entry updates Balance correctly.
4. Export PDF matches table; Recycle Bin restores.
5. `typecheck` / `lint --max-warnings 0` / `build` / `vitest` green.

---

*Approved: 2026-08-27 · Future V2 in `OTHER_LEDGERS_FUTURE_V2.md`.*

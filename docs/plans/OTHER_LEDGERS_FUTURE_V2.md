# Other Ledgers — Future V2 (Next Update)

**Status:** Planned — do NOT build until user says "build V2 / next update"
**Parent feature:** Other Ledgers v1 (`docs/plans/OTHER_LEDGERS_PLAN.md` — standalone manual ledgers under `/other-ledgers`)
**Owner decisions locked:** Sidebar = `Other Ledgers` · Storage = separate tables (`other_ledgers` + `other_ledger_entries`) with `linkedTransactionId` · Owner = Member OR free-text Other person · v1 = standalone (no account impact)

> **Agent instruction:** When user asks "what's next to update / what's for new update / next feature", answer from THIS file — summarize V2 below. Do not re-propose V1. Ask confirmation before coding (per `AGENTS.md §3.10`).

---

## 1. Goal (one sentence)

Let one real money movement hit **two places at once** — e.g., "Pay House Rent 15,000 from Brac Bank" automatically creates both (a) the account transaction (`Brac Bank -15,000`) and (b) a row in the `House Rent` Other Ledger (`Credit 15,000`), linked so they stay in sync.

---

## 2. Why v1 prepared for this

v1 schema already has forward-compat column:

```sql
other_ledger_entries.linkedTransactionId TEXT NULL REFERENCES transactions(id) ON DELETE SET NULL
```

- v1: all entries have `linkedTransactionId = NULL` — ledger is standalone, no account balance change.
- v2: when user opts into linking, new entries get `linkedTransactionId = <real transaction id>`.

No migration needed for v2 — just start writing the column.

---

## 3. User Flow (v2)

### A. Create normal transaction with ledger link
1. Open Transaction Wizard (`New Transaction` / FAB) → pick tab `Expense` (or Income/Transfer).
2. Fill `Source = Brac Bank`, `Amount = 15,000`, `Description = House rent July`, `Date`.
3. **New toggle row:** `Also post to Other Ledger [ ]` — unchecked by default.
4. When checked → dropdown appears: searchable list of existing Other Ledgers (`House Rent`, `Shop Due — Jamal`, etc.) + `Create New Ledger` inline.
5. Select `House Rent` → choose side `Debit or Credit` for the ledger (defaults opposite of account side: Expense → Credit in rent ledger).
6. Submit → app does **two writes atomically** (single `flush()`):
   - `transactions` row for Brac Bank
   - `other_ledger_entries` row for House Rent with `linkedTransactionId = tx.id`

### B. Manage linked rows
- **Other Ledger Detail** shows linked rows with a small link icon `↔ Brac Bank` + tooltip "Linked to Brac Bank transaction". Clicking the icon opens the source transaction detail.
- **Edit:** Editing the source transaction (amount/description/date) prompts: `Update linked ledger entry too? [Yes / No / Unlink]` — Yes updates both, Unlink clears `linkedTransactionId`.
- **Delete:** Deleting source transaction from Recycle Bin offers `Delete linked ledger row too?` or keep it (becomes standalone).
- **Filter:** Other Ledger detail gets a filter chip `Linked only / Standalone only / All`.

### C. No forced linking
- Creating entries directly inside `Other Ledger Detail → +` stays standalone (`linkedTransactionId = NULL`) — unchanged from v1.
- User can retroactively link an existing ledger entry to a past transaction via `Edit entry → Link to transaction` picker.

---

## 4. Schema (already in v1, no change)

```sql
CREATE TABLE other_ledgers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 3 AND 50),
  owner_type TEXT NOT NULL CHECK(owner_type IN ('member','external')),
  owner_member_id TEXT REFERENCES members(id) NULL,
  owner_name TEXT NULL, -- when external
  starting_date TEXT NOT NULL, -- YYYY-MM-DD
  opening_balance REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL
);

CREATE TABLE other_ledger_entries (
  id TEXT PRIMARY KEY,
  ledger_id TEXT NOT NULL REFERENCES other_ledgers(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  description TEXT NOT NULL CHECK(length(description) BETWEEN 1 AND 200),
  debit REAL NOT NULL DEFAULT 0 CHECK(debit >= 0),
  credit REAL NOT NULL DEFAULT 0 CHECK(credit >= 0),
  balance REAL NOT NULL DEFAULT 0, -- computed, not user input
  linkedTransactionId TEXT NULL REFERENCES transactions(id) ON DELETE SET NULL,
  metadata JSON, -- { tags: string[] }
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL,
  CHECK(debit = 0 OR credit = 0), -- one side per row
  CHECK(debit + credit > 0)
);
CREATE INDEX idx_other_entries_ledger_date ON other_ledger_entries(ledger_id, date);
CREATE INDEX idx_other_entries_link ON other_ledger_entries(linkedTransactionId);
```

---

## 5. Service Changes (v2 tickets)

| Area | Change |
|------|--------|
| `IDatabaseService` | `saveOtherLedgerEntry()` already exists from v1; v2 adds `saveTransactionWithLedgerLink(tx, ledgerId, side)` transactional helper |
| `TransactionService` / `useTransactionStore` | After `saveTransaction()` succeeds, if toggle on, call `saveOtherLedgerEntry({ ..., linkedTransactionId: tx.id })` before `flush()` |
| `OtherLedgerService` | `updateLinkedEntry(entryId, txPatch)`, `unlinkEntry(entryId)`, `getLinkedTransaction(entry)` |
| `Recycle Bin` | Purge must handle `ON DELETE SET NULL` — linked entry becomes standalone, not deleted |
| `Search` (`search.ts` `matchesTx`) | Already indexes Other Ledger entries via v1; v2 adds cross-link display text `"↔ Brac Bank"` to highlight |

---

## 6. UI Changes (v2)

- `TransactionFormModal.tsx` — new `Also post to Other Ledger` switch + searchable ledger dropdown (reuses modal picker pattern `DESIGN_IDENTITY.md §9`: trigger 14/10 → overlay z350 → 360/85vw blur24)
- `OtherLedgerDetail.tsx` — link icon + filter chips + edit-unlink flow
- `TransactionDetailModal.tsx` — shows "Also posted to: House Rent (Credit 15,000)" when `linkedTransactionId` exists

---

## 7. Tickets for V2 (when user says "build next update")

| Ticket | Title | Skill | Effort |
|--------|-------|-------|--------|
| T-119 | `Also post to Other Ledger` toggle + ledger picker in Transaction Wizard (with create-new inline) | `senior-frontend`, `ui-ux-pro-max` | M |
| T-120 | Atomic dual-write `saveTransactionWithLedgerLink()` + `OtherLedgerService` link helpers | `senior-backend` | M |
| T-121 | Link badge + cross-navigation in Other Ledger Detail & Transaction Detail | `senior-frontend` | S |
| T-122 | Edit/Delete sync prompt (update / unlink / keep standalone) + Recycle Bin handling | `senior-frontend`, `senior-backend` | M |
| T-123 | Ledger filter chips (All / Linked / Standalone) + search highlight for link text | `senior-frontend` | S |

Dependencies: `T-119 → T-120 → T-121 → T-122 → T-123`. No schema migration — column already exists.

---

## 8. Acceptance (V2 done when)

1. Creating `Brac Bank → House Rent 15,000` from wizard creates 1 account tx AND 1 ledger row with matching amount/date/description and `linkedTransactionId` set — verified by opening both ledgers.
2. Brac balance decreases, House Rent balance increases (standalone ledger math), both visible.
3. Editing source tx prompts to update linked row; deleting prompts to delete/unlink.
4. Direct `Other Ledger → +` still creates standalone `NULL`-linked rows.
5. `typecheck / lint --max-warnings 0 / build / vitest` green.

---

## 9. What to tell the user when they ask "what's next?"

> V2 is **Other Ledgers — Account Linking (dual-post)**. One transaction can hit both a real account (Brac Bank) and a manual ledger (House Rent) at once via a new "Also post to Other Ledger" toggle in the wizard. Schema is already ready (`linkedTransactionId`), so it's 5 tickets (T-119..T-123). Want me to start?

---

*Last updated: 2026-08-27 · Owner approved Decision 1=Option B (separate tables), Decision 2=Option B (member+external), Decision 3=standalone v1.*

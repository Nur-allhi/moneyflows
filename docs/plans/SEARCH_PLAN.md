# Search Expansion — Global (all transactions) + Ledger-Scoped

**Status:** Approved · **Created:** 2026-08-26 · **Branch:** `dev`
**Source:** User request — dashboard search currently scopes to `recentTxs` slice only; ledgers search `description` only; no highlighting.

---

## 1. Problem

| Area | Current | Gap |
|------|---------|-----|
| **Dashboard global** `useSearchStore.ts:1` `Dashboard.tsx:219,237` | `Header.tsx:40` + `SearchBar.tsx:4` share one `query`. Dashboard filters `accountsByMember.name/member.name:229`, `recentTxs.description:239` (slice of 7 `DASHBOARD_TX_DISPLAY_LIMIT:155`), `loanStacks.debtorName:246` | Older transactions hidden by slice; no amount/type/account/tag/date; no highlight |
| **Ledger local** `MemberProfile.tsx:43,284` `GroupLedgerScreen.tsx:50,90` `LoanDetailView.tsx:42,87` | Local `ledgerQuery` → `description.includes` after `displayedTxs.slice(-limit):147` | Window hides hits; ignores `resolveAccountDisplay:202` amount/tag/date; `TagLedgerScreen.tsx` has no text search |
| **Groups/Loans list** `GroupsListScreen.tsx:123` `LoansScreen.tsx:34` | `effectiveSearch = mobileSearch \|\| globalQuery` → `name/debtorName` only | Global leaks into list; no highlight |
| **DB** `IDatabaseService.ts:6` `SQLiteDatabaseService.ts:484` | `TransactionFilter` exact-match only, no `LIKE`/`FTS`, no index on `description` | No server search path |
| **Highlight** | None | No `<mark>` component |

---

## 2. Goals

1. **Dashboard search = ALL transactions** in DB (not `recentTxs` slice), with keyword highlighted in every hit.
2. **Ledger search = that ledger only** (member / group / loan detail / tag ledger), widened fields + highlighted, pagination-aware (no hidden hits).
3. Familiar identity: highlight, empty states, motion, tokens per `docs/DESIGN_IDENTITY.md`.

---

## 3. Decisions (approved)

| # | Decision | Chosen |
|---|----------|--------|
| D1 | Scope engine | **Client-side `matchesTx` first** (covers `description + amount + type label + accountDisplay + member + tags + date`). DB `LIKE` + index deferred to S-5 when dataset >1k. |
| D2 | Global UX | **Inline inline** — when `query≠''` dashboard still shows 3 sections but Transactions section searches `transactions` (all) then slices to `DASHBOARD_TX_DISPLAY_LIMIT`; add count `"3 transactions match 'x'"`. Full panel route deferred. |
| D3 | Ledger UX | **Isolated** — ledger `ledgerQuery` owns its view, ignores `useSearchStore`. Widen + highlight; slice applied **after** filter. Remove OR leakage in Groups/Loans. |
| D4 | Highlight style | **Violet translucent** `<mark>` — `oklch(62% 0.22 290 /0.25) radius 3 + glow`, token `--color-primary-mark`. Per `DESIGN_IDENTITY.md §3 violet=interaction`. |
| D5 | Debounce | **200ms** `useDebouncedValue` (`--transition-fast 0.2s` `tokens.css:78`). |
| D6 | Normalization | `toLowerCase().trim().normalize('NFKD')`, escaped regex, no fuzzy v1. |

**Interference rule:** Header `query` drives **only** Dashboard. Ledger inputs drive their ledger only.

---

## 4. Target Architecture

```
Header input (useSearchStore.query) ──► Dashboard: filter transactions(all)/accounts/loans + Highlight
LedgerSearch local ledgerQuery ──────► MemberProfile / GroupLedger / LoanDetail / TagLedger: filter displayed ledger + Highlight
```

**New shared code:**

```text
src/presentation/utils/
├── highlight.tsx        Highlight({text, query}) — escaped regex, <mark className={styles.mark}>
├── highlight.module.css .mark { oklch 62% 0.22 290 /0.25; radius 3; glow }
├── search.ts            matchesTx(tx, q, {accountMap, memberMap, resolveAccountDisplay, shortDate}) + matchesAccount + matchesLoanStack
└── useDebouncedValue.ts useDebouncedValue<T>(v, 200)
```

**Stores:**
- Keep `useSearchStore.ts:8` as is; derive `debouncedQuery` via hook.
- Ledgers keep `useState ledgerQuery` + debounced variant.

**DB v2 (deferred S-5):**
```ts
// IDatabaseService.ts:68
getTransactions(f: TransactionFilter & { search?: string })
// SQLiteDatabaseService.ts:484
AND (description LIKE '%'||$search||'%' OR json_extract(metadata,'$.tags') LIKE '%'||$search||'%')
CREATE INDEX idx_transactions_description ON transactions(description)
```

---

## 5. Tickets

| Ticket | Title | Skill | Effort | Files |
|--------|-------|-------|--------|-------|
| S-1 | Highlight primitive + token | `ui-ux-pro-max`, `frontend-design` | S | `utils/highlight.tsx`, `utils/highlight.module.css`, `styles/tokens.css` |
| S-2 | Dashboard: search ALL transactions + highlight | `senior-frontend`, `ui-ux-pro-max` | M | `Dashboard.tsx:237-249`, `utils/search.ts`, `utils/useDebouncedValue.ts` |
| S-3 | Ledgers: widen + highlight + pagination fix | `senior-frontend`, `ui-ux-pro-max` | M | `MemberProfile.tsx:43,284`, `GroupLedgerScreen.tsx:90`, `LoanDetailView.tsx:87`, `TagLedgerScreen.tsx`, `LedgerTable.tsx`/`MobileLedger.tsx` |
| S-4 | Groups/Loans: decouple from global + highlight | `senior-frontend` | S | `GroupsListScreen.tsx:123`, `LoansScreen.tsx:34`, `MemberList.tsx`, `RecycleBin.tsx` |
| S-5 | (Deferred) DB LIKE + index on description/tags | `senior-backend` | S | `IDatabaseService.ts:6`, `SQLiteDatabaseService.ts:484` |

**Dependencies:** S-1 → (S-2 ∥ S-3) → S-4 → S-5 (optional, trigger: `transactions.length > 1000`).

### Ticket detail

#### S-1 — Highlight primitive
**Content:**
1. Token `--color-primary-mark: oklch(62% 0.22 290 /0.25)` in `tokens.css:7`.
2. `utils/highlight.tsx` — `escapeRegExp`, split by `(escaped)`, wrap matches in `<mark className={styles.mark}>`, memo.
3. `utils/highlight.module.css` — `.mark { background: var(--color-primary-mark); color: var(--color-text); border-radius: 3px; padding: 0 2px; font-weight: 600; box-shadow: 0 0 8px var(--color-primary-glow); }`

**Acceptance:** Unit renders `“Opening Balance”` with `open` highlighted (case-insensitive, `.` escaped), no XSS.

#### S-2 — Dashboard all-transactions
**Content:**
1. `utils/search.ts` — `matchesTx` checks `description`, `amountStr`, `displayTxType`, `accountDisplay` via `accountMap/memberMap`, `tags` array, `shortDate`.
2. `Dashboard.tsx:237` — `filteredRecentTxs = debouncedQ ? allTxs.filter(matchesTx).sort(DESC).slice(0, LIMIT) : recentTxs`; `filteredAccountsByMember` also matches `type`? keep name-first.
3. Wire `useDebouncedValue(searchQuery, 200)`.
4. Render `Highlight` on `txDesc`, `acctName`, `debtorName`; show count badge `“3 matches”`; empty `"No matches for 'q'"` + Clear.

**Acceptance:** Query `“500”` finds amount 500 outside recent slice; `“bKash”` finds via `resolveAccountDisplay`; highlight visible at 360/1920.

#### S-3 — Ledger-scoped widen
**Content:**
1. MemberProfile `filteredLedger:284` / `filteredTxs:291` — run `matchesTx` (same util) **before** `displayedTxs.slice`; fix pagination: `searchFiltered = matchesTx(sortedTxs)` then `displayed = searchFiltered.slice(-limit)`.
2. GroupLedger `90-115`, LoanDetail `87-126`, TagLedger (add `ledgerQuery` input) — same pattern: `shortDate + amount + tags + accountDisplay`.
3. Pass `query` into `LedgerTable`/`MobileLedger` rows and replace plain `description` with `<Highlight query text />`.
4. PDF `downloadPdf` keeps current filter but does not carry highlight (DOM only).

**Acceptance:** Member ledger search `“bKash”` matches ledger rows via account display; highlight in `txDesc`; `displayLimit` no longer hides hits; balance math unchanged.

#### S-4 — Decouple Groups/Loans
**Content:**
1. `GroupsListScreen.tsx:123` `LoansScreen.tsx:34` — drop `effectiveSearch = mobileSearch \|\| globalQuery`; each screen owns `mobileSearch/query` only (or keep global but only on Dashboard). Update `MemberList/RecycleBin` similarly.
2. Add `Highlight` on `group.name`, `debtorName`.

**Acceptance:** Typing global Header no longer filters `/groups` or `/loans`; ledger inputs alone drive those lists; highlight visible.

#### S-5 — DB LIKE (deferred)
**Content:** Add `search` to `TransactionFilter`, `LIKE` on `description` + `json_extract(metadata,'$.tags')`, index. Gate behind size.

---

## 6. Risks & Mitigations

- Highlight must not break `formatAmount` mono spans — apply only to text fields.
- `displayLimit` after filter avoids hidden hits; keep `IntersectionObserver` sentinel after filtered set.
- S-1 is ≤50 LOC; S-2/S-3 reuse `search.ts` to avoid duplication (was 6 duplicated `description.includes`).

## 7. Verification

- Unit: `matchesTx` cases (amount numeric, tag, account display, date, case), `escapeRegExp`.
- E2E: Dashboard `q=“travel”` highlights in Recent; ledger `q=“groceries”` highlights in MemberProfile ledger only; global `q` does not filter `/groups`.
- Gates: `typecheck`, `build`, `lint --max-warnings 0`, no horizontal overflow at 360/1920.

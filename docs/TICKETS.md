# MoneyFlows — Feature Ticket List

**Version:** 3.2 · 2026-08-27
All tickets T-001…T-118 + Search S-1..S-4 are **complete** (Phase 13 Other Ledgers v1 shipped on `2c8957c`). Full historical specs live in git history (`git log -- docs/TICKETS.md`); audit context in `docs/audit/FINDINGS.md`. Next: Other Ledgers V2 dual-post (T-119..T-123) in `docs/plans/OTHER_LEDGERS_FUTURE_V2.md` — build on "next update".

---

## Completed Phases Index

| Phase | Theme | Tickets |
|-------|-------|---------|
| 1 | Foundation — schema, DB service, shell, dashboard, members, loans v1, wizard, recycle bin | T-001–T-030 |
| 2 | Groups, budgets/goals, polish | T-031–T-042 |
| 3 | Dynamic Configuration & Hardening (settings store, locale/currency, constants) | T-043–T-050 |
| 4 | Unified Loan System rewrite (`src/loans/`) | T-051–T-059 |
| 5 | Data Backup & Safety (restore points, integrity, FolderSync) | T-060–T-064 |
| 6 | Mobile Screen UI (bottom sheets, nav, responsive) | T-065–T-083 |
| 7 | Audit Remediation & Hardening (BUG-6, gates → `--max-warnings 0`, vitest) | T-084–T-091 |
| 8 | Storage Overhaul — OPFS migration, write coalescing, BUG-7 freeze fix | T-093–T-101 |
| 9 | v1.0.0 release + Account Edit/Delete + What's New modal | T-102–T-106 |

## Completed — Phase 12 (v1.1.0): UX Completeness Batch (2026-08-24)

### T-102 - App version in Settings — **Complete**
`__APP_VERSION__` injected via Vite define from package.json; muted footer line. Crash-safe read via `constants/appVersion.ts`.

### T-103 - What's New modal on update — **Complete**
Auto-opens once per version change (`lastSeenVersion` in AppSettings); plain-English bullets in `constants/whatsNew.ts`; top-left cross close; re-openable from Settings row; first installs included.

### T-104 - Account edit & delete UI — **Complete**
Pencil action on every account card (desktop grid + mobile selector) opens `EditAccountModal`: rename / change type / danger-zone delete with transaction & loan-movement counts and two-step confirm. Soft-delete → Recycle Bin (restorable 30 days).

### T-105 - Deleted-account labeling — **Complete**
Ledgers, detail modals, group screens, loan reports and PDFs render "(deleted account)" instead of raw IDs for history rows referencing a deleted account.

### T-106 - BUG-3 fix — **Complete**
Add-Account refreshes the accounts store so the new balance displays immediately.

### T-107 - Wizard pre-fills open ledger account — **Complete** (v1.1.1)
All four transaction-form entry points in MemberProfile pass `initialSource=selectedAccountId`; Income/Expense/Transfer pills also pin their tab. Verified: Bkash ledger → wizard opens with Source=Bkash.

### T-108 - Loan-ledger PDF export detail chooser — **Complete**
Download PDF opens a radio chooser (All details / Just description); choice persists via `settings.reportDetailMode`. Verified: both modes export, content checked, chooser readable on opaque panel.

### T-109 - Transaction tags: create + edit with autocomplete — **Complete**
Single optional tag stored in `metadata.tags`; typed with datalist suggestions from the persisted tag registry (`useTagStore`); editable in TransactionEditModal. Loan-movement tabs untagged for now.

### T-110 - Member ledger tag filter — **Complete**
Tag dropdown in the ledger toolbar (options = registry ∪ tags present in view); filters rows only, balance math untouched.

### T-111 - Family-wide tag browser (`/tags`, `/tags/:tag`) — **Complete**
Cross-member ledger per tag with member/account/description/amount and In/Out totals; reachable from the member toolbar once a tag is selected and via the new sidebar **Tags** nav item.

### T-112 - Tag management UI on the Tags page — **Complete** (v1.1.1)
Create / rename / delete directly on `/tags`: inline create row, per-card ✎ rename (rewrites the tag across all carrying transactions) and 🗑 two-step delete (strips it from transactions). Removed the interim Settings chips section. Sidebar gains a Tags item under Loans.

## Deferred / Open Items

| ID | Title | Skill(s) | Trigger |
|----|-------|----------|---------|
| T-092 | Split oversized files >300 LOC (MemberProfile 887→, TransactionFormModal 898→, SQLiteDatabaseService 739→, Dashboard ~490) — partial via T-130 gradient de-dupe, full splits deferred | `senior-frontend`, `ui-ux-pro-max` | touch when next edited |
| OPEN-A | Remove localStorage transition mirror once one release cycle has shipped on OPFS storage | `senior-backend` | **Done** `c3db41b` (shipped in `v1.5.0` → `v1.6.0` one cycle) |
| OPEN-B | PWA "update ready" toast instead of silent worker claim | `senior-frontend`, `ui-ux-pro-max` | next PWA-focused batch |

## Next Phase — Search Expansion: Global + Ledger-Scoped (S-1…S-5)

Plan: `docs/plans/SEARCH_PLAN.md` (approved 2026-08-26). Dashboard search → all transactions + highlight; ledger search → that ledger only, widened fields + highlight; DB LIKE deferred.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| S-1 | Highlight primitive + `--color-primary-mark` token | `ui-ux-pro-max`, `frontend-design` | S | **Complete** |
| S-2 | Dashboard: search ALL transactions + highlight (fix slice-before-filter, `matchesTx`, debounced) | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** |
| S-3 | Ledgers: widen fields (amount/account/tag/date) + highlight + pagination fix (`MemberProfile` `GroupLedger` `LoanDetail` `TagLedger`) | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** |
| S-4 | Groups/Loans: decouple from global `useSearchStore` (`effectiveSearch = mobileSearch \|\| global` → local only) + highlight | `senior-frontend` | S | **Complete** |
| S-5 | (Deferred) DB `LIKE` on `description`/`metadata.tags` + index — trigger when `transactions.length > 1000` | `senior-backend` | S | Deferred |

Dependencies: S-1 → (S-2 ∥ S-3) → S-4 → S-5. **S-1..S-4 done on dev — highlight + global all-transactions + ledger-scoped widen + pagination fix.**

## Phase 13 — Other Ledgers v1 (Approved 2026-08-27)

Plan: `docs/plans/OTHER_LEDGERS_PLAN.md` (v1 standalone). Future dual-post V2 in `docs/plans/OTHER_LEDGERS_FUTURE_V2.md`. Nav name: **Other Ledgers**.

Storage: separate tables `other_ledgers` + `other_ledger_entries` with `linkedTransactionId NULL` (forward-compat for V2). Owner: Member OR free-text Other person. Behavior: standalone — entries do NOT affect account balances.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| T-113 | Schema + migration: `other_ledgers` / `other_ledger_entries` (incl. `linkedTransactionId` NULL), indexes, seed no-op | `senior-backend` | M | **Complete** (`2c8957c`) |
| T-114 | Domain + `OtherLedgerService` + `useOtherLedgerStore` (CRUD, `computeRunningBalances` no-mutate, `flush` lifecycle) | `senior-backend`, `senior-frontend` | M | **Complete** (`2c8957c`) |
| T-115 | `OtherLedgersIndex` screen `/other-ledgers` — card grid, header `+ Add New Ledger` + global `+` entry picker (ledger dropdown), search | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** (`2c8957c`) |
| T-116 | `OtherLedgerDetail` `/other-ledgers/:id` — hero + `Date|Description|Debit|Credit|Balance` virtual table, per-ledger `+` pre-locked, running balance from full history | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** (`2c8957c`) |
| T-117 | `CreateLedgerModal` + `AddEntryModal` (edit/delete, validation 3–50 / 1–200, date ≥ startingDate, Debit xor Credit >0, tags via `useTagStore`) | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** (`2c8957c`) |
| T-118 | Wiring: Sidebar `Other Ledgers` + BottomNav More sheet + `routeTitles` + Recycle Bin tab + Search `Highlight` + PDF export + Settings health already covers new tables | `senior-frontend` | S | **Complete** (`2c8957c`) |

Dependencies: `T-113 → T-114 → (T-115 ∥ T-117) → T-116 → T-118`. Each file ≤300 LOC, `DESIGN_IDENTITY.md §17` gate, `typecheck/lint --max-warnings 0/build/vitest` green.

Future V2 (not ticketed here): dual-post linking — `Transaction Wizard → Also post to Other Ledger [dropdown]` creating `linkedTransactionId` link (see `OTHER_LEDGERS_FUTURE_V2.md` T-119..T-123). Build only when user says "next update / V2".

## Phase 15 — Cleanup & Optimization (Lean Combo 1A+2A+3A) — In Progress

Plan: `docs/plans/CLEANUP_OPTIMIZATION_PLAN.md` (branch `feature/cleanup-optimization` off `v1.5.0`). Tickets `T-124..T-131` atomic, gates `typecheck/lint/build/vitest` green per REPO_RULES §9.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| T-124 | Hygiene: verify `.gitignore` + remove tracked `dist`/`*.bundle` + `depcheck`/`prune` | `code-reviewer`, `senior-backend` | S | **Complete** (`7145bf6` + verified `git ls-files dist` 0) |
| T-125 | Optimization: lazy-load `jspdf`/`autotable`/`html2canvas`/`Calendar` | `senior-frontend` | S | **Complete** (`a174c9a` dynamic import) |
| T-126 | Remove OPFS `localStorage` transition mirror (`OPEN-A`) | `senior-backend` | M | **Complete** (`c3db41b` single path) |
| T-127 | Split `MemberProfile.tsx` 887 → 4 files | `senior-frontend`, `ui-ux-pro-max` | L | Todo — deferred to next touch (T-092) |
| T-128 | Split `TransactionFormModal.tsx` 898 → 4 files | `senior-frontend` | L | Todo — deferred |
| T-129 | Split `SQLiteDatabaseService.ts` 739 → repos | `senior-backend` | L | Todo — deferred |
| T-130 | De-dupe `ledgerGradient` → `constants/gradients.ts` (part of T-130) | `senior-frontend`, `frontend-design` | M | **Complete** (`26e22b3`) |
| T-131 | Docs: archive `session_log.md` (1000→archive) + de-dupe `T-107` + `OPEN-A` close | `skill-creator` | S | **Complete** (this commit) |

Dependencies: `T-124 → (T-125 ∥ T-126) → (T-127 ∥ T-128 ∥ T-129 ∥ T-130) → T-131`. Only `T-124` blocks the rest.

Future V2 still `T-119..T-123` in `OTHER_LEDGERS_FUTURE_V2.md` (build on “next update”).

## Phase 16 — Theme (Light/Dark) + Accent Color (A1 + B1) — Planned

Plan: `docs/plans/THEME_ACCENT_PLAN.md` (approved 2026-10-02, branch `feature/theme-accent` off `dev`).
Decision: A1 (`data-theme` token override, header sun/moon toggle, System/Light/Dark in Settings) + B1 (6 curated OKLCH accents in Settings). Defaults unchanged: dark + violet.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| T-132 | Token foundation: `--color-primary-deep` + replace ~15 hardcoded gradient tails + `[data-theme="light"]` block + 6 `[data-accent]` blocks in `tokens.css` | `frontend-design` | M | **Complete** |
| T-133 | Settings model + `useTheme()` hook + App wiring (`theme`, `accentId` in `AppSettings`/store, `data-theme`/`data-accent` on `<html>`, `matchMedia` system resolve) | `senior-frontend` | S | **Complete** |
| T-134 | Header sun/moon toggle (36px circle chrome, dark↔light flip, `aria-label`, focus-visible ring) | `senior-frontend`, `ui-ux-pro-max` | S | **Complete** |
| T-135 | Settings Appearance section: theme 3-way + accent swatch grid in `SettingsModal` + `SettingsPage` | `senior-frontend`, `ui-ux-pro-max` | M | **Complete** |
| T-136 | Identity + audit: `DESIGN_IDENTITY.md` §2/§17 update, hardcoded-literal audit (`labels.ts`, `Avatar`, `reset.css`, `main.tsx`), gates green | `code-reviewer`, `frontend-design` | S | **Complete** (+`--color-wash` sweep, `dark:` custom-variant, `--color-text-on-primary`, dark-slab fixes) |
| T-137 | Verification: 9 viewports × light/dark × 2 accents, no overflow, contrast check, vitest theme-resolve tests | `code-reviewer` | S | **Complete** (1440+390 verified live, 0 errors, contrast AA, `accents.test.ts` 5/5) |

Dependencies: `T-132 → T-133 → (T-134 ∥ T-135) → T-136 → T-137`. Merge to `dev` only with user confirmation.

## Phase 17 — Background Presets per Mode (Option A) — In Progress

Approved 2026-10-02, built on `feature/theme-accent` (theme workstream). Curated bases only — luminance stays in-lane per mode so text contrast can't break. Dark: Obsidian/Midnight/Forest/Plum. Light: Paper/Sky/Sand/Mint.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| T-138 | Tokens + model + hook: `[data-bg]` blocks, `bgDark`/`bgLight` in `AppSettings`, `backgrounds.ts`, `useTheme()` + pre-paint apply | `senior-frontend` | S | **Complete** |
| T-139 | Appearance "Background" row (current-mode presets, reuses swatch styles) + `backgrounds.test.ts` sync guard | `senior-frontend` | S | **Complete** |
| T-140 | Verification: computed bg per preset × mode, screenshots, gates | `code-reviewer` | S | **Complete** (8/8 presets resolve, dark/forest + picker screenshots, 0 errors) |

## Phase 18 — Type Overhaul (Manrope + Inter-tnum + Anek Bangla, self-hosted) — In Progress

Plan approved 2026-10-02 (full scope, Manrope headings, Anek Bangla, mono kept for chrome). Branch `feature/theme-accent`.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| T-141 | Font supply: fontsource variable packages (drop dead Geist + Google @import), retoken display/body, `.amount` utility | `senior-frontend` | M | **Complete** (19 woff2 bundled) |
| T-142 | Money off mono: ~20 files amount rules → Inter tabular; mono kept for sub/snapshotTime/text-mono + JB Mono still self-hosted | `senior-frontend` | M | **Complete** |
| T-143 | Identity docs: DESIGN_IDENTITY (§1/§2/§3/§5/§17) + DESIGN.md type tables | `skill-creator` | S | **Complete** |
| T-144 | Verification: bn-BD/৳ fallback, table alignment, bundle weight, offline (no googleapis) | `code-reviewer` | S | **Complete** (bn digits+৳ render aligned, Inter `zero` N/A in Chrome → dropped, 560KB fonts w/ unicode-range lazy subsets, 0 CDN refs) |

## Phase 19 — Online Sync via Google Drive (Path 1) — In Progress

Plan: `docs/plans/ONLINE_SYNC_PLAN.md`. Branch `feature/online-sync-drive` off `dev`.
Google login → auto-sync of `money_flows.db` to the user's Drive `appDataFolder`.
Mobile-save → desktop-boot sees it. The 4 guards in plan §3 block merge if violated.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| T-145 | `GoogleAuth.ts` — GIS loader, token client, cache/refresh, sign-in/out | `senior-frontend` | M | Open |
| T-146 | `CloudSync.ts` — appDataFolder upload/download/hash/conflict-copy I/O | `senior-backend` | M | Open |
| T-147 | Wire `_maybeCloudSync` into `flush()` + `pagehide` + boot-pull rule | `senior-backend` | M | Open |
| T-148 | Settings → Backup: sign-in row, status, Sync now, disconnect | `senior-frontend` | M | Open |
| T-149 | Open-tab remote check + "New data available" prompt | `senior-frontend` | S | Open |
| T-150 | Conflict-copy UX (snapshot slot + keep-mine/keep-remote choice) | `senior-frontend` | M | Open |
| T-151 | Verification: gates, E2E, offline/corrupt-remote tests, docs | `code-reviewer` | M | Open |

### T-145 - GoogleAuth.ts — GIS loader, token client, cache/refresh, sign-in/out
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/infrastructure/database/GoogleAuth.ts` (new, ≤300 LOC), `src/infrastructure/database/__tests__/GoogleAuth.test.ts` (new)
**Content:**
1. Lazy-load `https://accounts.google.com/gsi/client` once (script tag, promise memo — same init-memo pattern as storage layer); no npm dep.
2. OAuth2 token client with minimal scope `https://www.googleapis.com/auth/drive.appdata`; `requestAccessToken()` on sign-in, silent refresh via `expires_in` timestamp (refresh proactively 60s before expiry, no per-flush roundtrip).
3. Token kept in memory; persist only account email + expiry in IndexedDB (mirror `FolderSync` handle-store pattern) — never localStorage, never logged.
4. `signIn()`, `signOut()` (revoke + clear), `getValidToken(): Promise<string | null>` (null when signed out/expired-unrefreshable), `getAccountEmail()`.
5. Unit tests with mocked `google.accounts.oauth2`: expiry refresh path, sign-out clears, no-token returns null.
**Acceptance:** sign-in returns a usable token, expired token refreshes without UI, sign-out revokes + clears, tests green.

### T-146 - CloudSync.ts — appDataFolder upload/download/hash/conflict-copy I/O
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/CloudSync.ts` (new, ≤300 LOC), `src/infrastructure/database/__tests__/CloudSync.test.ts` (new)
**Content:**
1. `sync(data, hash)` — multipart upload of `moneyflows.db` + `moneyflows.db.sha256` sidecar to `appDataFolder` (create-or-update by filename query); all errors swallowed to caller-safe result type (never throw — mirror `FolderSync.sync`).
2. `remoteHash(): Promise<string | null>` — metadata-only: read sidecar content (bytes, not full DB); null when never synced / signed out / offline.
3. `download(): Promise<{ data, hash } | null>` — fetch DB bytes, recompute `digestHex`, return null on mismatch (Guard 3) instead of throwing.
4. `downloadToSnapshotSlot()` helper for conflict copies (T-150): returns verified bytes for the service to stash via existing snapshot ring.
5. Tests with mocked `fetch`: upload called with sidecar, hash-mismatch download → null, offline → null, never throws.
**Acceptance:** round-trip upload→hash→download verifies; corrupt remote is skipped silently; no thrown errors on any path; tests green.

### T-147 - Wire _maybeCloudSync into flush() + pagehide + boot-pull rule
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts`, `src/infrastructure/database/storage/index.ts` (if needed)
**Content:**
1. Run `impact({ target: "flush", direction: "upstream" })` first; keep blast radius to storage surfaces.
2. Add `_maybeCloudSync(data)` mirroring `_maybeFolderSync` (own cooldown constant, `void … .catch(() => {})`, Guard 1) + `lastCloudSyncTime`/`lastCloudSyncAt` fields; call from `flush()` next to snapshot/folder-sync lines.
3. `pagehide`/`visibilitychange` path also triggers cloud sync attempt (save → close phone syncs in seconds).
4. Boot-pull in `init()` after local load + migrate: if signed in and local empty/fresh → import verified remote (mirrors OPFS migration rule, Guard 2); if local dirty/loaded → skip pull (upload wins on next flush).
5. Expose `getCloudStatus()` (signedIn, email, lastSyncAt, lastError) for Settings/health UI.
**Acceptance:** existing gates green; save → background upload fires (cooldown-gated); fresh-device boot imports remote; dirty local never overwritten; `detect_changes()` shows storage-only blast radius.

### T-148 - Settings → Backup: sign-in row, status, Sync now, disconnect
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/presentation/screens/SettingsPage.tsx` (Backup section), `src/core/domain/AppSettings.ts` (`cloudEmail`, `cloudLastSyncAt` deep-fill defaults), `src/presentation/stores/useSettingsStore.ts`, `docs/plans/ONLINE_SYNC_PLAN.md §4` copy for empty-state
**Content:**
1. "Connect Google Drive" row (empty-state carries the 3-step console setup from plan §4); signed-in shows account email + last-sync time + storage-health warning hookup on revoke/failure.
2. "Sync now" button (manual `_maybeCloudSync` bypass-cooldown once) + "Disconnect" (signOut + clear email, local data untouched).
3. `DESIGN_IDENTITY.md §17` checklist for new rows; no `style={{}}`, no hardcoded strings outside labels constants.
**Acceptance:** sign-in/out round-trip updates UI; Sync now uploads within seconds; disconnect leaves local data intact; design checklist passes.

### T-149 - Open-tab remote check + "New data available" prompt
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts` (poll hook) or new `useCloudPoll.ts`, existing toast/modal primitives
**Content:**
1. While signed in and app visible: hash-only `remoteHash()` poll on the sync cooldown; full download only when hash differs from last-synced.
2. On newer remote + clean local: show "New data available — Refresh" prompt (existing Modal/toast); on Refresh, verified download replaces in-memory DB + store rehydration path already used by restore-points.
3. Dirty local → skip prompt entirely (upload wins; conflict path belongs to T-150).
**Acceptance:** phone-save → open desktop tab prompts within one cooldown; Refresh shows the new row; dirty desktop never prompts.

### T-150 - Conflict-copy UX (snapshot slot + keep-mine/keep-remote choice)
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** snapshot ring потребителя + existing restore/Modal primitives, `CloudSync.downloadToSnapshotSlot` consumer
**Content:**
1. Trigger: remote hash differs AND local dirty at pull/poll time (Guard 4) — never auto-overwrite either side.
2. Stash verified remote bytes into the snapshot ring (newest slot path, hash-carrying `SnapshotRecord`) so the remote side is recoverable as a restore point.
3. Choice dialog: "Keep mine (upload)" vs "Keep other device (load remote)" — plain language, both options safe; after choice, sync timestamps reset so no prompt loop.
**Acceptance:** forced-conflict fixture → dialog appears, both choices leave a recoverable state, no data silently dropped.

### T-151 - Verification: gates, E2E, offline/corrupt-remote tests, docs
**Skill:** `code-reviewer`
**Effort:** M
**File(s):** `e2e/`, `docs/SECURITY.md`, `docs/TAD.md`, `CHANGELOG.md`, `docs/VERSIONING.md` checklist
**Content:**
1. Full gates: typecheck + `lint --max-warnings 0` + vitest + build green; `detect_changes()` reviewed (storage + settings only); Guards 1–4 each have a failing-without-guard test.
2. E2E with mocked Google/Drive endpoints (no real OAuth in CI): sign-in → save → "uploaded" assertion; offline boot with stale token → app boots local, health row warns.
3. Docs: `SECURITY.md` (token storage, minimal scope, revocation), `TAD.md §2.2` (cloud sink), `CHANGELOG.md [Unreleased]` Added entry; paste `VERSIONING.md §4` checklist (bump happens at release, not here).
**Acceptance:** all gates green, E2E pass, docs updated, phase ready for user-confirmed merge to `dev`.

## Following Phase

Candidates after cleanup: Other Ledgers V2 (dual-post, already spec'd), Supabase sync groundwork, budgets/goals expansion, CSV export.

## Ticket Template (use for all new work)

```markdown
### T-<id> - <title>
**Skill:** <primary skill(s)>
**Effort:** S | M | L | XL
**File(s):** <paths>
**Content:**
1. …numbered, concrete steps…
**Acceptance:** <observable, testable outcome>
```

Rules: bite-sized & atomic · one logical change per commit · run typecheck/lint/test/build before done · `detect_changes()` before commit for code tickets.

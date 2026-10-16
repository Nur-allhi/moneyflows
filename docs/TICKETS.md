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
| T-145 | `GoogleAuth.ts` — GIS loader, token client, cache/refresh, sign-in/out | `senior-frontend` | M | **Complete** (memory-only token, IDB email+expiry, silent refresh w/ 60s skew, 7/7 tests) |
| T-146 | `CloudSync.ts` — appDataFolder upload/download/hash/conflict-copy I/O | `senior-backend` | M | **Complete** (upsert DB+sidecar, metadata-only hash, verified download, 9/9 tests, never throws) |
| T-147 | Wire `_maybeCloudSync` into `flush()` + `pagehide` + boot-pull rule | `senior-backend` | M | **Complete** (fire-and-forget sink, hidden-tab force, 8s boot-pull, `decideSyncAction` matrix 6/6, `getCloudStatus()`, build green) |
| T-148 | Settings → Backup: sign-in row, status, Sync now, disconnect | `senior-frontend` | M | **Complete** (`CloudSyncSection` + `CloudStatus` on port + `syncNow()`; follow-up: app-owned Client ID baked in at build time — pure Sign in with Google, no paste) |
| T-149 | Open-tab remote check + "New data available" prompt | `senior-frontend` | S | **Complete** (`checkRemoteUpdate`/`applyRemoteUpdate` on port, `CloudUpdatePrompt` in AppLayout, visible-tab poll + refocus check) |
| T-150 | Conflict-copy UX (snapshot slot + keep-mine/keep-remote choice) | `senior-frontend` | M | **Complete** (`resolveConflict` on port+service, conflict dialog in `CloudUpdatePrompt`, remote stashed as restore point either way) |
| T-151 | Verification: gates, E2E, offline/corrupt-remote tests, docs | `code-reviewer` | M | **Complete** (typecheck+lint+build green, unit 70/70, e2e `15-cloud-sync` 2/2 mocked, SECURITY/TAD/CHANGELOG updated, no bump per plan) |
| T-152 | `reconcileAfterSignIn` + empty-detect + auto-pull (deterministic sync) | `senior-backend` | M | **Complete** (shared reconcile, `_isLocalEmpty`, `effectiveHasLocal`, `_importVerifiedRemote` refactor, 28/28 db tests) |
| T-153 | Wizard entry gate (Sign in vs Guest) + conflict dialog reword | `senior-frontend` | M | **Complete** (step-0 gate, downloaded→dashboard, Settings reconcile+reload, Override/Download copy, e2e 13+15 green) |

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

### T-152 - reconcileAfterSignIn + empty-detect + auto-pull (deterministic sync)
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts`, `src/core/ports/IDatabaseService.ts` (`CloudReconcile` type), `src/infrastructure/database/__tests__/` decision tests
**Content:**
1. `_isLocalEmpty()`: zero rows across members/accounts/transactions (COUNT(*), reconcile-time only — never on the hot path).
2. `reconcileAfterSignIn(): Promise<'downloaded'|'uploaded'|'idle'|'choice'|'signed-out'>` — single shared entry used by wizard gate, Settings sign-in, and boot: token null → `signed-out`; empty local + remote → verified download+import → `downloaded`; local data + no remote → upload → `uploaded`; same hash → `idle` (adopt meta); both differ → stash + flag → `choice`.
3. `_maybeCloudSync`: treat local as fresh (`hasLocal:false`) when empty AND never synced — fresh-device auto-pull, no dialog. Previously-synced-but-emptied stays `conflict` (deliberate-wipe ambiguity).
4. Unit-test the new branches via `decideSyncAction` matrix + reconcile decision coverage where sql.js-free; gates green.
**Acceptance:** wipe-then-sign-in downloads silently; guest-with-data signs in and uploads silently; genuine both-sides case still flags `choice`; no auto-overwrite anywhere.

### T-153 - Wizard entry gate (Sign in vs Guest) + conflict dialog reword
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/presentation/screens/SetupWizard.tsx`, `src/presentation/components/settings/CloudSyncSection.tsx` (call reconcile post-sign-in), `src/presentation/components/CloudUpdatePrompt.tsx` (button copy), `e2e/flows/13-wizard.spec.ts` (keep green)**Content:**
1. Wizard step 0 (configured builds only): **Sign in with Google** + **Continue as guest** replace Get Started. Sign-in → `reconcileAfterSignIn()` → `downloaded` skips to dashboard (data present), else continue to step 1. Guest → step 1 unchanged. Keep "Welcome" copy so `13-wizard` stays green; unconfigured builds keep the current step 0.
2. Settings sign-in calls the same reconcile: `downloaded` → reload (restore-flow pattern); `choice` → status message (dialog follows via existing poll).
3. Conflict dialog buttons reworded to user language: **Override cloud** (keep mine) / **Download cloud data** (use theirs).
4. `DESIGN_IDENTITY.md §17` checklist for touched UI; typecheck + scoped lint + build + e2e `13-wizard` + `15-cloud-sync` green.
**Acceptance:** fresh user picks a path in one tap; no dialog except genuine both-sides case; wizard e2e untouched-green.

## Phase 20 — Sync UX Polish (user-approved improvements) — In Progress

Branch `google_signin_backup`. Sequential tickets, one commit each. All UI passes `DESIGN_IDENTITY.md §17`.

| Ticket | Title | Skill | Effort | Status |
|--------|-------|-------|--------|--------|
| T-154 | Sign-in progress UX (staged status + progress, no dead screen) | `senior-frontend` | S | **Complete** (google→syncing stages + ProgressBar in Settings + wizard, buttons disabled, stay-on-screen copy) |
| T-155 | Setup dropdowns → modal picker pattern (account type + member) | `senior-frontend` | M | **Complete** (trigger + overlay pickers per §9, token-only CSS, zero native selects left, e2e 13 green) |
| T-156 | Responsive auto-sync (30s cooldown, every mutation syncs) | `senior-backend` | S | **Complete** (`CLOUD_SYNC_COOLDOWN_MS` 120s→30s; flush path unchanged — hash-skipped, fire-and-forget, hidden-tab force) |
| T-157 | Header sync indicator beside bell | `senior-frontend` | M | **Complete** (`useCloudIndicator` cheap poll, desktop + mobile instances, guests see nothing, tap → Settings) |
| T-158 | Sidebar user profile (photo/name/email, profile scope) | `senior-frontend` | M | **Complete** (profile scope, persisted name/photo, footer photo+name+email, Family footer for guests, build green) |
| T-159 | Day-long sessions: persisted token + silent refresh, popup only on explicit taps | `senior-backend` | M | **Complete** (root cause: refresh used `prompt:''`; silent is `prompt:'none'`; token persisted+hydrated, interactive split, 10/10 tests) |
| T-160 | Cloud download resilience: newest-wins, dedupe, heal, taxonomy + diagnostics | `senior-backend` | M | **Complete** (newest-first reads, upsert dedupes, stale-sidecar/orphan/adopt heal, remote-corrupt taxonomy + replace-cloud escape, diagnostics row, 38/38 db tests) |
| T-161 | Splash boot progress + skip redundant cloud check | `senior-frontend` | M | **Complete** (BootProgress threading, staged splash bar, 60s boot-pull skip, e2e green) |
| T-162 | Upload write-verify + retry (no torn pairs) | `senior-backend` | S | **Complete** (sidecar read-back + one retry, stateful e2e mocks proving verify round trip) |
| T-163 | Deferred cloud retry when cooldown skips a flush | `senior-backend` | S | **Complete** (single one-shot timer at window expiry, re-flushes through guarded path, pure helper 4/4 tests) |
| T-164 | Wizard/Settings sign-in button follows sync stage | `senior-frontend` | S | **Complete** (busy copy advances google→syncing in step with the bar, both flows) |
| T-165 | ProgressBar freeze fix (updates after first paint) | `senior-frontend` | S | **Complete** (visibility ref; every percent applies once visible; 0.6s glide already in CSS) |
| T-166 | Animated water-flow fill on all progress bars | `senior-frontend` | S | **Complete** (diagonal flow overlay on gradient, leading shimmer kept, reduced-motion guard, GPU-cheap) |
| T-167 | Sync progress completes (100% beat, no abrupt vanish) | `senior-frontend` | S | **Complete** (done stage 100% + Synced ✓ held 1.2s on success; failures still clear to error text) |
| T-168 | Splash bar shows only on slow boots (600ms gate) | `senior-frontend` | S | **Complete** (bar gated on boot exceeding 600ms; throttled probe shows stages; fast boots clean) |
| T-169 | Informed conflict dialog (side-by-side data comparison) | `senior-frontend` | M | **Complete** (pure summaries + SQL wrapper, bytes held + preview API, cards with amounts, Keep-this-device/Download-cloud-data, 97/97 tests) |
| T-170 | Informed update prompt (what-changed preview on pull) | `senior-frontend` | M | **Complete** (verified-download preview, no import/state change, Cloud-first cards, Later/Refresh kept, 97/97) |
| T-171 | No-change boot writes nothing (conditional recalc) | `senior-backend` | M | **Complete** (pure compute+diff, update-only-stale + flush-only-if-changed, 104/104 tests) |
| T-172 | Header sync button triggers Sync-now on tap | `senior-frontend` | S | **Complete** (tap = immediate syncNow, guests keep deep link, start/end lifecycle events, re-entrancy guard) |
| T-173 | Circular sync animation on header button (all syncs) | `senior-frontend` | M | **Complete** (ring spin on any sync incl. background auto-sync, full-ring check flash on clean end, dot refresh, reduced-motion guard) |

### T-171 - No-change boot writes nothing (conditional recalc)
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/computeBalances.ts` (new) + `__tests__/computeBalances.test.ts`, `SQLiteDatabaseService.recalculateBalances()`
**Content:**
1. Root cause (confirmed in code): `recalculateBalances()` runs every boot and blanket-rewrites all account rows with fresh `updated_at` + `flush()` — hash changes with zero user edits → phantom uploads/downloads/conflicts.
2. Extract pure `computeBalances()` + `diffBalances()` (mirror `applyBalanceChange` branching exactly, deterministic replay order); service UPDATEs only differing rows (stamping only those) and flushes only when something changed.
3. Behavior-identical: same replay order, same per-type math, opening balances already exist as transactions; stale balances still self-correct.
4. Unit tests (pure, no wasm): per-type math, unknown-type ignore, diff empty on identical, stale-row detection. Full gates green.
**Acceptance:** second consecutive boot with no edits produces byte-identical DB (no phantom sync); genuinely stale balances still repair.

### T-170 - Informed update prompt (what-changed preview on pull)
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts` (`getUpdatePreview()`), `src/core/ports/IDatabaseService.ts`, `src/presentation/components/CloudUpdatePrompt.tsx`
**Content:**
1. User report: the "New data available" prompt says something arrived but not what — same blind choice as the old conflict dialog.
2. Service `getUpdatePreview(): Promise<ConflictPreview | null>` — verified `download()` (no import, no state change) + local `extractSide` + `remoteInfo` saved-time; null on any failure → current text fallback.
3. Modal renders the shared `SideCard` pair (Cloud first — it's the news — then This device) with counts + latest-3 amounts; buttons stay Later/Refresh.
4. No new network shape (one verified download, already fetched again on Refresh); full gates green; e2e skipped (30s poll seam, same as T-169 note).
**Acceptance:** phone-save → desktop prompt names the new transactions with amounts; fallback text unchanged when preview unavailable.

### T-168 - Splash bar shows only on slow boots (600ms gate)
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/components/SplashScreen.tsx`
**Content:**
1. Finding (probed): the bar always rendered — but local boots finish in ~200ms, so it flashed past perception; the user never saw it. A loader that flashes on fast boots is a distraction, not information.
2. Gate the narration on boot actually taking time: show the progress block only while `!ready` after 600ms. Slow boots (throttled probe: bar + stage text verified) narrate every stage; fast boots stay clean.
3. Typing animation, fade flow, and watchdog untouched. Full gates green.
**Acceptance:** fast boot = no bar flash; 8x-throttled boot = bar with stage labels visible.

### T-167 - Sync progress completes (100% beat, no abrupt vanish)
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/components/settings/CloudSyncSection.tsx`
**Content:**
1. Root cause: stages topped out at 75% (`google` 35 / `syncing` 75) and the bar unmounted the moment work finished — stuck-then-vanished.
2. Add a `done` stage (100%, `Synced ✓`): on Sync-now success hold it ~1.2s before releasing buttons; same after sign-in reconcile (non-reload path). Failure path keeps current behavior (clear + error line).
3. Full gates green.
**Acceptance:** every successful sync visibly sweeps to full before the bar leaves; failures still surface text immediately.

### T-160 - Cloud download resilience: newest-wins, dedupe, heal, taxonomy + diagnostics
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/CloudSync.ts`, `__tests__/CloudSync.test.ts`, `src/infrastructure/database/SQLiteDatabaseService.ts`, `src/core/ports/IDatabaseService.ts`, `src/presentation/components/settings/CloudSyncSection.tsx`, `e2e/flows/15-cloud-sync.spec.ts`
**Content:**
1. Root cause of live "download failed" loop: sidecar readable but DB bytes mismatch — classic interrupted upload (tab closed/suspended between the DB and sidecar writes). Retries can never succeed.
2. `CloudSync`: `listFiles()` newest-first (`orderBy=modifiedTime desc`); all reads use newest; `upsert` deletes older same-name dupes after success. New primitives: `downloadBytes()`, `writeHash()`, `deleteFile()` — all never-throw.
3. Service `_healRemoteAttempt()`: stale sidecar (remote bytes == local hash) → rewrite sidecar → synced; orphan sidecar (no DB file) → clean + treat remote as empty; valid-DB bytes + empty local → adopt + heal sidecar (`recovered`); foreign bytes + local data → `remote-corrupt` (touch nothing).
4. Taxonomy in status: `not-found`/`unreadable`/`remote-corrupt` with distinct UI copy; `remoteInfo()` diagnostics row (file count, modified time); `overwriteRemote()` explicit user escape hatch for corrupt (warned button).
5. Tests: newest-wins, dedupe deletes, stale-sidecar heal, orphan cleanup, adopt-valid, corrupt-preserved, taxonomy mapping; e2e dupe-file fixture green; full gates.
**Acceptance:** interrupted-upload remotes self-heal on next sync; genuine corruption is named, never silently overwritten, and escapable by explicit user choice.

### T-159 - Day-long sessions: persisted token + silent refresh, popup only on explicit taps
**Skill:** `senior-backend`
**Effort:** M
**File(s):** `src/infrastructure/database/GoogleAuth.ts`, `__tests__/GoogleAuth.test.ts`, `src/presentation/components/settings/CloudSyncSection.tsx`, `docs/SECURITY.md`
**Content:**
1. Root cause: refresh used `prompt: ''` (default = popup). Silent mechanism is `prompt: 'none'` — succeeds without UI while the Google session lives, errors quietly otherwise.
2. Persist `{token, expiresAtMs}` in the IDB auth record (same-origin, cleared on sign-out); hydrate memory on load.
3. `getValidToken()`: memory-valid → return; IDB-valid → adopt + return; else silent `prompt:'none'` attempt → persist + return, or null. Never throws, never shows UI. Background callers unchanged.
4. New `refreshInteractive()` (popup) for explicit taps only; Sync-now handler: cached/silent first, interactive fallback.
5. Tests: hydration across instances with zero GIS calls, silent uses `prompt:'none'`, expiry-with-dead-session → null, sign-out clears token. Docs: SECURITY token note updated.
**Acceptance:** active user sees zero popups for days across reloads; long-idle or wiped storage → single re-sign-in.

### T-154 - Sign-in progress UX (staged status + progress, no dead screen)
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/components/settings/CloudSyncSection.tsx`, `src/presentation/screens/SetupWizard.tsx`
**Content:**
1. Staged busy copy in both sign-in flows: `Opening Google…` (popup) → `Syncing your data…` (reconcile/upload running) → done/error. Never leave a static label while background work runs.
2. Show the existing `ProgressBar` (indeterminate) under the button while busy; disable Connect/Sign-in + Sync-now buttons to prevent double taps; keep the user on screen (no navigation until resolve).
3. Errors keep the staged copy pattern: popup-cancelled vs network vs expired-session each get their plain-language line (reuse `ERROR_COPY`).
**Acceptance:** throttled-network sign-in visibly progresses through both stages; no dead screen; double-tap safe.

### T-155 - Setup dropdowns → modal picker pattern (account type + member)
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/presentation/screens/SetupWizard.tsx`, `src/presentation/screens/SetupWizard.module.css`
**Content:**
1. Per `DESIGN_IDENTITY.md §9` (native select deprecated), replace both native `<select>` in the wizard money step (account type, member) with trigger buttons opening `pickerOverlay`/`pickerModal` option lists mirroring `transactionForm/extraPickers.tsx` (header + close + option rows + active = primary gradient).
2. New CSS uses tokens only (`--space-*`, `--color-*`, `--radius-*`); no hex, no literal spacing, no `style={{}}`.
3. Member list derives from step-1 names (live, not stale); account type rows reuse `ACCOUNT_TYPE_OPTIONS` + remaining `ACCOUNT_TYPES` fallback (preserve current option set exactly).
4. `DESIGN_IDENTITY.md §17` checklist; e2e `13-wizard` stays green.
**Acceptance:** wizard dropdowns visually match app pickers; same options, same values saved; no native select remains in the wizard.

### T-156 - Responsive auto-sync (30s cooldown, every mutation syncs)
**Skill:** `senior-backend`
**Effort:** S
**File(s):** `src/presentation/constants/config.ts` (`CLOUD_SYNC_COOLDOWN_MS`), `docs/plans/ONLINE_SYNC_PLAN.md` (cooldown note), unit assertion
**Content:**
1. Lower `CLOUD_SYNC_COOLDOWN_MS` `120_000 → 30_000`: every mutation already funnels through `flush()` → `_maybeCloudSync` (hash-skipped when unchanged, fire-and-forget, hidden-tab force) — the only change is responsiveness. No new network shape, no battery concern (unchanged data = zero bytes).
2. Keep Sync-now as force-bypass; keep snapshot/folder cooldowns untouched.
3. Assert the constant + idle-skip behavior in the existing CloudSync/service tests if cheap; full gates green.
**Acceptance:** save → background upload starts within ~30s (or instantly on tab-hide); unchanged flushes upload nothing; quota/battery unchanged.

### T-157 - Header sync indicator beside bell
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/presentation/components/Header.tsx`, `Header.module.css`, new `useCloudIndicator` hook or reuse `getCloudStatus()` poll
**Content:**
1. New status button directly beside `notifBtn`: states from `getCloudStatus()` — synced (green dot + check), never-synced (subtle gray), error/conflict (warning) — with `title` text; hidden entirely for guests (no sign-in = no change for them).
2. Poll on mount + route change (cheap IDB read; no export/hash in the poll path), plus refresh after mutations? Minimum: mount + 30s interval aligned with sync cooldown + visibility refocus.
3. Tap → navigate `/settings` (gear precedent); `aria-label` set; `DESIGN_IDENTITY.md §17` checklist.
**Acceptance:** signed-in users always see live sync state in the header; guests see zero change; tap lands in Settings.

### T-158 - Sidebar user profile (photo/name/email, profile scope)
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/infrastructure/database/GoogleAuth.ts` (profile scope + name/photo), `src/core/ports/IDatabaseService.ts` (`CloudStatus` extension), `src/App.tsx` (footer props), `src/presentation/components/Sidebar.tsx` (avatar img), `docs/SECURITY.md` (scope note)
**Content:**
1. Add `profile` to GIS scopes (name + picture need it; `drive.appdata` already requires verification for public rollout, so no new verification class). Persist `{name, photo}` alongside email in the IDB auth record (never the token); expose via `getCloudStatus()`.
2. Sidebar footer when signed in: Google photo avatar + display name + email (fallback: initial-letter avatar + email when photo/name absent). Signed out: current Family footer unchanged.
3. `App.tsx` feeds footer props from a mount + route-change status refresh (same cheap pattern as T-157); update `SECURITY.md` scope line.
**Acceptance:** sign-in → sidebar shows photo/name/email; sign-out → Family footer back; no photo URL ever logged.

### T-161 - Splash boot progress + skip redundant cloud check
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/infrastructure/database/getDatabase.ts`, `SQLiteDatabaseService.init()`, `src/main.tsx`, `src/presentation/components/SplashScreen.tsx`, `src/presentation/constants/config.ts`
**Content:**
1. Thread an optional progress callback through `initDatabase(progress)` → `db.init(progress)`: engine 15% → local data 40% → ready-local 65% → cloud check 75% → done 90%, with plain-language labels. Main-thread cost zero (calls only).
2. Skip `_cloudBootPull` network entirely when persisted meta is fresh (`Date.now() - meta.at < CLOUD_BOOT_SKIP_MS = 60s`) — covers reload-right-after-sync, the exact reported wait. Memory-only timestamps don't survive reload, so the persisted meta is the source.
3. SplashScreen shows `ProgressBar` + stage label under the version while booting; typing animation untouched; watchdog untouched.
**Acceptance:** post-sync reload boots with visible stages and usually skips cloud entirely; cold boot narrates engine → data → cloud.

### T-162 - Upload write-verify + retry (no torn pairs)
**Skill:** `senior-backend`
**Effort:** S
**File(s):** `src/infrastructure/database/CloudSync.ts` (`sync()`), `__tests__/CloudSync.test.ts`, `e2e/flows/15-cloud-sync.spec.ts` (stateful mocks)
**Content:**
1. After both upserts, read back the sidecar and compare: mismatch → re-run the pair once → still bad returns false (status surfaces, background retries, heal remains backstop). One extra metadata GET per successful sync; unchanged-data flushes still upload nothing.
2. Update e2e Drive mocks to be stateful (created files persist in list results) since verify now reads back.
3. Unit tests: verify-pass uploads once; torn write triggers exactly one re-upload then reports false; never throws.
**Acceptance:** killing the tab mid-upload can no longer leave a permanently torn pair unnoticed — the next sync either completes or reports.

### T-163 - Deferred cloud retry when cooldown skips a flush
**Skill:** `senior-backend`
**Effort:** S
**File(s):** `src/infrastructure/database/SQLiteDatabaseService.ts`, `src/infrastructure/database/CloudSync.ts` (pure helper), `__tests__/CloudSync.test.ts`
**Content:**
1. Root cause: a flush skipped by `CLOUD_SYNC_COOLDOWN_MS` schedules nothing — a lone quick second save waits indefinitely for the next mutation/tab-hide.
2. On cooldown-skip, schedule one one-shot retry at cooldown expiry (single pending timer; cleared on the next real attempt). Retry calls `flush()` so it re-exports fresh bytes and flows through the normal guarded path.
3. Pure `cloudRetryDelayMs(nowMs, lastSyncMs, cooldownMs, timerPending)` helper with unit tests (pending→null, fresh skip→full window, mid-window→remainder).
4. Full gates green.
**Acceptance:** save twice within 30s → second save uploads at cooldown expiry with zero further interaction; single timer only; sign-out/disconnect unaffected (token-gated path returns silently).

### T-164 - Wizard/Settings sign-in button follows sync stage
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/screens/SetupWizard.tsx`, `src/presentation/components/settings/CloudSyncSection.tsx`
**Content:**
1. Busy button copy advances with the stage instead of freezing on the first label: wizard `Opening Google…` → `Completing sign-in…`; Settings `Connecting…` → `Syncing…`. The staged ProgressBar below already advances — button and bar must agree.
2. No navigation until resolve (already true); buttons stay disabled while busy (already true).
**Acceptance:** throttled sign-in shows the button text change in step with the bar.

### T-165 - ProgressBar freeze fix (updates after first paint)
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/components/ProgressBar.tsx`
**Content:**
1. Root cause: the IntersectionObserver disconnects after its first trigger, so later `percent` changes never reach state — the splash bar froze at 5% while boot continued (reported as "never completes before the app loads").
2. Track visibility in a ref: once visible, apply every `percent` change directly (rAF); observer only gates the initial paint. Existing 0.6s width transition makes updates glide.
3. Full gates green (shared component — import-modal progress benefits too).
**Acceptance:** splash bar visibly sweeps 5→100 across boot stages instead of freezing.

### T-166 - Animated water-flow fill on all progress bars
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/components/ProgressBar.module.css`
**Content:**
1. Fill gets a moving diagonal-stripe overlay (water-flow feel) via `repeating-linear-gradient` + `background-position` animation, composited over the existing gradient; keep the leading-edge shimmer.
2. Token-only values; `prefers-reduced-motion: reduce` disables the motion (Header precedent); GPU-cheap (background-position only).
3. `DESIGN_IDENTITY.md §17` motion rules check.
**Acceptance:** every app progress bar shows continuous flow while busy; still with zero motion when reduced-motion is set.

### T-169 - Informed conflict dialog (side-by-side data comparison)
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/infrastructure/database/cloudDiff.ts` (new) + `__tests__/cloudDiff.test.ts`, `SQLiteDatabaseService.ts` (hold bytes + `getConflictPreview()`), `src/core/ports/IDatabaseService.ts`, `src/presentation/components/CloudUpdatePrompt.tsx`
**Content:**
1. User decisions: cards show full latest-3 (description + signed amount + date) with counts + timestamps; buttons **Keep this device** / **Download cloud data**.
2. Pure `summarizeRows()` over row arrays (counts, latest-3, last-change) — unit-tested with stubs, no wasm in tests. Thin SQL wrapper opens remote bytes in a second in-memory handle (`COUNT(*)`, latest by date, `MAX(updated_at)`); corrupt bytes → null → plain-dialog fallback.
3. Service holds conflict remote bytes in memory + `remoteSavedAt`, exposes `getConflictPreview()`; cleared on resolve/sign-out. Dialog renders two stacked cards; same Modal; `DESIGN_IDENTITY.md §17` checklist.
4. Full gates + e2e diverged fixture (cards render with correct counts).
**Acceptance:** both-sides-diverged shows what/where is newer with amounts; choice is informed; fallback dialog unchanged when preview unavailable.

### T-172 - Header sync button triggers Sync-now on tap
**Skill:** `senior-frontend`
**Effort:** S
**File(s):** `src/presentation/components/Header.tsx`, `src/infrastructure/database/SQLiteDatabaseService.ts` (lifecycle events)
**Content:**
1. Tap = immediate `syncNow()` (force path, same as Settings button) — no Settings trip. Guests (signed out) keep the old deep-link into Settings Backup as an invitation to sign in.
2. Service dispatches `moneyflows:sync-start` / `moneyflows:sync-end` window events around real network sync activity only (post idle-check in `_maybeCloudSync`) — background auto-syncs included, cooldown-skips excluded. Never throws, zero UI coupling.
3. Full gates green.
**Acceptance:** signed-in tap syncs within seconds from the header; guest tap opens Settings Backup; no event fires when there is nothing to sync.

### T-173 - Circular sync animation on header button (all syncs)
**Skill:** `senior-frontend`
**Effort:** M
**File(s):** `src/presentation/components/Header.tsx`, `Header.module.css`, `src/presentation/hooks/useCloudIndicator.ts` (or new hook state)
**Content:**
1. Button states: idle (cloud icon + status dot, as today) → syncing (rotating ring arc) → done (full ring + check flash ~1.2s, then idle) / warn on error. Driven by the T-172 lifecycle events + fresh `getCloudStatus()` on end — honest states only, no fake percentages.
2. Both desktop and mobile instances; `prefers-reduced-motion` guard; token-only CSS; `DESIGN_IDENTITY.md §17` checklist.
3. Full gates green.
**Acceptance:** add a transaction → ring spins without any tap; tap → spins → completes; error → warn state; guests see nothing.

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

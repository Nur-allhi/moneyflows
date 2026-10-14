# MoneyFlows — Session Log

Archived first 1000 lines to docs/audit/session_log.archive.md on 2026-08-27 — recent tail below.

- [whatsNew.ts] release notes re-keyed to 1.0.0
- [CHANGELOG.md] consolidated Unreleased into [1.0.0] - 2026-08-24 heading
- Release flow: commit dev -> merge dev->master -> tag v1.0.0 on master -> sync dev

### Skill(s) Used
- gitnexus, code-reviewer

### Status
- v1.0.0 tagged on master; settings footer auto-shows new version.

- Follow-up: APP_VERSION moved to guarded constants/appVersion.ts module after dev-server define edge case crashed Root; verified v1.0.0 footer + notes row live.


## Session 2026-08-24 06:00

### Changes
- BUG-2 investigation: scripted E2E of Add-Account under member (Md Iqbal azam profile)
- Result: NO reload (marker survived), account created + persisted correctly (balance 500, Opening Balance tx in ledger after reload) -> closed as dev-server artifact (wontfix)
- Found real minor issue during test -> BUG-3 logged: accounts store stale (balance 0) right after add; fix proposed = fetchAccounts() after save in AddAccountModal - awaiting owner confirmation

### Skill(s) Used
- senior-frontend, playwright E2E verification, code-reviewer

### Status
- BUG-2 wontfix(closed), BUG-3 open awaiting fix approval.


## Session 2026-08-24 06:15

### Changes
- BUG-3 fixed (owner-approved): AddAccountModal.handleSave now awaits fetchAccounts() after opening-balance tx
- Verified live: immediate balance 777 visible post-save, no reload
- Same-commit updates: BUGS.md BUG-3 -> fixed, CHANGELOG [Unreleased] Fixed entry

### Skill(s) Used
- senior-frontend, code-reviewer, playwright verification

### Status
- Complete on dev.


## Session 2026-08-24 06:50

### Changes
- Feature: account edit + delete (T-104)
  - [EditAccountModal.tsx/.module.css] NEW - rename/type + danger-zone delete w/ tx & loan-movement counts, two-step confirm, soft-delete
  - [AccountCard] optional actions slot (top-right overlay, click-isolated); used by MemberProfile grid + SelectAccountModal grid (pencil opens edit-account via registry)
  - [registry.ts] edit-account entry
- T-105: '(deleted account)' fallbacks in MemberProfile/GroupLedger/GroupsList/TransactionDetail/LoanService/LoanDatabase name resolvers
- v1.1.0: package.json bump; whatsNew.ts 1.1.0 notes; CHANGELOG [Unreleased] Added entries; TICKETS Phase 12 section
- E2E verified live: rename+type change persisted (balance kept), delete->bin->restore roundtrip, fallback label in detail modal, no reloads

### Skill(s) Used
- senior-frontend, ui-ux-pro-max, code-reviewer, playwright verification

### Status
- Complete on dev. Master sync pending user go-ahead.


## Session 2026-08-26 11:30

### Changes
- [AccountCard/MemberProfile/SelectAccountModal .module.css] edit-pencil button background removed (transparent, blends with card); hover softened to white 10% tint
- Verified computed style live: base bg transparent, icon-only

### Skill(s) Used
- frontend-design, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 12:10

### Changes
- T-108: wizard pre-fill from member>account ledger context
- [MemberProfile.tsx] all four transaction-form entry points pass initialSource=selectedAccountId
- Verified desktop: Bkash ledger -> hero/pills open wizard with Source=Bkash preselected

### Skill(s) Used
- senior-frontend, playwright verification

### Status
- Complete on dev. Mobile pills share same wiring (manual QA recommended).


## Session 2026-08-26 06:20

### Changes
- T-108: loan ledger PDF export detail chooser
  - [LoanDetailView.tsx] Download PDF opens radio chooser (All details / Just description); mode gates account-bracket in pdf rows; choice persisted via AppSettings.reportDetailMode
  - [AppSettings.ts] reportDetailMode field (default all)
  - [LoanDetailView.module.css] chooser styles (radioRow etc.)
- E2E verified: chooser default All; Just description exported PDF lacks account trail but keeps descriptions; choice remembered across reload

### Skill(s) Used
- senior-frontend, code-reviewer, playwright verification

### Status
- Complete on dev. Master sync pending user go-ahead.


## Session 2026-08-26 06:45

### Changes
- BUG fix (user-reported): export chooser reused translucent confirmForm glass -> options invisible. Added dedicated .exportModal opaque panel style; verified computed bg opaque + radios/labels readable.

### Skill(s) Used
- frontend-design, playwright verification

### Status
- Fixed on dev.


## Session 2026-08-26 12:40

### Changes
- Tags feature (T-109..T-111) per owner decisions B/single/member-first+family-wide/editable:
  - [useTagStore.ts] NEW persisted tag registry
  - [TransactionFormModal] Tag field w/ datalist autocomplete; saved into metadata.tags; registry grows on submit
  - [TransactionEditModal] tag seeded/saved/cleared + registry growth; css additions
  - [MemberProfile] ledger tag dropdown (registry U in-view tags) + family-wide jump button
  - [TagLedgerScreen.tsx/.module.css] NEW /tags + /tags/:tag cross-member views w/ In/Out totals
  - [App.tsx] routes added
- E2E: edit-tag save verified in store+registry; /tags lists QA Tag(1); detail shows member/account/amount row
- Wizard create-path tagging code-reviewed (automation blocked by animated dual-tree DOM; manual check recommended)

### Skill(s) Used
- senior-frontend, ui-ux-pro-max, playwright

### Status
- Complete on dev. Master sync pending.


## Session 2026-08-26 12:55

### Changes
- BUG (user report): transaction wizard stuck - submit/cancel unreachable + tag input inaccessible on desktop. Root cause: .modalBody lacked flex/min-height so extra Tag field overflowed fixed-height desktopModal (overflow:hidden clipped actions). Fixed via flex:1/min-height:0; verified at 700px window height.
- Feature: tag management UI - Settings > Transaction Tags chips w/ remove (useTagStore.removeTag); registry deletions don't alter existing tx metadata.

### Skill(s) Used
- frontend-design, senior-frontend, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 12:30

### Changes
- T-112: [App.tsx] sidebar 'Tags' nav under Loans (tag icon) + routeTitles entry; bottom nav untouched
- Verified: sidebar order Dashboard..Loans,Tags,Recycle; click -> /tags; active state applies

### Skill(s) Used
- senior-frontend

### Status
- Complete on dev.


## Session 2026-08-26 13:00

### Changes
- T-112: full tag management UI on /tags: inline create, per-card rename (propagates through transaction metadata), two-step delete (strips from txs); useTagStore.renameTag added; Settings chips section removed; sidebar Tags nav item
- E2E verified: create QA Alpha -> rename to QA Beta (registry + UI) -> delete; stale dev-server transform diagnosed (restart fixed) explaining earlier flakiness

### Skill(s) Used
- senior-frontend, playwright verification

### Status
- Complete on dev. Master sync pending user go-ahead.


## Session 2026-08-26 13:20

### Changes
- Tags page fixes (user-reported): renameInput overflowed card -> column layout w/ min-width:0; whole tag card clickable to open its ledger (inner clicks stopPropagation); edit/delete icons swapped to TransactionDetails-modal pencil/trash svgs w/ matching hover/active animation

### Skill(s) Used
- frontend-design, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 13:35

### Changes
- Tags page delete-confirm: Yes/No buttons were rendering bare (actBtn transparent classes from rewrite) -> switched to confirmBtn/cancelBtn styles w/ .deleteActions row; count=0 wording now 'Delete this unused tag?'

### Skill(s) Used
- ui-ux-pro-max, playwright verification

### Status
- Complete on dev.


## Session 2026-08-26 14:10

### Changes
- T-109 follow-up: wizard Tag field converted from datalist input to standard picker dropdown (trigger + overlay w/ No-tag option + inline create-new), matching Source/Destination picker design identity
- Live verified: dropdown opens/lists/creates/selects (trigger label updates to Travel)

### Skill(s) Used
- ui-ux-pro-max, senior-frontend

### Status
- Complete on dev.

## Session 2026-08-26 14:30

### Changes
- **Design identity — documented + wired:**
  - Created `docs/DESIGN_IDENTITY.md` v1.0 (170-line canonical): tokens (OKLCH, spacing, radii, shadows, typography, breakpoints, motion), 7 principles, surfaces (glass recipe), typography, 4 required interactive states + shimmer/empty/error, navigation (Sidebar/Header/BottomNav/FAB/SegmentedTabs), forms (FormField/AmountInput + deprecated native select → modal picker), modals/sheets/overlays/dropdowns (responsive pair 768, overlay 0.55 blur4 z300, picker 360/85vw blur24, closing 0.25-0.35s), ledger/cards/progress, icons (stroke 1.8, 16/18/20/24, emoji via TX_TYPE_ICON), motion, responsive (9 viewports), content constraints, recipes, banned patterns, §17 11-item pre-merge checklist.
  - Updated `DESIGN.md` header + added §7 (enforceable companion + gate table).
  - Updated `docs/FRONTEND_SPEC.md` v3.0 → 3.1: banner + §1.3 mandatory sentence + §4 table identity refs + §5 → §6 gate section.
  - Updated `AGENTS.md`: project tree lists DESIGN_IDENTITY.md, §3.2 promotes it to canonical review-enforceable, §3.4 bans `style{{}}`/hex/hardcoded locale and points to §§2/14/16.
- Gates: `build` PASS, `lint --max-warnings 0` PASS.

### Skill(s) Used
- ui-ux-pro-max, frontend-design, senior-frontend

### Status
- Complete on dev. Every future component/modal/dropdown/icon must pass `DESIGN_IDENTITY.md §17` before merge.

## Session 2026-08-26 15:30

### Changes
- **Playwright harness — fast e2e:**
  - Added `@playwright/test@1.54` + `playwright.config.ts:1` — `webServer: npm run dev` with `reuseExistingServer`, `workers:4`, `fullyParallel`, `setup` project → `chromium` with `storageState: e2e/.auth/storage.json`, `timeout 20s`, `trace on-first-retry`.
  - `e2e/auth.setup.ts:1` — `setup` seeds tiny deterministic DB (~12 txs: Salary/Groceries/Travel) via `seedTinyB64()` injected through `localStorage.moneyflows_db` + `page.reload()` + `storageState` snapshot — zero UI clicks, 2.9s.
  - `e2e/helpers/seed-tiny.ts:1` — inline SCHEMA from `SQLiteDatabaseService.ts:15-35` (covers `lend/repay`) + 2 members, 4 accounts, 12 txs, balance recalc, base64 export, cached.
  - `e2e/helpers/motion.ts:1` — `disableMotion()` injects `animation:none` for deterministic waits.
  - `e2e/app.smoke.spec.ts` + `e2e/search.smoke.spec.ts` — 4 tests proving current gap (dashboard slice vs ledger).
  - `package.json:6` scripts `test:e2e` / `test:e2e:ui` / `test:e2e:headed`; `.gitignore:12` ignores `e2e/.auth/` + `playwright/.cache/`.
- **Speed:** 4 tests `12.8s` serial-via-MCP → `12.6s` parallel (3 workers) with one webServer reuse; subsequent runs reuse DB via `storageState` (no cold seed). Keep `npm run dev` running → webServer reuse cuts 6s. Use `page.evaluate` seeding, not clicks; `disableMotion` removes shimmer waits.
- Gates: `typecheck` PASS, `build` PASS, `playwright --list` 4 tests, `playwright test` 4 passed.

### Skill(s) Used
- senior-frontend, playwright

### Status
- Complete on dev. Next: S-1 Highlight primitive.

## Session 2026-08-26 16:00

### Changes
- **Search — S-1..S-4 complete (S-5 deferred):**
  - **S-1** `tokens.css:8` + `utils/highlight.tsx:1`/`highlight.module.css:1` + `useDebouncedValue.ts:1`/`search.ts:1` — `--color-primary-mark /0.28` `mark` violet translucent + `Highlight` escaped regex + `matchesTx` (description+amount+type+account+member+tags+date via `shortDate`) + `useDebouncedValue(200)`.
  - **S-2 Dashboard** `Dashboard.tsx:13,222-300,427,444,481,518` — global `rawQuery→debouncedQuery(200)` + `matchesTx` over `transactions` (all, not `recentTxs` slice) then `slice(DASHBOARD_TX_DISPLAY_LIMIT)`, `accountMap/memberMap` ctx, `<Highlight>` on `mName/acctName/txDesc/debtorName`, empty `No matches for "q"`.
  - **S-3 Ledgers** — `MemberProfile.tsx:43,149-210,284,710,861` debounced local, `tagFilteredAll→searchFilteredAll→displayed.slice`, sentinel/length fix, `LedgerTable searchQuery` + `Highlight` + mobile `txDesc`; `GroupLedgerScreen.tsx:5,80-110,335,373` same pattern + `LedgerTable searchQuery`; `LoanDetailView.tsx:11,67,87-126,381,458` debounced + `matchesTx` + mobile `Highlight` + `LedgerTable searchQuery`; `TagLedgerScreen.tsx:8,108,238-270` added local search `LedgerSearch` + `filteredSorted` + `Highlight` on member/account/desc.
  - **S-4 Decouple** — `GroupsListScreen.tsx:11,123` `LoansScreen.tsx:6,20,34,150` `MemberList.tsx:10,18,30` `RecycleBin.tsx:6,22,31` `RecycleRow.tsx:2,36` — `effectiveSearch = mobileSearch.trim()` (drops `useSearchStore` OR), `Highlight` on `cardName/debtorName/memberName/Recycle name`, `LoanCard searchQuery` prop, `RecycleRow searchQuery`.
  - `LedgerTable.tsx:4,18,34,130-160` — `searchQuery` prop + `Highlight` on `desc`/`account` (virtual+plain).
- Gates: `typecheck` PASS, `lint --max-warnings 0` PASS, `build` PASS, `playwright test` 4/4 PASS.

### Skill(s) Used
- senior-frontend, ui-ux-pro-max

### Status
- S-1..S-4 done on dev. Dashboard now searches **all** transactions + highlights; ledgers search **that ledger only** with widened fields + highlight; pagination window fixed. S-5 DB LIKE deferred.

## Session 2026-08-26 17:00

### Changes
- **Header/Sidebar layout — single logo + blank header:**
  - Sidebar `Sidebar.tsx:18` now owns the **single** `MoneyFlows` logo (transplanted header gradient `Header.module.css:125` `135deg primary→income` `brandSlot` 52px) — replaces old sidebar `logoAccent`; when `!isDashboard` shows `Back 32 circle` + `breadcrumb` (`Members / Nusrat` etc.) in same slot (`breadcrumbRow` 10px muted `*` → text). Removes duplicate header logo.
  - Header `Header.tsx:28-64,66-90` desktop `left` now blank (`null` on desktop, mobile keeps `logo` on `/` else `← + title`); `searchWrap` rendered only when `isDashboard` (`{isDashboard && searchWrap}`) + filler `flex:1` on blank, hidden off-dashboard; `mobileSearchBtn` already hides off-dashboard `(!isMobile || isDashboard)`. Desktop off-dashboard header is blank glass `surface blur20 radius-md` `Header.module.css:1` with only `right` (`date ⚙ + 🔔`).
  - App `App.tsx:88-97` computes `isDashboard = pathname==='/'` + extended `breadcrumb` for `/groups/:id`, `/tags/:tag`, `/loans/:debtor` and passes `isDashboard+breadcrumb` to `Sidebar`, hides `SearchBar` row off-dashboard `{isDashboard && searchOpen &&}`.
  - Styles `Sidebar.module.css:15-80` new `brandSlot`, `logo/logoSpan` gradient, `backBtn` 32 circle hover glow, `breadcrumb/sep`.
- Gates: `typecheck` PASS, `lint` PASS, `build` PASS, `playwright` 4/4 PASS.

### Skill(s) Used
- senior-frontend, ui-ux-pro-max

### Status
- Complete on dev. Header search hidden off-dashboard, sidebar owns single logo or Back+breadcrumb, header blank frees 400px. Center space left empty for future use.

## Session 2026-08-26 17:10 — Fix: Back + routes in header

### Changes
- **Fix:** Back + breadcrumb/routes moved from sidebar → **header** per user correction.
  - Sidebar `Sidebar.tsx:1` reverted to **single logo only** (`brandSlot` 52px `MoneyFlows` gradient) — no `isDashboard`/`breadcrumb` props, no `backBtn` in sidebar.
  - Header `Header.tsx:1,28,45-90` now imports `Link`, desktop off-dashboard (`!isMobile && !isDashboard`) shows `← 32 circle` + `breadcrumb` (`Members / Nusrat`, `Groups`, `#tag`, `Loans/debtor`) in `left` (`flex` `breadcrumbRow` 12px muted `*→text` `Header.module.css:204`); dashboard desktop `left` stays blank (sidebar has logo). Mobile `← + breadcrumb` else `← + title` when `!isDashboard`. `searchWrap` still hidden off-dashboard `{isDashboard &&}`, blank center `flex:1` filler keeps `right` at edge.
  - App `App.tsx:99-104` `Sidebar` now plain (no breadcrumb), `Header` receives `breadcrumb` prop; `isDashboard` kept for `SearchBar` row gating.
- Gates: `typecheck` PASS, `build` PASS, `lint` PASS.

### Skill(s) Used
- senior-frontend

### Status
- Complete on dev. Single logo stays in sidebar, header shows Back + routes on all non-dashboard pages, search hidden off-dashboard, blank center reserved.

## Session 2026-08-26 17:30 — Version 1.2.0 + VERSIONING.md

### Changes
- **Bump 1.1.0 → 1.2.0** (feat drives MINOR per `docs/VERSIONING.md §2` highest-wins): `package.json:4` `1.2.0` → `__APP_VERSION__` → `Settings` footer; `whatsNew.ts:8` new `1.2.0` entry (5 bullets: dashboard all-transactions + ledger-scoped + single logo + splash match + gaps/duplicate date); `CHANGELOG.md:8` new `1.2.0 - 2026-08-26` `Added/Changed` + fresh `[Unreleased]`.
- **Docs** `docs/VERSIONING.md:1` NEW — semver `MAJOR/MINOR/PATCH` table, when-to-bump decision table (highest wins, `feat→MINOR`), what agent MUST do (four files one commit: `package.json` + `whatsNew` + `CHANGELOG` + no `session_log` bump), checklist, tagging on `master` only, guardrails, examples (`1.0.0→1.1.0` Tags, `1.1.0→1.2.0` Search).
- Wired `REPO_RULES.md:48` §7 → `VERSIONING.md` single source, `AGENTS.md:25` tree + `§3.4` versioning sentence.
- Gates: `typecheck` PASS, `build` PASS.

### Skill(s) Used
- senior-frontend

### Status
- Complete on dev. `Settings` will show `1.2.0` after next `dev→master` merge; agent now auto-bumps per `VERSIONING.md §2→§3`.

## Session 2026-08-26 17:20 — Splash matches sidebar logo

### Changes
- **Splash** `SplashScreen.module.css:24-38` wordmark now uses same treatment as sidebar `Sidebar.module.css:22-37` — `Money` gradient `135deg primary→income` clipped text `700`, `Flows` `500` `secondary` (`-webkit-text-fill-color` preserved). Typing split at 5 still `base=Money` gradient, `accent=Flows` secondary, cursor `primary` unchanged. Opening animation now shows the single app logo (36px vs sidebar 22px, same gradient) — no second logo treatment.

### Skill(s) Used
- frontend-design

### Status
- Complete on dev. Opening animation and sidebar share one logo identity.

## Session 2026-08-27 12:00 — Other Ledgers v1 approved + Future V2 doc

### Changes
- **Decision confirmed:** Sidebar = Other Ledgers · Storage = separate tables other_ledgers+other_ledger_entries with linkedTransactionId NULL (Option B, forward-compat dual-post) · Owner = Member OR free-text Other person (Option B) · Behavior v1 = standalone (no account impact), V2 dual-post later.
- **New docs:** docs/plans/OTHER_LEDGERS_PLAN.md (v1 full spec: routes /other-ledgers/:id, 2 Plus entry points, Date|Desc|Debit|Credit|Balance table, CreateLedger/AddEntry modals, service/store, integration) + docs/plans/OTHER_LEDGERS_FUTURE_V2.md (V2 next-update spec: Also post to Other Ledger toggle in wizard, atomic dual-write, link badge, edit/delete sync, filter chips, T-119..T-123 — builds only on "next update" trigger).
- **Updated docs:** docs/TICKETS.md v3.1 Phase 13 T-113..T-118 (approved), docs/PRD.md v3.1 F11/F12 Other Ledgers, docs/TAD.md v3.1 §2.4b schema, docs/FRONTEND_SPEC.md v3.2 routes + Other Ledgers screen spec, AGENTS.md §2 tree + §5 Phase 13 ticket table with future V2 note.
- **GitNexus:** 
ode .gitnexus/run.cjs analyze refreshed — 2332 nodes / 5065 edges / 192 flows.

### Skill(s) Used
- skill-creator, senior-backend, senior-frontend, ui-ux-pro-max

### Status
- Documented and staged on dev. **Next: T-113** — schema + migration for Other Ledgers. Ask "what's next to update?" → agent answers from OTHER_LEDGERS_FUTURE_V2.md (V2 dual-post).
## Session 2026-08-27 13:00 — Other Ledgers v1 built (T-113..T-118)

### Changes
- **T-113:** Schema other_ledgers + other_ledger_entries (linkedTransactionId NULL, indexes) + migration in _migrate() + SCHEMA update
- **T-114:** Domain otherLedgers/domain/types.ts + OtherLedgerService (sortOtherEntries, computeOtherRunningBalances, CRUD, recomputeBalances) + useOtherLedgerStore (Zustand)
- **T-115:** OtherLedgersIndex /other-ledgers — search, card grid with ledgerGradient, global +Entry picker (ledger dropdown), +New Ledger
- **T-116:** OtherLedgerDetail /other-ledgers/:id — hero with owner/start/balance, search, Date|Desc|Debit|Credit|Balance table, per-ledger +Add, edit/delete, PDF via jspdf
- **T-117:** CreateLedgerModal (Member/Other toggle, name 3-50, startingDate, openingBalance) + AddEntryModal (Debit/Credit xor, date >= start, desc 1-200, tag picker via useTagStore, edit mode)
- **T-118:** Wiring: Sidebar Other Ledgers, routeTitles, breadcrumb, BottomNav More sheet, DeletedItem widened, purgeExpired covers new tables, RecycleBin types widened
- Gates: typecheck PASS, lint --max-warnings 0 PASS, build PASS, vitest 19/19 (excluding e2e)

### Skill(s) Used
- senior-backend, senior-frontend, ui-ux-pro-max

### Status
- **Other Ledgers v1 complete on dev (2c8957c).** Next: Other Ledgers V2 (see OTHER_LEDGERS_FUTURE_V2.md) on "next update".

## Session 2026-09-29 12:07

### Changes
- New branch `feature/loan-lender-breakdown` off dev — per-lender loan breakdown + targeted repayment (Option A)
- Verified user scenario against DemoDB: Home EXP holds 15 active loans (Business Cash 30230 + Brac Bank x2 19000/35000 outstanding); confirmed no per-source totals and no pay-specific-lender path existed
- `LoanStack.lenderBreakdown` (derived, no migration) via `buildLenderBreakdown()` in LoanDatabase; `recordRepayment({ lenderAccountId })` hits chosen lender oldest-first, spills over FIFO; tx dest = chosen lender
- `LoanDetailView` header shows "Owed to" inline list when 2+ lenders (borrowed + outstanding each, member-suffixed names for duplicate bank names)
- Repay form shows scoped LenderPicker dropdown when 2+ lenders; single-lender flow unchanged; 6 new vitest tests (grouping + targeted/spillover/FIFO/reject)
- Gates: typecheck PASS, unit vitest 25/25 PASS (4 files), lint has 1 pre-existing warning in LedgerSection.tsx (untouched, fails --max-warnings 0 on dev too), e2e specs fail under vitest on clean dev too (pre-existing collector issue)
- Committed `b129947`, pushed to `origin/feature/loan-lender-breakdown`

### Skill(s) Used
- senior-backend, senior-frontend

### Status
- Feature complete on branch. Next: user confirmation to merge into dev (needs CHANGELOG [Unreleased] entry at merge time per REPO_RULES §5).

## Session 2026-09-29 12:20

### Changes
- Split repay form on `feature/loan-lender-breakdown` (`a5a961a`): "Paying Off" lender selector (allocation) + "Credit To" free account picker (money destination), independent; Credit To prefills with chosen lender until user overrides (touched-ref, survives lender switches)
- Service already accepted both ids — submit now sends `lenderAccountId` + `destinationAccountId` separately, empty credit falls back to lender; new 7th test (pay off BRAC_B, credit Cash) green
- Gates: unit vitest 26/26 PASS, tsc PASS, eslint PASS on all touched files

### Skill(s) Used
- senior-frontend

### Status
- Pushed. Still needs user confirmation to merge into dev + CHANGELOG entry.

## Session 2026-09-29 12:28

### Changes
- `a5658d2` on `feature/loan-lender-breakdown`: "Available in {account}" row in loan ledger header (live account balance, locale currency) — internal borrowers only, counterparty ledgers unchanged
- Gates: tsc PASS, eslint PASS, unit vitest 26/26 PASS; pushed

### Skill(s) Used
- senior-frontend

### Status
- Still needs user confirmation to merge into dev + CHANGELOG entry.

## Session 2026-09-29 12:36

### Changes
- Page feedback: "Owed to" breakdown in loan ledger header is now collapsible (`cef7bb1`) — header button shows lender count + chevron, expanded by default, `aria-expanded` set
- Page feedback follow-up: collapsed by default + chevron enlarged to a 28px tap target in `--color-text` (`883a6b1`)
- Page feedback: text glyph swapped for chevron-down SVG (same `M4 6l4 4 4-4` as AccountsSection, rotates 180° when open) (`505c4d2`)
- Page feedback: smooth open/close via grid-rows `0fr→1fr` slide (same pattern as accounts dropdown) (`9e9c8b1`)
- Page feedback: whole "Owed to" block toggles on click anywhere (header button keeps keyboard/`aria-expanded` handling with stopPropagation) (`b54ea33`)
- Page feedback: "Owed to · 3" title centered in section, chevron pinned right (`605a22c`)
- Page feedback follow-up: chevron vertically centered against title via `top: 50% + translateY` (`a48b904`)

## Session 2026-09-29 12:54

### Changes
- Ledger rename (`11fb69b`): pencil button next to debtor name reuses existing `edit-account` modal on the borrower account; stacks refetch on rename so header/PDF update; rename-by-ID propagates to all tx references; pushed
- Gates: tsc PASS, eslint PASS, unit vitest 26/26 PASS

## Session 2026-09-29 13:30

### Changes
- BUG: clicking any loan card froze the app (report + reproduced in two browsers). Root cause: rename refetch effect in LoanDetailView called fetchLoanStacks() → parent LoansScreen shows loading skeletons (unmounting detail) → remount refetches again → infinite mount/fetch/unmount storm (StrictMode double-effect refires it every mount)
- Fix (`297cb8d`): deleted the effect; header name now derives live from the accounts store via shared `getStackDisplayName()` helper (also adopted by LoanDatabase — one naming rule, no refetch, no loop)
- Verification: new e2e `14-loan-rename.spec.ts` (create loan → open ledger → rename → header asserts) PASSES 2/2; unit vitest 29/29 PASS; tsc + eslint PASS
- Gates: typecheck PASS, lint PASS, unit 29/29, e2e rename 2/2

### Skill(s) Used
- senior-frontend, senior-backend

### Status
- Pushed. Still needs user confirmation to merge into dev + CHANGELOG entry.
- Gates: tsc PASS, eslint PASS, unit vitest 26/26 PASS; pushed

### Skill(s) Used
- senior-frontend

### Status
- Merged into dev as squash `bfa4eaf` (2026-09-29 13:45, user-approved) with CHANGELOG `[Unreleased]` entries; build/tsc/unit 29/29 green on merged result; `dev` + feature branch pushed.

## Session 2026-09-29 13:45 (merge)

### Changes
- Squash-merged `feature/loan-lender-breakdown` → `dev` (`bfa4eaf`): per-lender breakdown, split repayment, available balance, ledger rename + freeze fix, 10 unit tests + e2e `14-loan-rename`, CHANGELOG entries
- Pushed `dev` (`dddfac2..bfa4eaf`); feature branch also pushed

### Status
- Next: user's call — delete `feature/loan-lender-breakdown` or keep; Other Ledgers V2 on "next update".

## Session 2026-10-02 (release 1.6.0)

### Changes
- Version bump `1.5.0 → 1.6.0` (MINOR per VERSIONING §2: feat + Added) in one commit `5bf47fd`: package.json + whatsNew 1.6.0 entry + CHANGELOG `[1.6.0] - 2026-10-02`
- Merged `dev → master` no-ff (`ded577d`), tagged `v1.6.0`, pushed `master --follow-tags`; `dev` fast-forwarded to master and pushed
- Gates on release: build PASS, tsc PASS, unit 29/29 PASS, e2e rename 2/2 PASS (earlier); lint has 1 pre-existing warning in untouched LedgerSection.tsx — disclosed, predates batch

### Status
- Released v1.6.0 on master. Next: delete local feature branches? Other Ledgers V2 on "next update".

## Session 2026-10-02 (global search)

### Changes
- New branch `feature/global-search` off dev (already contains master `ded577d`), pushed to origin
- Header search is now global: always visible on every page (was dashboard-only), grouped dropdown
  overlay across Transactions / Accounts / Members / Loans / Groups / Tags / Other Ledgers
  - NEW `useGlobalSearch.ts` — shared query store + 200ms debounce, per-entity caps, keyboard nav
    (move/selectActive), actions (tx→detail modal, others→routes); never touches ledger-local state
  - NEW `GlobalSearch.tsx` + `GlobalSearch.module.css` — glass dropdown (tokens only, §17 states)
  - `Header.tsx`/`SearchBar.tsx` — focus/blur wrapper, ArrowUp/Down+Enter/Esc, Highlight matches;
    mobile search toggle + SearchBar row now available on all pages (`App.tsx` gate removed)
  - Ledger-local `LedgerSearch`/`MobileLedger` states untouched — still scoped to their own ledger
- Gates: typecheck PASS, build PASS, unit vitest 29/29 PASS, lint clean on touched files
  (1 pre-existing warning in untouched LedgerSection.tsx, also fails on dev)
- Live verified on :3000: search visible on /member, "Eftynur" → Accounts+Members groups with
  highlight, click navigates to /member/:id, 0 console errors
- Committed `552c127`, pushed `origin/feature/global-search`

### Skill(s) Used
- senior-frontend, ui-ux-pro-max, playwright verification

### Status
- Complete on branch. Next: user confirmation to merge into dev (+ CHANGELOG [Unreleased] entry at merge time per REPO_RULES §5).

### Follow-up fix (same session)
- Bug: global-search dropdown painted behind page content (filter drawers, sticky loan headers, FAB).
  Root cause: `.header` has `backdrop-filter` → stacking context with z-auto, trapping the
  z-351 dropdown below later DOM content with its own z-index.
- Fix: `.header` gets `z-index: 150` — above page content (max 200, non-overlapping BottomNav/
  WhatsNew stay above it) but below modal overlays (300+) and import overlay (999).
- Verified live with screenshot on member profile: dropdown crisp above hero cards + ledger table.
- Gates: CSS-only change (no tsc/lint surface change); build + 29 unit tests green from parent commit.

### Follow-up fix 2 (same session)
- Feedback: dropdown background too glassy, results hard to read over busy ledgers.
- Fix: `.dropdown` background → `oklch(16% 0.015 260 / 0.92)` (frosted, near-opaque) instead of
  glassy `--color-surface` (/0.55); blur24 kept. Verified via screenshot — ledger no longer
  bleeds through, rows fully legible.

## Session 2026-10-02 (merge to dev)

### Changes
- Merged `feature/global-search` → `dev` as squash `a641ba9` (user-approved): global header
  search + z-index fix + frosted dropdown + CHANGELOG `[Unreleased]` entry; pushed `dev`
- Pre-merge gates on branch tip: typecheck PASS, build PASS, unit 29/29 PASS, lint clean on
  touched files (1 pre-existing LedgerSection.tsx warning, also on dev — disclosed)
- `detect_changes()` vs dev: 10 files, Header/SearchBar touched + 3 new files, LOW risk, no affected processes

### Status
- Live on dev. Next: delete `feature/global-search`? Other Ledgers V2 on "next update".

## Session 2026-10-02 (release 1.7.0)

### Changes
- Version bump `1.6.0 → 1.7.0` (MINOR per VERSIONING §2: feat + Added) in one commit `dc858f2`: package.json + whatsNew 1.7.0 entry + CHANGELOG `[1.7.0] - 2026-10-02`
- Merged `dev → master` no-ff (`6c1e014`), tagged `v1.7.0`, pushed `master --follow-tags`; `dev` fast-forwarded to master and pushed
- Gates on release: build PASS, tsc PASS, unit 29/29 PASS, version string confirmed baked into bundle; lint has 1 pre-existing warning in untouched LedgerSection.tsx — disclosed, predates batch

### Status
- Released v1.7.0 on master. Next: delete `feature/global-search`? Other Ledgers V2 on "next update".

## Session 2026-10-02 (member-wise whole report, B+C)

### Changes
- New branch `feature/member-wise-report` off dev (user-approved B+C combined: service engine + preview screen)
- T-132 `src/reports/` NEW: `MemberReportService` (accounts section, full-history balances, closing pinned to live `account.balance`) + 4 vitest tests
- T-133: loan sections grouped by counterparty (reuses loan credit/debit sets) + other-ledger sections (reuses `computeOtherRunningBalances`/`sortOtherEntries`) + 3 more tests (8 total in scope, all green)
- T-134 `memberReportPdf.ts`: cover summary + per-account/loan/ledger tables via lazy jspdf-autotable, `Member_<name>_<date>.pdf`
- T-135 `memberReportCsv.ts`: BOM + `Section,Account,Date,Type,Description,Debit,Credit,Balance` rows with RFC4180 quoting + 1 test
- T-136 `MemberReportScreen` (`/member/:id/report`): presets (all/month/last-3/custom), account chips, Loans/Other-ledgers toggles, summary hero, LedgerTable sections, PDF/CSV/Print, print stylesheet, mobile hero 2-col
- T-137 wiring: lazy route + `Members / Name / Report` breadcrumb in `App.tsx` (impact LOW), Report button in `ProfileHero` desktop actions + mobile pills, CHANGELOG `[Unreleased]` entry
- Gates: unit 8/8 (reports scope) PASS, `tsc` PASS, `eslint --max-warnings 0` PASS on touched files, `vite build` PASS
- Note: `git push` to origin repeatedly timed out (network) — 5 commits local on branch at `71af06c`; push pending retry
- Follow-up (`90e71cc`): page feedback — every account/loan/ledger section now starts on a fresh PDF page (`doc.addPage()`), same rule in the print stylesheet; cover summary + first section share page 1
- Follow-up (`e4a83b9`, user-confirmed): loan rows now follow member perspective — money out = debit, money back = credit (`isOutflow` vs included accounts); receivable/outstanding unchanged; 9/9 tests green; push to origin failing again (network), commit local
- Fix (`f1dcdc4`, user-reported): linked rows showed "(deleted account)" because the name map only knew the member's own accounts. Now resolves against ALL accounts — same-member shows bare name, other members show "Member / Account" (also in loan sections); only truly missing accounts read as deleted. 10/10 tests green, pushed.
- UI (`d0c1a62`, user-approved option B): filters moved off the page into a funnel-button sheet — desktop Modal / mobile BottomSheet (`ReportFilterSheet`: period, accounts, sections, Reset/Apply); header keeps a one-line summary (`This month · 3 of 5 accounts`), funnel shows a dot when filters differ from default. Pushed.
- Fix (`27955a7`, user-reported): custom From/To used native date inputs — now uses the shared shadcn `DatePicker` calendar like every other screen. Pushed.
- Debug (user-reported "no calendar opens"): reproduced via new `e2e/report-calendar.spec.ts` — root cause was a STALE dev server on :3000 serving the pre-DatePicker bundle (HMR hadn't picked up the fix; `reuseExistingServer` kept reusing it). Killed it, fresh server → calendar opens, e2e green. Also dropped the Modal's redundant default Cancel/Save footer in the filter sheet (`footer={<></>}`). Committed `9c0fe31`, pushed.
- Print (`9976920`, user-reported "Print takes the whole app screen"): print now isolates report content — sidebar/header/bottom-nav/ripple/search hidden, tokens flip to light paper + dark ink (`@page 12mm`), blur/shadows off, and full non-virtualized bordered tables (`ReportPrintTable`, same Date|Type|Description|Debit|Credit|Balance columns as the PDF) replace the virtualized LedgerTables with per-section page breaks. Verified by new print-media e2e (chrome hidden, print tables visible). Screen split to respect 300 LOC (`ReportSections`). Pushed.

## Session 2026-10-02 (merge member-wise report → dev)

### Changes
- Squash-merged `feature/member-wise-report` → `dev` (`5f6c501`, user-approved): full member-wise report (T-132..T-137 + perspective flip, counterparty labels, per-page PDF sections, filter sheet, DatePicker fix, print isolation) + CHANGELOG `[Unreleased]` entry; pushed `dev`
- Pre-merge gates on merged result: typecheck PASS, unit 10/10 (reports scope) PASS, build PASS

### Skill(s) Used
- senior-backend, senior-frontend

### Status
- Live on dev. Next: delete `feature/member-wise-report`? Version bump at release time per VERSIONING.md. Other Ledgers V2 on "next update".

### Skill(s) Used
- senior-backend, senior-frontend

### Status
- Complete on branch, NOT merged. Next: user reviews report screen live → confirm merge into dev (+ push when network recovers).

## Session 2026-10-02 (release bump 1.7.0 → 1.8.0)

### Changes
- MINOR bump per VERSIONING.md §2 (feat(report) member-wise report → Added): `package.json:4` 1.7.0→1.8.0 + `whatsNew.ts:8` new 1.8.0 entry (3 plain-English bullets) + `CHANGELOG.md:8` `[Unreleased]`→`## [1.8.0] - 2026-10-02`, committed `b126de3` on dev
- Gates on bump: typecheck PASS, build PASS, `detect_changes` LOW (WHATS_NEW only, no processes); lint has 1 pre-existing warning in untouched `LedgerSection.tsx:82` (scheduleClose dep) — out of scope for atomic version commit

### Skill(s) Used
- gitnexus

### Status
- 1.8.0 live on dev (unpushed). Next: user confirms `merge dev to master` → merge + tag v1.8.0 per VERSIONING.md §5.

## Session 2026-10-02 (merge 1.8.0 → master)

### Changes
- User-approved: pushed `dev` (`31eac19..fc5da49`), pre-merge gates typecheck PASS / build PASS / unit 39/39 PASS (17 e2e suites fail under vitest import — pre-existing, run via playwright instead) / lint 1 pre-existing warning `LedgerSection.tsx:82`
- Merged `dev → master` no-ff `57cd820` + tagged `v1.8.0` + pushed `master --follow-tags`; `dev` fast-forwarded to `master`, pushed pending

### Skill(s) Used
- gitnexus

### Status
- v1.8.0 live on master + dev. Next: Other Ledgers V2 on "next update".

## Session 2026-10-02 (theme + accent planning)

### Changes
- User approved A1+B1: `data-theme` token override + header sun/moon toggle; 6 curated OKLCH accents in Settings
- Created branch `feature/theme-accent` off `dev`; committed `fa51dab`: `docs/plans/THEME_ACCENT_PLAN.md` (NEW) + Phase 16 T-132..T-137 in `docs/TICKETS.md`

### Skill(s) Used
- frontend-design, senior-frontend

### Status
- Plan committed on `feature/theme-accent` (unpushed). Next: build T-132 token foundation on user go-ahead.

## Session 2026-10-02 (Phase 16 build: theme + accent T-132..T-137)

### Changes
- T-132 token foundation (`868a5d9`, 25 files): `--color-primary-deep`, `[data-theme="light"]`, 6 `[data-accent]` blocks, glow/mark via `color-mix` (auto-follow), gradient tails swapped, tailwind `@theme inline` aliased to tokens (shadcn follows theme+accent, verified in dist CSS)
- T-133 settings + hook (`a4202d9`): `theme`/`accentId` in `AppSettings`, deep-fill `merge` in store (backfills old installs), `ACCENTS` constants, `useTheme()` + pre-paint script in `index.html`, wired in `AppLayout`
- T-134 header toggle (`d2ae6ff`): sun/moon 36px button in `settingsWrap` (desktop + mobile), `useEffectiveTheme()`, all 4 states
- T-135 appearance pickers (`3c3f004`): shared `AppearanceSection` (theme 3-way + swatch grid, instant-apply) in `SettingsModal` + `SettingsPage`
- T-136 audit (`cf25eb4`, 41 files): `--color-wash` sweep (~100 white washes), `dark:` custom-variant follows app theme, `DESIGN_IDENTITY.md` §2/§17
- T-136b + T-137 (`0849c8c`, 32 files): verification found gold/teal white-text fail → new `--color-text-on-primary` (dark ink for teal/gold) swept across all primary buttons + shadcn; dark slabs (Modal/Search/pickers/drawers) made adaptive; fixed pre-existing `actPrimary` missing white text (invisible in light); `accents.test.ts` 5/5 (palette↔CSS sync guard)
- Live verification (dev :5174, fresh boot): header toggle flips + persists, store merge backfills defaults, 1440 dark/violet + light/violet + light/gold + 390 light/gold screenshots, overflow 0, 0 console errors, contrast body 13-15:1 / white-on-primary 3.6-4 / ink-on-teal-gold 6.5-7; 39/39 unit tests pass (17 e2e-under-vitest fails pre-existing)
- Gates: typecheck PASS, build PASS, lint 1 pre-existing warning (`LedgerSection.tsx:82`)

### Skill(s) Used
- frontend-design, senior-frontend, code-reviewer

### Status
- Phase 16 complete on `feature/theme-accent` (unpushed). Next: user confirms merge to `dev` (REPO_RULES §3) — then push + Other Ledgers V2 on "next update".

## Session 2026-10-02 (BUG-4 hover fix)

### Changes
- User report: light-mode hover on "+ New Transaction" washed the label (white on near-white)
- Logged BUG-4 first per §3.11, diagnosed: `.actBtn:hover` wash bg (0,2,0) stomps `.actPrimary` gradient; audited all other gradient-button hovers (opacity/glow only — safe)
- Owner-approved option A: `.actPrimary:hover` re-asserts gradient + opacity + glow
- Verified live on :5174 (light/violet): real hover keeps gradient + white label, screenshot; 0 console errors

### Skill(s) Used
- senior-frontend

### Status
- BUG-4 fixed on `feature/theme-accent` (unpushed, CHANGELOG deferred to `dev` merge). Next: merge confirmation.

## Session 2026-10-02 (light-mode polish: semantic ramp + depth)

### Changes
- User asked to improve light background + text visibility; measured first: body ink 13.4 / muted 6.0 already good, but income 2.9 / gold 2.3 / success 3.0 on white cards failed
- Owner-approved option B: `[data-theme="light"]` retuned semantic ramp (income 50/0.12/170, expense 52/0.15/30, cash 55/0.13/85, success 50/0.12/150 — all ≥4.9:1 on cards; purple/danger pass as-is), layered accent ambient (top + bottom wash), border 0.14→0.16
- `DESIGN_IDENTITY.md` theming row documents the ramp
- Verified live on :5174 (light/violet): computed tokens resolve to ramp values, dashboard screenshot legible, 0 console errors

### Skill(s) Used
- frontend-design

### Status
- Pushed on `feature/theme-accent`. Next: merge confirmation (CHANGELOG entry rides with merge).

## Session 2026-10-02 (Phase 17: background presets T-138..T-140)

### Changes
- User asked for background choice per mode; owner-approved option A (curated presets, luminance in-lane)
- T-138: `[data-bg]` blocks (midnight/forest/plum + sky/sand/mint; obsidian/paper are defaults), `bgDark`/`bgLight` in `AppSettings`, `backgrounds.ts`, `useTheme()` sets single `data-bg` for current mode + bg-tinted `theme-color`, pre-paint mirror
- T-139: Appearance "Background" row (presets follow effective mode, reuses swatch styles) + `backgrounds.test.ts` 4/4
- T-140: live verification — 8/8 presets resolve to exact values, seeded `bgDark:forest` boots correctly, dark/forest dashboard + picker screenshots, 0 errors; typecheck + build green
- Fixed 2 `noUncheckedIndexedAccess` errors; updated `TICKETS.md` Phase 17 → Complete

### Skill(s) Used
- senior-frontend

### Status
- Phase 17 complete, pushed on `feature/theme-accent`. Next: merge confirmation.

## Session 2026-10-02 (Phase 18: type overhaul T-141..T-144)

### Changes
- Merged `feature/theme-accent` → `dev` first (user order): 14 commits + CHANGELOG, `--no-ff`, gates green, pushed; branch kept alive
- T-141 (`7aa2138`): fontsource variable Manrope/Inter/Anek Bangla (+JetBrains Mono — caught that killing the Google @import would orphan chrome mono) + dropped dead Geist dep; retokened display/body; `.amount` utility
- T-142 (`1791466`, 20 files): all amount rules mono→Inter (tabular kept); chrome keeps mono (search sub, snapshot times, text-mono util)
- T-143: DESIGN_IDENTITY (§1/§2/§3/§5/§17) + DESIGN.md type tables rewritten to the new contract
- T-144: live verification on demo.db — all 4 faces `document.fonts.check` true; bn-BD/৳ renders Bengali digits aligned, no tofu; Inter `zero` does NOT activate in Chrome → dropped from `.amount`; 560KB woff2 total but unicode-range split (browser fetches used subsets only); zero `googleapis` refs in dist; restored en-IN/BDT after
- TICKETS.md Phase 18 → Complete

### Skill(s) Used
- senior-frontend, code-reviewer

### Status
- Phase 18 complete on `feature/theme-accent` (unpushed). Next: merge confirmation for the font batch.

## Session 2026-10-02 (merge Phase 18 → dev)

### Changes
- User-approved merge: `feature/theme-accent` (Phase 18: T-141/142/143/144 + CHANGELOG entry) → `dev` via `--no-ff`; branch kept
- Post-merge build green on the merge result; pushed

### Skill(s) Used
- gitnexus

### Status
- Phase 18 merged to `dev`. Branch `feature/theme-accent` kept (next: TBD).

## Session 2026-10-02 (release 1.9.0 → master)

### Changes
- User-approved release: bump 1.8.0 → 1.9.0 MINOR on `dev` (`package.json` + `whatsNew.ts` 1.9.0 entry + `CHANGELOG [1.9.0]`, one commit `a18b014`)
- Gates: typecheck PASS, build PASS, 48/48 unit PASS (17 e2e-under-vitest pre-existing), lint 1 pre-existing warning — same caveats as 1.8.0
- `whatsNewFor('1.9.0')` resolves (exact find); version define flows from package.json (unchanged paths)
- Merged `dev → master` no-ff `f338c62` + tagged `v1.9.0` + pushed `master --follow-tags`; `dev` fast-forwarded to `master`, pushed

### Skill(s) Used
- gitnexus

### Status
- v1.9.0 live on master + dev. Next: user call (Other Ledgers V2 on "next update", or new work).

## Session 2026-10-02 (BUG-5 account cards)

### Changes
- User report: card text doesn't adapt to light mode; asked all components auto-adjust
- Diagnosed: cards keep fixed dark gradients but inherit theme ink (dark-on-dark in light); audited all remaining `color:#fff/white` — avatars/badges/semantic are correct, found missed solid-primary whites (filter pills, add hovers, obBtn, filterIconBox) breaking under gold/teal
- Note: user's :3000 runs pre-theme code (no header toggle) — verified there that old build has no light mode; all verification done on :5174 (feature branch) with demo.db
- Logged BUG-5 first per §3.11; owner-approved option A (dark cards, white ink)
- Fix: `.card` pins white ink, actions white, `:active` → press-scale (was gradient-stomping wash, BUG-4 pattern); missed on-primary whites → ink token; identity AccountCard row notes pinned ink
- Verified live on demo.db (7 real cards, light mode): gradient bg + all-white text via computed styles; build green

### Skill(s) Used
- senior-frontend

### Status
- BUG-5 fixed, pushed on `feature/theme-accent` (CHANGELOG deferred to `dev` merge). Next: merge confirmation.

## Session 2026-10-02 (merge theme-accent → dev)

### Changes
- User-approved merge: `feature/theme-accent` (14 commits + CHANGELOG entry) → `dev` via `--no-ff` (branch kept alive for Phase 18 fonts)
- Closed: Phase 16 T-132..T-137, Phase 17 T-138..T-140, BUG-4 + BUG-5 fixed (CHANGELOG `[Unreleased]` Added/Fixed included, no version bump per VERSIONING — feature→dev)
- Gates pre-merge: typecheck PASS, build PASS, 48/48 unit PASS (17 e2e-under-vitest pre-existing), lint 1 pre-existing warning (`LedgerSection.tsx:82`, also on dev)
- detect_changes vs dev: MEDIUM — touched symbols exactly the theme surfaces (AppLayout, AppSettings, Header, SettingsModal/Page, store) + docs; affected processes are app-shell/settings flows, as intended

### Skill(s) Used
- gitnexus

### Status
- Merged to `dev`. Next: Phase 18 type overhaul on `feature/theme-accent`.

## Session 2026-10-02 (splash version tag)

### Changes
- Splash screen now shows `v{APP_VERSION}` bottom-center (`SplashScreen.tsx:63` + `.version` in `SplashScreen.module.css`): absolute, `bottom: --space-8`, centered via `translateX(-50%)`, `text-secondary` + `font-size-xs` tokens, auto-follows theme/accent and version bumps (currently v1.9.0)
- Gates: typecheck PASS, eslint PASS on touched file, build PASS, `detect_changes` LOW (SplashScreen touched only, no affected processes)

### Skill(s) Used
- senior-frontend

### Status
- Complete on dev (`1ddb30d`), pushed to `origin/dev`. Next: user call (Other Ledgers V2 on "next update", or new work).

## Session 2026-10-02 (release 1.10.0 → master)

### Changes
- User-approved release: bump 1.9.0 → 1.10.0 MINOR (user chose MINOR over PATCH) in one commit `b1c3f1b`: package.json + whatsNew 1.10.0 entry ('loading screen now shows the app version at the bottom') + CHANGELOG `## [1.10.0] - 2026-10-02` Added
- Gates: typecheck PASS, build PASS, unit 48/48 PASS, eslint clean on touched file (1 pre-existing warning in untouched LedgerSection.tsx — disclosed), `detect_changes` vs master LOW (SplashScreen only, no affected processes)
- Merged `dev → master` no-ff `104eeaa` + tagged `v1.10.0` + pushed `master --follow-tags`; `dev` fast-forwarded to `master`, pushed — back on `dev`

### Skill(s) Used
- senior-frontend, gitnexus

### Status
- v1.10.0 live on master + dev. Next: user call (Other Ledgers V2 on "next update", or new work).

## Session 2026-10-02 (branch feature/ui-polish)

### Changes
- New branch `feature/ui-polish` off `dev` (user-approved name), pushed to origin with upstream tracking — clean base at `427cda3` (post-1.10.0)

### Status
- Ready for UI fixes. Next: user lists the fixes.

### Header click animations (same session)
- `Header.tsx`/`Header.module.css` on `feature/ui-polish`: one-shot icon replays via `useReplay()` remount keys — gear 360° spin, theme rotate-in swap, plus 90° twist, bell ring swing, back nudge, search pop, clear twist; `prefers-reduced-motion` disables all; existing hover/active states untouched
- Gates: typecheck PASS, eslint PASS, build PASS, unit 48/48 PASS, `detect_changes` LOW (Header only, no affected processes; pre-edit impact HIGH disclosed — structural, change is additive-only)

### App-wide button animations (same session)
- Shared infra: `hooks/useReplay.ts` + `styles/click-anims.css` (global `anim-pop/spin/twist/ring/nudge/swap` + reduced-motion guard, imported in `main.tsx`); `Header` refactored to shared hook
- 44 files wired (~250 buttons, 3 parallel batches): chrome, dashboard, members, loans, groups, tags, reports, all modals/pickers, recycle, other ledgers, shadcn `Button` (covers calendar day cells) + calendar nav
- Fixed 2 real layout breaks from review: `MemberList` + `OtherLedgersIndex` space-between cards now use per-child spans sharing one replay key (single wrapper collapsed the balance alignment)
- Skipped (user-approved): 6 oversized files already >300 LOC (`LoanDetailView`, `GroupLedgerScreen`, `GroupsListScreen`, `SettingsPage`, `SettingsModal`, `OtherLedgerDetail` — wire when split per T-092) + `ErrorBoundary` (class component)
- Gates: typecheck PASS, eslint clean (1 pre-existing `LedgerSection` warning, untouched), build PASS, unit 48/48 PASS, `detect_changes` HIGH disclosed (44 files, additive-only, no logic changes)

### BUG-8 fix (same session, page feedback on `/`)
- Logged BUG-8 first per §3.11: Dashboard "New Transaction" icon + label wrapped to two lines — rollout's single `.anim-target` span collapsed the row-flex `gap: 8px`
- Fix: two `.anim-target` spans sharing one replay key (icon + label); tree-wide audit found no other svg+text single-span wrappers
- Gates: typecheck PASS, eslint PASS; `detect_changes` n/a (single button)

## Session 2026-10-02 (merge feature/ui-polish → dev)

### Changes
- User-approved merge: `feature/ui-polish` (5 commits: header anims + app-wide rollout + BUG-8 fix + CHANGELOG `[Unreleased]` Added/Fixed) → `dev` via `--no-ff` `e6a9d41` (branch kept alive); pushed `dev`
- Pre-merge gates on branch tip: typecheck PASS, build PASS, unit 48/48 PASS, eslint clean (1 pre-existing `LedgerSection` warning)
- `detect_changes` vs dev: HIGH disclosed (50 files, all additive-only animation wiring, no logic changes); no version bump (feature→dev, per VERSIONING)
- First `dev` push timed out (network, retry succeeded `427cda3..e6a9d41`); back on `feature/ui-polish` (clean, one commit behind the merge)

## Session 2026-10-02 (BUG-9 amount clipping, same branch)

### Changes
- Logged BUG-9 first per §3.11: big amounts clipped left in Recent Transactions (fixed 100px `.txAmount`); user picked scope 1 (dashboard + ledgers)
- Fix: dashboard cell `width` → `min-width` (grows, desc flexes); ledger `.debit/.credit/.balance` centered → right-aligned (leading digits + ellipsis). `minmax` tracks rejected: header/rows are separate grids, content sizing would misalign them
- Gates: build PASS, typecheck PASS; impact LOW (LedgerTable has 3 render-only consumers; RecentTxsPanel not indexed, single consumer Dashboard)

## Session 2026-10-02 (font-size follow-up: sidebar + settings, same branch)

### Changes
- User report: text-size setting had no effect on sidebar + Settings page — both used fixed px (7 + 22 spots), bypassing the scaled tokens
- Fix: mapped every fixed size to the nearest fluid token (22→text-5xl, 16→text-2xl, 14→text-lg, 13→text-md, 12→text-base, 11→text-sm, 10→text-xs); zero fixed px remain in either file
- Gates: build PASS, typecheck PASS; impact max LOW

## Session 2026-10-02 (merge feature/ui-polish → dev, round 2)

### Changes
- User-approved merge: `feature/ui-polish` (text-size setting + BUG-9 amount fix + sidebar/settings token mapping + CHANGELOG `[Unreleased]` entries) → `dev` via `--no-ff` `8a6c131` (branch kept alive); pushed `dev` (`e6a9d41..8a6c131`)
- Pre-merge gates: build PASS, unit 48/48 PASS; `detect_changes` vs dev LOW, no affected processes; no version bump (feature→dev)
- Back on `feature/ui-polish`, clean

## Session 2026-10-02 (collapsible sidebar, same branch)

### Changes
- User-picked design (plain-language choice): fold + hover peek. Arrow button on the sidebar edge folds to a 68px icon rail; hovering the rail peeks the full 220px floating over content; choice persists via `AppSettings.sidebarCollapsed`; folded icons show name tooltips; footer keeps avatar, logo becomes M mark; content area reclaims the space (`mainWide`); mobile/bottom-nav untouched
- Gates: typecheck PASS, eslint PASS, build PASS, unit 48/48 PASS; impact HIGH disclosed (structural — AppLayout shell; change additive, Sidebar props untouched)

## Session 2026-10-02 (sidebar collapse debug via Playwright, same branch)

### Changes
- User report: sidebar "stuck" after clicking fold (content moved under it, bar stayed wide). Code review: store + classes + shipped CSS all correct (verified `width:68px` collapsed + `padding-left:100px` mainWide rules in fresh `dist` output)
- Playwright proof on fresh server (`e2e/sidebar-fold.check`, deleted after): open=220, folded=68, hover-peek=220, unfold works, main padding 100px — 2/2 green; screenshot confirms icon rail + reclaimed content + readable amounts
- Root cause: user's tab was on the stale :3000 dev server (served pre-collapse bundle; third such incident). Killed it, started a fresh `npm run dev` (:3000, HTTP 200)
- No code changes needed; tree clean

## Session 2026-10-02 (sidebar peek + toggle polish, same branch)

### Changes
- User feedback: peek slid UNDER the app header (header z-150 > sidebar z-100) + floating edge arrow looked tacked-on
- Fix: peek now `z-index:160` via doubled `.sidebar.peek` selector (beats App.module z-100 regardless of bundle order; still below WhatsNew 200 / modals 300+) — toggle moved INSIDE the bar (logo row; stacks under the M mark when folded), no longer half-outside
- Playwright verified (2/2, spec deleted after): `elementFromPoint` at peek top = aside; screenshots confirm in-flow toggle + peek floating above header
- Gates: typecheck PASS, eslint PASS, build PASS

## Session 2026-10-02 (sidebar brand-face stacking bug, same branch)

### Changes
- User report: arrow + logo misplaced when folded. Playwright reproduced: M mark rendered at x≈79–115, OUTSIDE the 68px rail
- Root cause (mine, not stale client this time): hidden face still sized the shared grid cell (fixed via display:none), then `.faceHidden{display:none}` lost to `.faceOpen/.faceShut{display:flex}` — equal specificity, later rule won, so BOTH faces rendered stacked and overflowing
- Fix: `.face.faceHidden` (doubled specificity, deterministic win). Verified: mark/toggle centers exactly at rail center, logo hidden, element screenshot clean
- Gates: Playwright 2/2 green (specs deleted after), build PASS

## Session 2026-10-02 (hide folded toggle, same branch)

### Changes
- User call: no toggle on the folded rail — removed the shut-face button; the way back is hover-peek (reveals full bar with its toggle) → click pins open
- Playwright 2/2 green: zero toggles when folded, peek toggle pins open at 220px after mouse leaves (spec deleted after)
- Gates: typecheck PASS, eslint PASS, build PASS

## Session 2026-10-02 (sidebar smooth fold, same branch)

### Changes
- User report: nav buttons jumped down/up on fold — the top area changed height between states (stacked M+toggle vs logo row)
- Fix (CSS-only): `.brandSlot` locked to a fixed 104px in both states (fits the 74px folded stack and the logo row) + padding transition; nav offset now identical, verified NAV Y = 145px before/mid/after via Playwright (spec deleted after)
- Gates: build PASS

## Session 2026-10-02 (sidebar full animation pass, same branch)

### Changes
- User asked for fully animated open/close/pin: page content padding now glides (`padding-left` 0.25s transition — measured mid-flight at 125px, proving glide not snap), peek shadow fades in, logo/M-mark crossfade in place via stacked grid faces (no size change, nav rock-solid at 145px through the transition)
- Playwright 2/2 green (spec deleted after); screenshot confirms folded stack (M over chevron, centered) + reclaimed content
- Gates: typecheck PASS, eslint PASS, build PASS

## Session 2026-10-02 (sidebar nav icons, same branch)

### Changes
- Page feedback: Members → lucide `Users` (`user-group` doesn't exist in lucide — verified, closest picked by user), Groups → `SquareStack`, Loans → `HandCoins`; applied to sidebar + mobile BottomNav for consistency (`App.tsx` nav configs, `size={20} strokeWidth={1.8}` matching the old inline-svg treatment)
- Gates: typecheck PASS, eslint PASS, build PASS; impact LOW

## Session 2026-10-02 (text size setting, same branch)

### Changes
- NEW `constants/fontSizes.ts` (Small/Medium/Large, default Medium) + `AppSettings.fontSize` (deep-fill backfills old installs) + `tokens.css` `[data-font]` blocks scaling all `--text-*`/`--font-size-*` tokens + `useTheme()` sets `data-font` + index.html pre-paint mirror + `AppearanceSection` "Text size" segmented row (instant-apply, anim-pop, both Settings modal + page)
- Gates: typecheck PASS, eslint PASS, build PASS, unit 48/48 PASS, `detect_changes` LOW (index predates theme/accent symbols — change follows the approved accent/bg precedent, additive-only)

## Session 2026-10-02 (merge feature/ui-polish → dev, round 3)

### Changes
- User-approved merge: `feature/ui-polish` (lucide nav icons + collapsible sidebar suite + CHANGELOG `[Unreleased]` entries) → `dev` via `--no-ff` `b8e9401` (branch kept); pushed `dev` (`8a6c131..b8e9401`)
- Pre-merge gates: build PASS, unit 48/48 PASS; `detect_changes` vs dev MEDIUM (7 files, sidebar/nav scope, Playwright-verified live); no version bump
- Staying on `dev`

## Session 2026-10-02 (release 1.11.0 → master)

### Changes
- User-approved release: bump 1.10.0 → 1.11.0 MINOR (multiple feats, nothing breaking) in one commit `ea5d375`: package.json + whatsNew 1.11.0 entry (3 plain-English bullets) + CHANGELOG `[1.11.0] - 2026-10-02`
- Gates: typecheck PASS, build PASS, 48/48 unit PASS (lint: 1 pre-existing warning in untouched LedgerSection.tsx — disclosed)
- Merged `dev → master` no-ff `79edf85` + tagged `v1.11.0` + pushed `master --follow-tags`; `dev` fast-forwarded to `master`, pushed — on `dev`, in sync

### Status
- v1.11.0 live on master + dev. Next: user call.

## Session 2026-10-02 (settings reorganization, on dev)

### Changes
- NEW components/settings/SettingsDisclosure.tsx + CSS: reusable collapsible section (loan-ledger chevron SVG M4 6l4 4 4-4, grid 0fr→1fr expand, tokens only)
- SettingsPage: 6 tabs → 5 (Backup & Storage merged: Restore Points latest-hero + Show-all-N, Cloud Backup latest-file + Show-all-N, Engine Health, Import/Export); General/Dashboard/Activity/About wrapped in disclosures; sub-nav 160px → 200px nowrap
- SettingsModal: same disclosures mirrored (Money & Region, Appearance, Limits, Restore, Cloud, Storage, App)
- Gates: typecheck PASS, eslint PASS (touched files), build PASS, unit 48/48 PASS (17 e2e suites fail under vitest runner — pre-existing config issue, untouched); detect_changes MEDIUM, settings scope only

### Status
- Committed on dev. Next: user call.


## Session 2026-10-02 (groups rename + sort, on dev)

### Changes
- GroupsListScreen.tsx: rename in detail body (desktop Modal + mobile BottomSheet) via pencil button — Modal title is string-only so body row mirrors name; validation empty + duplicate (case-insensitive) with inline error; persists via saveAccountGroup UPSERT, updates list + detail state
- GroupsListScreen.tsx: sort dropdown (Created order | Name A-Z | Highest balance | Most accounts), view-only, desktop header + mobile toolbar above list; combines with existing search
- GroupsListScreen.module.css: sortLabel/sortSelect/mobileToolbar + renameRow/renameName/renameBtn/renameInput/renameActions/renameSave/renameCancel/renameError, tokens only, no new inline styles
- Gates: tsc PASS, eslint PASS (tsx), detect_changes MEDIUM groups-scope only; file now 495 LOC (was 365, limit 300 — T-092 split deferred, disclosed)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev. Next: user verifies UI then commit.


## Session 2026-10-02 (groups sort restyle to chips, on dev)

### Changes
- Replaced native sort <select> (deprecated per DESIGN_IDENTITY §9) with filter chips row: Created / Name A-Z / Highest balance / Most accounts; single row visible desktop+mobile, aria-pressed, active = primary gradient + glow
- CSS: removed sortLabel/sortSelect/mobileToolbar; added chips/chip/chipActive per §15 recipe (pill, wash 6%, 4 states incl. focus-visible 2px)
- Gates: tsc PASS, eslint PASS

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev. Next: user verifies UI then commit.


## Session 2026-10-02 (member ledger header icon fix, on dev)

### Changes
- Page feedback /member/:id desktop: Download PDF + Show-filters buttons had icons misplaced — .anim-target inline span broke pdfBtn flex layout (baseline icon, dead hover gap) and pdfBtnIcon class sat directly on <svg>
- LedgerSection.tsx: wrapped both header svgs in <span pdfBtnIcon> (GroupLedgerScreen pattern); MemberProfile.module.css: .pdfBtn .anim-target inline-flex centered, hover gap moved onto .anim-target (6px, drawerToggle 4px), .pdfBtnIcon centers + sizes inner svg
- Gates: tsc PASS; eslint 1 pre-existing warning (useEffect scheduleClose dep, untouched line 98 — disclosed)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev (with groups rename+chips). Next: user verifies then commit.


## Session 2026-10-02 (ledger header icons root-cause fix, on dev)

### Changes
- Follow-up: icons still broken after first fix — zoomed screenshot showed PDF icon fully clipped + chevron riding top edge. Root cause: .anim-target rules in MemberProfile.module.css were dead — CSS Modules hashes .anim-target (plain class in tsx stays global), so inline-flex centering never applied; verified only 3 occurrences, all mine
- Fix: :global(.anim-target) on the 3 rules. Verified with seeded Playwright screenshots: rest = search/download/chevron all centered; hover = Download PDF pill expands with proper icon-label gap
- Scratch spec + screenshots removed. Gates: tsc PASS; eslint 1 pre-existing warning (line 98, untouched)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev (with groups rename+chips). Next: user verifies then commit.


## Session 2026-10-02 (commit, on dev)

### Changes
- CHANGELOG Unreleased: Added (groups rename + sort chips) + Fixed (ledger header icons)
- Gates pre-commit: tsc PASS, unit 48/48 PASS (17 e2e files fail under vitest — pre-existing config issue, same as prior session), eslint 1 pre-existing warning (LedgerSection:98 untouched)
- Committed d8c3301 on dev + pushed

### Skill(s) Used
- senior-frontend

### Status
- Clean on dev. NOTE: session_log commit entry itself uncommitted — amend or include next commit.


## Session 2026-10-02 (release v1.12.0 + feature branch, on feature/loan-ledger-header)

### Changes
- User-approved: merge dev -> master + version bump, then feature branch for loan ledger header
- Bump per VERSIONING §2: MINOR (feat present) 1.11.0 -> 1.12.0 — package.json + whatsNew 1.12.0 (2 plain-English bullets) + CHANGELOG [1.12.0] - 2026-10-02; backfilled missing settings-reorg CHANGELOG entry (82ecc6e had none)
- Gates: typecheck PASS, build PASS (8.01s), unit 48/48 PASS (17 e2e files fail under vitest — pre-existing config issue), lint 1 pre-existing warning (LedgerSection:98 untouched, same as 1.11.0); detect_changes vs master HIGH but scope-expected (settings+groups+metadata only)
- Release flow: commit eb2ee8c on dev -> merge dev->master ebe69ee (no-ff) -> tag v1.12.0 -> pushed master --follow-tags; dev ff to master + pushed
- New branch feature/loan-ledger-header off ebe69ee, switched. Next: rebuild loan ledger header on accounts pattern (copy-adapted + accounts-style drawer, per user picks)

### Skill(s) Used
- gitnexus, senior-frontend

### Status
- v1.12.0 live on master + dev. On feature/loan-ledger-header, clean. Awaiting go-ahead to implement loan header.


## Session 2026-10-02 (loan ledger header unify, on feature/loan-ledger-header)

### Changes
- LoanDetailView desktop header rebuilt on accounts-ledger pattern (copy-adapted, accounts-style drawer per user picks): title + txCount pill, LedgerSearch, 30px circle-expand Download PDF, More toggle with chevron-rotate + active-filter count badge, drawer with Type icon-pills (All/Loans Issued/Repayments, lucide) + Date pills/inputs + Clear Filters
- Behavior matches accounts: mousedown-outside + 500ms hover auto-close (useCallback timers, no new lint warnings); removed emoji Filter button (banned per DESIGN_IDENTITY §11) + inline svg style; dead CSS (filterBtn/filterDropdown/fadeIn/filterGroup) removed
- Gates: tsc PASS, eslint --max-warnings 0 PASS, loans vitest 20/20 PASS; seeded Playwright verification (create loan -> open ledger): header rest + drawer open screenshots, type filter hides repay rows, Clear Filters restores; scratch spec removed
- NOTE: LoanDetailView.tsx now ~680 LOC (was 547, limit 300 — T-092 split deferred, disclosed); mobile keeps shared MobileLedger unchanged

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on feature/loan-ledger-header. Next: user verifies, then commit -> PR into dev (needs explicit merge approval).


## Session 2026-10-02 (loan header merge to dev)

### Changes
- User-approved: commit + merge feature/loan-ledger-header -> dev (squash 568185d, pushed); branch kept
- CHANGELOG [Unreleased] Added entry included; detect_changes LOW, no affected flows

### Skill(s) Used
- senior-frontend

### Status
- On dev, merged content pushed. session_log note uncommitted (rides next commit). Next: user call.


## Session 2026-10-02 (release v1.13.0)

### Changes
- User-approved: merge dev -> master + bump. MINOR (feat present) 1.12.0 -> 1.13.0: package.json + whatsNew 1.13.0 (1 bullet) + CHANGELOG [1.13.0] (self-corrected a mid-edit heading mix-up before committing — verified final headings)
- Gates: build PASS, unit 48/48 PASS (17 e2e files fail under vitest — pre-existing), lint 1 pre-existing warning (LedgerSection:98 untouched)
- Flow: bump 925317f on dev -> merge no-ff 6d8c7ae -> tag v1.13.0 -> pushed master --follow-tags; dev ff + pushed; on dev

### Status
- v1.13.0 live on master + dev. session_log note uncommitted (rides next commit). Next: user call.


## Session 2026-10-03 (ledger drawer stay-open fix, on dev)

### Changes
- User-reported: filter card closed in ~500ms, no time to select (both Account + Loan ledgers shared the idle auto-close timer)
- Fix per user pick (stay-open): removed close timer + hover handlers in LedgerSection.tsx + LoanDetailView.tsx; drawer now closes on outside-click, Escape (new), or More toggle; selections no longer fight a timer
- Gates: tsc PASS, eslint --max-warnings 0 PASS on both files (old pre-existing LedgerSection:98 warning gone with the removed pattern), loans vitest 20/20 PASS; seeded Playwright on both ledgers: drawer visible after 2s idle, Escape closes (scratch spec removed)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev. Next: user verifies, then commit (and version bump only if user asks — fix alone is PATCH).


## Session 2026-10-03 (tx modal footer icon fix, on dev)

### Changes
- Page feedback: TransactionDetailModal footer icons riding high in circles — same root cause as ledger buttons (global .anim-target inline span broke button flex centering; hover gap dead)
- TransactionDetailModal.module.css: :global(.anim-target) inline-flex centering + hover gap moved onto it for iconBtn/ledgerBtn; dead button-level gap removed; same centering for mobile mobSheetBtn; impact LOW (0 affected)
- Gates: tsc PASS, eslint --max-warnings 0 PASS; seeded Playwright: footer icons centered at rest, Edit hover expands to pill with proper gap (scratch spec removed)

### Status
- Uncommitted on dev (with drawer stay-open fix). Next: user verifies, then commit.


## Session 2026-10-03 (commit two fixes on dev)

### Changes
- User-approved commit: fc5aa87 fix(ledger) drawer stay-open + 6020b21 fix(modal) footer icons (each with CHANGELOG Fixed entry); detect_changes LOW, pushed dev

### Status
- On dev. session_log note uncommitted (rides next commit). Next: user call.


## Session 2026-10-03 (release v1.13.1)

### Changes
- User-approved: merge dev -> master + bump. PATCH (fixes only) 1.13.0 -> 1.13.1: package.json + whatsNew 1.13.1 (2 bullets) + CHANGELOG [1.13.1]
- Gates: build PASS, unit 48/48 PASS (17 e2e files fail under vitest — pre-existing), lint clean on touched files
- Flow: bump 8c47d3b on dev -> merge no-ff 1c40e5e -> tag v1.13.1 -> pushed master --follow-tags; dev ff + pushed; on dev

### Status
- v1.13.1 live on master + dev. session_log note uncommitted (rides next commit). Next: user call.


## Session 2026-10-03 (ledger sort: newest-first + Asc/Desc pills, on dev)

### Changes
- User request: latest-on-top everywhere + two Asc/Desc buttons in the filter card. Scope confirmed: all ledgers, two pill buttons.
- Member ledger was the only oldest-on-top view: useMemberData.ts now has sortOrder ('desc' default); filteredTxs + ledgerRows display newest-first, balances still walked oldest→newest so running balances stay correct; LedgerSection.tsx filter drawer (desktop) + filter tray (mobile) gained "Newest first / Oldest first" pills
- Group/Loan/Other already newest-first: added same sortOrder state + pills (desktop filter bar/drawer, mobile via extended MobileLedger sortRow) — display flips, balance math untouched (Group/Loan/Other accumulate chronological, reverse only for display)
- Tag ledger detail: sortOrder + "Newest/Oldest first" pills next to search (filterRow in TagLedgerScreen); also replaced an inline style with CSS module classes
- MobileLedger.tsx/.module.css: optional sortOrder/onSortChange props rendering a Sort row inside the filter tray when provided (Group/Loan/Other use it)
- Gates: typecheck PASS, eslint --max-warnings 0 PASS on all 8 touched source files, vite build PASS, vitest 30/30 PASS (loans/reports/other scope); detect_changes MEDIUM (ledger screens + MobileLedger, 2 affected processes as expected)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev. Next: user verifies order + pills on Member/Group/Loan/Other/Tag (desktop + mobile), then commit.


## Session 2026-10-03 (ledger date column width, on dev)

### Changes
- User request: increase date column width in the ledger. Scope confirmed: generous +40px.
- LedgerTable.module.css (shared by Member/Group/Loan/Other ledgers): date column 55px→95px mobile, 90px→130px desktop, across header/row + noBalance variants; other columns untouched
- Gates: typecheck PASS, build PASS; impact LOW (LedgerTable, 3 direct callers)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev (with sort-order work). Next: user verifies, then commit.


## Session 2026-10-03 (ledger date dd-mm-yyyy, on dev)

### Changes
- User request: ledger Date column date-only, format dd-mm-yyyy (no time).
- Root cause: Member ledger passed raw tx.date (ISO with time) into LedgerTable; other ledgers used shortDate ("3 Oct 2026").
- Fix: shortDate() in dates.ts now returns dd-mm-yyyy date-only (local parts, zero-padded; invalid input falls back to yyyy-mm-dd slice); useMemberData.ts ledgerRows now formats via shortDate (was raw ISO); TagLedgerScreen table cell switched from yyyy-mm-dd slice to shortDate — Member/Group/Loan/Other/Tag ledgers + member report tables/PDFs + ledger search matching all follow the same format consistently
- Gates: typecheck PASS, eslint --max-warnings 0 PASS on touched files, build PASS; impact MEDIUM disclosed before edit (shortDate, 12 direct callers — display + PDFs + search, no logic change)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev (with sort-order + date-width work). Next: user verifies, then commit.


## Session 2026-10-03 (release v1.14.0)

### Changes
- User-approved: merge dev -> master + bump. MINOR (feat present) 1.13.1 -> 1.14.0: `6412eb6` feat(ledger) newest-first sort + Asc/Desc pills + wider dd-mm-yyyy date column (CHANGELOG Added/Changed) + `9bf22d0` bump (package.json + whatsNew 1.14.0 + CHANGELOG [1.14.0] - 2026-10-03)
- Gates on final state: typecheck PASS, build PASS (v1.14.0 verified baked in bundle), unit 39/39 PASS, eslint clean on touched files; detect_changes MEDIUM (ledger screens only, as expected)
- Flow: merge no-ff `8e64d36` -> tag `v1.14.0` -> pushed master --follow-tags; dev ff to master + pushed; back on dev
- Note: bump commit briefly dropped the [1.13.1] heading in CHANGELOG (self-corrected before committing — verified final headings)

### Status
- v1.14.0 live on master + dev. session_log note uncommitted (rides next commit). Next: user call.


## Session 2026-10-03 (picker count/balance stuck + tiny, on dev)

### Changes
- Page feedback (/groups → TransactionFormModal → Select Member): member "N accounts" + account balance ran stuck against the name and looked tiny
- Root cause: .pickerItem is flex, but its only flex child is the single inline .anim-target click-animation wrapper — the row gap never applied (pickers.tsx:48,103)
- Fix (TransactionFormModal.module.css only, no markup/logic): .pickerItem > .anim-target is now a full-width flex row (gap 10px); count 11→12px; balance 12→13px semibold in primary text color (was 12px secondary) — also fixes the same stuck layout in account/counterparty/tag/lender/borrower pickers sharing the classes
- Gates: build PASS (tsc + vite)

### Skill(s) Used
- senior-frontend

### Status
- Uncommitted on dev. Next: user verifies picker rows, then commit.


## Session 2026-10-03 (release v1.14.1)

### Changes
- User-approved: commit + push + merge to master + back to dev. PATCH (fix only) 1.14.0 -> 1.14.1: `cfe5a58` fix(picker) row spacing (CHANGELOG Fixed) + `711eb1c` bump (package.json + whatsNew 1.14.1 + CHANGELOG [1.14.1] - 2026-10-03)
- Gates on final state: build PASS (tsc + vite)
- Flow: pushed dev -> merge no-ff `2a73da8` -> tag `v1.14.1` -> pushed master --follow-tags; dev ff to master + pushed; back on dev

### Status
- v1.14.1 live on master + dev. session_log note uncommitted (rides next commit). Next: user call.


## Session 2026-10-14

### Changes
- Tx picker rows: member step now stacks name (+shortName) left via .pickerMain, account count right; account/person step puts account name left and type+balance stacked right-aligned via .pickerSide (pickers.tsx + TransactionFormModal.module.css)
- Font sizes matched for visibility: name 14px/600, meta 12px, count 13px/500, balance 14px/700 tabular
- Gates: tsc clean, eslint --max-warnings 0 clean, vitest unit 9 files / 48 tests pass (17 e2e FAILs are pre-existing Playwright specs picked up by vitest runner)

### Status
- Uncommitted on dev. Next: user verifies picker rows, then commit.

### Follow-up 2026-10-14 (picker row collapse after click)
- User reported count/balance dropping under name in picker rows. Root cause: global .anim-pop .anim-target { display:inline-block } (click-anims.css) ties specificity with .pickerItem > .anim-target flex row and wins by load order once a row is clicked
- Fix: added .pickerItem.anim-pop > .anim-target { display:flex } (higher specificity) in TransactionFormModal.module.css
- Gates: tsc clean, eslint --max-warnings 0 clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Verified 2026-10-14 (Playwright, live :3000)
- Real root cause found via browser evaluate: .pickerItem > .anim-target never matched — CSS Modules hashes .anim-target, but JSX uses literal global class. Inner span computed display:block, rows stacked. Fixed with :global(.anim-target) on both rules (+ kept .anim-pop override)
- Playwright proof: member rows inner=flex, name x=611 / count right=925 (btn edge 939); account row name left, type+balance right-aligned at 925; clicked row (anim-pop) stays flex
- Screenshot confirms names left, counts right. Gates: tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies on their screen, then commit.

### Change 2026-10-14 (show balance on selected account trigger)
- Form triggers showed only 'name — member' after selection. Added accounts prop to FormFields + renderAccountValue() helper: name left, formatted balance right, arrow last (source, destination, Paid To, Credit To)
- CSS: .pickerTrigger > :global(.anim-target) flex row (+ anim-pop variant), new .pickerBalance 13px/600 tabular secondary
- Playwright proof on live :3000: trigger reads 'Test Cash — Test User | 0 BDT | v' with value x=548, balance 917-952, arrow 968 (btn 533-993). Screenshot taken. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (account row: type under name, balance solo right)
- Per feedback: moved account type meta from right column into left column under the name (account + counterparty rows); right column now holds balance alone, always 1 line (nowrap), vertically centered
- Name may wrap to max 2 lines (-webkit-line-clamp: 2); row grows, balance stays put
- Playwright proof: short name -> name 1 line + type below, balance 1 line right@925; injected long name -> name exactly 2 lines (42px), balance still 1 line (21px) right@925, row 86px. Screenshot taken. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit all picker work together.

### Change 2026-10-14 (lucide chevron-left back button)
- Replaced text ◀ with ChevronLeftIcon (lucide-react, size 16, repo convention per calendar.tsx) in picker header; added aria-label='Back to members'
- Playwright proof: back button renders 16x16 svg, click returns to member list. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit all picker work together.

## Session 2026-10-14 (release v1.14.2)

### Changes
- User-approved: commit + push + merge to master. PATCH 1.14.1 -> 1.14.2: fix d013b8c picker two-column rows + balance on trigger + lucide chevron (CHANGELOG Fixed) + 634fdc4 bump (package.json + whatsNew 1.14.2 + CHANGELOG [1.14.2] - 2026-10-14)
- Gates: build PASS, eslint --max-warnings 0 PASS, vitest unit 48/48 PASS (17 e2e files fail under vitest runner = pre-existing Playwright specs; affected flows verified manually in live browser with screenshots)
- detect_changes: low risk, no affected processes
- Flow: pushed dev -> merge no-ff 0ecd5b6 -> tag v1.14.2 -> pushed master --follow-tags; dev ff to master + pushed; back on dev, tree clean

### Status
- v1.14.2 live on master + dev. Next: user call.

### Change 2026-10-14 (dashboard recent txs: setting limit + Load more)
- User asked: last 15 recent txs + Load more button. Confirmed approach: wire existing dashboardTxLimit setting (was ignored, hard slice 12) + Load more
- useDashboardData: full sorted list, recentLimit state init/reset from dashboardTxLimit, visibleRecentTxs slice, recentRemaining, showMoreRecent (+1 page); config DEFAULT 10->15, removed dead DASHBOARD_TX_DISPLAY_LIMIT; RecentTxsPanel renders ledger-style Load more (N remaining); Dashboard.module.css loadMoreBtn
- Playwright proof on DemoDB (DemoDB/moneyflows-20260925-211143.db loaded into test browser OPFS): 5 rows + Load more (320 remaining) -> click -> 10 rows + (315 remaining); search 'Medicine' -> 5 + (12 remaining), limit resets on query change. Screenshot taken
- Note: :3000 dev server served a stale Dashboard transform mid-edit (ReferenceError); touching the file forced re-transform, verified fresh. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit (MINOR bump on merge: new Added entry).

### Committed 2026-10-14 (dashboard Load more -> dev)
- ed055b7 feat(dashboard) on dev + pushed (973ff5f..ed055b7). Gates: build PASS, eslint clean, unit 48/48, detect_changes low risk/no affected flows
- Note: git add warned src/presentation/screens/dashboard ignored, but all 7 files committed, tree clean, check-ignore confirms tracked (warning was a stray artifact pattern)
- Status: on dev, clean. Next: user call (merge to master would be MINOR bump).

### Change 2026-10-14 (dashboard section toggles: metrics/summary/actions)
- User asked: hide MetricCards, MonthSummary, Quick Actions sections via Settings. Confirmed: three individual toggles, no master switch
- AppSettings: showMetricCards/showMonthSummary/showQuickActions (default true); SettingsPage Dashboard Sections +3 switch rows; Dashboard.tsx conditional render (FAB/header untouched)
- Playwright proof on DemoDB: all 6 switches render on; Month Summary off -> dashboard hides summary only, persists across navigation; toggled back on -> all sections return. Screenshot of Settings taken. tsc + eslint clean
- Status: uncommitted on dev (with Load-more batch). Next: user verifies, then commit (MINOR on merge).

### Committed 2026-10-14 (dashboard section toggles -> dev)
- 42e96af feat(dashboard) on dev + pushed (ed055b7..42e96af). Gates: build PASS, eslint clean, unit 48/48, detect_changes low risk/no affected flows
- Status: on dev, clean. Next: user call (merge to master => MINOR bump, two Added entries pending).

### Change 2026-10-14 (dashboard panels auto height)
- User feedback: panels stretched to tallest column (5 members but long empty height). Fix: align-items: start on .content grid so each panel hugs its content
- Playwright proof on DemoDB: Where 275px / Recent 314px / Loans 788px - independent. Screenshot taken. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

## Session 2026-10-14 (release v1.15.0)

### Changes
- User-approved: commit + push + merge to master. MINOR 1.14.2 -> 1.15.0: ed055b7 feat Load more + 42e96af feat section toggles + 2ed79f0 fix panel auto-height (CHANGELOG Added x2 + Fixed) + b64b5bd bump (package.json + whatsNew 1.15.0 + CHANGELOG [1.15.0] - 2026-10-14)
- Gates: build PASS, eslint --max-warnings 0 PASS, vitest unit 48/48 PASS (17 e2e files fail under vitest runner = pre-existing Playwright specs; flows verified live on DemoDB with screenshots)
- detect_changes: low risk, no affected processes
- Flow: pushed dev -> merge no-ff 6b34b48 -> tag v1.15.0 -> pushed master --follow-tags; dev ff to master + pushed; back on dev, tree clean

### Status
- v1.15.0 live on master + dev. Next: user call.

### Change 2026-10-14 (text size rework: bigger scale + XL + token conversion)
- User: small/medium/large all look tiny; wants bigger + adjustable incl. descriptions/numbers. Confirmed: bigger presets + XL (no slider, no per-category)
- tokens.css: base +2px all text-* tokens, small=base-1, large=base+2, NEW xl block=base+4; font-size-* rem tokens bumped likewise; fontSizes.ts +XL; index.html pre-paint allowlist + useTheme docstring
- Converted fixed-px TEXT to tokens in Dashboard (metricValue 22->4xl, loanCurrency 7->3xs) + TransactionFormModal (names/balances/counts/descriptions/labels/titles; chrome inputs/buttons/icons/arrows left fixed per design comment)
- Playwright proof: XL selectable in Appearance, data-font=xl, row desc+amount render 19px at XL, layout holds (screenshot); restored Medium after
- Status: uncommitted on dev. tsc + eslint clean. Next: user verifies, then commit (MINOR on merge).

### Change 2026-10-14 (ledger text follows text-size setting)
- User: text-size barely affected ledgers (fixed px). Converted row/header/amount/balance text to tokens: LedgerTable (all cells), MobileLedger title/badge, MemberProfile heroName/filterLabel, TagLedger headings/cards/table, LoansScreen names/metas, LoanDetailView labels/titles, OtherLedgersIndex cards, MemberReport print table. Chrome (buttons/inputs/icons/selects/avatars) left fixed
- Playwright proof on DemoDB member ledger: desktop row 14 / date 13 / type 11 at Medium; XL -> row 18 / date 17. Screenshot at XL, restored Medium after. tsc + eslint clean
- Note: virtualized ledger rows keep fixed 54/56px heights - very long descriptions could clip at XL (pre-existing constraint, slightly more likely now)
- Status: uncommitted on dev. Next: user verifies, then commit (MINOR on merge).

### Change 2026-10-14 (light-mode contrast hardening)
- User: light-mode text/numbers washed out. Measured real contrast ratios in browser (custom oklch converter): primary 15.2 ok; secondary 6.78 weak; opacity-faded BDT micro-labels 3.61 FAIL; gold numbers 4.66 marginal
- Fix (light block only): text-secondary 46%->40%, gold 55%->49%; replaced opacity:0.55 micro-label fades with solid secondary color (Dashboard currencyLabel/txCurrency/loanCurrency, LedgerTable currencyLabel, MemberProfile statCurrency/txCurrency, LoanDetailView txCurrency)
- After: micro 8.76, secondary 8.76, gold 5.96, teal 5.20 - all AA. Screenshot at light. Note: dev server served half-stale tokens.css mid-edit (HMR); touch forced re-transform. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit (MINOR on merge).

### Change 2026-10-14 (ledger desktop column widths)
- User: fixed space for Date/Type/Account/Debit/Credit/Balance, breathing room; description wraps 2-3 lines. Desktop grid 130/90/1fr/90/90/90 -> 140/84/1fr/110/110/110 (account 250->260). Mobile untouched (space-constrained)
- Playwright proof on DemoDB member ledger: grid computes as set, all number cells fit, injected long desc wraps 2 lines with row growing to fit. Screenshot taken. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (ledger number columns 130px, titles centered)
- User: 130px each for debit/credit/balance + titles centered over columns. Desktop grids -> 140/84/1fr/130/130/130 (account variant 260). Mobile unchanged
- Playwright proof (same-table measurement after reload): all 6 title centers == column centers. Note: mid-edit HMR served half-stale CSS again; touch + reload verified fresh. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (ledger row centering + conditional BDT + suffix size)
- Row align-items:start->center so date/type/numbers sit mid-row beside multi-line descriptions
- Debit/credit/balance suffix renders only with an amount (empty arrives as '' -> now bare —, previously stray BDT). Both virtual + plain row paths
- Suffix size: already 10px vs 13px amount (verified, no change needed)
- Playwright proof: multi-line row all 6 cell centers == row center; no stray BDT cells; suffix 10 vs amount 13. Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (ledger number cells centered)
- User: debit/credit/balance row text centered, not right-aligned. Changed text-align right->center on .debit/.credit/.balance (date/type/account already centered, description stays left)
- Playwright proof: all 3 cells text-align:center with symmetric padding (124/123, 44/44, 59/59). Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (currency suffix proportional size)
- User: BDT suffix should be visibly smaller than amount. Root cause: token mapping narrowed the gap (suffix 8->10px vs amount 13px). Fix: suffixes now 0.7em of their amount (LedgerTable/Dashboard/MemberProfile/LoanDetailView currency + tx micro labels; statCurrency already 0.5em)
- Playwright proof: Medium 13/9.1px, XL 17/11.9px - ratio holds, scales with preset. Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (suffix smaller + spaced)
- User: size gap still subtle. Suffix 0.7em->0.6em and margin 2px->4px across all currency/tx micro labels (ledger, dashboard, profile, loans)
- Playwright proof: amount 13px, suffix 7.8px, 4px gap. Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (ledger numbers semibold)
- User: number weight too light. Ledger debit/credit/balance inherited 400 -> set 600 (matches dashboard month/member/tx amounts). Tabular-nums kept
- Playwright proof: computed weight 600 + tabular-nums on live row. Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

## Session 2026-10-14 (release v1.16.0)

### Changes
- User-approved: commit + push + merge to master. MINOR 1.15.0 -> 1.16.0: 0286a41 feat(theme) type scale +2px, XL preset, token-driven text, light contrast (secondary 46->40, gold 55->49, opacity fades removed), ledger polish (130px numbers, centered titles/amounts, mid-aligned rows, bare-dash empties, 0.6em suffix, semibold numbers) + ff3767f bump (package.json + whatsNew 1.16.0 + CHANGELOG [1.16.0])
- Fixed CHANGELOG misplacement: font/ledger entries had landed under [1.15.0]; moved to new [1.16.0] (Added x2 + Fixed x2)
- Gates: build PASS, eslint clean, unit 48/48, detect_changes low risk/no affected flows; all features contrast-measured + screenshotted live on DemoDB
- Flow: pushed dev -> merge no-ff 45412ac -> tag v1.16.0 -> pushed master --follow-tags; dev ff + pushed (one push timeout, retry ok); back on dev, clean

### Status
- v1.16.0 live on master + dev. Next: user call.

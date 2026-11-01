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

### Change 2026-10-14 (recent-row: desc 3 lines, date+amount 1 line)
- User: description may wrap 2-3 lines, date + amount stay single-line. Fix: txDesc line-clamp 2->3; txDate gained missing white-space:nowrap (+overflow hidden) so dates like 24-09-2026 can't split
- Playwright proof: injected long desc wraps exactly 3 lines (clamp), date 1 line nowrap, amount 1 line nowrap. Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Change 2026-10-14 (recent-row date breathing room)
- User: date touched the description (65px box vs 66px text = 1px overlap, worse at larger presets). Fix: txDate width->min-width:78px + margin-right:6px
- Playwright proof: box 78, text 66, 12px inner breathing, 14px gap to desc (was 8 with overlap). Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

### Config 2026-10-14 (pin GitHub account for this repo)
- User has 2 GitHub accounts; pinned this repo to Nur-allhi via local git config credential.https://github.com.username (GCM skips the account picker). Verified with passwordless ls-remote. No secrets stored - token stays in Credential Manager/keyring.

### Change 2026-10-14 (collapsed sidebar footer avatar centering)
- User: avatar sat slightly left when sidebar folded. Cause: .collapsed .footer centers content but the 10px flex gap to the zero-width footerText still applied, pushing the avatar 5px left. Fix: gap:0 in collapsed footer
- Playwright proof: collapsed, avatar center 50 == footer center 50. Screenshot. tsc + eslint clean
- Status: uncommitted on dev. Next: user verifies, then commit.

## Session 2026-10-14 (release v1.16.1)

### Changes
- User-approved: commit + push + merge to master. PATCH 1.16.0 -> 1.16.1: da17e4d fix (recent desc 3-line clamp, date nowrap+breathing room, collapsed avatar centering) + bump (package.json + whatsNew 1.16.1 + CHANGELOG [1.16.1])
- Gates: build PASS, eslint clean, unit 48/48, detect_changes low risk/no affected flows; verified live with measurements + screenshots
- Flow: pushed dev -> merge no-ff -> tag v1.16.1 -> pushed master --follow-tags; dev ff + pushed; back on dev, clean

### Status
- On clean `dev`. Next: user's process-improvement round for sync, then next changes on `dev`.

## Session 2026-10-15 (safety branch google_signin_backup)

### Changes
- User directive: keep `master` stable without Google backup; isolate sync work. Created `google_signin_backup` off `dev`, merged `feature/online-sync-drive` no-ff (`881b249`, Phase 19 T-145..T-153), typecheck green, pushed with `-u`
- Back on `dev` (plan commit `73df24d` pushed); `master` untouched at v1.16.1
- Topology: `master` (stable, no sync) ← `dev` (next changes) → periodic merge into `google_signin_backup` (sync workstream, merges on user call)

## Session 2026-10-15 (Phase 19 online sync — plan + T-145/T-146)

### Changes
- User-approved Path 1 (Google login + Drive appDataFolder). Wrote `docs/plans/ONLINE_SYNC_PLAN.md` (arch, 4 merge-blocking guards, console setup, release) + raised Phase 19 tickets T-145..T-151 in `docs/TICKETS.md`; committed `73df24d` on dev
- Created branch `feature/online-sync-drive` off dev, pushed with `-u`
- T-145 (`bc4f61e`): `GoogleAuth.ts` — memoized GIS loader (no npm dep), memory-only token, IDB email+expiry, silent refresh w/ 60s skew, signOut revokes; 7/7 vitest green
- T-146 (`42ca7a5`): `CloudSync.ts` — upsert `moneyflows.db` + `.sha256` sidecar, metadata-only `remoteHash()`, hash-verified `download()`; never throws; 9/9 vitest green
- Gates on both: typecheck PASS, scoped eslint `--max-warnings 0` clean (full-repo lint still has pre-existing `LedgerSection.tsx:82` warning)

### Skill(s) Used
- senior-frontend (T-145), senior-backend (T-146)

### Status
- T-145/T-146 complete on branch (unpushed). Next: T-147 wiring (`impact` on `flush` first) → T-148/149/150 UI → T-151 verification → user-confirmed merge to dev.

## Session 2026-10-15 (Phase 19 complete T-147..T-151)

### Changes
- T-147 (`6c8200b`): `_maybeCloudSync` fire-and-forget in `flush()` (hidden-tab force), `_cloudBootPull` under 8s timeout, pure `decideSyncAction` (6/6 matrix tests), `getCloudStatus()`; `impact(flush)` = CRITICAL as expected (central durability point) — change strictly additive, signed-out path is cooldown + IDB-miss
- T-148 (`df1a486`): `CloudSyncSection` in Settings → Backup (Connect/status/Sync now/Disconnect + console setup copy), `CloudStatus` + `syncNow()` on `IDatabaseService` port, `cloudClientId` in AppSettings (live status, no dual-write)
- T-149 (`9e66c68`): `checkRemoteUpdate`/`applyRemoteUpdate` + `CloudUpdatePrompt` in AppLayout (visible-tab cooldown poll, refocus check, snooze, reload-on-apply)
- T-150 (`7848d22`): `resolveConflict(mine/theirs)` + conflict dialog (required choice, remote kept as restore point either way); repaired two edit slips (dropped newline, clobbered method header) caught by read-back
- T-151 (`df42280` + `dd40c49`): e2e `15-cloud-sync` 2/2 green (mocked GIS/Drive: connect→upload + offline-boot→warn), SECURITY/TAD/CHANGELOG docs, no version bump (release-time per plan)
- Gates: typecheck PASS, full `lint --max-warnings 0` PASS, build PASS, unit 70/70 (18 e2e-under-vitest import failures are pre-existing), `detect_changes` LOW on final diff

### Skill(s) Used
- senior-backend (T-146/147), senior-frontend (T-145/148/149/150), code-reviewer (T-151)

### Status
- Phase 19 complete on `feature/online-sync-drive`, pushed. Next: user reviews → confirm merge to `dev`; live test needs user's OAuth Client ID (plan §4); version bump at release (MINOR per §2).

## Session 2026-10-15 (Sign in with Google — no more Client ID paste)

### Changes
- User feedback: per-user Client ID paste is inconvenient → switched to one app-owned OAuth client baked in at build time (`GOOGLE_CLIENT_ID` real-env/`.env.local` → `__GOOGLE_CLIENT_ID__` → `constants/googleClient.ts`, mirrors `__APP_VERSION__` pattern; `.env*` already gitignored)
- `CloudSyncSection` simplified: explainer + **Sign in with Google** button (unconfigured builds show "not set up", stay fully local); dropped `cloudClientId` from AppSettings (branch-only field, never released)
- `playwright.config` webServer passes a dummy ID (GIS fully stubbed in e2e); plan §2/§4 + README updated (publisher one-time setup, zero user setup)
- Debugging saga: e2e kept failing on a stale vite server squatting :3000 (pre-change code + `reuseExistingServer` kept reusing it); `netstat -p TCP` missed the IPv6 listener — `netstat -ano` found PID 10672, killed it; verified env flow with a temp config probe (removed after); `CI=1` forces a fresh server
- Gates: typecheck PASS, scoped lint clean, build PASS, e2e `15-cloud-sync` 2/2 green

### Skill(s) Used
- senior-frontend

### Status
- On `feature/online-sync-drive`, unpushed. Next: commit + push; user creates ONE OAuth client (plan §4) into `.env.local`, runs `npm run dev`, taps Sign in with Google for the live test.

## Session 2026-10-15 (T-152/T-153 deterministic sync + wizard gate)

### Changes
- User directive: choice only for genuine both-sides data; entry gate Sign in vs Guest (Option A confirmed). Raised T-152/T-153, both built on branch
- T-152: `reconcileAfterSignIn()` shared by wizard/Settings/boot (`downloaded`/`uploaded`/`idle`/`choice`/`signed-out`), `_isLocalEmpty()` row counts, `effectiveHasLocal` (empty+never-synced auto-pulls; emptied-after-sync stays conflict), `_importVerifiedRemote` extracted and reused in 3 pull sites; db tests 28/28
- T-153: wizard step 0 gate (Sign in with Google → downloaded skips to dashboard, else step 1; guest unchanged; unconfigured builds keep Get Started; "Welcome" copy kept for e2e), Settings sign-in reconciles (downloaded → reload), conflict buttons reworded to Override cloud / Download cloud data
- Process fix for me: no more trailing-newline edit anchors (caused 3 same-line corruptions, all caught by read-back); pre-check :3000 with `netstat -ano` before e2e (another stale vite squatter killed)
- Gates: typecheck PASS, scoped lint clean, build PASS, unit 73/73, e2e 13-wizard + 15-cloud-sync 4/4 green

### Skill(s) Used
- senior-backend (T-152), senior-frontend (T-153)

### Status
- Unpushed on branch. Next: commit + push; reply to user's live-test conflict (their wipe case now auto-downloads — retest by clearing site data + sign in).

## Session 2026-10-15 (Phase 20 sync UX polish T-154..T-158)

### Changes
- Built on `google_signin_backup` (keeps `dev`/`master` clean per safety topology). All 5 user-requested improvements, sequential commits:
- T-154 (`5f6e4b6`): staged sign-in progress — Opening Google… → Syncing your data… with ProgressBar in Settings + wizard gate, actions disabled, stay-on-screen copy
- T-155 (`9e9b7cb`): wizard money-step native selects → modal picker pattern per DESIGN_IDENTITY §9 (trigger + overlay + active gradient, token-only CSS, zero selects left)
- T-156 (`058b854`): `CLOUD_SYNC_COOLDOWN_MS` 120s→30s — every mutation already auto-syncs via flush (hash-skipped, hidden-tab force); no Sync-now needed
- T-157 (`d0a84da`): `useCloudIndicator` + header cloud button beside bell (desktop + mobile instances, guests see nothing, tap → Settings)
- T-158 (`ad38e12`): `profile` scope for name/photo (persisted, never logged) → sidebar footer shows photo + name + email; guests keep Family footer
- Gates: typecheck PASS, lint `--max-warnings 0` PASS, build PASS, unit 74/74, e2e wizard/backup/cloud-sync 5/5
- Self-correction: trailing-newline edit slips recurred (4th instance) — rule now enforced: anchors end on full code lines + read-back every edit

### Skill(s) Used
- senior-frontend (T-154/155/157/158), senior-backend (T-156)

### Status
- Phase 20 complete on `google_signin_backup`, pushed. Next: user live-tests (consent now also shows `profile` scope); `master` still clean v1.16.1.

## Session 2026-10-15 (header deep link follow-up)

### Changes
- User request: header sync button now navigates `/settings?tab=backup&open=google-drive-sync` — Backup tab with Google section already open, Sync now one tap away
- Real bug found by e2e: after Settings sign-in (no route change) the header/sidebar kept stale state up to 30s → added `moneyflows:cloud-status` window event fired from section refresh, consumed by `useCloudIndicator` + App footer effect
- Gates: typecheck + scoped lint clean, e2e `15-cloud-sync` 3/3 (incl. new deep-link round trip)

### Status
- Committed `9469978`, unpushed. Next: push + reply.

## Session 2026-10-15 (T-159 session persistence)

### Changes
- User report: Sync-now re-opened the Google popup. Root cause: (1) token memory-only, wiped on every reload (sign-in itself reloads on download); (2) refresh used `prompt:''` = popup — the silent mechanism is `prompt:'none'`
- T-159 (`db8a84c`): token persisted in IDB + hydrated across reloads; `getValidToken()` = memory → persisted → silent `none` (never UI, never throws); new `refreshInteractive()` for explicit taps only; Sync-now cache-first with interactive fallback
- Result spec: active users stay signed in for days across reloads; long-idle (dead Google session) or wiped storage → single re-sign-in
- Gates: typecheck PASS, scoped lint clean, 10/10 auth tests (hydration with zero GIS calls, prompt assertions, sign-out clears)

### Status
- Committed, unpushed. Next: push + reply; user retests Sync-now (no popup expected within the hour).

## Session 2026-10-15 (T-160 download resilience)

### Changes
- User report: cleared storage → sign in → "Last download failed" loop with cloud data present. Diagnosis: message comes only from the pull branch, i.e. sidecar reads fine but DB bytes mismatch — classic interrupted upload (tab closed/suspended between DB and sidecar writes); plain retries can never succeed
- T-160 (`c80dbc0`): newest-wins reads (`orderBy=modifiedTime desc`), upsert deletes older dupes, `_healRemoteAttempt` (stale sidecar→rewrite, orphan→cleanup, valid bytes + empty device→adopt, else `remote-corrupt` preserving everything), `remoteInfo()` diagnostics row, `overwriteRemote()` warned escape hatch + Replace-cloud-backup button
- Cloud/data still never auto-overwritten: corrupt path touches nothing; empty device never uploads
- Gates: typecheck PASS, scoped lint clean, 38/38 db tests (incl. 7-case heal matrix), e2e cloud-sync/backup 4/4, build PASS
- Process note: one more trailing-newline anchor slip caught by read-back (ports file) — rule holds: full-line anchors + verify after every edit

### Status
- Committed, unpushed. Next: push + reply with retest steps (user's broken remote should self-heal on next Sync-now).

## Session 2026-10-15 (e2e mock glob gotcha)

### Changes
- T-160 e2e initially failed with real-app-correct code: probe proved Playwright glob `**/drive/v3/files**` does NOT match file-id URLs carrying `?alt=media` (content fetches escaped to real Google → 401), while regex and `**/drive/v3/files/*` match everything
- Fix (`f6ad10c`): stateful Drive mocks (created files persist, sidecar hash readable back) + regex route matcher — write-verify now proven end-to-end in e2e, 2/2 green
- Lesson: when app logic looks right but e2e disagrees, isolate mock-vs-app with a minimal probe before touching product code

## Session 2026-10-15 (T-161/T-162/T-163 boot, verify, retry)

### Changes
- User reports: (1) post-download reload sits on a blind splash for seconds; (2) auto-sync must never damage data mid-sync; (3) when does auto-sync run after a save?
- T-161: `BootProgress` threading (`initDatabase` → `init`) with staged splash bar + labels; boot cloud check skipped when persisted meta is fresh (<60s) — covers reload-right-after-sync
- T-162: upload write-verify (sidecar read-back, exactly one re-upload on tear) — torn pairs get completed or reported, never silently persisted
- T-163 (`1ca31e7`): deferred retry — a cooldown-skipped flush schedules one one-shot retry at window expiry via re-flush; pure `cloudRetryDelayMs` helper 4/4 tests
- Gates: typecheck PASS, scoped lint clean, 44/44 db tests, build PASS

### Status
- Committed, unpushed. Next: push + reply (incl. whole-DB-vs-delta explainer).

## Session 2026-10-16 (T-164..T-166 progress UX)

### Changes
- User reports: (1) wizard button stuck on Opening Google; (2) splash bar never completes before app loads; (3) bars should feel alive (water flow)
- T-164: busy button copy advances google→syncing in both sign-in flows, agreeing with the staged bar
- T-165 (`1beaffb` part): root cause of frozen bar — observer disconnected after first paint so later percents never applied; visibility ref keeps every update flowing (0.6s glide already in CSS)
- T-166: diagonal stripe flow over the gradient + leading shimmer kept + `prefers-reduced-motion` guard; GPU-cheap background-position only
- Gates: typecheck PASS, scoped lint clean, build PASS

### Status
- Committed, unpushed. Next: push + reply.

## Session 2026-10-16 (T-167 completion beat)

### Changes
- User report: Sync-now bar stuck at 75% then vanished. Root cause: stages topped out at 75% with no 100% state — unmount on finish looked like a cut
- T-167 (`ee9c90c`): `done` stage (100%, Synced ✓) held 1.2s on success in both sign-in and Sync-now via shared `StageBar`; failures keep clear-to-error behavior
- Gates: typecheck PASS, scoped lint clean

## Session 2026-10-16 (T-168 splash visibility)

### Changes
- User report: splash bar never shows after sign-in. Probed it live: the bar always rendered — but local boots finish in ~200ms ("Finalizing…" already at 100ms), flashing past perception
- T-168 (`1b837b3`): narration appears only while boot exceeds 600ms — fast boots stay clean, slow boots (8x-throttle probe: bar + stage text verified) narrate every stage. Typing/fade/watchdog untouched
- Gates: typecheck PASS, scoped lint clean, build PASS

### Status
- Committed, unpushed. Next: push + reply (pull + rebuild reminder for stale-dist suspicion).

## Session 2026-10-16 (merge sync work into dev)

### Changes
- User-approved: merged `google_signin_backup → dev` no-ff (`009a38e`, Phases 19–20 T-145..T-168). One conflict (`session_log.md` tail, both sides appended) resolved keeping both histories
- Gates on merge result: typecheck PASS, full lint `--max-warnings 0` PASS, unit 92/92, build PASS; pushed `dev`
- Merged `dev → google_signin_backup` (fast-forward) and pushed — both branches even; `master` untouched at v1.16.1

### Status
- `dev` now carries the sync workstream. Next: user call (further polish or release flow with version bump + tag).

## Session 2026-10-16 (setup wizard + settings refresh S-1, on feature/setup-settings-refresh)

### Changes
- User request: setup wizard + Settings layout improvement — organized/stacked first-run, categorized card-based Settings, all collapsed by default. Confirmed: 3-step stacked wizard + unify Page+Modal. Branch `feature/setup-settings-refresh` off dev, pushed with -u
- S-1 (no visual change): NEW `components/settings/sections/` kit — `useBackupState` hook (snapshots/health/folder/restore/import logic unified), `MoneyRegionFields`, `LimitsFields`, `RestorePoints`, `FolderBackup`, `EngineHealth`, `ImportExportRow`, `AboutApp` (owns install-prompt + whats-new state), `cx` CSS-module passthrough (keeps Modal vs Page visuals pixel-identical), barrel `index.ts`
- `SettingsModal.tsx` 463→~160 LOC rewired to kit (same titles/subtitles/badges/defaultOpen); `SettingsPage.tsx` General/Backup/About bodies rewired (Dashboard/Activity/Diagnostics untouched for S-2)
- Noted: header gear navigates to /settings — `settings` modal registry entry has no open() callers (unreachable UI, still compiles); S-3 call pending
- Gates: typecheck PASS, eslint --max-warnings 0 PASS (touched), build PASS, Playwright live :3000 General/Backup/About tabs verified identical, detect_changes touched exactly the 2 hosts (backup/restore flows, as intended); stale GitNexus index (231 behind) noted, manual blast radius LOW

### Skill(s) Used
- senior-frontend

### Status
- S-1 complete on branch, unpushed. Next: S-2 5-card collapsed IA on SettingsPage.

## Session 2026-10-16 (setup wizard + settings refresh S-2, on feature/setup-settings-refresh)

### Changes
- S-2: SettingsPage 5 tabs → 5 collapsed cards in a centered 760px stack (Preferences / Appearance / Dashboard / Backup & Storage / About), all `defaultOpen={false}` with live badges (currency, theme·accent, n-of-6 on, snapshot count, version)
- NEW cards: `PreferencesCard` (draft + inline Save, `saveMode` prop for S-3 modal reuse), `AppearanceCard`, `DashboardCard` (7 instant switches from store), `BackupCard` (restore + folder + Drive sync + engine + import/export + import overlay moved in), `AboutCard` (AboutApp + activity + diagnostics + log actions moved in)
- SettingsPage.tsx → ~60 LOC composition; dead tab CSS removed (.layout/.subNav/.navItem/.content/.card/.cardHead/.separator + mobile block); `?tab=backup&open=google-drive-sync` deep link preserved via remount key + scroll-into-view
- Gates: typecheck PASS, eslint --max-warnings 0 PASS, build PASS; Playwright live :3000 — 0 expanded by default, tap expands, deep link opens Backup + Drive section, screenshot confirms stacked cards

### Skill(s) Used
- senior-frontend

### Status
- S-2 complete on branch, unpushed. Next: S-3 thin SettingsModal to wrapper.

## Session 2026-10-16 (user feedback batch: 5 settings/wizard items, on feature/setup-settings-refresh)

### Changes
- User reported 5 items; investigated each live before touching code (per §3.10/§3.11); confirmed plan via question tool (modal picker, auto-skip Try-it, execute all)
- (1) Primary member: dropdown DID save (attribution in useSubmit.ts:52, invisible effect) but native select mismatched app pickers → logged BUG-11, built NEW `MemberPicker` modal picker (own tokens CSS, reduced-motion guard) + "New transactions belong to this member." helper; verified pick→Save→persist→label; env reset to null after
- (2) Locale: answered (Intl number/date formatting; bn-BD = Bengali digits) + added helper "Formats numbers & dates — bn-BD renders Bengali digits."
- (3) Numpad Max Digits confirmed 100% dead (written, read nowhere) → removed everywhere (AppSettings, config consts, LimitsFields, PreferencesCard, e2e seeds). Dashboard limit verified WORKING live (limit=2 → 2 rows + Load more 323; restored 5 after) → added helper "Dashboard Recent Transactions only — ledgers show everything." (likely missed Save tap or ledger expectation)
- (4) Drive "going behind" → logged BUG-10, root cause measured (closed nested tray 29px not 0: `.trayOpen .trayInner` descendant selector leaked open padding into nested tray) → scoped to `>`; verified 29px→0px; marked fixed (CHANGELOG at merge)
- (5) Wizard Try-it: agreed irrelevant after real data — found Try-it UNREACHABLE (member-save on Continue means step 3 always has data) → removed step 4 + handleLoadSample + dead keys/CSS, 5→4 dots, How-it-works always "Finish → Dashboard". NOTE: sample-data entry point is gone; say the word to put it on step 0
- S-3 also done: SettingsModal 463→~70 LOC (5 shared cards, Done footer; +switch/log/import utilities in its CSS). Modal still has no open() callers (header gear routes to /settings) — noted, kept compiling
- Gates: typecheck PASS, full `npm run lint` 0, build PASS, unit 92/92, scratch e2e 99-wizard-finish 2/2 green (deleted after) + 13-wizard 2/2, detect_changes vs dev MEDIUM (settings/wizard/docs scope, 1 intended process)

### Skill(s) Used
- senior-frontend

### Status
- Full batch complete on branch. Next: push + user verifies live → confirm merge to `dev` (CHANGELOG Added/Fixed entries ride with merge).

## Session 2026-10-16 (guest Google sign-in entry, on feature/setup-settings-refresh)

### Changes
- User report: skipped wizard → dashboard → Settings has no Google sign-in. Diagnosed two layers: (1) running :3000 predates `.env.local` key — served ID-less build ("not set up", no button) though the key exists on disk; (2) even configured, sign-in is buried (collapsed Backup card → nested disclosure) and guests see zero sync affordance (header button hid when signed out, wizard skipped)
- User-confirmed: header button for guests. `useCloudIndicator.ts` now returns idle guest state (`never` dot + "Sign in to back up to Google Drive") when signed out AND build configured; null only when unconfigured (no dead button). No Header markup change — existing buttons + Backup deep link render as-is
- Verification saga: scratch e2e failed first on reused ID-less :3000 (proving the env diagnosis); killed :3000 squatter (PID 6520), `CI=1` fresh server with dummy ID → scratch 98-guest-sync green (button visible → deep link → Drive section), spec deleted after
- Gates: typecheck PASS, eslint clean

### Skill(s) Used
- senior-frontend

### Status
- Committed on branch, unpushed. Next: push; USER MUST RESTART `npm run dev` (picks up `.env.local` key) → header cloud button + Settings sign-in appear; then verify → confirm merge to `dev`.

## Session 2026-10-16 (sign-out-erase for account switch, on feature/setup-settings-refresh)

### Changes
- User request: after Google sign-in, Backup & Storage should offer Sync Now + Sign out; sign-out clears local synced data so another account can sign in. (Sync Now already existed — user never saw it: still on ID-less :3000 build. Disconnect renamed to Sign out.)
- User-confirmed: erase-device semantics + sync-first guard (Q2 unanswered → safe default: final sync, warned second-confirm on failure, never silent destroy)
- `CloudSync.ts`: NEW `clearLastSyncMeta()` (memory + IDB fingerprint) so a wiped device never poses as previously-synced under T-152 rules
- `CloudSyncSection.tsx`: `handleDisconnect` → `handleSignOut` — confirm → best-effort final `syncNow()` (failure → "Unsynced changes will be lost. Sign out anyway?" second confirm) → `googleAuth.signOut()` (revoke + auth IDB) → `resetStorage()` (DB + snapshots) → `clearLastSyncMeta()` → `setupComplete:false` → reload to wizard. Drive backup untouched. Note copy updated.
- e2e `15-cloud-sync`: NEW sign-out test (mocked GIS/Drive: sign in → Sign out → setupComplete false → /setup Welcome → 0 members); fixed S-2 fallout (Backup heading → disclosure text). Debugging notes: closed trays stay in DOM (snapshot shows hidden content — not a bug); fresh boot holds 1–2 empty-DB snapshots (harmless ring, asserted around it); had to kill unknown :3000 squatter for CI fresh-ID server
- Gates: typecheck PASS, scoped lint clean, e2e cloud-sync 4/4 green (incl. pre-existing 2)

### Skill(s) Used
- senior-backend (CloudSync meta), senior-frontend (section + e2e)

### Status
- Committed on branch, unpushed. Next: push → user restarts dev → verifies sign-in + sign-out flow → confirm merge to `dev` (CHANGELOG entries ride with merge).

## Session 2026-10-16 (BUG-12 recovery fix after sign-out-erase, on feature/setup-settings-refresh)

### Changes
- User report: Database Error after my sign-out-erase; restore led to empty wizard. Diagnosed: (1) `resetStorage()` flushed the empty schema THROUGH the snapshot ring → slot 0 became an empty snapshot → later Restore Latest landed on empty DB (the wipe itself worked, e2e-green); (2) recovery screen offered only newest slot; (3) repeated :3000 kills caused hangs/slow loads on top
- Fix: `suppressSnapshot` flag (checked synchronously, race-free with fire-and-forget flush) so reset flushes never enter the ring; NEW `restoreSnapshotExact()` on port + service (no fallback, per-slot errors); recovery screen lists all slots with times + exact restore buttons, truthful Start Fresh copy ("resets to empty"), watchdog message names stalled stage, "No older backups" empty state
- Gates: typecheck PASS, scoped lint clean, unit 92/92, NEW e2e `16-recovery` green (forced wasm failure → error UI + actions, no crash), fresh-profile boot → 4-step wizard, 0 errors
- BUG-12 stays OPEN until user confirms data back. Restarted their dev server detached (was down; mine has `.env.local` key via vite). Told user: expect wizard (wiped as requested) → sign in / re-setup; older slots only predate the wipe

### Skill(s) Used
- senior-backend (service/port), senior-frontend (recovery UI + e2e)

### Status
- Committed on branch, unpushed. Next: push → user reloads normal Chrome → reports → confirm merge to `dev`.

## Session 2026-10-16 (BUG-12 storage-hang timeout, on feature/setup-settings-refresh)

### Changes
- User exhausted all 4 profile steps (single tab, hard refresh, SW unregistered, extensions off); other browsers + incognito fine → last suspect is origin storage APIs hanging with no error (the only boot path without any timeout)
- Fix: 12s `withStorageTimeout` (exported for reuse) around adapter init + main read + snapshot recovery + recovery slot-list load; hung origin now fails fast with "site data may be damaged / use Start Fresh" into the engine-free wipe path instead of the 15s watchdog dead loop
- Gates: typecheck PASS, scoped lint clean, unit 92/92 (11 files), `16-recovery` + `13-wizard` e2e green

### Skill(s) Used
- senior-backend

### Status
- Committed on branch, unpushed. Next: push → user hard-reloads normal Chrome (picks up fix) → Start Fresh if recovery shows → sign in → confirm merge to `dev`.

## Session 2026-10-16 (BUG-12 dead-end loop fix, on feature/setup-settings-refresh)

### Changes
- User pasted the new recovery screen: stall at `Starting…` = sql.js engine file never loaded (dead/restarting server — only :3000 listener is my detached server, no port conflict), and Start Fresh silently no-ops without engine/storage/SQL → reload loop. Both confirmed by reading init vs handler preconditions
- Fix: NEW `wipePersistedStorage()` in storage/index (OPFS main+snapshots dir, LS main+ring+flag, cloud-sync IDB; auth/settings kept so signed-in boot re-pulls Drive) wired to Start Fresh + `setupComplete:false` + reload — works with zero engine; engine download via blob URL with 10s timeout and actionable error ("is the dev server running?") instead of 15s mystery hang
- Gates: typecheck PASS, scoped lint clean, unit 92/92, `16-recovery` e2e still green, clean-profile boot → wizard 0 errors (exercises new wasm path)
- BUG-12 updated (stays open until user confirms). Server: single :3000 (mine, detached, has key) — user must use it, not start a second one

### Skill(s) Used
- senior-backend (storage/service), senior-frontend (recovery handler)

### Status
- Committed on branch, unpushed. Next: push → user reloads normal Chrome → reports → confirm merge to `dev`.

## Session 2026-10-16 (BUG-12 dead-button fix, on feature/setup-settings-refresh)

### Changes
- User: device empty, expects wizard, recovery buttons appear dead. Cause: recovery actions had no busy feedback and hung silently on poisoned storage (wipe awaited hung stores forever; restore loop uncapped) — clicks looked dead
- Fix: per-store 8s timeouts in `wipePersistedStorage` returning a `WipeReport`; all restore paths capped via `withStorageTimeout`; Restoring…/Wiping… busy states with mutual disabling; wipe failure renders manual-clear guidance (F12 → Application → Storage → Clear site data → reload)
- Gates: typecheck PASS, scoped lint clean, unit green, `16-recovery` e2e green, build PASS

### Skill(s) Used
- senior-frontend

### Status
- Committed on branch, unpushed. Next: push → user hard-reloads (Ctrl+Shift+R) normal Chrome → Start Fresh → wizard → sign in → confirm merge to `dev`.

## Session 2026-10-16 (BUG-12 resolved by reboot, on feature/setup-settings-refresh)

### Changes
- User confirmed: hosted stable ALSO fails in the same single Chrome profile (works in other profiles) → exonerated dev server, all recent code, and origin site data (different origin + released code). Suspects narrowed to profile-global (extensions/proxy/SecureDNS/GPU/WASM)
- User rebooted the computer: hosted + dev apps both load normally → BUG-12 closed as OS/machine-level (stale loopback sockets / zombie vite+Chrome processes from repeated :3000 kills / hung profile network service). No data lost. Lesson logged: after 2–3 kill/restart cycles, reboot before blaming the app
- Cleaned BUG-12 duplicate Status/Resolved fields from the triage appends (single fields per template)

### Skill(s) Used
- senior-frontend

### Status
- Committed on branch, pushed. Next: user verifies data + sign-in live → confirm merge to `dev` (CHANGELOG Added/Fixed ride with merge, no version bump per VERSIONING).

## Session 2026-10-16 (BUG-13 splash progress, on feature/setup-settings-refresh)

### Changes
- User report: splash bar shows "Starting…" then nothing until app loads. Logged BUG-13 first. Root cause: render gate `{!ready && showProgress}` unmounted the bar the instant boot completed — while splash lingers ~800ms for typing + fade — so staged progress and the final 100% never painted (ProgressBar itself was fine per T-165)
- Fix: gate on `showProgress` alone with `ready ? 100/'Ready' : live values` — fast boots (<600ms) unchanged, slow boots stage then show Ready through fade
- Gates: typecheck PASS, scoped lint clean, NEW e2e `17-splash` green (delayed engine → stages → Ready → app)

### Skill(s) Used
- senior-frontend

### Status
- Committed on branch, unpushed. Next: push → user verifies → confirm merge to `dev`.

## Session 2026-10-16 (BUG-14 morning re-auth auto-close, on feature/setup-settings-refresh)

### Changes
- User report: signed in at night, morning Sync-now popup opens then auto-closes. Logged BUG-14 first. Diagnosis: hourly access tokens (GIS implicit flow, no refresh tokens) + dead overnight Google session → silent `none` renewal null → explicit fallback opened popup with `prompt:''`, which fails closed instead of offering the chooser
- Fix: `signIn` + `refreshInteractive` request `prompt:'select_account'`; silent path untouched. Unit prompt assertions added/updated
- Gates: typecheck PASS, scoped lint clean, unit 92/92

### Skill(s) Used
- senior-backend

### Status
- Committed on branch, unpushed. Next: push → user reloads dev (picks up fix), taps Sync now → chooser appears → confirm merge to `dev`.

## Session 2026-10-16 (BUG-15 popup spam + stuck sync bar, on feature/setup-settings-refresh)

### Changes
- User report: Sync-now progress never finishes + console shows 6× `GSI_LOGGER: Failed to open popup … prompt=none … blocked?`. Logged BUG-15 first. Diagnosis: GIS opens a REAL popup even for silent `prompt:'none'` — background retries (boot/flush/polls) outside gestures get blocker-killed, spamming doomed popups after the hourly token dies; Drive fetches had zero timeouts so a hanging network stuck the bar at 75% forever
- Fix: per-session silent-renewal backoff (`silentRenewalDead`, cleared by explicit sign-in/refresh/sign-out — explicit taps always attempt); 30s `fetchWithTimeout` (abort + race guarantee) on all 6 Drive calls + profile fetch
- Gates: typecheck PASS, scoped lint clean, unit 94/94 (backoff + timeout tests), e2e cloud-sync 4/4 green

### Skill(s) Used
- senior-backend

### Status
- Committed on branch, unpushed. Next: push → user verifies Sync now completes-or-errors-cleanly → confirm merge to `dev`.

## Session 2026-10-16 (console hygiene meta fix, on feature/setup-settings-refresh)

### Changes
- User: cleared local storage, sync works; asked about console lines. All benign dev-mode noise: React DevTools hint, install-banner suppression (intentional, own Install UI), router v7 future-flag warnings (dev-only, production-silent), and attached effect stacks (not errors). Notably: zero GSI popup errors now
- Fix: added standard `mobile-web-app-capable` alongside the Apple tag (silences Chrome deprecation, iOS still needs theirs)
- Gates: build PASS

### Skill(s) Used
- senior-frontend

### Status
- Committed on branch, unpushed. Next: push → confirm merge to `dev`.

## Session 2026-10-16 (merge setup-settings-refresh → dev)

### Changes
- User-approved merge: `feature/setup-settings-refresh` (30 commits: S-1 sections kit, S-2 five cards, S-3 modal thinning, BUG-10/11/13/14/15 fixes, numpad removal, MemberPicker, wizard Try-it removal, guest sync entry, sign-out-erase, recovery slot picker + timeouts + busy states, splash Ready, PWA meta) + CHANGELOG `[Unreleased]` Added/Fixed entries → `dev` via `--no-ff` `a6b21a3`; pushed `dev` (`009a38e..a6b21a3`); branch kept
- Gates: pre-merge typecheck + full lint 0 + build + unit 94/94 green on branch tip; post-merge typecheck PASS on result; no version bump (feature→dev per VERSIONING)
- detect_changes scope (earlier): settings/wizard/sync/recovery/docs only, as intended

### Skill(s) Used
- senior-backend, senior-frontend, gitnexus

### Status
- Live on `dev`. Next: user call (release bump per VERSIONING at release time; `master` untouched; Other Ledgers V2 on "next update").

## Session 2026-10-17 (T-169 informed conflict dialog)

### Changes
- User spec: compare cloud-vs-local in the popup (amounts shown) + buttons Keep this device / Download cloud data. Built on `dev` (carries all sync work)
- `cloudDiff.ts`: pure `summarizeRows` (counts, latest-3 signed amounts, last-change) + thin `extractSide` (7 capped queries); 3/3 unit tests with stubs
- Service: 4 conflict sites funneled through `_flagConflict` (stash + hold bytes + flag); `getConflictPreview()` opens both snapshots in-memory (plain-dialog fallback); preview cleared on resolve; port shapes live in `IDatabaseService`
- Modal: This-device vs Cloud cards (counts + latest + timestamps) + new button copy; token-only CSS module
- Drive-by: `dev` typecheck was red before my change (pre-existing, loan-lender-breakdown era) — fixed `LoanService` unknown→Database cast + widened test mock for the new port method
- Gates: typecheck PASS, scoped lint clean, unit 97/97, build PASS
- E2E note: live-dialog e2e skipped (no fast trigger seam — 30s poll; manual live test stands in)

### Status
- Committed `141eef6` on `dev`, unpushed. Next: push + reply.

## Session 2026-10-17 (T-170 update preview)

### Changes
- User report: Refresh prompt said something arrived but not what. Same informed-treatment as T-169 for the pull path
- T-170 (`8434dd3`): `getUpdatePreview()` (verified download only — no import/state change) + Cloud-first `SideCard` pair in the Refresh prompt; Later/Refresh unchanged; plain-text fallback
- Gates: typecheck PASS, scoped lint clean, unit 97/97, build PASS
- E2E note: same 30s-poll seam as T-169 — live two-device test stands in

### Status
- Committed on `dev`, unpushed. Next: push + reply.

## Session 2026-10-17 (T-171 phantom sync fix)

### Changes
- User report confirmed in code: `recalculateBalances()` ran every boot doing blanket `UPDATE accounts SET balance=0, updated_at=now()` + flush — hash changed with zero user edits → phantom uploads/downloads/conflicts
- T-171 (`f62cba8`): pure `computeBalances` + `diffBalances` (mirrors `applyBalanceChange` exactly); service UPDATEs only stale rows and flushes only when changed; genuinely stale balances still self-correct
- Gates: typecheck PASS, scoped lint clean, unit 104/104 (7 new), build PASS

### Status
- Committed on `dev`, unpushed. Next: push + reply (note: one final upload per device on first boot after fix, then quiet).

## Session 2026-10-17 (T-172/T-173 header tap-to-sync + ring)

### Changes
- User requests: (1) header sync button syncs immediately, no Settings trip; (2) circular animation on any sync, full round = done
- T-172 (`9587937` part): tap runs immediate `syncNow()` with re-entrancy guard (guests keep deep link); service emits `moneyflows:sync-start/end` only around real network activity (idle/cooldown skips silent)
- T-173: `SyncGlyph` states — cloud+dot idle, spinning ring during any sync incl. background auto-syncs, full-ring check flash 1.2s on clean end; dot refreshes on sync-end; both desktop+mobile instances; reduced-motion guard
- Gates: typecheck PASS, scoped lint clean, build PASS

### Status
- Committed on `dev`, unpushed. Next: push + reply.

## Session 2026-10-17 (T-174 tick badge + outer ring)

### Changes
- User refinements: (1) persistent tick when nothing left to sync; (2) tap-when-idle answers with the tick; (3) ring orbits OUTSIDE the cloud, not inside
- T-174 (`a88994c`): synced idle = cloud + centered green tick badge (replaces corner dot); tap flashes completion even with zero network; spinner = centered cloud + rotating outer arc (r=10, transform-box fill-box); reduced-motion guard kept
- Gates: typecheck PASS, scoped lint clean, build PASS

### Status
- Committed on `dev`, unpushed. Next: push + reply.

## Session 2026-10-17 (T-175 spinner orbit fix)

### Changes
- User report: animation read as inner clutter, not an outer circle. Cause: r=10 ring overlapped the full-size cloud edges
- T-175 (`a14a823`): cloud shrinks to 62% centered, arc rides r=10.5 fully outside; verified with screenshots 450ms apart showing the arc at different orbit positions (frame hashes differ)
- Gates: typecheck PASS, scoped lint clean, build PASS (probe spec deleted after use)

### Status
- Committed on `dev`, unpushed. Next: push + reply.

## Session 2026-10-16 (app logo sizing)

### Changes
- User supplied `Logo_mockups/MoneyFlows Fintech Logo Showcase.png` (1254x1254 composite) + approved crop-hero-icon approach
- Cropped top hero glass tile (413,63,430x430) and middle lockup band (200,530,850x215); resized via System.Drawing HighQualityBicubic
- `public/`: `icon-512.png` + `icon-192.png` overwritten in place (padded 84% artwork, maskable-safe), new `apple-touch-icon.png` (180), `favicon-32x32.png` + `favicon-16x16.png` (tight crop), `logo-horizontal.png` (850x215, unwired asset for header/splash later)
- `index.html`: favicon now PNG 32/16 (svg kept as fallback), apple-touch-icon points to new 180px PNG; `manifest.json` unchanged (paths still valid)
- Gates: build PASS, new PNGs verified in `dist/`

### Status
- Uncommitted on current branch. Next: commit + continue per user call.

## Session 2026-10-17 (T-176 legal pages)

### Changes
- User request for Google verification: in-app Privacy + Terms (T-176, `1a5b1bb` on `dev`)
- Shared `LegalDoc` screen (glass panel, token-only CSS, ≤300 LOC) at guard-exempt `/privacy` + `/terms` (reviewers land without setup); About links; honest copy matching real behavior (local-first, drive.appdata-only, no analytics)
- `SUPPORT_EMAIL` placeholder left for user to replace before submitting verification
- Gates: typecheck PASS, scoped lint clean, build PASS, e2e 18 green

### Status
- Committed on `dev`, unpushed. Next: push + reply.

## Session 2026-10-17 (release v1.17.0 via safety branch)

### Changes
- User-approved release path: `dev → google_signin_backup` (merge `ed4cd12`, clean) → gates green → version bump `1.16.1 → 1.17.0` MINOR on safety (`948ad5d`: package.json + whatsNew 3 bullets + CHANGELOG `[1.17.0] - 2026-10-17`) → `google_signin_backup → master` no-ff (`e0c45de`) → tag `v1.17.0` → pushed all
- Unrelated PWA-icon work (index.html, icons, Logo_mockups) stashed during branch hops and restored intact — never committed
- Gates: typecheck PASS, full lint 0 PASS, unit 104/104 PASS, build PASS (merge result + bump commit)

### Status
- `master` at v1.17.0 (tag live on remote) with sync + legal pages; `dev` and `google_signin_backup` pushed. Next: user verifies production deploy, then Google verification submit.

## Session 2026-10-17 (release v1.17.1 patch)

### Changes
- User-approved: ship real support inbox to production. Synced `origin/master` back into `dev` (clean), bumped `1.17.0 → 1.17.1` PATCH on `dev` (`4aeed1a`: package.json + whatsNew + CHANGELOG `[1.17.1] - 2026-10-17`), merged `dev → master` no-ff (`01bff92`), tagged `v1.17.1`, pushed master + tags + dev
- Unrelated PWA-icon work stashed across hops and restored intact — never committed
- Gates: typecheck PASS, build PASS (bump commit)

### Status
- `master` at v1.17.1 (tag live). Next: user confirms production deploy, then verification submit.

## Session 2026-10-17 (PWA icon set commit)

### Changes
- Committed the pending icon work on `dev` (`d3a186a`): detailed M-mark 192/512, apple-touch-icon, favicons 16/32, logo-horizontal + index.html wiring (favicons, apple-touch PNG). Squares are OAuth-logo-ready. `Logo_mockups/` source sheet left untracked as-is
- Gates: build PASS (icon/link-only change)

### Status
- Committed on `dev`, unpushed. Next: push + reply (OAuth logo upload itself stays a console action).

## Session 2026-10-17 (release v1.17.2 patch)

### Changes
- User-approved: ship pending dev work (PWA icon set) to production. Gates green on dev tip (typecheck, full lint 0, 104/104, build)
- Bump `1.17.1 → 1.17.2` PATCH on `dev` (`7df2daa`: package.json + whatsNew + CHANGELOG `[1.17.2] - 2026-10-17`); merged `dev → master` no-ff (`0d28b59`); tag `v1.17.2` live on remote; pushed master + tags + dev
- Back on clean `dev` (only untracked `Logo_mockups/` source sheet remains)

### Status
- `master` at v1.17.2. Next: user confirms production deploy (icons + legal contact live), then verification submit after 24h window.

## Session 2026-10-17 (BUG-16 sync popup auto-close + bar stuck at 75%)

### Changes
- Logged BUG-16 (open/high): GIS popup auto-closes with no callback; `handleSyncNow` awaits unsettled GIS promises forever → stage stuck 75%, no error, reload-only recovery
- Diagnosis from source reads (dev has BUG-14 `select_account` + BUG-15 network timeouts): remaining hole is NO timeout on GIS token promises (`signIn`/`getValidToken`/`refreshInteractive`) or `loadGis` — BUG-15 covered Drive fetches only. GitNexus index stale for sync symbols (impact/query degraded) — call graph taken from direct reads instead
- Ruled out: missing client ID (popup appeared → ID baked in, server restarted after `.env.local`)

### Skill(s) Used
- senior-frontend

### Status
- BUG-16 fixed on `dev` (`5a0ee87`): shared `requestToken` timeout helper + 15s script-load timeout + actionable sign-in error copy; 3 new timeout tests. Gates: typecheck PASS, full lint 0 PASS, unit 107/107 PASS, build PASS. Pre-existing quirk noted: `npm test` also picks up `e2e/*.spec.ts` under vitest (Playwright-runner mismatch, 21 collection failures) — unit scope `npx vitest run src` is the green gate. Next: push dev; user fixes hosted origin allowlist (checklist given) and retests sync.

## Session 2026-10-17 (merge BUG-16 to master)

### Changes
- User-approved `dev → master` no-ff (`6854182`): BUG-16 GIS timeout fix (`5a0ee87`) + CHANGELOG Unreleased Fixed + BUGS.md fixed + session logs. No version bump/tag (release step pending user call)
- Gates re-run on merge result: typecheck PASS, full lint 0 PASS, unit 107/107 PASS, build PASS; pushed `master` (`0d28b59..6854182`)
- Back on clean `dev` (only untracked `Logo_mockups/` remains)

### Status
- `master` carries the sync hang fix. Next: deploy hosted app + user verifies origin allowlist, then version-bump release when confirmed.

## Session 2026-10-17 (BUG-17 sign-in on every app open)

### Changes
- Logged BUG-17 (medium): hours-later + same-URL answers ruled out storage loss → ~1h token + failing silent renewal. User chose stretch + smooth over re-auth-UX-only/backend options
- Fixed on `dev` (`8ca1547`, same commit: BUGS.md fixed + CHANGELOG Fixed): real `expires_in` honored on all grant paths; NEW `renewBeforeExpiry()` (10-min window, activation-gated, 5-min throttle, backoff-honoring, expired delegates to normal path); NEW `ensureProactiveRenewal()` wired once in `AppLayout`; 5 new tests
- Gates: typecheck PASS, full lint 0 PASS, unit 112/112 PASS, build PASS. `detect_changes` medium (AppLayout mount effect only — expected). Stays on `dev` (no master merge requested)

### Skill(s) Used
- senior-frontend

### Status
- BUG-17 fixed on `dev`, unpushed. Next: push + user retests; long-idle reopens still need one tap by platform design.

## Session 2026-10-17 (merge BUG-17 to master)

### Changes
- User-approved `dev → master` no-ff (`50910dc`): BUG-17 token-lifetime fix (`8ca1547`) + CHANGELOG Unreleased Fixed + BUGS.md fixed + session logs. No version bump/tag (release step pending user call)
- Gates re-run on merge result: typecheck PASS, full lint 0 PASS, unit 112/112 PASS, build PASS; pushed `master` (`6854182..50910dc`)
- Back on clean `dev` (only untracked `Logo_mockups/` remains). Week-long token question answered: not possible client-side (Google fixes ~1h); direction question dismissed → staying as-is

### Status
- `master` carries both sync fixes (BUG-16 hang + BUG-17 hourly re-sign). Next: deploy hosted app + user retests, then version-bump release when confirmed.

## Session 2026-10-17 (BUG-18 false conflict on one device)

### Changes
- Logged BUG-18 (high): single-tab + normal-use answers ruled out multi-tab/meta-loss → unconfirmed-upload stale fingerprint; user chose convergence guard
- Fixed on `dev` (`a2fea0b`, same commit: BUGS.md fixed + CHANGELOG Fixed): `decideSyncAction` convergence-idle + flush fingerprint heal + `healIfConverged()` re-verify + reconcile stale-meta refresh + dialog auto-dismiss; convergence tests added
- Gates: typecheck PASS, full lint 0 PASS, unit 113/113 PASS, build PASS. `detect_changes` flagged HIGH but attribution is stale-index noise (untouched methods/processes) — diff-verified confinement to sync paths + green gates. Stays on `dev` (no master merge requested)

### Skill(s) Used
- senior-frontend

### Status
- BUG-18 fixed on `dev`, unpushed. Next: push + user retests; genuine two-device conflicts still ask as before.

## Session 2026-10-17 (merge BUG-18 to master)

### Changes
- User-approved `dev → master` no-ff (`ce45235`): BUG-18 convergence guard (`a2fea0b`) + CHANGELOG Unreleased Fixed + BUGS.md fixed + session logs. No version bump/tag (release step pending user call)
- Gates re-run on merge result: typecheck PASS, full lint 0 PASS, unit 113/113 PASS, build PASS; pushed `master` (`50910dc..ce45235`)
- Back on clean `dev` (only untracked `Logo_mockups/` remains)

### Status
- `master` carries all three sync fixes (BUG-16 hang, BUG-17 hourly re-sign, BUG-18 false conflict). Next: deploy hosted app + user retests, then version-bump release when confirmed.

## Session 2026-10-17 (header sync tap reopens sign-in popup)

### Changes
- `Header.openSyncSettings`: token-valid path unchanged (syncNow + flash); no-token path now runs `googleAuth.signIn` popup → `reconcileAfterSignIn` (reload on downloaded) → syncNow; cancel/dead popup leaves the warn dot. Unconfigured build still deep-links to Settings. User-requested UX, not a bug → no BUGS.md entry
- Gates: typecheck PASS, full lint 0 PASS, unit 113/113 PASS, build PASS. Committed on `dev`, unpushed

### Skill(s) Used
- senior-frontend

### Status
- Next: push dev + user verifies popup-from-header when the ~1h session lapses.

## Session 2026-10-17 (merge header sign-in feature to master)

### Changes
- User-approved `dev → master` no-ff (`a3bca5c`): header sign-in popup feature (`78e4d5c`) + CHANGELOG Unreleased Added + session log. No version bump/tag (release step pending user call)
- Gates re-run on merge result: typecheck PASS, full lint 0 PASS, unit 113/113 PASS, build PASS; pushed `master` (`ce45235..a3bca5c`)
- Back on clean `dev` (only untracked `Logo_mockups/` remains)

### Status
- `master` carries BUG-16/17/18 fixes + header sign-in. Next: deploy hosted app + user verifies, then version-bump release when confirmed.

## Session 2026-10-17 (mobile UI audit + BUG-19 starting-balance wipe fix)

### Changes
- Mobile UI audit (Playwright, 390x844, fresh guest profile): wizard, dashboard, members, member detail + linked accounts, loans, other ledgers index/detail/entry sheets, settings, More sheet, light mode. Ranked refinement list delivered to user (Other Ledgers index layout mess #1; detail headers missing titles; emoji-as-icons; orphaned empty-state buttons; zero-in-danger-red; touch targets; validation-in-labels; duplicate wizard progress; suspicious All Accounts badge)
- BUGS.md: logged BUG-19 (critical) + BUG-20 (high) from audit findings. BUG-19: wizard step 2 stored starting balance raw on accounts.balance — boot recalculateBalances (T-171 replay) zeroed it on reload; live-reproduced 28,000 -> 0. BUG-20: linked-accounts modal showed 0 BDT while dashboard showed 28,000 in same (pre-reload) session — diagnose later against healthy account
- BUG-19 fixed (eff4d6c): SetupWizard.handleAddAccount now mirrors AddAccountModal — account saved with balance 0 + income 'Opening Balance' transaction tagged isOpeningBalance:true; live-verified vanish-then-fix (reload keeps 28,000 + both Opening Balance rows in Recent Transactions); detect_changes LOW (stale index, diff-verified confined to wizard)
- Process notes: agentation extension overlay in the test browser intercepts the bottom-right More nav button on reload (removed DOM-side repeatedly; real-user app behavior unaffected) — worth a persistent extension-free e2e context later
- Gates: typecheck PASS, eslint scoped clean, unit 113/113 (src), build PASS

### Skill(s) Used
- ui-ux-pro-max (audit), senior-frontend (fix)

### Status
- BUG-19 closed on `dev` (commit eff4d6c, pushed? NO — commit only, unpushed). Next: user decision on BUG-20 + mobile UI refinement list (starts with Other Ledgers index layout); then push.

## Session 2026-10-17 (calculation-logic audit — BUG-21..BUG-37 logged)

### Changes
- Full read-only calculation/logic audit across every module (balance engine, loans, other ledgers, reports, dashboard, member profile/ledger, groups, recycle bin, write paths). Deliverable was an audit report for the user to triage — NO code changed in this session
- 17 findings logged in `docs/BUGS.md` as BUG-21..BUG-37 (status `open`, no fix approach — each awaits user confirmation per AGENTS.md §3.10). New IDs allocated after BUG-20; entries inserted above the fixed history, ordered severity high → medium → low then found-date
- HIGH (4): BUG-21 dashboard metric chips use two different formulas behind one "vs last month" label (`prevAssets/prevCash` use `thisMonthNet`, `prevBanks/prevLoans` use `lastMonthNet`; `loansChange` subtracts a flow from a stock; `prevX > 0` fallback silently reports 0.0%). BUG-22 member report `closing: acct.balance` is the live balance while `opening` unwinds ALL transactions → Opening + Credit − Debit ≠ Closing for ranges ending before the last transaction (existing tests only cover ranges ending at the last tx). BUG-23 `recordRepayment` clamps loan `outstanding` at 0 and silently discards the overpayment remainder while booking the full amount as a `repay` tx → stack says settled, report can go negative (test asserts −2000). BUG-24 `updateTransaction` never calls `validateTransaction` and the edit modal posts `Number(amount)` from an unsanitized input → blank=0 / non-numeric=NaN / negative / empty description / source===dest all pass, then `applyBalanceChange` writes the bad delta straight into `accounts.balance` (permanent corruption, NaN survives flush)
- MEDIUM (4): BUG-25 loan principal movements (`lend`/`loan_issue`/`repay`/`loan_repayment`/…) counted as income/expense, feeding every "net" figure. BUG-26 profile Total Income (`income` only, includes opening balances) vs Total Expenses (`expense`+`loan_issue`+`lend`) not comparable. BUG-27 loan stack `progressPercent`/`totalRecovered` exclude settled loans. BUG-28 group ledger PDF exports only the `displayLimit` page slice
- LOW (9): BUG-29 Recycle Bin "Total Amount" sums transaction amounts + account balances + ledger opening balances + entry debit+credit (and prefixes every row with "−"). BUG-30 other_ledger/other_entry rows labelled "Account" but unreachable via the Accounts tab. BUG-31 amount rules differ between create (digits-only `parseInt`) and edit (`inputMode="decimal"`, unsanitized). BUG-32 member ledger running balance wrong when no account is selected (latent — `showBalance = !!selectedAccountId` hides it). BUG-33 member ledger balance rendered as raw `String(balance)`, bypassing `formatAmount()`. BUG-34 `on_track` loan status actually means fully repaid. BUG-35 other-ledger `recomputeBalances` rewrites `updated_at` on every entry of the ledger per mutation. BUG-36 unused `createGivenLoan`/`createReceivedLoan`/`recordPayback` (`createReceivedLoan` duplicates given-loan mapping → inverted if ever wired). BUG-37 `getFamilySummary` sums `mobile_wallet`+`business` as `activeLoans`, ignores loan stacks, excludes counterparty accounts; unused by UI
- Verified NOT defects (recorded so a future session does not re-litigate): group ledger per-row running balance is slice-consistent (`netChange` over the same rows); `OtherLedgerDetail` balances read from sorted stored values; `computeBalances.ts` mirrors `applyBalanceChange`/`recalculateBalances` correctly
- Test-coverage gaps noted for later: no test asserts update-path validation (BUG-24), overpayment behaviour (BUG-23), dashboard trend math (BUG-21/25), or a report range ending before the last transaction (BUG-22)
- Audit report saved to `docs/audit/CALCULATION_LOGIC_AUDIT_2026-10-17.md` (user-requested): summary table, 17 findings grouped by module with BUG-ID cross-refs to BUGS.md, verified-non-defects, test-coverage gaps, recommended priority. House naming matches `docs/audit/PII_NAMES_AUDIT_2026-08-24.md`
- Report gained a §0 plain-language section (user-requested, "so that I can understand easily"): big picture (receipt book vs wallet balances), the 4 serious + 4 moderate issues explained with concrete scenarios, the 9 minor ones as a table, recommended work order, and the 3 decisions that need the user (overpayment rule, whether to repair already-damaged data, first-step scope). Each plain item carries its BUG-ID so it maps to the technical section
- No fixes applied by design — user asked for the report first ("then I will decide about the findings"). Logging proceeded under AGENTS.md §3.11 (log before anything else) while fixes stay blocked on §3.10 confirmation

### Skill(s) Used
- code-reviewer, senior-backend, senior-frontend (static audit; no tooling/gates run — docs-only change)

### Status
- 17 findings logged on `dev`, pushed at user request — remote `dev` is at `b128400` (in sync). The push also carried the earlier unpushed BUG-19 fix (`eff4d6c`) + its session log (`14105ee`), confirmed with the user first
- Next: user triages the report and picks a finding; recommended order = BUG-24 + BUG-23 (only data-corrupting pair), then BUG-22, then BUG-21/25. Each fix needs an approved approach before code is touched. Still open from the earlier audit: BUG-20 (linked-accounts modal balance)

## Session 2026-10-17 (mobile audit list documented as plan)

### Changes
- NEW `docs/plans/MOBILE_UI_REFINEMENTS_PLAN.md` — M-01..M-09 tickets with observed-vs-acceptance criteria, fixes-first ordering, and BUG-19/BUG-20 cross-refs (audit findings are now in-repo, not chat-only)
- No code touched in this step

### Status
- Committed `docs:` on `dev`. Next: BUG-20 diagnosis or first ticket M-01 on user call.

## Session 2026-10-17 (BUG-20 diagnosed + closed as resolved-by-BUG-19, regression guard)

### Changes
- BUG-20 ("Linked Accounts modal shows 0 BDT while dashboard shows the real total") diagnosed live in the running app against the exact reported data set (member Imran: City Bank 25,000 + Cash Wallet 3,000 = 28,000). Dashboard "Total in Banks", dashboard member row, Members list, profile hero, mobile Linked Accounts modal (25,000 + 3,000) and desktop dropdown all read the same values — before AND after a full reload. **BUG-20 does not reproduce on current code.**
- Root cause (no separate defect — a second face of BUG-19): those accounts held a balance no transaction backed (pre-fix wizard wrote the raw number onto the account row). Boot's `recalculateBalances()` (main.tsx:90) recomputes every balance from the transaction stream and rewrites unbacked rows to the replayed sum (0); the Linked Accounts modal re-reads those rows while the dashboard metric renders the in-store value through `useAnimatedValue` → "modal 0 / dashboard 28,000" inside that window. Verified every other balance writer cannot produce an unbacked balance: `AddAccountModal` + fixed wizard write an `isOpeningBalance` income tx, `EditAccountModal` cannot change a balance, `LoanService` creates counterparty accounts at 0
- User-confirmed plan = Option A (close as resolved-by-BUG-19 + regression guard; no production change for a symptom that no longer exists). Option B (re-derive balances in `restoreAccount` and every account write) deferred — noted as better folded into BUG-24 work
- `docs/BUGS.md`: BUG-20 moved out of the open block into fixed history (Status fixed, diagnosed root cause, fix approach, resolved-by `eff4d6c` + today's regression test)
- NEW regression test in `e2e/flows/03-accounts.spec.ts` (mobile modal + desktop dropdown): asserts per-account card balances `{DBBL 70,000 · Cash -6,000 · bKash 0}`, profile Net Balance 64,000 and dashboard In-Banks 70,000 — mobile case repeats all of it after a reload, pinning BUG-19 + BUG-20. Values derived from `e2e/helpers/seed-tiny.ts` (balances rebuilt by replay)
- Mutation-verified the guard bites: temporarily forced the modal to `formatAmount(0, …)` → the new mobile test failed with exactly the reported symptom (`DBBL "0 BDT"` vs expected `"70,000 BDT"`); mutation reverted, `git diff -- src` is empty
- `CHANGELOG.md` [Unreleased] → Fixed: extended the existing BUG-19 bullet to name the Linked Accounts list reading 0 BDT (same user-visible fix; no version bump — docs/test only per `docs/VERSIONING.md` §2 rule 4)
- TWO pre-existing harness defects found while running gates, logged (not fixed, per §3.11): **BUG-38** `npm test` can never pass — vitest collects all 21 `e2e/*.spec.ts` and exits 1 ("Playwright Test did not expect test() here") while the 113 real unit tests pass; **BUG-39** `e2e/search.smoke.spec.ts:13` waits for a dashboard `Search...` input that the global header search (`a641ba9`) replaced → `npx playwright test` is permanently 30/1 red on an untouched app
- Gates: typecheck PASS, lint `--max-warnings 0` PASS (exit 0), unit 113/113 PASS (the 21 vitest "failed suites" are BUG-38, all Playwright files), Playwright 30 passed / 1 failed = BUG-39 only (my 4 tests in `03-accounts` green; e2e for the new spec run 3× including a negative mutation run)
- Gotcha hit again: the long-lived dev server on :3000 served a **stale bundle** (Windows watcher missed an edit) — a mutation run silently tested old code. Fix used: kill the listener by port (`Get-NetTCPConnection -LocalPort 3000`) and let Playwright start a fresh server, verifying the served module with `Invoke-WebRequest` before trusting a run

### Skill(s) Used
- senior-frontend (diagnosis + regression test), code-reviewer (harness findings BUG-38/39)

### Status
- On `dev`, awaiting push. BUG-20 = fixed (docs + regression test only, `src/` untouched). Next: user decision on BUG-38/BUG-39 one-line fixes (vitest `exclude: ['e2e/**']`; update/replace the stale search smoke), then the earlier audit order (BUG-24 + BUG-23 first).

## Session 2026-10-17 (branch fix/calculation-audit for the calculation audit)

### Changes
- Created `fix/calculation-audit` off `dev` (`552c9aa`) in the main folder and pushed with upstream tracking. Safe to branch here because the mobile UI workstream already runs in its OWN worktree (`C:/Users/EftynurPc/.local/share/opencode/worktree/949b9e/mobile-refinements` -> `feature/mobile-refinements`), so the two sessions no longer share a working tree
- Both workstreams share base `552c9aa`, so the later merges into `dev` align: calc branch carries the audit fixes, mobile branch carries M-01..M-09 (`docs/plans/MOBILE_UI_REFINEMENTS_PLAN.md`)
- Merge-collision analysis between the two branches — real overlap is confined to dashboard/member-profile presentation files: `sections.tsx` (calc BUG-21 trend label vs mobile M-05 zero-red colour rules) and `Dashboard.tsx`/`LedgerSection.tsx` (mobile M-03/M-09). Zero overlap on the calc-branch files `SQLiteDatabaseService.ts`, `LoanService.ts`, `LoanDatabase.ts`, `MemberReportService.ts`, `OtherLedgerService.ts`, `useLoanStore.ts`, `TransactionEditModal.tsx`, `FormField.tsx`, `RecycleBin.tsx`, `GroupLedgerScreen.tsx`. Sequencing recommendation given to the user: do BUG-24 first (touches none of their files), defer the dashboard work (BUG-21/25) until after M-05 lands
- `AGENTS.md` §5 deliberately NOT edited on this branch: the other workstream is actively editing that file and §5 is the likeliest conflict point. Handoff for this branch is recorded here instead
- No production code changed yet on this branch

### Skill(s) Used
- none yet (branch setup only)

### Status
- Branch `fix/calculation-audit` ready, pushed, in sync. Next: user picks the first finding and confirms its approach, plus the two standing decisions — overpayment rule (BUG-23) and whether to detect/repair already-damaged data (BUG-24). Recommended first = BUG-24 with BUG-31 riding along (same root cause)

## Session 2026-10-17 (fix/calculation-audit — gate fixed, BUG-38 closed)

### Changes
- User decisions recorded for the calculation-audit workstream: BUG-23 overpayment -> **Option A** (refuse the excess and tell the user, record the rest separately); BUG-24 pre-existing damaged data -> **Option B** (detect + report only, never auto-repair financial records); fix the verification gate before touching calculation code
- **BUG-38 fixed** (`vite.config.ts`): added `/// <reference types="vitest/config" />` + `test.include: ['src/**/*.{test,spec}.{ts,tsx}']`. `npm test` now reports `Test Files 13 passed (13)`, `Tests 113 passed (113)`, **exit 0** — previously 21 Playwright specs were collected and the process always exited 1
- Design notes (both deliberate): a single config file beats a separate `vitest.config.ts`, because vitest would use the latter *instead of* `vite.config.ts` and silently drop the React plugin, the `__APP_VERSION__`/`__GOOGLE_CLIENT_ID__` defines and the `@` alias for any unit test that later needs them. An `include` allow-list beats `exclude: ['e2e/**']` because any future stray spec outside `src/` is then skipped by default rather than silently collected
- Same-commit bookkeeping: `BUGS.md` BUG-38 -> fixed (moved below the open block, placed next to BUG-20 in the fixed history), `CHANGELOG.md` Unreleased/Fixed entry added. **No version bump** — developer-harness fix on a branch; the version bump belongs to the merge/release step (same precedent as BUG-19's "no version bump")
- Gates: typecheck PASS, lint 0 PASS, `npm test` 113/113 exit 0, build PASS. `detect_changes` risk **LOW** (0 changed symbols, 1 file — config-only, so no production processes affected)
- Deliberately NOT done: BUG-39 (Playwright suite permanently 30 passed / 1 failed). It is the same class of one-line gate fix, but it edits `e2e/` which the mobile UI workstream also touches — awaiting the user's go-ahead to avoid stepping on that branch

### Skill(s) Used
- code-reviewer

### Status
- BUG-38 closed on `fix/calculation-audit`. The unit gate is now a real signal, so every later fix on this branch can be verified against it
- Next ticket: **BUG-24** (`updateTransaction` bypasses validation — the one finding that can corrupt stored balances) with **BUG-31** riding along (identical root cause: create vs edit amount rules), then **BUG-23** under the confirmed Option A rule

## Session 2026-10-17 12:47 (fix/calculation-audit — BUG-24 + BUG-31 fixed)

### Changes
- User approval: "go with your recommendations" → implemented **BUG-24** as **Option A1 + B1** plus the **shared amount field**, and **BUG-31** folded in (same root cause). Left alone by design: no maximum amount (the app has never had one — a ceiling is a product decision, not a bug fix).
- **New `src/core/domain/transactionRules.ts`** — one source of truth, importable by both infrastructure and presentation: `validateTransactionFields` (canonical messages the DB always threw), `isValidTransactionFields`, `sanitizeAmountInput` (digits + one decimal separator + max 2 decimals), `parseAmountInput` (`''` → NaN, decimals preserved), `MAX_DESCRIPTION_LENGTH`, `MAX_AMOUNT_DECIMALS`
- **BUG-24 (high, the balance-corrupting one):** `SQLiteDatabaseService.updateTransaction` now calls `validateTransaction` **before** it touches any balance row (it previously wrote straight through); `validateTransaction` itself now delegates to the shared module instead of holding a private copy of the rules. `TransactionEditModal` validates before saving, renders each issue in the existing `FormField` error slot (no new error pattern; only one new `.formError` class for DB-level refusals, token-based), and **stays open** on failure. The edit modal and the create form both read back `useTransactionStore.getState().error` after the awaited save, because the store rolls back and logs rather than throwing — that read-back is what stops a refused save from closing the window and looking successful (it also delays tag-writing/loan-sync until the save really succeeded).
- **BUG-31 (low):** `AmountInput` (`FormField.tsx`, used by Edit + Add Account initial balance) and `TransactionFormModal.handleAmountChange` (create) both run the same `sanitizeAmountInput`, so both accept the same characters. `transactionForm/validation.ts` no longer duplicates the rules — it delegates amount/description to the shared module and keeps only its own "Amount is required" wording for an empty box. `useSubmit` switched `parseInt` → `parseAmountInput`, so decimals survive a create; the create screen's grouped display now preserves typed decimals (it used to show `100` for a typed `100.50`).
- One self-inflicted mistake, caught and repaired immediately: an `edit` call on `TransactionEditModal.module.css` used a bad `oldString` and deleted the `.tagLabel {` selector, leaving its declarations dangling. The next read showed it, the selector was restored byte-for-byte, and the file was re-read to confirm it was identical to the original before the intended class was appended.
- Bookkeeping in the same commit: `BUGS.md` BUG-24 + BUG-31 → **fixed**, moved out of the open block into the fixed history (placed after BUG-38, before BUG-19), each with the user-confirmed approach and a Resolved line. The move was done by a script (`%TEMP%\opencode\move-bugs.ps1`) that extracts the blocks by heading, rewrites Status/Approach/Resolved in place and re-inserts them, then verified: CRLF preserved, no BOM, headings in the right order, no double blank lines anywhere. No version bump — branch work; the bump belongs to the merge/release step.
- Gates on the final tree: typecheck PASS, lint 0 PASS, `npm test` **14 files / 130 tests pass** (was 13/113; +17 new tests), build PASS. `detect_changes` risk **medium** — 9 changed symbols / 7 files, all presentation entry points; affected processes are the `HandleSave → …` chains (4).
- Verification honesty: the 17 new tests cover the shared rules (the thing that was missing, and now the thing the DB calls). There is **no** DB-level integration test proving `updateTransaction` rejects — the repo has no `SQLiteDatabaseService` harness (all existing tests are pure-function tests). The DB wiring is covered by typecheck/build + reading the code. A live Playwright/manual check is the honest way to prove the edit path end-to-end, and it was deliberately deferred to the user's call (also because `e2e/` is shared with the mobile workstream).

### Skill(s) Used
- code-reviewer, senior-backend (DB guard), senior-frontend (forms/validation)

### Status
- BUG-24 and BUG-31 closed on `fix/calculation-audit`. Nothing merged; `dev` untouched.
- Next ticket: **BUG-23** — loan overpayment, under the confirmed **Option A** rule (refuse the excess and tell the user, record the remainder separately). Then **BUG-22** (member-report closing balance, where `MemberReportService.test.ts` has a real test gap: it only covers ranges ending at the last transaction, which is why the wrong method passes). Dashboard findings (BUG-21/BUG-25) stay deferred until the mobile workstream's M-05 lands — `dashboard/sections.tsx` is the one genuine merge conflict between the two branches.
- Still open and unasked: BUG-39 (Playwright permanently 30 passed / 1 failed — one-line fix, but it edits `e2e/`, which the mobile branch also touches); and whether to commit/gitignore/leave untracked `Logo_mockups/MoneyFlows Fintech Logo Showcase.png` (1.23 MB).

## Session 2026-10-17 13:05 (fix/calculation-audit — BUG-23 fixed, BUG-40 logged)

### Changes
- The three BUG-23 decisions were put to the user; the reply was "no response, use your judgement and proceed", so the recommended options were taken: **refuse outright** (rather than inventing a prepayment transaction for the excess), **log the edit-path door as its own finding** (rather than patch it approximately), and **carry the numbers in a typed error, formatted by the UI** (rather than hardcode currency in the service).
- **BUG-23 fixed.** `LoanService.recordRepayment` now sums the active outstanding of the loans it could pay down and throws a new `OverpaymentError{attempted, maximum}` **before any write** — so a refused repayment leaves every loan exactly as it was, instead of the old behaviour where `Math.min(remaining, outstanding)` clamped the allocation and the leftover was silently dropped while the transaction was still booked at the full `params.amount`.
- New `src/loans/domain/errors.ts` (`OverpaymentError`), re-exported through the `src/loans` public API (T-051's convention) so the presentation layer imports it from `../../../loans`, not from a deep path. It carries numbers and not a message because the service has no locale/currency; `useSubmit`'s loan-tab `catch` — which already kept the form open — formats it with the user's own settings: "Only … is still outstanding for this borrower — reduce the amount."
- Ceiling = the borrower's **total** active outstanding, not the targeted lender's: spillover onto other lenders is deliberate and already covered by a test, so a per-lender ceiling would have refused legitimate repayments.
- 4 new tests (`lenderRepayment.test.ts`): refuses above the total and writes **nothing** (no loan mutated, no transaction), reports the true ceiling while ignoring settled/zero-outstanding loans, still accepts paying off exactly everything, and applies the same guard on a targeted lender.
- **BUG-40 logged** (open, medium): `syncLoanTransaction` (the edit path) still holds the same silent clamp — editing a repayment upward raises the ledger while the loan stops at zero. Written up with the reason it is *not* a quick fix: a transaction stores a single `loanRef` while one repayment may have paid down several loans, so there is no per-transaction allocation to reverse. To be decided on its own merits.
- Two self-inflicted `BUGS.md` mistakes, both caught and repaired: (1) a "collapsed double blank lines" normalisation step stripped the blank line after **every** `---` separator in the file — spotted by reading the result, then `git checkout -- docs/BUGS.md` and redone with a corrected script that only touches the two insertion sites; (2) the insert helper places the `---` *after* the inserted entry, so both BUG-24 (from the previous session) and BUG-23 lost the separator that the fixed block uses between entries — added, and verified: 0 separator problems, 0 headings directly after a `---`, CRLF preserved, no BOM.
- Same-commit bookkeeping: `BUGS.md` BUG-23 → **fixed** and moved into the fixed history (after BUG-31, before BUG-19) with the confirmed approach + Resolved line, BUG-40 added at the end of the medium-severity group (before the low block, per the file's ordering rules); `CHANGELOG.md` user-facing bullet. No version bump.
- Gates: typecheck PASS, lint 0 PASS, `npm test` **14 files / 134 tests pass** (was 130), build PASS. `detect_changes` risk **medium** — changed symbol `recordRepayment`, 4 files; affected processes `SettleLoanStack → LoanService` and `DeleteLoanStack → LoanService` (neighbouring paths the class-level edit surfaced — no behaviour change there).

### Skill(s) Used
- senior-backend (service rule + domain error), code-reviewer

### Status
- BUG-23 closed on `fix/calculation-audit`; BUG-40 recorded as its deliberate follow-up. Nothing merged; `dev` untouched.
- Next ticket: **BUG-22** — member report "closing" prints the live balance (`MemberReportService.ts` ~`:155`, `closing: acct.balance`) instead of the balance at the end of the requested period. Worth noting for whoever picks it up: `MemberReportService.test.ts` only exercises ranges ending at the last transaction, which is exactly why the wrong method passes — so the fix needs a test that ends the range *before* the newest transaction.
- Then: BUG-21/BUG-25 (dashboard) once the mobile workstream's M-05 lands, since `dashboard/sections.tsx` is the one real merge conflict between the two branches.

## Session 2026-10-17 13:10 (fix/calculation-audit — BUG-22 fixed, GitNexus re-indexed)

### Changes
- **BUG-22 fixed.** `MemberReportService` set `closing: acct.balance` — the LIVE balance — regardless of the selected range, while `opening` is back-computed by unwinding all history and each row's running balance stops at the last in-period row. Any range ending before the newest transaction therefore printed a Closing that included later activity, and the statement's own arithmetic broke (Opening + Credit − Debit ≠ Closing), including the summary (which sums the section closings). `closing` is now the period-end `running` value; the two definitions coincide whenever the range reaches the last transaction, so unfiltered reports are unchanged.
- The class doc comment that stated "live `account.balance` is the closing truth" was itself describing the bug — corrected, and the new line at the assignment explains why (`BUG-22`) so it does not get "fixed" back.
- **Mutation-verified, deliberately:** reverting `closing: running` → `closing: acct.balance` makes the new test fail with `expected 1100 to be 1400` while the other 9 tests in the file stay green — precisely the blindness the finding described (the old suite only covered ranges ending at the final transaction). The new test ends the range on 2026-08-02 with a later 08-03 transfer present, and also asserts `closing = opening + totalCredit − totalDebit` for every section, so this class of error cannot come back silently.
- Test title corrected: `'covers every account with closing pinned to live balance'` → `'…closing is the end-of-range balance (the live balance when unfiltered)'`. The assertions were already right; only the name was asserting the wrong rule.
- **GitNexus index was stale and got in the way of the required impact analysis**: `impact` could not resolve `MemberReportService` at all (the index had 2,332 symbols from an older tree). Ran `node .gitnexus/run.cjs analyze` (27.8s) → 3,783 symbols / 8,522 edges / 300 flows. FTS/BM25 search stays disabled (LadybugDB extension unavailable offline) — affects only natural-language search, not impact/context.
- Honest note on the tooling: after the re-index, `impact(generateReport, upstream)` reports **LOW / 0 direct callers / 0 processes**, but it does **not** resolve the chained `new MemberReportService(…).generateReport(…)` call — the real call site is `MemberReportScreen.tsx:86`. The blast radius was therefore established by reading the code: consumers of the value are `ReportSections.tsx:41`, `memberReportPdf.ts:111` and the summary stat at `MemberReportScreen.tsx:206` (the CSV exporter only carries it through a fixture). `detect_changes` risk **low**, 0 processes.
- The re-index rewrote the auto-generated GitNexus block in `AGENTS.md` **and** `CLAUDE.md` (one line each: the symbol/relationship/flow counts). Committed separately as a chore so the bug fix stays focused — and because `AGENTS.md` §5 is where the parallel mobile workstream is most likely to conflict.
- Same-commit bookkeeping: `BUGS.md` BUG-22 → **fixed** and moved to the top of the fixed history (severity high, next to BUG-20/BUG-24) with the approach and a Resolved line; `CHANGELOG.md` user-facing bullet. No version bump.
- Gates: typecheck PASS, lint 0 PASS, `npm test` **14 files / 135 tests pass** (was 134), build PASS.
- Third `BUGS.md` separator slip (same root cause as the earlier two: the insert helper puts the `---` before the new entry but not before the anchor). Caught by the verifier script and fixed; the verifier now reports 0 separator problems, 0 headings directly after a `---`, CRLF preserved, no BOM.

### Skill(s) Used
- code-reviewer, gitnexus (impact/context/detect_changes)

### Status
- BUG-22 closed on `fix/calculation-audit`. Nothing merged; `dev` untouched.
- Next: **BUG-21 + BUG-25** (dashboard metric chips use two formulas under one label; loan movements counted as income/expense). These are parked until the mobile workstream's M-05 lands because `src/presentation/screens/dashboard/sections.tsx` is the single genuine merge conflict between the two branches — they touch the same file's label/colour rules.
- Remaining open findings after this: BUG-21, BUG-25–BUG-30, BUG-32–BUG-37, BUG-39, BUG-40.

## Session 2026-10-17 13:35 (fix/calculation-audit — BUG-41 logged: the missing half of the BUG-24 decision)

### Changes
- Answered the question "is everything from the audit fixed?" against the register rather than from memory: **4 of the 17 audit findings are fixed** (BUG-22, BUG-23, BUG-24, BUG-31); BUG-21 and BUG-25–BUG-37 remain open. BUG-38 (harness, fixed) and BUG-39/BUG-40 (found during this work) are outside the audit's 17.
- While checking the audit's §0 "Decisions needed" list against what actually shipped, found an unbuilt commitment: the approved **Option B** for BUG-24 was *detect and report* already-damaged balances (plus the prevention half). Only prevention was built. Nothing in the app ever compares a stored `accounts.balance` against a balance recomputed from the transaction stream, so any balance poisoned *before* the fix stays wrong **and invisible** — "permanent" in the audit's words.
- **BUG-41 logged** (open, medium, report-only candidate fix; `computeBalances` already recomputes and is unit-tested, Settings → Storage health is the natural surface). Per §3.11 this was logged as its own finding rather than left as unwritten follow-up. BUG-24's Resolved line gained a scope note so the fixed entry cannot be read as claiming the whole decision.
- **Fourth `BUGS.md` incident, and the worst: my heading-anchored insertion *replaced* the `## BUG-32` heading instead of inserting before it**, orphaning BUG-32's bullets under BUG-41. Caught by reviewing the register (the id/status dump had no BUG-32) and repaired by restoring the exact original heading — verified byte-for-byte against `git show HEAD:docs/BUGS.md`. Net diff vs `HEAD` is now exactly the intended 12 additions / 1 replacement. Root cause: `edit` with the heading as the whole `oldString` **deletes** it; every previous insert had been done with a helper that re-emits the anchor. Lesson recorded: when inserting before an anchor line, the anchor must be part of `newString`.
- Verified after repair: 0 fixed-block separator problems, 0 headings directly after `---`, BOM `35,32,77` (none), CRLF intact.

### Skill(s) Used
- code-reviewer, gitnexus (impact/detect_changes earlier in the session)

### Status
- Docs-only change; no source touched, so no gate re-run was needed beyond the register verification.
- Still nothing merged. Next fix: **BUG-21 + BUG-25** (dashboard) when the mobile workstream's M-05 lands; then BUG-26…30, 32…37, 39, 40, 41.
- Open question for the user: whether BUG-41 is worth building now (it is the only open finding that concerns data that is *already* wrong, rather than behaviour going forward).

### Correction, same session (BUG-41 re-scoped after tracing the boot path)

- Before writing any code I traced the boot path, and **the premise I had just written into BUG-41 was wrong.** My earlier grep for `recalculateBalances` used `include: *.ts` and so **missed `src/main.tsx:90` and `src/presentation/screens/SetupWizard.tsx:116`** (both `.tsx`). It has callers: `main.tsx:90` runs it unconditionally on **every boot**.
- What that means: `recalculateBalances()` replays every non-deleted transaction and **silently `UPDATE`s any account whose stored balance disagrees** (`diffBalances` → `UPDATE`). So balance-level divergence is *not* invisible — it is silently **repaired, every launch**, which is closer to the Option C the user had *ruled out* than to the report-only Option B. Conversely, damage stored **inside a transaction row** (BUG-24's actual mechanism — an amount stored as `0` or NaN) is **invisible to that pass by construction**, because the replay reproduces the bad number and the two agree (`diffBalances` returns empty → no write, no report). The detector that *can* find BUG-24-class damage is a **validity scan over stored transactions**, which does not exist.
- So BUG-41 was corrected in place: retitled from "already-damaged **balances** are never detected" to "**transactions** damaged before the BUG-24 fix are never re-validated", with (a)/(b)/(c) recorded, the false sentence explicitly marked as a correction of record, and the fix split into **Scope A** (validity scan, recommended — reuses `transactionRules.ts`) and **Scope B** (make the boot replay report instead of repairing silently — a separate, more sensitive decision because `SetupWizard` and BUG-19's fix depend on that replay). BUG-24's scope note adjusted from "balances" to "records".
- Also verified while there: `computeBalances` mirrors `applyBalanceChange` **exactly** (same nine types, same source/dest branches), so the boot replay is not currently corrupting anything — it is a faithfully duplicated model, i.e. a maintenance coupling rather than a live defect.
- Lesson recorded: **grep file-extension filters are a correctness hazard in a mixed `.ts`/`.tsx` repo.** Two of the three call sites were invisible to me.

## Session 2026-10-17 13:55 (fix/calculation-audit — BUG-41 fixed, Scope A)

### Changes
- User left the two open BUG-41 questions to my judgement ("proceed"), so I built the **recommended** options: **Scope A** (a read-only validity scan over stored transactions) surfaced in **Settings → Backup & Storage → Data Integrity**. Scope B (make the boot replay *report* instead of silently repairing) was deliberately **not** built and is recorded as still open in the entry.
- New `src/core/domain/transactionIntegrity.ts` — `scanTransactions()` reports every stored row that breaks the rules the write path enforces *today*, reusing `validateTransactionFields` plus a new `validateTransactionLinks`. `IDatabaseService.findInvalidTransactions()` is implemented at the end of `SQLiteDatabaseService` using the same columns and ordering as the balance replay, and **writes nothing** (report-only, per the approved Option B). Wired through `useBackupState` (failure caught, so a broken scan cannot take the backup card down) into a presentational `IntegrityRow`.
- **Anti-drift work, per the earlier BUG-24 "one shared module" decision:** the account-link type sets and the four pairing messages were extracted from the guard into `transactionRules.ts` and both the guard and the scan now call the same functions. Without this the scan would have carried its own copy of the rules it claims to check — the exact failure mode the audit is about.
- **Two more corrections of record, both found by building the detector (the entry now carries three):**
  1. *"An edit could store amount 0/NaN"* — **false**. Every shape the `transactions` table has ever had (initial `SCHEMA`, `transactions_v2` `:309`, `transactions_v3` `:362`) declares `amount REAL NOT NULL CHECK(amount > 0)`, so SQLite refuses it on any database this app created.
  2. The durable damage class is instead a **link violation** — an expense/repayment whose source or destination was nulled or crossed: the row survives, the replay *skips a row with no account*, so the money never moved anywhere, and a replay-mismatch check agrees with the damage by construction. That is precisely why the scan had to be a rule scan, not a balance-divergence check.
  3. The audit's "**permanent**" was too strong: the balance divergence a rejected edit leaves behind (old effect reversed at `:1278`, then the write throws at `:1280`) is repaired by the next boot's replay — wrong only until the next launch.
- **Severity lowered medium → low** in the same commit, with the reasoning written into the entry: amount corruption is impossible on current schemas, so what remains is record hygiene plus the rarer link case, and the scan's value is as much insurance against a future bypass/import/synced row as it is a fix. Flagged for the user, who can overrule.
- **`impact(validateTransaction)` came back HIGH** (2 direct callers, 4 processes: `addTransaction`, `updateTransaction`, `handleAddAccount`). I warned rather than proceeded quietly, and deliberately limited the change: control flow, throw order and every message kept identical; only the duplicated type lists and message strings were swapped for shared helpers. `detect_changes` = **high** (boot + write processes in scope).
- **Verification (this is the part that matters):** 10 new pure unit tests → **145 total** (was 135); typecheck / lint / build PASS; full Playwright suite at its exact documented baseline (**30 passed / 1 failed**, the failure being BUG-39). Then, because no unit test in this repo can touch `SQLiteDatabaseService` (still no DB harness — the standing verification gap), I wrote a **throwaway spec, ran it, and deleted it** (never committed) to drive the real database end to end:
  - healthy seed → **"All 12 records check out"**
  - seed damaged three ways (nulled source account, emptied description, unparseable date) → **"3 of 12 records need attention"** with each reason listed on its own row
  - and, for the HIGH-risk refactor: clearing the amount in the edit modal still shows **"Amount must be a positive number"** and keeps the modal open — BUG-24 re-verified live, not just by reading.
- Debugging note for future e2e work: a fresh profile makes the **"What's New" overlay** swallow clicks (dismiss the `[class*="overlay"]` first), and the desktop transaction-detail **Edit control is an icon button (`title="Edit"`), not text** — the text one is the mobile sheet.

### Skill(s) Used
- code-reviewer, gitnexus (impact/detect_changes), senior-frontend, senior-backend

### Status
- BUG-41 closed (Scope A). Nothing merged; `dev` untouched.
- Audit scoreboard now: fixed = BUG-22, BUG-23, BUG-24, BUG-31, BUG-41 → **5 of 17** (plus BUG-38 outside the audit). Still open: BUG-21, BUG-25…BUG-30, BUG-32…BUG-37, BUG-39, BUG-40, and BUG-41 Scope B.
- Next: **BUG-21 + BUG-25** (dashboard) when the mobile workstream's M-05 lands; then the moderate tier (BUG-26/27/28).

## Session 2026-10-18 12:20 (fix/calculation-audit — BUG-27 fixed)

### Changes
- Session start: read `session_log.md` + `AGENTS.md §5`. State: branch at `b299432`, `dev` untouched at `552c9aa`, mobile workstream mid-batch at **M-06** → **M-05 has not landed**, so BUG-21/BUG-25 stay parked.
- The user left "what's next?" to my judgement again. **Merging into `dev` requires explicit approval (§3.12) and an automated non-response is not approval**, so the branch stays parked and I took the highest-value unblocked finding instead: **BUG-27**.
- **BUG-27 (loan stack progress and total recovered ignore settled loans) fixed.** New pure exported `stackTotals(loans)` in `src/loans/infrastructure/LoanDatabase.ts` computes `totalAmount` / `totalRecovered` / `progressPercent` over **every** loan, settled included; `_getStackForBorrower` now sources both aggregate fields from it. The active/settled split still drives the list, the counts, `isSettled` and `totalOutstanding` — and `totalOutstanding` needed no change at all, because `LoanService` only marks a loan settled once `outstanding` hits 0 and clamps `outstanding <= principal`; recovery therefore stays inside 0–100% and no clamp is needed.
- Took the audit's option (a) — *"progress/recovered reflect the whole stack"* — over (b) *"or be labelled active-only"*: relabelling would leave the same card showing an active-only percentage next to a lifetime amount, which is precisely the incoherence the finding describes. Recorded in the entry.
- **One UI follow-through**, flagged as the only visible change beyond the number itself: `LoanCard` and `LoanDetailView` dropped their `activeCount > 0` guard, so a fully settled stack now reads **100%** instead of a dash, and the card agrees with the detail bar.
- Impact analysis: `_getStackForBorrower` **LOW** (3 impacted, 0 processes) — no warning needed.
- Verification: **8 new unit tests** (153 total, was 145); **mutation-verified** by restoring the active-only scope → 5 of them fail, the first with `expected 1000 to be 2000` (the repaid loan's principal vanishing — the exact reported symptom). typecheck / lint / build PASS. Full Playwright suite at its documented baseline (**30 passed / 1 failed** = BUG-39, unchanged).
- Throwaway spec (deleted, never committed) seeded a real database with one settled loan (1,000 / 0) and one fresh one (1,000 / 1,000): the Loans screen rendered **"1 active • 1 settled • 50% repaid"** where it previously showed 0%.
- **Self-inflicted lesson, recorded because it cost a cycle:** the first version of that throwaway assertion required `getByText('0% repaid')` to match **0** elements, and it failed against perfectly correct code — because `'0% repaid'` is a **substring of `'50% repaid'`**. The fix came from dumping the actual DOM (one visible element containing "repaid"), not from guessing, after which the assertion was anchored (`/^0% repaid$/`). Rule going forward: **negative text assertions must be anchored.**
- Bookkeeping in the same commit: `BUGS.md` BUG-27 → fixed (open block 15 → 14 entries; moved to the top of the fixed history, before BUG-41; verifier reports 0 separator problems); a `CHANGELOG` `Fixed` bullet; and **`AGENTS.md §5` corrected** — it still claimed BUG-38 was open (fixed at `1ee794d` on this very branch), and the §5 audit-workstream paragraph is now current (6 of 17 fixed, `dev` untouched, MINOR bump due at merge).

### Skill(s) Used
- gitnexus (impact), code-reviewer, senior-backend, senior-frontend

### Status
- BUG-27 closed. Nothing merged; `dev` still at `552c9aa`.
- Audit scoreboard: **6 of 17** fixed (BUG-22, BUG-23, BUG-24, BUG-27, BUG-31, BUG-41), plus BUG-38 outside the audit.
- Next: **BUG-28** (Group ledger PDF exports only the current page — `GroupLedgerScreen.tsx`, no collision with the mobile files), then **BUG-26** (member profile Total Income vs Total Expenses — same folder as their `LedgerSection.tsx` work, so slightly riskier). BUG-21/BUG-25 remain blocked on M-05.
- Still awaiting a user decision on: merge-into-`dev` approval, BUG-39, the untracked `Logo_mockups/` PNG, and BUG-41 Scope B.

## Session 2026-10-18 13:05 (fix/calculation-audit — BUG-28 fixed)

### Changes
- Session start: read `session_log.md` + `AGENTS.md §5`. State: branch at `5371b7c`, `dev` untouched at `552c9aa`.
- **The mobile workstream has finished and M-05 has landed** (`b3c3337`, "zero balances render neutral, danger red only for negatives", plus `e593291` closing M-03…M-09). Their branch touched `dashboard/sections.tsx` (39 lines), `dashboard/panels.tsx` and `memberProfile/LedgerSection.tsx`. **BUG-21/BUG-25 are therefore unblocked** — no further concurrent edits to `dashboard/` — though their branch is still not merged into `dev`, so the eventual merge order decides who resolves the overlap in `sections.tsx`.
- **BUG-28 (group ledger PDF exports only the visible page) fixed.** `handleDownloadPdf` was built from `searchFilteredTxs`, which was an alias for `displayedTxs` — the `displayLimit` page slice, 10 rows by default — so anything past the first page was silently dropped and the statement's Opening Balance / Total Debit / Total Credit described just that page. It now walks `searchFilteredAll`, the full search-filtered ledger.
- **Root cause was partly the alias itself:** the name promised the full filtered set and delivered the page, which is exactly how the PDF builder came to be pointed at the view model. The alias is deleted; its two remaining consumers (`ledgerRows`' netChange, the empty-state `typeRows`) now read `displayedTxs`, which is what they actually meant.
- **Anti-drift:** the table and the PDF each had their own `running` accumulator, which is what *allowed* the two to disagree. Both now use one new pure helper, `withRunningBalances(items, deltaOf, endBalance)` in `src/presentation/utils/runningBalance.ts`; the PDF also reuses the component's `isGroupCredit`/`isGroupDebit` instead of its own private credit predicate. The on-screen table deliberately keeps its page-scoped walk — the audit verified that as internally consistent.
- **Decisions taken inside the fix (no user gate needed, recorded in the entry):** (a) export the full filtered set — the audit's own "expected" wording, the only defensible behaviour; (b) the export keeps *ignoring* the type tabs, deliberately, because the tabs themselves disagree across layouts (**BUG-42**, logged below) and adding tab support now would bake an undecided rule into a statement; (c) the statement stays chronological regardless of the on-screen sort, as before.
- Impact analysis: `GroupLedgerScreen` **LOW** (1 direct caller — the lazy route in `App.tsx`; 0 processes).
- Verification: **5 new unit tests** (158 total, was 153) — whole-ledger walk, zero-delta internal transfers, negative balances, empty input, and the slice-vs-ledger property that documents *why* the old code was wrong; **mutation-verified** — `endBalance - net` → `endBalance` fails 3 of them, the first reading `expected [1850, 1850, 1650, 1700] to deeply equal [1000, 1000, 800, 850]`. typecheck / lint / build PASS.
- Playwright: **30 passed / 1 failed** on a re-run of the two that failed first (`03-accounts` mobile modal, `15-cloud-sync` sign-out) — the first full run showed 28/3, both extra failures passed in isolation in 27s, i.e. **load-dependent flakes under 6 workers, not regressions** (worth remembering: a full-suite run on this machine can report up to 3 failures without any code change; re-run the named specs before believing them).
- **BUG-42 logged (open, low):** the group ledger's **Expense** tab selects loan rows on mobile (`expense → ['expense','lend','loan_issue']`) but not on desktop (loan types classify as `loan`), so the same tab shows different rows per layout while the other four tabs agree. Needs a product call — is lending an expense (cash out) or a loan (asset swap)? — so it is logged, not fixed, and is the reason decision (b) above exists.
- Bookkeeping in the same commit: `BUGS.md` BUG-28 → fixed (top of the fixed history, before BUG-27) + the new BUG-42 in the open block; **register order repaired** — BUG-40 (medium) had been sitting among the lows, now sorted correctly per the file's own rules; verifier reports 0 separator problems, no BOM, headings re-dumped and inspected. `CHANGELOG` `Fixed` bullet (user-facing wording).
- **Observation, not touched (needs the user's call):** `BUGS.md:431` carries a **second** `## BUG-11` heading whose body is actually BUG-12's recovery triage (no Status/Severity fields), i.e. a duplicated heading with misplaced history. Left alone — it is historical record, and fixing it is a one-line retitle ("BUG-12 (continued)") whenever the user wants it.

### Skill(s) Used
- gitnexus (impact), code-reviewer, senior-frontend

### Status
- BUG-28 closed. Nothing merged; `dev` still at `552c9aa`.
- Audit scoreboard: **7 of 17** fixed (BUG-22, BUG-23, BUG-24, BUG-27, BUG-28, BUG-31, BUG-41), plus BUG-38 outside the audit. New finding BUG-42 open.
- Next: **BUG-26** (member profile Total Income vs Total Expenses are not comparable — `memberProfile/useMemberData.ts` + `ProfileHero.tsx`), then BUG-29/BUG-30 (Recycle Bin) and BUG-32…BUG-37. **BUG-21/BUG-25 are now unblocked** (M-05 landed) but need a definition decision before they can be coded.
- Still awaiting a user decision on: merge-into-`dev` approval, BUG-39, the untracked `Logo_mockups/` PNG, BUG-41 Scope B, the mislabelled BUG-11 heading, and (new) BUG-42's lending-as-expense question.

## Session 2026-10-18 13:40 (fix/calculation-audit — BUG-26 fixed)

### Changes
- **BUG-26 (member profile "Total Income" / "Total Expenses" are not comparable) fixed.** Two separate reducers with different filters: `totalIncome` counted only `type === 'income'`; `totalExpenses` counted `expense` **plus** `loan_issue` and `lend`, and `loan_paidback` was missing from both. Anyone who lent money out and got it back looked steadily poorer — income flat, expenses up by the whole loan.
- **The fix is one definition rather than two kept in step.** The dashboard had *already* answered this question — its private `INCOME_TYPES` / `EXPENSE_TYPES` cover all eight non-transfer types symmetrically — but they lived as consts inside `useDashboardData.ts`, so the member profile wrote its own (`TagLedgerScreen` holds a third copy, `cloudDiff.ts` a fifth). New `src/core/domain/transactionCategory.ts` exports `INCOME_TX_TYPES` / `EXPENSE_TX_TYPES`, `isIncomeTx` / `isExpenseTx` and `sumIncomeExpense(txs) → { income, expense, net }`; the dashboard consumes it (values unchanged — its sets were copied verbatim) and the member hero takes both figures from one call.
- **Deliberately not decided here:** loan principal stays on both sides of the classification (whether it belongs in these totals at all is the open **BUG-25**, and that decision now lands in exactly one file); account opening balances stay `income`, per the BUG-19 convention, because excluding them is an app-wide change (dashboard month summary included) rather than a member-profile one; `transfer` is documented as neither. All three recorded in the entry so the next session does not re-litigate them.
- Impact analysis: each hook has exactly one consumer (`MemberProfile.tsx`, `Dashboard.tsx` — verified by grep, the locate-style check GitNexus returns empty for these hook symbols).
- Verification: **5 new unit tests** (163 total, was 158), including an exhaustiveness test over all nine schema types (a new type that fits neither bucket fails the suite) and the loan-cycle case; **mutation-verified** — cutting `INCOME_TX_TYPES` back to `['income']` fails 3 of them, the loan-cycle one reading `expected { income: +0, expense: 1000 } …`. typecheck / lint / build PASS.
- **Live verification (throwaway spec, deleted, never committed):** the seeded Admin member's hero now reads **Net Balance 64,000 · Total Income 1,12,000 · Total Expenses 48,000**; the old rules gave 1,07,000 / 48,000 — a 59,000 gap that did not match the 64,000 balance rendered beside it. The new pair reconciles exactly (income − expenses = the member's account balances, the seed's only transfer being internal). One locator lesson: the desktop hero is `profileHero` / `heroStats`, the mobile one `profileCard` — a locator borrowed from the mobile spec silently finds nothing on desktop, which is what the first failed run was.
- Full Playwright suite back at its documented baseline exactly: **30 passed / 1 failed** (= BUG-39), with both known flakes green this run.
- Bookkeeping in the same commit: `BUGS.md` BUG-26 → fixed (top of the fixed history, before BUG-28) with the three "not decided here" items spelled out; `CHANGELOG` `Fixed` bullet in user-facing wording; `AGENTS.md §5` audit paragraph refreshed.

### Skill(s) Used
- gitnexus (impact/scope), code-reviewer, senior-frontend

### Status
- BUG-26 closed. Nothing merged; `dev` still at `552c9aa`.
- Audit scoreboard: **8 of 17** fixed (BUG-22, BUG-23, BUG-24, BUG-26, BUG-27, BUG-28, BUG-31, BUG-41), plus BUG-38 outside the audit; BUG-42 open as a new finding.
- Next: **BUG-29 + BUG-30** (Recycle Bin — one wrong headline total, one tab/label mismatch; same file, so likely one commit), then BUG-32/BUG-33 (member ledger — `String(balance)` and the latent credit rule; same file, and now adjacent to the shared helper work), then BUG-34…BUG-37, BUG-40, and **BUG-21/BUG-25** (now unblocked, but they need a definition decision first).
- Still awaiting a user decision on: merge-into-`dev` approval, BUG-39, the untracked `Logo_mockups/` PNG, BUG-41 Scope B, the mislabelled `BUGS.md:431` heading, BUG-42's lending-as-expense question, and now whether opening balances should count as income anywhere (currently they do, app-wide).

## Session 2026-10-18 14:20 (fix/calculation-audit — BUG-29 + BUG-30 fixed, BUG-43 logged)

### Changes
- **BUG-43 logged (open, medium) — found while committing BUG-26, before touching anything else (§3.11).** `.gitignore:42` is a bare `dashboard` pattern, so it matches **any** path component named `dashboard`, not just the untracked Playwright aria-snapshot dump in the repo root it was written for: `git check-ignore -v src/presentation/screens/dashboard/newSection.tsx` resolves to it, i.e. **a new file added to the dashboard screens folder is silently ignored** — absent from `git status`, `git add -A <folder>` errors, nothing warns at commit time. Already-tracked files there are unaffected, which is why it went unnoticed; the parallel mobile workstream edits exactly that folder. Logged with the one-line fix (`/dashboard`, root-anchored) and **not applied** — it is a repo-level change awaiting the user's word. Committed alone as `3625dbf`.
- **BUG-29 (Recycle Bin headline summed incomparable quantities) fixed.** The headline added transaction `amount` + account `balance` + `other_ledgers.opening_balance` + `other_ledger_entries.(debit+credit)`, and every row prefixed its amount with `-`, so a deleted account holding 70,000 rendered as **-70,000**. Took the audit's first option (**totals per tab/kind**): the figure now measures the **active tab** and names what it measures — Transactions → "Total Amount", Accounts → "Total Balances", Ledgers → "Total Value" — while **All Items** (the one tab that mixes kinds by definition) shows how many kinds are in the bin ("Item Types"), which is the audit's second option for a heterogeneous set. The blanket `-` is gone: `amount` is `CHECK(amount > 0)` and carries no direction, and a balance is not a movement, so the sign was never derivable; rows now show a magnitude beside the kind label. Row colours were left alone (not raised by the audit). The total follows the search box as well as the tab, so it always describes what is on screen.
- **BUG-30 (other-ledger rows labelled "Account" but unreachable) fixed.** Deleted `other_ledger` / `other_entry` rows rendered under All Items as "Account" (bank icon), while the Accounts tab filtered `type === 'account'` — so two different kinds both read "Account" and the ledger kinds could be reached by no tab at all (reachable in practice: the Other Ledgers UI soft-deletes both). Took the audit's first option (**their own tab/label**): labelling and tab filtering now come from **one** map, `DELETED_KIND` in new `src/presentation/constants/recycleKinds.ts`, so a kind cannot be described as one thing and filed somewhere else; a fourth **Ledgers** tab covers both ledger kinds, and the tab counts use the same predicate as the list. Chose a separate tab over folding them into Accounts because a ledger is not an account and the row label should say what the record is.
- Verification: **5 new unit tests** (168 total, was 163) on the shared map — one fails if two kinds ever share a row label (the exact reported symptom), one fails if a tab is a dead end; **mutation-verified** — relabelling `other_ledger` as "Account" fails with `expected 3 to be 4`. typecheck / lint / build PASS.
- **Live verification (throwaway spec, deleted, never committed):** deleted the seeded DBBL account (balance 70,000) through the real UI (member profile → Edit DBBL → Delete Account → Yes, delete), then read the bin: the row showed **70,000 BDT** with `-70,000` absent; all four tabs rendered; Accounts read "Total Balances 70,000 BDT"; Ledgers read "Total Value" over "No deleted items"; All Items read "Item Types". Verified persistence by reloading.
- Full Playwright: first run 29 passed / 2 failed — the known BUG-39 plus `03-accounts` desktop dropdown; **re-ran that spec in isolation: 4 passed**, so the baseline is unchanged at **30 passed / 1 failed**. That is now three separate load-dependent flakes observed across this branch (`03-accounts` mobile modal *and* desktop dropdown, `15-cloud-sync` sign-out); re-run any named failure before believing it.
- Two self-inflicted lessons, recorded so they are not repeated: (1) a blanket PowerShell rename sweep (`-replace 'TabKey','RecycleTab'`) also renamed an unrelated local state variable, caught only by reading the grep output back — sweeping renames need a scoped edit, and this is also why `gitnexus rename` exists; (2) `Set-Content -Encoding UTF8` in Windows PowerShell 5.1 writes a **BOM**, which is how this file and `BUGS.md` were bitten before — the BOM was detected and stripped, and `write`/`edit` (which do not add one) are the right tools.
- Also recorded in BUG-29: the delete handler is fire-and-forget (`void handleDelete()`), so a reload *immediately* after the click can outrun the write — a test artifact at human speed, not a user-facing race, but the reason the first live run showed an empty bin.

### Skill(s) Used
- gitnexus (impact), code-reviewer, senior-frontend, frontend-design (tab/stat label wording)

### Status
- BUG-29 and BUG-30 closed; BUG-43 open (needs one word to fix). Nothing merged; `dev` still at `552c9aa`.
- Audit scoreboard: **10 of 17** fixed (BUG-22, BUG-23, BUG-24, BUG-26, BUG-27, BUG-28, BUG-29, BUG-30, BUG-31, BUG-41), plus BUG-38 outside the audit; BUG-42 and BUG-43 open as new findings.
- Next: **BUG-32 + BUG-33** (member ledger — `useMemberData.ts`: the latent credit rule when no account is selected, and `String(balance)` bypassing locale formatting; same file, so likely one commit), then BUG-34…BUG-37, BUG-40, and **BUG-21/BUG-25** (unblocked, but they need a definition decision first).
- Still awaiting a user decision on: merge-into-`dev` approval, BUG-39, the untracked `Logo_mockups/` PNG, BUG-41 Scope B, the mislabelled `BUGS.md:431` heading, BUG-42's lending-as-expense question, whether opening balances count as income anywhere, and **BUG-43's `.gitignore` line**.

## Session 2026-10-18 16:05 (fix/calculation-audit — BUG-32 + BUG-33 fixed, BUG-44 logged)

### Changes
- **BUG-44 logged (open, low) — found while verifying, before touching anything else (§3.11).** Full `npx playwright test` runs on this machine are unstable with no source change: consecutive full runs this session gave 29/2, 28/3 and 30/1, always from the same short list (`03-accounts` mobile modal, `03-accounts` desktop linked-accounts dropdown, `15-cloud-sync` sign-out) and always as "element not found / still loading" rather than a wrong value — and each named spec passes in isolation (`03-accounts` alone → 4 passed). Seen on this branch before the audit fixes too (the BUG-28 run hit `03-accounts` + `15-cloud-sync`), so it is not caused by them. Consequence: a red full run is not trustworthy and the documented baseline only holds when the suite effectively runs serially. Logged with three options (pin `--workers=1` and treat that as the gate / add explicit readiness waits to those three specs / keep re-running named failures); **no fix applied** — the cause is not yet diagnosed, and masking it is a decision for the user.
- **BUG-32 (member ledger sign rule wrong with no account selected) fixed.** The audit called it "always false with `selectedAccountId === null`" and therefore latent; **tracing the real rows showed the audit's description was imprecise**: the test was `tx.destAccount === selectedAccountId`, so rows whose `destAccount` is `null` (`lend`, `loan_issue` — money leaving) matched `null === null` and were booked as a **credit**, while rows with a destination were always a **debit**. Net effect in the **All Accounts** member ledger, on screen (not latent — only the *balance* column is hidden): a **repayment received** (`Rafiq Repay`, dest = a member account) appeared under **Debit**, and a **loan issued** appeared under **Credit** — money in and money out swapped — plus a transfer between two of the member's own accounts was debited the amount, drifting the running balance by twice every repaid loan. The same predicate was copy-pasted into `pdfExport.ts`, so the PDF inherited it.
- **BUG-33 (balance column unformatted) fixed** in the same row builder: `balance: String(balance)` printed `70000BDT` while the debit/credit cells on the same row already used `formatAmountParts`. Now `formatAmountParts(balance, locale, currency).amount` → `70,000BDT` (the table appends the currency label itself), so grouping and locale digits apply like everywhere else.
- **One shared rule instead of two copies (the audit's stated root cause).** New `src/presentation/utils/memberLedger.ts`: `memberLedgerDelta(tx, accountIds)` — money arriving **inside the view** is `+`, money leaving is `-`, and a row with **both legs inside the view** nets to `0`; the view is `{selectedAccountId}` when one is selected, otherwise the member's accounts. `ledgerAmountCells(delta, amountText)` turns that one delta into the debit/credit cells (delta 0 → both columns, the convention the group ledger already uses for internal transfers), so a row's columns and its balance can no longer disagree. `useMemberData.ledgerRows` now uses it plus the shared `withRunningBalances` walk (from BUG-28) instead of its own manual `bal` loop; `pdfExport.ts` uses the same two helpers and its **three duplicated row-builders collapsed into one**. The PDF's balance anchoring (opening-balance row vs `selectedAcct.balance`) is unchanged, and because `showBalance === !!selectedAccountId` the new rule reproduces the old one exactly in the view where the balance column is actually rendered — the visible change is the All Accounts debit/credit columns.
- Also removed a `as unknown as LedgerRow` cast in the row builder: `LedgerRow` has optional fields, so the cast was hiding nothing but type errors — the literal now satisfies it directly.
- Verification: **10 new unit tests** (shared with BUG-33, **178 total**, was 168) — both views, an account outside the view, the internal-transfer case, and a mixed-ledger running balance asserted through `withRunningBalances`; **mutation-verified** by restoring the old rule verbatim (`tx.destAccount === (accountIds.size === 1 ? … : null)`), which fails 4 of them with exactly the reported symptoms: `expected -300 to be +0` (internal transfer), `expected -200 to be 200` (repayment received), `expected -1500 to be 1200` (running balance). typecheck / lint / build PASS.
- **Live verification (throwaway spec, deleted, never committed):** on the seeded member's All Accounts ledger, `Rafiq Repay Travel` now sits in the **Credit** column (5,000) with a dash in Debit, `Loan to Rafiq` stays a **Debit** (20,000), and the DBBL→Cash `ATM Cash` transfer appears in **both** columns; then selecting DBBL made the balance column read **"70,000BDT"** (asserted the unformatted `70000` is absent). Note for the test toolbox: the account *card* is a `div[role=button]` that never becomes "stable" for Playwright's `click()` (hover/animation) — `dispatchEvent('click')` works, same trick the account edit button needs.
- Full Playwright after the change: 29/2 then 28/3 across two runs; re-ran `03-accounts` alone → 4 passed, so the baseline is unchanged at **30 passed / 1 failed** (BUG-39) and the rest is BUG-44. The two 03-accounts failures were "element not found" on the account card and on `Net Balance` — load timing, not balance values, so not a regression from BUG-33's formatting change (verified by reading the assertion output, not assumed).

### Skill(s) Used
- gitnexus (impact), code-reviewer, senior-frontend

### Status
- BUG-32 and BUG-33 closed; BUG-44 open (harness flakiness, no fix applied). Nothing merged; `dev` still at `552c9aa`.
- Audit scoreboard: **12 of 17** fixed (BUG-22, BUG-23, BUG-24, BUG-26, BUG-27, BUG-28, BUG-29, BUG-30, BUG-31, BUG-32, BUG-33, BUG-41), plus BUG-38 outside the audit; BUG-42, BUG-43, BUG-44 open as new findings.
- Next: **BUG-34 + BUG-35** (loan status `on_track` actually means "fully repaid"; other-ledger `recomputeBalances` rewrites `updated_at` on every entry — the second is a data-integrity/logic defect in `OtherLedgerService`), then BUG-36, BUG-37, BUG-40, and **BUG-21/BUG-25** (still needs a definition decision before coding — note the audit's sign-rule description for BUG-32 was wrong, so re-read the code before trusting BUG-21's wording).
- Still awaiting a user decision on: merge-into-`dev` approval, BUG-39, the untracked `Logo_mockups/` PNG, BUG-41 Scope B, the mislabelled `BUGS.md` second `## BUG-11` heading, BUG-42's lending-as-expense question, whether opening balances count as income anywhere, BUG-43's `.gitignore` line, and now BUG-44's flakiness approach.

## Session 2026-10-18 18:40 (fix/calculation-audit — BUG-34 + BUG-35 fixed, BUG-45 logged)

### Changes
- **BUG-45 logged (open, low) — found while tracing who consumes `LoanItem.status`, before touching BUG-34 (§3.11).** The settled/active split in `_getStackForBorrower` tests the loan **row's** `status`, while the item's own derived status is computed beside it and consumed by nothing. So a loan that is fully repaid in money terms but still flagged `active` — the exact state BUG-34's third status describes — is counted in `activeCount`, pushed into `activeLoanItems`, and keeps `stack.isSettled` false: the Loans **Active** filter lists it and the card reads "1 active" beside 0 BDT outstanding at 100% repaid. **Not reachable through the UI today** (every path that drives `outstanding` to 0 also flips the flag; `createLoan` needs a positive amount) — it is reachable from data written before those paths maintained the flag, which is why the third state exists. Logged with the definition call spelled out (does a stale flag mean the loan is finished?); **nothing changed** — deliberately not folded into BUG-34's fix, because mapping the derived state to `settled` would have labelled a row settled while the same code files it as active.
- **BUG-34 (`on_track` meant the opposite of what it sounded like) fixed.** A zero-outstanding loan whose flag is still `active` was reported as `on_track` — the name reads as "repaying on schedule", the meaning is "all the money is back". No consumer, so nothing on screen was wrong, but it was a trap for the next reader. Now `LoanItemStatus = 'active' | 'repaid' | 'settled'` with `'repaid'` replacing `'on_track'`, and the rule moved out of the row builder into one documented pure function, `loanItemStatus(loan)` in new `src/loans/domain/loanStatus.ts`, so the name and the meaning sit together. Chose the rename over deleting the field (the state is real information about pre-flag data) and over mapping it to `'settled'` (contradiction with the split — see BUG-45).
- **BUG-35 (`recomputeBalances` churned every row) fixed.** Each add/edit/delete rewrote `balance` **and** `updatedAt` for **every** row in the ledger, unchanged ones included, and with a **different timestamp format** from the rest of the module (`nowSql()` wrote `YYYY-MM-DD HH:MM:SS` into a column everything else fills with ISO `...THH:MM:SS.sssZ`). Now it calls the **same** `computeOtherRunningBalances` walk that `getEntries` uses to display balances — so the stored figure and the shown figure come from one rule — and writes a row only when the balance actually moved, with `nowIso()`. The hand-rolled inline walk and the now-unused `nowSql()` are gone. Still not user-visible (the stored balance is never displayed; the screen and the PDF recompute), which is why the audit rated it low — the loss was row churn toward the cloud-sync work.
- Verification: **9 new unit tests** (**187 total**, was 178) — 4 for the loan state (settled flag wins; money still out → active; money all back → **repaid**; the returned set never contains `on_track`) and 5 for the ledger recompute over a fake DB asserting the **number and identity** of writes (a correct ledger is left alone with 0 saves and untouched timestamps, only the stale middle row is rewritten, the rewrite carries an ISO timestamp, balances walk in **date** order not insertion order, a second run is a no-op). **Mutation-verified:** mapping the zero-outstanding case back to `'active'` fails 2 loan tests; dropping the "balance unchanged" guard fails 3 ledger tests. typecheck / lint / build PASS.
- **Live verification (throwaway spec, deleted, never committed):** drove the *real* write path against the *real* database, because the fake DB in the unit test cannot prove the app's own path — create ledger → debit 100 (`-100BDT`) → credit 300 (`200BDT`, and the first row still `-100BDT`) → edit the first entry to 50 (the **second** row is the one that had to be rewritten, now `250BDT`, with the first at `-50BDT`) → delete the second (`-50BDT`) → reload still `-50BDT`. So the guard still fixes whatever actually needs fixing, and persistence is intact.
- Test-toolbox note for future sessions: on the Other Ledgers screens the rendered labels are **uppercased by CSS**, so `getByText('Current Balance')` never matches — Playwright sees `CURRENT BALANCE`; use a case-insensitive regex. The member picker in the create-ledger modal pre-selects the first member, so it needs no interaction. The desktop ledger detail has no `heroValue` (that is the mobile-only card) — read balances from the table rows.
- Two earlier branches of this session's own scratch work were wrong and were discarded, recorded so they are not repeated: I assumed the create-ledger modal auto-navigates to the new register (it returns to the index; you must click the card), and I assumed the desktop detail showed the mobile hero card.

### Skill(s) Used
- gitnexus (impact), code-reviewer, senior-frontend

### Status
- BUG-34 and BUG-35 closed; BUG-45 open (definition call). Nothing merged; `dev` still at `552c9aa`.
- Audit scoreboard: **14 of 17** fixed (BUG-22, BUG-23, BUG-24, BUG-26, BUG-27, BUG-28, BUG-29, BUG-30, BUG-31, BUG-32, BUG-33, BUG-34, BUG-35, BUG-41), plus BUG-38 outside the audit; BUG-42, BUG-43, BUG-44, BUG-45 open as new findings.
- Remaining audit findings: **BUG-36** (unused loan-store methods, `createReceivedLoan` records a received loan as given — delete or fix), **BUG-37** (`getFamilySummary` mislabels account types; unused, public port), **BUG-40** (repayment edit path clamps; needs the allocation decision), **BUG-21 + BUG-25** (dashboard formulas / loan movements as income-expense; needs a definition decision first). BUG-36 and BUG-37 are unused-code findings, so their fix is a delete-vs-fix call.
- Still awaiting a user decision on: merge-into-`dev` approval, BUG-39, the untracked `Logo_mockups/` PNG, BUG-41 Scope B, the mislabelled `BUGS.md` second `## BUG-11` heading, BUG-42's lending-as-expense question, whether opening balances count as income anywhere, BUG-43's `.gitignore` line, BUG-44's flakiness approach, and now BUG-45's stale-flag definition.

## Session 2026-10-18 20:10 (fix/calculation-audit — BUG-36 + BUG-37 fixed by deletion)

### Changes
- **Decision context:** this pair (unused-code findings) needed a delete-vs-repair call, so it was put to the user as a question; no answer came back with the instruction to judge from the task objective and context. Took the **delete** option for both, reasoning that in each case the dead code is a *duplicate* of a flow the app already runs correctly — keeping a second implementation of the same operation is the pattern that produced BUG-26 (two income/expense rules) and BUG-28 (two running-balance walks), both of which had to be collapsed to one. Both deletions are reversible from git history.
- **BUG-36 fixed (deleted).** Removed `createGivenLoan`, `createReceivedLoan` and `recordPayback` from `src/loans/presentation/stores/useLoanStore.ts` — interface entries and implementations. None had a caller; `createReceivedLoan` was a line-for-line copy of `createGivenLoan` (same `lenderAccountId: params.sourceAccount` / `borrowerAccountId: params.destAccount` mapping, including the `throw err`), so wiring it up would have recorded a loan you *received* as one you *gave out*. The flows stay available through the paths the UI already uses: `createLoan` (TransactionFormModal/`useSubmit`) and `recordRepayment` — which `recordPayback` merely delegated to.
- **BUG-37 fixed (deleted).** Removed `getFamilySummary` from the port (`IDatabaseService`), its implementation in `SQLiteDatabaseService`, the `FamilySummary` interface, the `core/ports` re-export, and the port inventory line in `docs/TAD.md`. It summed `mobile_wallet` + `business` balances into a field called `activeLoans`, ignored the real loan stacks, and excluded `counterparty` accounts from buckets that `totalAssets`/`netWorth` were built from — a right-looking shape around a wrong answer, with no caller. A *correct* family summary would have to be rebuilt on the dashboard's metrics, which the dashboard already exposes; repairing it would have created exactly the second-source-of-truth pattern above.
- Evidence: `impact` on each removed symbol returned **0 upstream callers** (getFamilySummary: one implementer, no callers); repo-wide grep found references only in the audit, this register and the TAD line, which was updated. typecheck / lint / build PASS, **187 unit tests** pass, and live specs pass: `05-other-ledgers`, `06-loans`, `14-loan-rename`, `01-dashboard` (6 passed).
- No new unit tests, deliberately: the fix removes code, so the coverage question is whether the *remaining* paths still work — which is what the suite and the four live specs check. Nothing user-visible changed, so the CHANGELOG entry is marked developer-facing.

### Skill(s) Used
- gitnexus (impact ×3), code-reviewer

### Status
- BUG-36 and BUG-37 closed by removal; audit scoreboard **16 of 17** fixed.
- **One audit finding left: BUG-40** (a repayment *edited upward* silently clamps the loan instead of refusing — BUG-23's second door), which needs the allocation-model decision; then the pair that needs a definition call: **BUG-21 + BUG-25** (dashboard chips computed two ways under one "vs last month" label; loan movements counted as both income and expense).
- Branch is 15 commits ahead of `dev` (which is still untouched at `552c9aa`); nothing merged. Open findings beyond the audit: BUG-39, BUG-42, BUG-43, BUG-44, BUG-45.


## Session 2026-10-18 21:40 (fix/calculation-audit — BUG-40 fixed, BUG-46 found + fixed, BUG-47 logged)

### Changes
- **BUG-40 fixed (repayment edits are refused, not clamped) — the last audit finding.** The edit path still held BUG-23's silent clamp: `loan.outstanding -= diff` then `Math.max(0, …)`, so raising a repayment past what the loan still owed raised the ledger while the loan record stopped at zero. Fixed on a shared pure rule, mirroring BUG-23: `src/loans/domain/repaymentEdit.ts` `repaymentEditViolation(loan, oldAmount, newAmount)` returns the numbers (direction, room, ceiling/floor) or `null`, `RepaymentEditError` carries them, `LoanService.assertRepaymentEditAllowed` throws, and `TransactionEditModal.handleSave` calls it **before** `updateTransaction` — checking afterwards would leave the edited amount on the ledger with the loan clamped, which is the bug itself. `syncLoanTransaction` refuses the same way instead of clamping, so the rule cannot be bypassed. The modal formats with the user's locale/currency and stays open with the message. The mirror case is covered too: cutting a repayment below what has actually been repaid would push `outstanding` above `principal` (every "recovered" figure goes negative) and is refused.
- **BUG-46 found + fixed (a loan write could be dropped on reload).** Found *during* the BUG-40 live check: the accepted edit closed the modal, the in-memory loan row read `outstanding 0 / settled`, and after a reload it read `15,000 / active` again. Diagnosed by instrumenting the flush lifecycle (temporary logs, all removed): the flush that followed the loan write logged and then never reached the storage adapter, and a full-content fingerprint of the exported bytes after the write was **byte-identical** to the one before it, which is exactly what the reload read back.
  - Two root causes, one symptom. (1) `SQLiteDatabaseService._scheduleFlush` set `flushScheduled = true` and **nothing ever cleared it** — after the first scheduled write of a page load every later `markDirty()` was a silent no-op, so the dirty flag stopped meaning "will be written". (2) `LoanDatabase` writes straight into the raw sql.js database from `getSqlJsDb()` and never announced itself, so even a working scheduler would not know a loan write had happened.
  - Fix: the scheduled flag is cleared as the flush **starts** (a change landing mid-flush now schedules a follow-up instead of being dropped), and `LoanDatabase` takes an `onWrite` callback that `LoanService` wires to a now-public `markDirty()`. `getSqlJsDb()` has exactly one consumer (`LoanService`), so that closes the whole raw-write surface. Rejected alternatives: routing loan SQL through `IDatabaseService` (a large refactor of the module Phase 7 deliberately gave its own SQL) and always flushing on `pagehide` (hides the lie; during teardown the write lock is not granted, which is why the two reload flushes logged and wrote nothing).
  - This also explains the long-standing oddity that loan state *sometimes* persisted: `createLoan`/`recordRepayment` write the loan rows **before** their `saveTransaction()` call, so that transaction's own flush carried them out; the edit path writes the transaction first and the loan second, and `settleLoan` writes no transaction at all — both lost the loan side.
- **BUG-47 logged (open, medium).** `recordRepayment` stamps **no** `loanRef` on the repayment transaction (unlike `createLoan`, which sets `loanRef = loan.id`), because one repayment can pay across several of the borrower's loans (oldest first, with spillover) and a transaction stores a single optional ref. Consequence: a repayment created by the app has no link, so editing its amount updates the ledger and leaves the loan untouched — a silent no-op, and it means BUG-40's guard is reachable today only from legacy rows. Logged with three options and a recommendation: (a) persist the computed split as `metadata.allocations: [{ loanId, amount }]` — the `metadata` column already exists, so no migration, and both directions of an edit become exact; (b) write `loanRef` only when the repayment fits inside one loan (half a fix); (c) leave the loan alone and say so in the UI. **Needs a user decision** — leaning (a).
- Evidence: 13 new unit tests for BUG-40 (7 pure-rule incl. both boundaries and a settled loan; 6 service incl. over-raise/over-cut refused with **nothing written**, an absorbed raise, a raise that settles the loan, and lending edits still moving principal + outstanding together) and 6 new for BUG-46 (3 coalescing: one write per burst, a later change always writes, repeated writes keep flushing; 3 announcement: every write announced, still writes without an owner, `LoanService` wires it). **Both mutation-verified** (restoring the clamp fails 4 BUG-40 tests; disabling the cut limit fails 1; restoring the sticky flag fails 2 coalescing tests; dropping the announcement fails 2 wiring tests). Live — throwaway Playwright spec driving the real modal against a seeded legacy-shaped repayment (deleted, never committed): raising 5,000 → 25,000 refused with "Only 15,000 BDT is still owed on this loan — the repayment can be raised to at most 20,000 BDT.", modal stayed open, reopening showed the untouched 5,000; raising to exactly 20,000 accepted **and the settled state survived a reload**; lowering back to 5,000 accepted and reactivated the loan. typecheck / lint (`--max-warnings 0`) / build PASS; **206 unit tests** (was 187).
- Booked in the same commit: `docs/BUGS.md` (BUG-40 and BUG-46 moved to the fixed block with corrected root causes; BUG-47 stays in the open medium group), `CHANGELOG.md` `Fixed` (two user-facing entries), this log, `AGENTS.md` §5 (all 17 fixed, open list now BUG-47/BUG-39/BUG-42/BUG-43/BUG-44/BUG-45 + BUG-21/BUG-25).

### Skill(s) Used
- gitnexus (impact on `recomputeBalances`/`validateTransaction`), code-reviewer

### Status
- **15 of the 17 audit findings are fixed** — BUG-40 closed (the last one worked), and BUG-46 (new, high) closed alongside it. The two audit findings still open are **BUG-21 + BUG-25** (the dashboard definition pair — chips computed two ways under one "vs last month" label, and loan movements counted as both income and expense), which need one agreed formula before any code changes. BUG-47 logged as the deliberate follow-on decision.
- Branch `fix/calculation-audit` is 16 commits ahead of `dev` (`dev` still untouched at `552c9aa`); **nothing merged**. Contains a `feat:` commit, so a **MINOR bump to 1.18.0** is still owed at merge (intentionally not prepped here).
- Still awaiting a user decision on: merge-into-`dev` approval, **BUG-47's allocation model**, BUG-39 (one-line e2e fix), BUG-42, BUG-43 (`.gitignore` `/dashboard`), BUG-44 (flakiness approach), BUG-45 (stale-flag definition), BUG-41 Scope B, BUG-21 + BUG-25 (dashboard definition call), the untracked `Logo_mockups/` PNG, the mislabelled second `## BUG-11` heading, and whether opening balances count as income app-wide.
- Note for the next session: an async digest inside the storage init path (`readMain`) changes the init flow and made the app fall back to localStorage with an empty database — instrumentation there must stay synchronous.

## Session 2026-10-18 23:05 (fix/calculation-audit — BUG-47 fixed: repayments record their split)

### Changes
- **BUG-47 fixed (the split a repayment applies is now recorded, and an edit reverses it).** The decision the register asked for was (a) — persist the split on the transaction itself — and the standing instruction was to judge and continue when no answer comes back, so that is what was built. No schema migration: it rides in the existing `metadata` column.
  - **New `src/loans/domain/repaymentAllocations.ts`** (pure): `LoanAllocation`, `readAllocations` (ignores anything malformed — the column is free-form JSON), `recordAllocations` (keeps every other metadata key; clears the field when empty), `totalAllocated`.
  - **`recordRepayment` records the split in the order it applied it**, and when one loan absorbed the whole payment it also stamps `loanRef` the way `createLoan` does — so the detail view and `deleteLoan` keep working for the common case. A split across several loans has no single loan to point at, so it carries only the split.
  - **`reapplyRepayment`** (new private): gives every recorded loan back precisely what this repayment took — an exact reversal, which is why a cut can always be honoured — then walks the new amount over the **same loans in the same order**, so a smaller repayment pays the same loans first instead of rearranging them. A raise past what the split held continues with the borrower's remaining loans, oldest-first, exactly as `recordRepayment` allocates. Loans that have since been deleted are skipped without losing the rest; only rows whose figures actually move are written, timestamped like every other write (BUG-35).
  - **`assertRepaymentEditAllowed` now judges both shapes**: a recorded split is limited by what the borrower's loans still owe between them (so the ceiling is `old + Σ outstanding`, message scoped "across these loans"), while a bare legacy `loanRef` keeps BUG-40's conservative single-loan rule untouched. `RepaymentEditError` and the violation carry an optional `scope: 'loan' | 'loans'` that changes only the wording.
  - **`TransactionEditModal`** reads the split (`readAllocations(transaction.metadata)`) and treats a repayment as linked when it has *either* a `loanRef` or a recorded split — for the pre-check before the write and the sync after it.
- Evidence: **11 new unit tests** — reading/recording a split (order preserved, malformed entries ignored, other keys kept), recording from `recordRepayment` (spillover → split and no single reference; single loan → both), and the edit path (a cut revives the settled loan and re-pays in the recorded order; a raise re-applies over the same loans; an unchanged amount writes nothing; a since-deleted loan is skipped; the ceiling refused with `scope: 'loans'` and its boundary allowed; the sync refuses too, without persisting the reversal). **Mutation-verified twice**: ignoring the recorded split in the sync fails 4 tests; not recording it in `recordRepayment` fails 2. Typecheck / lint (`--max-warnings 0`) pass; **217 unit tests** (was 206). Existing loan/ledger specs re-run: `05-other-ledgers`, `06-loans`, `14-loan-rename` → 4 passed.
- **Honest gap, logged in the entry rather than glossed:** the edit flow through the *live* UI (wizard repayment → edit → loans move) has **not** been run for BUG-47 — the wiring is typechecked and unit-covered, but that is the one verification outstanding. `deleteLoan` also still removes only transactions carrying `loanRef`, so deleting a loan that a *split* repayment partly paid leaves that share allocated to it; reversing one of several loans is a design call, recorded in the fixed entry.
- Booked in the same commit: `docs/BUGS.md` (BUG-47 moved to the fixed block with the corrected root cause, the fix, the evidence and the known limitation), `CHANGELOG.md` `Fixed` (user-facing), this log, `AGENTS.md` §5.

### Skill(s) Used
- gitnexus (grepping the `loanRef` surface before changing it), code-reviewer

### Status
- **15 of the 17 audit findings are fixed** (BUG-47 closed since the last entry; BUG-40 and BUG-46 in the previous one). Still open from the audit: **BUG-21 + BUG-25** — the dashboard definition pair (chips computed two ways under one "vs last month" label; loan movements counted as both income and expense), which need one agreed formula before coding. The recommended definitions were put to the user with the question tool and came back unanswered, with the standing "judge and continue" instruction — so they are the next session's first task, and the recommendation is recorded in the register (`AGENTS.md` §5).
- Branch `fix/calculation-audit` is 20 commits ahead of `dev`; **nothing merged**; `dev` still at `552c9aa`. A MINOR bump to 1.18.0 is still owed at merge.
- Open findings beyond the audit: BUG-39, BUG-42, BUG-43, BUG-44, BUG-45 (+ BUG-41 Scope B). Untracked `Logo_mockups/` still present.

## Session 2026-10-30 (fix/calculation-audit — BUG-21 fixed, BUG-25 closed by decision — audit complete)

### Changes
- **BUG-21 fixed (the dashboard chips now share one definition).** Agreed definition, as put to the user: each chip compares the metric with **its own value at the end of last month** — current value minus the movement of *its own* accounts (and, for the loans chip, of the loan stock: `lend` in, `repay` out). This replaces two formulas that used to coexist under one "vs last month" label: assets/cash were shifted by this month's *family-wide* net, banks/loans by last month's, so an expense paid from a bank moved the Cash-in-Hand baseline it never touched, and a loan stock was compared against an income/expense net.
  - **New `src/core/domain/balanceEffect.ts`** — the one per-transaction sign rule (`balanceEffects`, `loanStockDelta`, `LOAN_TX_TYPES`). `computeBalances` (the boot reconciliation) now delegates to it instead of keeping its own copy, so the dashboard trends and the balance replay cannot drift apart. `impact` on `computeBalances`: **LOW**, one direct caller (`recalculateBalances`).
  - **New `src/presentation/screens/dashboard/metricTrend.ts`** — `metricTrend(current, movement)` returns `{ base, delta, percent }`, with `percent: null` when a percentage of the baseline would be unreadable (base ≤ 0); `accountMovement` and `loanMovement` sum the period's movement per metric.
  - **`useDashboardData`** computes the four trends from this month's transactions per metric; the dead `prevAssets/prevCash/prevBanks/prevLoans` exports and the old change numbers are gone (nothing consumed them except the chips).
  - **`sections.tsx`** — the four duplicated trend spans became one `TrendLine` component: `x.x% vs last month`, or the change in currency when no percentage is meaningful. `Dashboard.tsx` passes the four trend objects.
- **BUG-25 closed by product decision (wontfix), no code change.** The user's call: keeping loan movements counted as income/expense is good for now. Recorded in `docs/BUGS.md` as `wontfix (product decision, 2026-10-30)` and in the `transactionCategory.ts` header, which remains the single place a future change lands. Noted there too: BUG-21 being fixed independently means these totals now feed only the Month Summary panel and plain income/expense sums — not the metric chips.
- Evidence: **10 new unit tests** (trend arithmetic incl. the base ≤ 0 currency fallback; `accountMovement` for income, expense, transfer, lend, repay, unattributable types and accounts outside the set; `loanMovement`; and the regression itself — a 5,000 expense from the bank leaves Cash-in-Hand's base at 10,000 with a zero delta while the bank's base moves 25,000 → −5,000). **Mutation-verified**: dropping the account-set filter fails 3 tests including that regression. Live (throwaway spec, deleted): the seeded dashboard reads `Cash in Hand −6,000 BDT | 0 BDT vs last month`, `Total in Banks 70,000 BDT | 0.0% vs last month`, `Active Loans 0 BDT | 0 BDT vs last month`, `Total Assets 64,000 BDT | 0.0% vs last month` — no NaN/undefined, and the negative-cash card correctly took the currency fallback. Typecheck / lint (`--max-warnings 0`) / `npm run build` pass; **227 unit tests** (was 217).
- **BUG-43 fixed (one line, folded in because it blocked this commit).** The bare `dashboard` pattern in `.gitignore:42` matched *any* path component named `dashboard`, so the two new files this session added — `src/presentation/screens/dashboard/metricTrend.ts` and `__tests__/metricTrend.test.ts` — were silently invisible to `git status`; tracked files were unaffected, which is what kept it quiet. Anchored it as `/dashboard`: the root debug artifact stays ignored (`git check-ignore -v dashboard` still reports `.gitignore:42:/dashboard`) and the source folder is no longer matched. The register had this recorded as a pending one-line fix; it was applied here rather than committing with `git add -f`, which would have left the trap armed for the next new file.
- Harness note: the e2e `auth.setup` keeps failing with `page.goto: Timeout 8000ms` on a cold dev server; warming `npm run dev` first and re-running fixes it (the suite then passes in seconds). Same as the earlier note, worth remembering rather than re-diagnosing.

### Skill(s) Used
- gitnexus (`impact` on `computeBalances` — LOW risk, 1 direct caller; `useDashboardData` is not in the index and was checked by grep: one consumer), code-reviewer

### Status
- **The audit is complete**: 16 of the 17 findings fixed (BUG-21 was the last), and BUG-25 closed by an explicit product decision. Follow-ons fixed along the way: BUG-40, BUG-46, BUG-47.
- Branch `fix/calculation-audit` is ahead of `dev` (`git rev-list --count dev..HEAD`); **nothing merged**; `dev` still at `552c9aa`. Still owed at merge: **MINOR bump to 1.18.0** (four files per `docs/VERSIONING.md`), deliberately not prepped here.
- Open findings left in the register (all outside the audit, each awaiting a user call): **BUG-39** (one-line e2e fix), **BUG-42** (group ledger Expense tab, mobile vs desktop), **BUG-43** (`.gitignore` `/dashboard`, one-line fix not applied), **BUG-44** (Playwright flakiness approach), **BUG-45** (stale loan flag definition), plus **BUG-41 Scope B**.
- Untracked `Logo_mockups/` PNG still present.

## Session 2026-10-30 (release v1.17.3 to master; new `beta_v2.0` branch carries the audit as v1.18.0)

### Changes
- **`dev → master`, released as v1.17.3 (`d4936f6`).** Before merging I verified the risk instead of guessing: `master`'s tree was *exactly* the merge-base's tree (its 6 "extra" commits are all `Merge dev: …` release merges with no content of their own), and `git merge-tree --write-tree master dev` produced dev's tree hash unchanged — so the merge could not conflict and could not resurrect anything. `git diff master dev` was 8 files / +836−2, of which exactly **one** source file: `SetupWizard.tsx` (the BUG-19 opening-balance fix); the rest docs + one e2e spec.
  - Bump: PATCH, per `docs/VERSIONING.md` §2 rule 3 (dev had one unreleased `fix:` and no `feat:`). Applied in one commit (`16b5306`) across the three release files — `package.json`, `whatsNew.ts` (5 plain-language bullets), `CHANGELOG.md` ([Unreleased] → `## [1.17.3] - 2026-10-30`, fresh empty [Unreleased] left on top, matching how `7df2daa` did 1.17.2). Note `dev`'s [Unreleased] also held the sync fixes (BUG-16/17/18, header cloud button) that had been merged to master but never given a release heading — they ship in 1.17.3 now, which is honest because no heading ever claimed them.
- **Created `beta_v2.0` from `master`**, then merged `fix/calculation-audit` into it (`0bc6baa`, parents `d4936f6` + `5a4904c`). No conflicts — the audit branch's base is `dev@552c9aa`, and `master` (via dev) had only added the 1.17.3 bump on top of it.
- **Caught a silent trap in that merge:** git merged `CHANGELOG.md` cleanly but *semantically wrong* — the audit's 21 entries landed under `## [1.17.3]`, i.e. already-shipped work would have been re-announced in the 1.17.3 notes. Rebuilt the top of the file deterministically from both sides (`git show d4936f6:CHANGELOG.md` + `git show fix/calculation-audit:CHANGELOG.md`): audit body became `## [1.18.0] - 2026-10-30` (1 Added + 20 Fixed), the shipped 1.17.3 section was kept verbatim (1 Added + 4 Fixed), and the five dev items that the audit branch had inherited were dropped from the 1.18.0 block by exact-line match. Amended into the merge commit so the merge is correct on its own.
- **Bumped to 1.18.0 (`73fa27f`)** — MINOR, per §2 rule 2 (the audit carries `feat:` commits). Only `package.json` + `whatsNew.ts` needed changes because the CHANGELOG already carried the 1.18.0 section. `beta_v2.0` pushed with `-u`.
- Gates on `beta_v2.0`: typecheck clean, lint `--max-warnings 0` clean, **227 unit tests pass** (this branch has the BUG-38 vitest fix, so `npm test` exits 0 — on `dev` the same command still reports the 21 e2e-suite failures, which is BUG-38 and expected there), `npm run build` clean.
- Docs: `AGENTS.md` §5 now carries a **branch map** (`master` `d4936f6` = v1.17.3 release line; `dev` `16b5306` = also 1.17.3, and it did **not** receive the audit merge; `beta_v2.0` `73fa27f` = v1.18.0 with the audit; `fix/calculation-audit` kept at `5a4904c`), and the audit paragraph's "not merged / needs a bump" text was replaced with the released state. Phase 19's stale "`master` stays stable at v1.16.1" was corrected.

### Skill(s) Used
- gitnexus (merge-risk verification by tree comparison rather than assumption), code-reviewer

### Status
- Branch state: **`master` = v1.17.3 (`d4936f6`), `dev` = v1.17.3 (`16b5306`), `beta_v2.0` = v1.18.0 (`73fa27f`) — all three pushed.** `beta_v2.0` is where audit/2.0 work continues.
- Still open in the register (unchanged, each awaits a user call): **BUG-39** (one-line `e2e/search.smoke.spec.ts:13` fix), **BUG-42** (group ledger Expense tab, mobile vs desktop), **BUG-44** (Playwright parallel-load flakiness), **BUG-45** (stale `active` loan flag definition), plus **BUG-41 Scope B**.
- Note for next session: `dev` and `master` do not contain the audit fixes. Any 2.0 work that must reach users goes through `beta_v2.0`; if the audit should also land on `dev`, that is a separate merge the user has not asked for.
- Untracked `Logo_mockups/` PNG still present.

## Session 2026-10-30 (v1.18.1 on `beta_v2.0` — last four open bugs closed)

### Changes
- **BUG-42 — group ledger "Expense" tab differed between phone and desktop (fixed).** Both layouts offered the same five tabs but answered with their own private type→tab map: `lend`/`loan_issue` sat under **Expense** on mobile and under **Loan** on desktop. Fix follows the BUG-25 product call (lending counts as an expense), so the desktop was brought to the phone, and there is now **one** answer: new `src/presentation/constants/ledgerTabs.ts` (`matchesLedgerTab`) built on the existing `INCOME_TX_TYPES`/`EXPENSE_TX_TYPES`/`LOAN_TX_TYPES`, consumed by the phone list, the desktop table **and** the PDF row set (`GroupLedgerScreen.tsx`, 4 call sites → 1 rule). Desktop now filters on transaction type *before* mapping rows, so the running-balance column is still computed over the whole ledger.
- **BUG-45 — a fully repaid loan with a stale flag still counted as "active" (fixed).** `_getStackForBorrower` split on the row's raw `status` while the derived `loanItemStatus` was computed beside it and used by nothing; a third copy of the same question lived in the dashboard panel's Settled/Partial badge. One definition now: `loanStatus.ts` gained `isLoanRunning` / `splitStack` / `stackIsSettled` ("nothing left to pay wins; the flag may describe a loan but never outvote its money"), used for `activeCount`, `settledCount`, `totalOutstanding`, `loans` order and `isSettled`, and the panel badge reads `stack.isSettled` instead of re-deriving it.
- **BUG-39 — stale `e2e/search.smoke.spec.ts` (fixed).** The case asserted a dashboard `Search...` input the header global search replaced, so the suite was permanently 30/1. Rewritten to assert the current UI and to make the same point properly: typing in the header search opens the results listbox and finds a description (`Groceries`) beyond the dashboard's recent slice.
- **BUG-44 — flaky full Playwright runs (gate fixed).** User-approved option (a): `playwright.config.ts` now runs `fullyParallel: false` / `workers: 1`, documented in-file with the symptom history and the still-open root-cause candidates. Option (b) (explicit data-loaded readiness waits) remains the follow-up once the cause is known.
- **BUG-41 Scope B — declined** (recorded in `docs/BUGS.md`): it reports nothing the Data Integrity scan does not, and it edits boot code the setup wizard depends on (the BUG-19 area).
- **Verification.** New tests: `ledgerTabs.test.ts` (5) + 3 stack-split tests in `loanStatus.test.ts` → **235 unit tests** (was 227). Both logic fixes were **mutation-verified** (reverting the Expense branch fails the lending test; restoring `status === 'active'` fails all 3 split tests). Gates: typecheck, lint `--max-warnings 0`, 235 tests, build — all clean. **Full Playwright suite: 31 passed / 0 failed in ~1.9 min**, the first genuinely green baseline (dev server warmed first; cold start still times out `auth.setup`).
- **Release:** PATCH → **1.18.1**, per `docs/VERSIONING.md` §2 rule 3 (fixes only). Three files in one commit: `package.json`, `whatsNew.ts` (2 plain-language bullets), `CHANGELOG.md` (`[1.18.1] - 2026-10-30`, one Fixed bullet per fix, including the harness line).
- **Register is now empty.** `docs/BUGS.md` open section removed (all four moved to fixed with Root Cause / Fix Approach / Resolved evidence); scan confirms **0 open, 43 fixed, 2 wontfix (BUG-25, BUG-41 Scope B)**.

### Skill(s) Used
- gitnexus (impact on `_getStackForBorrower` → LOW, 3 upstream, 0 processes; the other symbols are not in the index, call sites verified by grep), code-reviewer, senior-frontend

### Status
- `beta_v2.0` = **v1.18.1**, pushed. `master`/`dev` remain at v1.17.3 and do **not** contain the audit; nothing was merged to either.
- **No open bugs.** The calculation-logic audit is closed end to end: 16 of 17 findings fixed, BUG-25 closed by product decision, plus follow-ons BUG-40/46/47, and BUG-39/42/44/45 now fixed.
- Next work: **Other Ledgers V2** (dual-post toggle, `docs/plans/OTHER_LEDGERS_FUTURE_V2.md` T-119..T-123) when the user says "next update"; the Google Drive sync line still lives on `google_signin_backup`.
- Untracked `Logo_mockups/` PNG still present.
## Session 2026-10-17 12:30

### Changes
- Branch `feature/mobile-refinements` created off `dev` @ `552c9aa` in worktree `...\opencode\worktree\949b9e\mobile-refinements` (session moved here; main checkout untouched for parallel calc-audit session).
- Worktree toolchain stood up: npm install, typecheck PASS, vitest 113/113, build PASS. Dev server runs on :3100 (worktree copy).
- **M-01 complete** (`0e6987f`): Other Ledgers index mobile head restructured — search full-width row 1, row 2 = count left + CTAs right; `+ Entry` hidden when zero ledgers; composed centered empty state ("No ledgers yet" + single `+ New Ledger` CTA). CSS-module only + JSX restructure in `OtherLedgersIndex.tsx`; desktop visual order preserved via `order: -1` on count.
- Verified via project Playwright runner (scratch spec, deleted after): empty-state geometry (count below search, left-aligned, no horizontal overflow) + populated row-2 geometry, screenshots checked at 390x844.
- Gates: typecheck / eslint --max-warnings 0 / vitest 113 / vite build all PASS. detect_changes (moneyflows vs dev): 0 changed symbols, 0 affected processes, risk low. §17 checklist pass. Stale lockfile version-string noise from npm install reverted.
- Plan doc: M-01 marked **done**.

### Skill(s) Used
- senior-frontend (screen/CSS work); Playwright project-runner pattern for verification.

### Status
- M-01 done. Next: **M-02** (Other Ledger detail header title in App.tsx routeTitles / Header) per execution order, then M-04+M-06+M-07 (detail screen touch zone), M-03, M-05, M-08, M-09.

## Session 2026-10-17 13:05

### Changes
- **M-02 complete** (`1823e84`): detail routes (member/other-ledger/group/tag/loan + member report) now show the SUBJECT NAME in the mobile header instead of an empty center. Root cause: `.breadcrumb { display: none }` in the 768px media query + Header rendering the hidden breadcrumb div when a breadcrumb exists (only mobile branch). Fix: mobile branch always renders the title span fed from the breadcrumb (last crumb, or second-to-last for depth-3 member-report routes); ellipsis truncation added (.title nowrap/ellipsis + .left min-width 0); desktop breadcrumb unchanged.
- Verified via scratch Playwright spec (deleted after): ledger detail + member detail titles, 50-char name ellipsizes without page overflow, desktop breadcrumb intact. All 5 pass at 390x844.
- Gates: typecheck / eslint --max-warnings 0 / vitest 113 / build PASS. detect_changes: 1 touched symbol (Header, expected), 0 affected processes, risk low. Plan doc: M-02 done.
- Note discovered while testing: CreateLedgerModal name validation = 3-50 chars (surfaced when a 67-char test name was rejected).

### Skill(s) Used
- senior-frontend (Header JSX/CSS), Playwright project-runner for verification.

### Status
- M-01, M-02 done. Next: **M-04 + M-06 + M-07** (Other Ledger detail orphaned buttons & trash touch targets & modal inline styles) per execution order, then M-03, M-05, M-08, M-09.

## Session 2026-10-17 13:55

### Changes
- **M-02 done** (`1823e84`): mobile header shows SUBJECT NAME on all detail routes (last breadcrumb crumb; second-to-last for the depth-3 member-report route). Root cause was `.breadcrumb { display:none }` on mobile while the JSX rendered the hidden breadcrumb div. Long names ellipsize; desktop breadcrumb untouched. Verified by 5-pass scratch spec (ledger/member titles, 50-char ellipsis, desktop breadcrumb intact).
- **M-04 + M-06 done** (`1badf7a`): OtherLedgerDetail mobile — orphaned floating buttons replaced by an anchored action bar between the hero card and the list (New Entry pill + rename + delete, right-aligned); delete-confirm sheet + mobile toolbar switched from inline styles to CSS module classes. **M-06**: icon buttons now 44x44; rename was previously hover-revealed (`opacity:0` = unreachable on touch) — now always visible on mobile. Composed empty state: icon + "No entries yet" + hint + primary "Add First Entry" CTA. Sentinel divs inline-style free.
- **M-07 done** (`dd3bb38`): new shared `OtherLedgerModals.module.css` for Create/Rename/AddEntry modals — all inline `style={{}}` removed (~12 per modal); labels now use `txStyles.fieldLabel` uppercase casing ("Ledger Name", "Opening Balance", "Description", "Amount" — Amount/Description newly labeled); placeholders carry guidance, not ranges ("e.g. House Rent", "What was this for?", "0.00"); validation ranges still live in error surface; sheet footer + delete-confirm buttons token-classed, `#fff` literal replaced by `--color-text-on-primary`. Verified by scratch spec: create + add-entry flows work end-to-end with the new classes.
- Gates each ticket: typecheck / scoped eslint --max-warnings 0 / vitest 113 / build PASS; detect_changes vs dev: low, no affected processes; §17 checked.

### Skill(s) Used
- senior-frontend; ui-ux conventions (tokens/labels); Playwright scratch-spec verification.

### Status
- M-01, M-02, M-04, M-06, M-07 done. Next: **M-03** (emoji-icon sweep across wizard/dashboard/ledger empty states, header bell) then **M-05** (zero values not danger red), **M-08** (wizard progress), **M-09** (verify-only LedgerSection badge).

### Session 2026-10-17 15:00 (M-03/M-05/M-08/M-09 - closes Phase A)

### Changes
- **M-03 done** (`6a0a162`): ALL emoji UI icons replaced with the lucide-react set (same 1.8-stroke style as BottomNav). Scope: SetupWizard hero/feature icons, dashboard panel empty states (Coins/ClipboardList/CreditCard/Eye), loans + members + recycle screens (SearchX/HandCoins/TrashIcon/RefreshCw/AlertTriangle via new `presentation/components/StatusIcons.tsx`), header bell (BellIcon), error screens, main.tsx bootstrap fail screen, wizard low-balance warning. `TX_TYPE_ICON` emoji map deleted (sheet title now plain "Transaction Details"). Dashboard MonthSummary inline colors -> `.statTeal/.statCoral` classes; `+ Net` arrow -> ArrowUpRight SVG. `.empty-state-icon/.error-state-icon` now flex-sized (SVG-ready). Grep for emoji codepoints in src/presentation + src/otherLedgers + src/loans = 0 matches. 29 unit + full targeted e2e pass.
- **M-05 done** (`b3c3337`): zero balances render NEUTRAL; danger red only for genuinely negative values. Dashboard MetricValue refactored to semantic tone classes (`.toneZero/.toneNeg/.toneCash/.tonePrimary/.toneText`) replacing hardcoded coral on "Total in Banks"/"Active Loans"; LoansScreen mobile "Total Outstanding" tile zero -> secondary (`.summaryZero`). Cash -6,000 stays red (correct - real deficit); income/expense category colors intentionally unchanged (typed semantics). Verified via scratch spec: zero tiles carry secondary color, negative keeps coral.
- **M-08 done** (`f8e5a50`): setup wizard dots row DELETED (kept the funded bar); bar merged into the top row sharing space with "Skip -> Dashboard" (one progress indicator). Card now `justify-content: safe center` - vertically centered when it fits, top-aligned & scrollable on the tall "How it works" step (was clipping). Bar width via CSS var `--fill-width` (same pattern as ProgressBar). Skip button 44px min-height. Verified step 0-3 gaps ~= even on fitting steps, last card reachable on step 3.
- **M-09 done** (`8e332a5`): verified "All Accounts 0" badge = `filteredTxs.length` (tx rows, by design) - contradiction with "Linked Accounts (3)" was a LABEL misread. Renamed badges to "{n} tx" (desktop ledger panel head + mobile toolbar) with tooltip "Transactions in this ledger view". New members with 0 txs now read "0 tx" unambiguously.

### Gates
typecheck / full `eslint src --max-warnings 0` / vitest 31 / build pass on every commit; detect_changes risk low-medium (M-03 spread, 0 affected processes). Full Playwright suite: 31 passed / 1 failed at workers=2 - the 1 failure is PRE-EXISTING BUG-39 (stale search.smoke asserting a `Search...` input the header search replaced; awaiting user decision, not touched). NOTE: at 6 workers the shared dev server flakes (03-accounts/15-cloud-sync dashboard boot timeouts) - e2e load finding, not regression.

### Status
- **All 9 mobile refinements tickets COMPLETE (M-01..M-09)** on `feature/mobile-refinements` (9 commits, tip `8e332a5`, clean tree).
- NEXT: user confirmation required to merge into `dev` (per 3.8/3.12). Then consider Unreleased CHANGELOG entries + version bump per docs/VERSIONING.md at merge time.

## Session 2026-10-17 (post-review patch)
### Changes
- Post-review catch during 'is everything fixed?' check: M-06's index-card half was NOT satisfied — .cardDelete was still 28x28 while only the detail circle had been fixed in 1badf7a. Fixed: visual 32px + invisible ::before inset -7px = 46x46 hit area (UNGuideline touch-target-size 'padding may extend beyond visual'). Scratch Playwright check passed and deleted; nothing was touched in parallel-session files.
### Skill(s) Used
- ui-ux-pro-max (touch-target pattern)
### Status
- M-06 now fully satisfied; all 9 tickets genuinely done. Commit pending on `feature/mobile-refinements`; merge to dev still awaits explicit user approval.

## Session 2026-10-18
### Changes
- Pushed `feature/mobile-refinements` (tip ef8a19b) to remote with upstream tracking; branch was previously local-only. No merge performed.
### Status
- Branch is on remote at origin/feature/mobile-refinements. Merge to dev still awaits explicit user approval per 3.8/3.12.
## Session 2026-10-31
### Changes
- Merged feature/mobile-refinements (34fe858, M-01..M-09) into beta_v2.0 with --no-ff as 2ae487d. Conflicts resolved: dashboard/sections.tsx (M-05 tone-based MetricValue + audit TrendLine combined), RecycleBin.tsx (per-kind lucide KIND_ICON map replaces DELETED_KIND emoji icons, audit tab structure kept), session_log.md (both blocks kept).
- Version bump 1.18.1 -> 1.18.2 PATCH per docs/VERSIONING.md sec.2 table (UI fixes) in atomic commit 83d1dfe: package.json + whatsNew.ts + CHANGELOG [1.18.2]. Chosen PATCH after user gave no reply to the 2.0.0 question; flagged as user-overridable.
- Gates on beta after merge: typecheck, scoped eslint --max-warnings 0, vitest 235/235, build - all green. Pushed origin/beta_v2.0.
### Skill(s) Used
- ui-ux-pro-max (conflict resolutions for icon/tone patterns)
### Status
- beta_v2.0 at 83d1dfe = dev-line mobile refinements + audit fixes, v1.18.2. master untouched. Next: Other Ledgers V2 when user says "next update".
## Session 2026-10-31 (v2.0 stamp)
### Changes
- Per user decision, beta_v2.0 line renumbered: the interim 1.18.2 release is retitled as v2.0.0 (same content, no second stacked release). Atomic commit c50fa8e: package.json, whatsNew.ts (2.0.0 entry + "nothing to do on your side" caveat), CHANGELOG [2.0.0] with no-migration note, AGENTS.md sec.5. All future updates on beta_v2.0 now number from 2.0.x.
- Gates: typecheck + build green. Pushed origin/beta_v2.0.
### Status
- beta_v2.0 = v2.0.0 (M-01..M-09 mobile refinements + BUG-21..47 audit), tip c50fa8e. master stays on 1.17.x stable. Next: Other Ledgers V2 when user says "next update".
## Session 2026-10-31 (beta -> dev merge)
### Changes
- Merged beta_v2.0 (ada6677, v2.0.0) into dev with --no-ff as 63582c9 on the user call to test the app. Post-merge diff beta<->dev is empty (content-identical); typecheck + vitest 235/235 green. Pushed origin/dev (16b5306 -> 63582c9). AGENTS.md branch map updated.
### Status
- dev and beta_v2.0 now the same code (v2.0.0). master stays v1.17.3 stable, untouched. User testing on dev; next work (Other Ledgers V2) continues on beta_v2.0 unless user says otherwise.
## Session 2026-10-31 (BUG-48)
### Changes
- BUG-48 fixed (user-approved Option A): deleted the legacy `.filterRow > :first-child { flex: 1 1 240px }` from TagLedgerScreen.module.css; LedgerSearch now rests as its designed 30x30 circle on /tags and expands on hover like every other page. Same-commit updates: BUGS.md (fixed + resolved) + CHANGELOG Unreleased Fixed. Commit 040f4b8 on beta_v2.0, pushed. Scratch Playwright verified idle=30x30 circle / hover=180 capsule (deleted after run). Gates: typecheck / scoped lint / vitest 235 / build / detect_changes (1 CSS file, 0 processes) all green. NOTE: e2e seed-first-boot races its 15s expect at ~13s on this machine (BUG-44 family, pre-existing on cold dev compiles) - do the seed inline in future scratch specs.
- Investigated with live dev server + MCP browser: app boots fine, splash typed wordmark ~10-13s, What's New v2.0.0 dialog appears once.
### Skill(s) Used
- ui-ux-pro-max (component geometry diagnosis)
### Status
- BUG-48 closed. Next: user continues UI review on beta_v2.0 / dev; Other Ledgers V2 on "next update".
## Session 2026-11-01 (dev -> master release merge)
### Changes
- Merged dev (c3d1550, v2.0.1) into master with --no-ff on the user call as b241159: "Merge dev: release v2.0.1 - calculation audit (BUG-21..BUG-47), mobile refinements M-01..M-09, tags search shape BUG-48". 57 commits, 102 files, +4689/-799; no conflict (dev contained all of master). Release on master is v2.0.1, without the Drive-sync workstream (that stays on google_signin_backup).
- Gates: vitest 235/235 green on merged master (~2.8s). Pushed origin/master (d4936f6 -> b241159).
- AGENTS.md sec.5 branch map + Phase 19 line updated: master now at v2.0.1 (b241159).
### Skill(s) Used
- (none — release/chore session)
### Status
- master = v2.0.1 stable (b241159), dev/beta_v2.0 unchanged at v2.0.1 content. Docs commit follows on dev. Next: Other Ledgers V2 (T-119..T-123) when user says "next update".
## Session 2026-11-01 (master release + T-174 tag sorting)
### Changes
- Merged dev (c3d1550, v2.0.1) into master as b241159 on the user call and pushed; vitest 235/235 green on merged master. Docs commit 2127575 on dev (branch map: master = v2.0.1).
- T-174 (user choice Option A over B/C): tag-card grid on /tags now sortable — Most used (default, unchanged), Name A-Z, Z-A (localeCompare + count-desc tie-break). Pills reuse the detail ledger's sortPill styles; rendered only when >1 tag; new .tagSortRow margin class only, tokens only. Gates: typecheck / scoped eslint --max-warnings 0 / vitest 235 / build / detect_changes (TagLedgerScreen + docs only, 0 affected processes, low risk). Feature commit 8322c74 on beta_v2.0.
- Version bump 2.0.1 -> 2.1.0 MINOR per VERSIONING.md sec.2 (feat: commit) in atomic commit dbf4c47: package.json + whatsNew.ts 2.1.0 entry + CHANGELOG [2.1.0] Added + AGENTS sec.5 T-174 note. Pushed origin/beta_v2.0.
### Skill(s) Used
- senior-frontend
### Status
- beta_v2.0 at dbf4c47 = v2.1.0 (not yet on dev/master — sweep at next merge). master = v2.0.1. Next: Other Ledgers V2 (T-119..T-123) when user says "next update".

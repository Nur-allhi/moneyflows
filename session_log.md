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

### Skill(s) Used
- senior-backend, senior-frontend

### Status
- Complete on branch, NOT merged. Next: user reviews report screen live → confirm merge into dev (+ push when network recovers).

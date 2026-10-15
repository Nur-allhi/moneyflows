# MoneyFlows — Bug Tracker

Living queue of known issues. Maintained per the BUG TRACKING PROTOCOL (AGENTS.md §3.11).

## Ordering rules (maintain this file exactly so)

1. `open` and `in-progress` bugs always sort above `fixed` and `wontfix`.
2. Within the same status, sort by severity: `critical` → `high` → `medium` → `low`.
3. Within the same status + severity, sort by found date, oldest first.
4. `fixed`/`wontfix` entries stay at the bottom as history, in the same severity/date order.

## Entry template

```markdown
## BUG-<sequential-id>: <short title>

- **Status:** open | in-progress | fixed | wontfix
- **Severity:** critical | high | medium | low
- **Found:** YYYY-MM-DD (during: <what surfaced it>)
- **Location:** <file(s)/component/route affected>
- **Description:** What's wrong; observed vs. expected behavior.
- **Root Cause:** (unknown until diagnosed)
- **Fix Approach:** (only after user confirms the approach)
- **Resolved:** YYYY-MM-DD — commit/PR reference
```

---

## BUG-10: Nested collapsed disclosure leaks content (Google Drive Sync sliver)

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-16 (during: settings refresh S-2 verification, user report "Drive option going behind")
- **Location:** `src/presentation/components/settings/SettingsDisclosure.module.css:111` (`.trayOpen .trayInner`); visible in `BackupCard.tsx` (Google Drive Sync nested inside Backup & Storage card)
- **Description:** The collapsed Google Drive Sync section shows a clipped sliver of its body text ("Online sync is not set up…", cut mid-line) spilling into the Engine Health area. Top-level collapsed cards measure 0px; the nested tray measures ~29px. Expected: collapsed = 0px, nothing visible.
- **Root Cause:** `.trayOpen .trayInner` is a descendant selector — the open outer card's rule also matches the nested closed disclosure's trayInner, giving it open padding (12/16/16). The padding inflates the `0fr` grid track so one text line leaks. Any future nested disclosure would hit the same.
- **Fix Approach:** user-confirmed — scope the selector to `.trayOpen > .trayInner` (direct child) so open padding never reaches nested closed trays.
- **Resolved:** 2026-10-16 — one-selector fix on `feature/setup-settings-refresh`; verified live (nested Drive tray 29px → 0px, top-level trays unaffected); CHANGELOG entry deferred to `dev` merge.

---

## BUG-12: Startup timed out — recovery screen after dev restart / sign-out-erase window

- **Status:** open
- **Severity:** high
- **Found:** 2026-10-16 (during: user manual test — Database Error "Startup timed out. Your data may need recovery." with restore auto-backup / Start Fresh options)
- **Location:** boot init path (`getDatabase`/`initDatabase`, splash watchdog) — possibly connected to sign-out-erase `resetStorage()` on `feature/setup-settings-refresh`
- **Description:** App boots into the Database Error recovery screen instead of normal startup. Observed after the dev-server restart / sign-out-erase testing window. Expected: normal boot to dashboard/wizard.
- **Triage 2026-10-16:** loaded `/` read-only via probe — boots clean to dashboard, all 5 members + balances present, 0 console errors. Data is NOT wiped (rules out a completed sign-out-erase) and current boot is healthy. Server responds 200; repeat probe also clean — failure is isolated to the user's browser tab (hung boot / stale service worker / stuck recovery screen), not server or data. Awaiting what the tab shows.
- **Triage 2026-10-16 (2):** user confirms Playwright (clean profile) loads perfectly, normal Chrome errors repeatedly → profile-specific stored state (their OPFS/IDB/SW), not server or code. Error text is the watchdog ("Startup timed out") = a >15s HANG, not a thrown init error. Next: user tries Restore Latest Backup (safe) + shares console errors + storage size.
- **Triage 2026-10-16 (3):** restore completed (console clean) but after minutes-long load the app shows the SETUP WIZARD = restored DB has no members (+ setupComplete false). Mechanism: `restoreNewestSnapshot()` restores slot 0 = newest ring entry — and `resetStorage()`/empty flushes snapshot the EMPTY db into slot 0, so newest ≠ good data. Older slots may still hold the real data. Also user's dev server is DOWN (vite WS "server connection lost" in their console) — must restart and leave running. Next: snapshot inventory from their console (slots/times/sizes + settings flag), then restore the correct older slot; DO NOT enter wizard data yet (new snapshots rotate the ring).
- **Root cause 2026-10-16 (4, user-confirmed trigger: AFTER my sign-out-erase):** two defects in my path: (1) `resetStorage()` flushes the empty schema THROUGH the snapshot ring — slot 0 becomes an empty snapshot, so any later "Restore Latest Backup" lands on an empty DB → wizard. The sign-out wipe itself worked (e2e green); (2) recovery screen offers ONLY newest slot, no way to pick an older one. Fix: suppress snapshot during reset flush + exact-slot restore + slot picker UI + watchdog message names the stalled stage. Server flapping (repeated :3000 kills) explains the hangs/load delays.
- **Root Cause:** (unknown until diagnosed — candidates: OPFS state left by `resetStorage().clearAll()` + re-init; splash watchdog firing on slow ID-less/GIS boot; unrelated OPFS corruption)
- **Fix Approach:** user-confirmed direction (make recovery work + app loads to wizard): (1) `resetStorage()` suppresses the snapshot ring while flushing the empty schema — slot 0 can never be an empty snapshot again; (2) NEW `restoreSnapshotExact()` on the port/service (no fallback, per-slot errors); (3) recovery screen lists every slot with time + exact restore buttons + truthful Start Fresh copy ("resets to empty"); (4) watchdog message names the stalled boot stage.
- **Resolved:** — (implemented + verified below; stays open until the user confirms their data is back)
- **Verification 2026-10-16:** typecheck PASS, scoped lint clean, NEW e2e `16-recovery` green (forced engine failure → Database Error UI + actions, slot list degrades without crashing), fresh-profile boot lands on the 4-step wizard with 0 errors. User action still needed: restart dev (was down), reload normal Chrome — expect the wizard (device was wiped by their sign-out, as requested) — then sign in / re-setup; older slots only help if they predate the wipe.

---

## BUG-11: Primary Member uses native select (design mismatch); effect is invisible

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-16 (during: settings refresh, user report "dropdown not matching + function not working")
- **Location:** `src/presentation/components/settings/sections/MoneyRegionFields.tsx:47` (native `<select>`)
- **Description:** The Primary Member dropdown is a browser-native select while every other picker in the app uses the modal-picker pattern (DESIGN_IDENTITY §9 deprecates native selects) — popup styling/behavior doesn't match. Separately, setting it changes nothing visible: it only attributes new transactions' memberId (`transactionForm/useSubmit.ts:52`), so users can't tell it worked.
- **Root Cause:** (design) native select never migrated when T-155 established the picker pattern; (perception) no helper copy and no visible confirmation of what Primary Member does.
- **Fix Approach:** user-confirmed modal picker — NEW `MemberPicker` (trigger + overlay + list, own tokens-only CSS, reduced-motion guard) in `MoneyRegionFields`, plus "New transactions belong to this member." helper.
- **Resolved:** 2026-10-16 — on `feature/setup-settings-refresh`; verified live (open → pick Namira → Save → id persisted + trigger label updates; reset to null after); CHANGELOG entry deferred to `dev` merge.

---

## BUG-9: Big amounts clipped on the left in Recent Transactions

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-02 (during: `feature/ui-polish` verification, page feedback)
- **Location:** `src/presentation/screens/Dashboard.module.css` `.txAmount`; `LedgerTable.module.css` `.debit/.credit/.balance`
- **Description:** Long amounts (e.g. 7+ digits + arrow + currency) exceed the fixed 100px amount cell; the cell can't shrink and content is nowrap right-aligned, so digits overflow to the left and get cut. Expected: full amount always visible.
- **Root Cause:** Fixed-width amount column sized for small numbers; ledger cells were additionally center-aligned so overflow clipped both sides with no readable anchor.
- **Fix Approach:** owner-approved scope (dashboard + ledgers) — dashboard cell `width` → `min-width` (grows, description flexes); ledger amount cells `center` → `right` so leading digits + ellipsis stay readable. NOTE: `minmax` tracks were considered for ledgers but rejected — header and rows are separate grids sharing the template, so content-sized tracks would misalign them.
- **Resolved:** 2026-10-02 — two CSS-only edits on `feature/ui-polish`; build + typecheck green; impact LOW (LedgerTable: 3 render-only consumers).

---

## BUG-8: Dashboard "New Transaction" icon + label wrap to two lines

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-02 (during: app-wide button-animation rollout verification, page feedback on `/`)
- **Location:** `src/presentation/screens/Dashboard.tsx:54` (`actBtn actPrimary`)
- **Description:** The "New Transaction" button shows its plus icon and label stacked on two lines instead of one row. Expected: icon + label side by side with the 8px flex gap.
- **Root Cause:** The rollout wrapped the svg + text in a single `.anim-target` span inside the row-flex `.actBtn` (`gap: 8px`) → flex gap lost, inline content wraps.
- **Fix Approach:** split into two `.anim-target` spans sharing one replay key (same pattern as the MemberList/OtherLedgersIndex card fix).
- **Resolved:** 2026-10-02 — split spans committed on `feature/ui-polish`; tree-wide audit confirms no other svg+text single-span wrappers; typecheck + eslint clean.

---

## BUG-5: Account card text unreadable in light mode (+ missed on-primary whites)

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-02 (during: Phase 17 follow-up, user report)
- **Location:** `AccountCard.module.css` `.card`/`.actions`; filter/add buttons in `OtherLedgerDetail`, `GroupLedgerScreen`, `GroupsListScreen`, `MemberProfile`
- **Description:** Account cards keep their fixed dark gradients in light mode, but `.name`/`.balance`/`.type` inherit theme ink → dark text on dark card. Card action buttons use theme-secondary (same failure). Separately, several solid-primary buttons still use hardcoded white (`filterPillActive`, `addBtn:hover`, `obBtn`, `filterIconBox`) — missed in the T-137 on-primary sweep, breaking under gold/teal accents. Also `.card:active` paints a wash that stomps the gradient (same pattern as BUG-4).
- **Root Cause:** Card chrome never declared its own ink color (relied on dark-mode body text); sweep only covered gradient backgrounds, not solid-primary ones.
- **Fix Approach:** owner-approved option A (dark cards, white ink) — `.card` pins `color:#fff`, actions go white/white-hover, `:active` becomes press-scale instead of wash; missed solid-primary whites swept to `var(--color-text-on-primary)`.
- **Resolved:** 2026-10-02 — fix commit on `feature/theme-accent`; verified live on demo.db (light mode: real card gradient bg + all-white text via computed styles). CHANGELOG entry deferred to `dev` merge.

---

## BUG-3: Accounts list shows stale balance (0) right after Add-Account

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-08-24 (during: BUG-2 reproduction testing)
- **Location:** `AddAccountModal.tsx` handleSave → `useAccountStore.accounts`
- **Description:** After creating an account with an initial balance, the in-memory accounts store still reported the pre-transaction snapshot (balance 0) because only the transactions store was updated; the UI corrected itself on next remount/refetch.
- **Root Cause:** Modal awaited `saveAccount` + `addTransaction` but never re-fetched accounts.
- **Fix Approach:** owner-approved — call `fetchAccounts()` after the opening-balance transaction in `handleSave`.
- **Resolved:** 2026-08-24 — commit adds `await fetchAccounts()`; verified live (immediate balance 777 visible post-save, no reload).

---

## BUG-4: Dashboard "+ New Transaction" label unreadable on hover in light mode

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-02 (during: Phase 16 light-mode verification, user report)
- **Location:** `src/presentation/screens/Dashboard.module.css` `.actBtn:hover` vs `.actPrimary`
- **Description:** In light mode, hovering the gradient "+ New Transaction" button washes the label out. Observed: hover background turns near-white while the label stays white. Expected: gradient persists on hover with a glow/opacity shift, label stays readable.
- **Root Cause:** `.actBtn:hover` (specificity 0,2,0) sets a wash `background`, which beats `.actPrimary`'s gradient (0,1,0); `.actPrimary:hover` only sets `opacity`, so it never restores the background. In dark mode the wash-over-dark stayed readable, which hid the defect.
- **Fix Approach:** owner-approved option A (scoped variant hover) — `.actPrimary:hover` re-asserts the primary gradient + opacity/glow, matching every other gradient button.
- **Resolved:** 2026-10-02 — fix commit on `feature/theme-accent`; verified live (light-mode hover keeps gradient + white label, screenshot + computed-style check). CHANGELOG entry deferred to `dev` merge.

---

## BUG-2: App "restarts" while creating a new account under a member

- **Status:** wontfix
- **Severity:** high
- **Found:** 2026-08-24 (during: user manual test report)
- **Location:** Add-Account flow (MemberProfile → AddAccountModal)
- **Description:** App appeared to restart while creating an account under a member.
- **Root Cause:** Could not reproduce in current build (v1.0.0+): scripted E2E run created an account under a member with **no reload** (page marker survived), correct member link, and correct persistence (opening balance 500 + Opening Balance transaction verified after reload). Strongest explanation: Vite dev-server auto-restarts/full-reloads during the recent heavy editing sessions — browser tabs auto-refreshed mid-action, which looks exactly like an app restart. Production/PWA builds have no such trigger.
- **Fix Approach:** none required for the app. If it recurs outside dev-server sessions, capture the time + console state and reopen.
- **Resolved:** 2026-08-24 — closed as dev-environment artifact; see BUG-3 for the real (minor) issue found during this investigation.

---

## BUG-1: Real family names and financial PDF persist in tracked docs and git history

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-08-24 (during: full-project PII name audit requested by owner)
- **Location:** `Project_plan/Financial_Review.md` (25 hits), `Project_plan/*.md`, `DESIGN_FILES/*.html`, `DESIGN.md`, `docs/PRD.md`, `AGENTS.md`, `session_log.md`, and **git history**: PDF blob added in `f9f802a`, removed at HEAD by `68f3771`, still reachable from `master`
- **Description:** SECURITY.md §5 forbids real person names tied to financial figures. Full names were present across 14+ tracked files and an exported loan-ledger PDF remained extractable from history. Runtime code was already clean.
- **Root Cause:** Scaffolding docs authored from the family's real spreadsheet audit; mockups reused real member names; data PDF slipped into one fix commit before `.gitignore` covered `USER_DATA/`.
- **Fix Approach:** owner-approved Option B2 — full `git filter-repo` rewrite on a mirror clone: USER_DATA paths purged + all family/counterparty names replaced with role placeholders across every commit; all refs force-pushed.
- **Resolved:** 2026-08-24 — history rewrite (all SHAs replaced; pre-rewrite backup bundle `C:\Dev_Projects\moneyflows-backup-pre-rewrite.bundle`; post-rewrite scan shows 0 tracked files with real names). Residual platform caveat documented in `docs/audit/PII_NAMES_AUDIT_2026-08-24.md` §7.

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

## BUG-20: Linked Accounts modal shows 0 BDT while dashboard shows the real total

- **Status:** open
- **Severity:** high
- **Found:** 2026-10-17 (during: mobile UI audit — BEFORE the BUG-19 reload, Dashboard "Total in Banks" read 28,000 in the same session)
- **Location:** `src/presentation/screens/memberProfile/AccountsSection.tsx` (Linked Accounts modal, route `/member/:id`)
- **Description:** The Linked Accounts modal lists "City Bank — 0 BDT Available Balance" and "Cash Wallet — 0 BDT Available Balance" while the dashboard reports "Total in Banks 28,000 BDT" for the same two accounts in the same session. Expected: the modal shows each account's current balance. Note: BUG-19 zeroed these specific accounts after reload, so re-verify against a healthy account before diagnosing.
- **Root Cause:** (unknown until diagnosed)
- **Fix Approach:** (pending user confirmation)
- **Resolved:**

---

## BUG-19: Setup Wizard starting balances silently erased on next reload

- **Status:** fixed
- **Severity:** critical
- **Found:** 2026-10-17 (during: mobile UI audit — fresh guest profile, seeded accounts, reload)
- **Location:** `src/presentation/screens/SetupWizard.tsx:103` (`handleAddAccount` — `new Account(..., Number(accountDraft.balance))`) + `src/infrastructure/database/computeBalances.ts` / `SQLiteDatabaseService.recalculateBalances` (T-171 boot pass)
- **Description:** Wizard step 2 stores the "Starting balance" value directly on `accounts.balance` without creating an opening-balance transaction (the normal `AddAccountModal` flow, by contrast, saves the account with balance 0 and adds an `income` transaction tagged `isOpeningBalance: true`). On the next reload, boot's `recalculateBalances()` computes expected balances purely from the transaction stream (0 for a fresh account), sees 25,000 ≠ 0, and rewrites the row to 0. Observed: City Bank 25,000 + Cash Wallet 3,000 ("Total in Banks 28,000 BDT") → after one reload every surface (dashboard, member ledger, linked-accounts modal) reads 0 BDT. Expected: starting balances survive reload like normal-creation accounts. Severity = silent first-run data-wipe for every user who types a starting balance during setup.
- **Root Cause:** wizard saves starting balance as a raw account row field; boot balance math only replays transactions and treats the field as stale.
- **Fix Approach:** user-confirmed via deferred decision (user unresponsive; audit recommendation applied) — wizard `handleAddAccount` now saves the account with balance 0 and creates the `isOpeningBalance` income transaction exactly like `AddAccountModal`; boot replay then reproduces the balance, so nothing is rewritten. Live-verified: seeded 25,000 + 3,000 → reload → all surfaces still show 28,000 + both Opening Balance rows.
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, scoped lint clean, unit 113/113 PASS, build PASS.

---

## BUG-18: False sync conflict on a single device

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-17 (during: user report — conflict dialog while editing on one device only, no real data difference; mentions timestamp)
- **Location:** `decideSyncAction` + all four conflict-raising paths (`_maybeCloudSync`, `_cloudBootPull`, `reconcileAfterSignIn`, `checkRemoteUpdate` in `SQLiteDatabaseService.ts`) + `CloudUpdatePrompt.tsx` dialog copy
- **Description:** "Sync conflict — another device changed data" appears although only one device edits and both sides look the same. Expected: single-device states never raise a both-sides-moved choice.
- **Root Cause:** diagnosed 2026-10-17 (single tab + during-normal-use answers rule out multi-tab disagreement and sign-in/data-clear fingerprint loss): unconfirmed upload → stale fingerprint. An upload can land server-side while the client records failure (slow-network timeout on the response, stale verification read — BUG-15 timeouts made hangs fail, but a timed-out-while-successful upload still leaves meta stale). Next cycle the identical content triple-differs (local ≠ fingerprint, remote ≠ fingerprint) and `decideSyncAction` returns `conflict` — it never checks that local and remote are actually identical. The dialog's "Saved {time}" is then the user's own upload time, which is why the timestamp looks suspicious but meaningless.
- **Fix Approach:** user-confirmed (convergence guard) — `decideSyncAction` returns `idle` when local and remote hashes are identical regardless of fingerprint staleness; `_maybeCloudSync` heals the fingerprint + clears a same-state conflict on that path (conflict early-return moved after); NEW `healIfConverged()` re-verifies before `checkRemoteUpdate` re-alarms; sign-in reconcile refreshes stale fingerprints too; healed conflicts dismiss their own dialog. Genuine both-sides-moved states still ask.
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, full lint 0 PASS, unit 113/113 PASS (convergence tests), build PASS.

---

## BUG-17: Sync asks to sign in again on every app open

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-17 (during: user report — every Sync-now tap after opening the app demands Google sign-in)
- **Location:** `src/infrastructure/database/GoogleAuth.ts` (`getValidToken` persistence + silent renewal) + `CloudSyncSection.handleSyncNow` fallback
- **Description:** Each fresh app open followed by Sync now pops the Google sign-in instead of reusing the previous session. Expected: within the token lifetime (and whenever silent renewal can succeed) sync proceeds with no popup.
- **Root Cause:** diagnosed 2026-10-17 (hours-later + same-URL answers rule out storage loss): the GIS implicit-flow token lives ~1h; on reopen the saved token is expired and silent `prompt:'none'` renewal fails, so every old session falls through to the interactive popup. Silent path is fragile by construction — GIS opens a real popup even for `none` (see BUG-15), so popup blockers kill the gesture-less boot attempt and third-party-cookie/FedCM blocks kill the Google-session reuse. Environmental checks (cookies, popup allow, test-user status) may restore silent renewal on their own.
- **Fix Approach:** user-confirmed (stretch + smooth) — `requestToken` now returns the real `expires_in` lifetime instead of assuming 1h (all three grant paths); NEW `renewBeforeExpiry()` silently renews inside the final 10-min window (activation-gated, throttled, backoff-honoring, expired delegates to the normal path); NEW `ensureProactiveRenewal()` activity listener wired once in `AppLayout`. Long-idle reopens still need one tap (implicit-flow platform limit, no backend).
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, full lint 0 PASS, unit 112/112 PASS (5 new BUG-17 tests), build PASS.

---

## BUG-16: Google popup auto-closes with no callback; Sync-now bar stuck at 75%

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-16 (during: user report — header sync tap opened Google popup that auto-closed; Settings Sync now progress stuck half-done)
- **Location:** `src/infrastructure/database/GoogleAuth.ts` (`signIn`, `getValidToken`, `refreshInteractive`, `loadGis`) + `src/presentation/components/settings/CloudSyncSection.tsx:93` (`handleSyncNow` stage)
- **Description:** Tapping sync opens the Google sign-in popup which closes by itself without signing in. Tapping Sync now in Settings then leaves the progress bar stuck at 75% ("Syncing your data…") forever — no error, no recovery without reload. Expected: a closed/cancelled popup always settles into an error message and clears the bar.
- **Root Cause:** GIS token promises (`new Promise` around `requestAccessToken`) have no timeout and assume the callback always fires; `loadGis()` likewise never times out. When the popup dies without a callback (unauthorized origin, blocker/FedCM kill, dead-session edge), the await hangs forever so `setStage(null)` never runs. BUG-15 added network timeouts but NOT GIS-callback timeouts — this is the remaining hole. Trigger-side candidates: opened URL not in Google Console authorized origins, popup/FedCM blocking, third-party cookies off.
- **Fix Approach:** user-confirmed (timeouts + config check) — shared `requestToken` helper races every GIS callback against a timer (60s interactive, 10s silent; script load 15s); silent timeout settles as backoff-null, interactive timeout rejects so the bar always clears; sign-in timeout maps to an actionable origin/blocker error instead of the cancel copy.
- **Resolved:** 2026-10-17 — on `dev`; typecheck PASS, full lint 0 PASS, unit 107/107 PASS (3 new BUG-16 timeout tests), build PASS.

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

## BUG-15: Background silent renewals spam blocked popups; Sync now bar sticks

- **Status:** fixed
- **Severity:** high
- **Found:** 2026-10-16 (during: user report — Sync-now progress never finishes + console shows 6× `GSI_LOGGER: Failed to open popup window … prompt=none … Maybe blocked by the browser?`)
- **Location:** `GoogleAuth.getValidToken()` silent path (called from boot/flush background paths) + `CloudSync` Drive fetches (no timeouts)
- **Description:** (1) Every background silent renewal opens a REAL popup even with `prompt:'none'`; outside user gestures the blocker kills it, so after the hourly token dies the app spams doomed popups on every flush/poll instead of settling into 'reconnect'. (2) `syncNow`'s Drive fetches have no timeout — on a hanging network the Sync-now progress bar sticks at 75% forever instead of failing into an error state.
- **Root Cause:** silent GIS renewal retried unconditionally per call with no per-session backoff; network layer assumes failure, never hangs.
- **Fix Approach:** (1) per-session silent-renewal backoff in `getValidToken` — one failure stops background GIS attempts until explicit sign-in/refresh succeeds or sign-out (explicit taps always attempt); (2) 30s `fetchWithTimeout` on all 6 Drive calls + profile fetch, so hangs surface as errors and the bar always completes.
- **Resolved:** 2026-10-16 — on `feature/setup-settings-refresh`; typecheck + scoped lint clean, unit 94/94 (backoff + timeout tests), e2e cloud-sync 4/4; CHANGELOG entry deferred to `dev` merge.

---

## BUG-14: Next-morning re-auth popup opens then closes by itself

- **Status:** fixed
- **Severity:** medium
- **Found:** 2026-10-16 (during: user report — signed in last night, morning Sync-now shows Google popup that auto-closes)
- **Location:** `src/infrastructure/database/GoogleAuth.ts:215` (`signIn`) + `:324` (`refreshInteractive`) — both `requestAccessToken({ prompt: '' })`
- **Description:** Access tokens live ~1h (GIS implicit flow, no refresh tokens); overnight the persisted token expires and silent `prompt:'none'` renewal fails (dead Google session / blocked third-party cookies). The explicit-tap fallback opens the popup with `prompt:''`, which fails closed (instant error, popup auto-closes) instead of offering the account chooser. Expected: tapping Sign in / Sync now always presents the chooser.
- **Root Cause:** `prompt:''` lets Google attempt silent issuance inside the popup and die with no UI; explicit user taps need `prompt:'select_account'`.
- **Fix Approach:** explicit taps (`signIn`, `refreshInteractive`) now request `prompt:'select_account'` — chooser always offered; silent `prompt:'none'` path untouched for background callers.
- **Resolved:** 2026-10-16 — on `feature/setup-settings-refresh`; typecheck + scoped lint clean, unit 92/92 (prompt assertions added/updated); CHANGELOG entry deferred to `dev` merge.

---

## BUG-13: Splash progress bar vanishes mid-splash, never shows completion

- **Status:** fixed
- **Severity:** low
- **Found:** 2026-10-16 (during: user report — bar shows "Starting…" then nothing until app loads)
- **Location:** `src/presentation/components/SplashScreen.tsx:80` (`{!ready && showProgress && ...}`)
- **Description:** On boots slower than 600ms the progress bar appears, but unmounts the instant `ready` fires — while the splash lingers ~800ms more for typing + fade. Users see a frozen "Starting…" flash, never staged progress or completion. Expected: bar stays through fade-out showing 100%.
- **Root Cause:** `!ready` in the render gate unmounts the bar (and its final 100%/Finalizing paint, batched with `ready`) before the fade completes. ProgressBar itself applies every update (T-165) — it just never stays mounted to show them.
- **Fix Approach:** render gate `{showProgress && ...}` with `ready ? 100/'Ready' : percent/status` — bar stays mounted through typing + fade showing completion.
- **Resolved:** 2026-10-16 — one-condition fix on `feature/setup-settings-refresh`; NEW e2e `17-splash` green (delayed engine → staged labels → Ready visible through fade → app loads); CHANGELOG entry deferred to `dev` merge.

---

## BUG-12: Startup timed out — recovery screen after dev restart / sign-out-erase window

- **Status:** fixed
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
- **Resolved:** 2026-10-16 — full computer restart cleared it; hosted + dev apps both load normally. Root cause was OS/machine-level (stale loopback sockets, zombie `vite`/Chrome processes from repeated :3000 kills, or a hung profile network service) — never app code or data: clean profiles always booted, and no data was lost. All hardening shipped along the way stays (slot picker, exact restore, no empty snapshots, boot/storage timeouts, busy states, guest sync entry, sign-out-erase). Lesson: after 2–3 kill/restart cycles, reboot before blaming the app. CHANGELOG entries ride with the `dev` merge.

---

## BUG-11: Primary Member uses native select (design mismatch); effect is invisible
- **Verification 2026-10-16:** typecheck PASS, scoped lint clean, NEW e2e `16-recovery` green (forced engine failure → Database Error UI + actions, slot list degrades without crashing), fresh-profile boot lands on the 4-step wizard with 0 errors. User action still needed: restart dev (was down), reload normal Chrome — expect the wizard (device was wiped by their sign-out, as requested) — then sign in / re-setup; older slots only help if they predate the wipe.
- **Root cause 2026-10-16 (4, from pasted screen):** stall was at boot stage `Starting…` = the sql.js engine file never finished loading (dead/restarting server), and Start Fresh silently no-ops without the engine (needs storage+SQL) → dead-end loop. Fixed: `wipePersistedStorage()` engine-free wipe (OPFS files + LS keys + cloud-sync IDB; auth/settings kept) wired to Start Fresh + `setupComplete:false` + reload; engine download now has a 10s timeout with an actionable message ("is the dev server running?") instead of a 15s mystery hang.
- **Triage 2026-10-16 (5):** user confirms MCP (clean profile) loads, normal Chrome still fails → 100% profile-local (SW/OPFS/IDB/extensions), server+code exonerated. Discriminator: incognito load test + exact current message (new code names the stalled stage).
- **Triage 2026-10-16 (6):** all 4 profile steps exhausted (single tab, hard refresh, SW unregistered, extensions off), other browsers fine → remaining suspect is the origin storage APIs themselves hanging (no error, just pending) — the one boot path with zero timeout. Fixed: 12s `withStorageTimeout` around adapter init + main read + snapshot recovery + slot-list load; hung origin now fails fast into the working Start Fresh instead of the 15s watchdog loop.
- **Triage 2026-10-16 (7):** user clarifies device is empty (expects wizard) but recovery buttons appear dead. Cause: recovery actions had no busy feedback and could hang silently on the same poisoned storage (wipe awaited hung stores forever; restore loop uncapped). Fixed: per-store 8s timeouts with a `WipeReport` (opfs/local/cloudMeta) + manual-clear guidance naming failed stores; all restore paths capped; Restoring…/Wiping… busy states; actions mutually disabled while one runs.
- **Triage 2026-10-16 (8):** hosted STABLE version also fails in the SAME single Chrome profile, works in user's other profiles. Different origin (separate OPFS/IDB/SW/cache) + released code (no branch changes) → exonerates dev server, all recent code, AND origin site data. Remaining suspects are profile-global: extensions, flags/policies, GPU/WASM environment. Next: exact hosted failure text + console, extension list diff.
- **Triage 2026-10-16 (9):** hosted shows the same 15s watchdog on OLD released code → hang is in long-stable paths (engine/storage/balances), profile does it to every origin. Per-profile network layer is now prime suspect: Chrome proxy and Secure-DNS settings are per-profile (a dead proxy / dead DNS provider hangs every fetch on every site, matching both origins). Extension-disable still unconfirmed. Next: confirm extensions all-off, proxy + SecureDNS state, chrome://version command line.

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

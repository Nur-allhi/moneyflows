# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Tags → Open ledger: the search box no longer rests as a squashed oval — it rests as a small circle and expands on hover, same as on every other ledger page.

## [2.0.0] - 2026-10-31

> **Why the number jumped:** the mobile-refinement batch and the calculation audit together mark a new app generation, so this line starts at **2.0.0**. There is **no migration** — databases, settings and backups from any 1.x version open unchanged.

### Fixed
- Every screen now shows its own title in the mobile app bar (was blank or lost context on detail routes), and long titles trim neatly instead of pushing the header's buttons out.
- The Other Ledgers index header no longer misaligns on phones, and its "New Ledger" button works again on mobile.
- Other-ledger detail no longer leaves stranded rename/delete buttons on an empty list — an empty ledger now explains itself and offers one clear "Add First Entry" action.
- Ledger rename, delete and add buttons are now easy to tap on touch screens (44px targets) instead of missing half your taps.
- Zero amounts no longer show in danger red — red is reserved for money you owe; the setup guide also drops its duplicated progress bar and dead space.
- Setting up no longer buries the progress in dots: a single funded bar with a Skip shortcut sits at the top of the guide.

### Changed
- Emoji are replaced everywhere with the app's own icon set (dashboard rows, recycle bin, ledger cards) for consistent rendering across devices.
- Ledger and entry forms no longer show validation limits in their labels — limits only surface when you actually type too much.
- Remaining-ledger entry count badge now reads "N tx" with a tooltip instead of being mistaken for an account count.

## [1.18.1] - 2026-10-30

### Fixed
- The group ledger's **Expense** tab now lists lending on desktop exactly as it does on your phone. The two layouts used different rules for the same tab, so a loan you gave out sat under **Expense** on one and under **Loan** on the other; lending now counts as an expense, the same way it already counts in your Income/Expense totals.
- A loan with nothing left to pay no longer appears as **active**. The Loans list, its "N active" count and the dashboard's Settled/Partial badge all go by the outstanding amount now, so an older record whose flag was never flipped can no longer contradict "0 BDT remaining, 100% repaid".
- The browser test suite now runs one test at a time and its one stale search test checks the current UI, so a red run means something actually broke instead of needing a re-run to interpret.

## [1.18.0] - 2026-10-30

### Added
- Settings → Backup & Storage now has a **Data Integrity** row that checks every saved transaction against the rules the app enforces today and tells you if any record needs attention (which record and why). It only reports — it never changes or repairs your data. Most databases will simply read "All N records check out".

### Fixed
- The four dashboard cards now compare each figure with **its own** value at the end of last month, so an expense paid from a bank account no longer changes the Cash-in-Hand trend (and a loan balance is no longer compared against an income/expense figure). When a percentage of that baseline would be meaningless — a balance that was zero or negative — the card shows the change in money instead of a nonsense figure.
- Editing a repayment now moves the loans it paid, in both directions. A repayment records how it was split across the borrower's loans, so lowering it hands the money back to those loans and raising it re-applies over them (refused when the loans have no room left, with the same clear message as when you record one). Before, a repayment the app created carried no link to any loan, so editing its amount quietly left the loans untouched — the history said one figure and the loans another.
- A change you make to a loan can no longer be lost when something else was saved just before it. Editing a repayment updated the transaction history but the loan's outstanding amount could come back unchanged after a reload (creating a loan, recording a repayment, or settling a loan was affected the same way). Every change now schedules its own save instead of relying on an earlier one still being pending, and loan records tell the database they changed. (Found while verifying the repayment-edit fix below.)
- Editing a repayment *upward* past what the borrower still owes is now refused, with the same clear message you get when you record one: the Edit window says how much is still owed, stays open, and saves nothing. Previously the amount on the ledger was raised while the loan record stopped at zero, so the history claimed more had been repaid than was ever lent. Cutting a repayment below what has really been repaid is refused too, because it would leave a loan owing more than it was for.
- Two unused leftovers are gone rather than kept: the loan store's three backwards-compatibility methods (one of which would have recorded a loan you *received* as one you *gave out*, and none of which any screen called) and the database summary that counted mobile-wallet and business balances as "active loans". No visible change — it just removes a wrong answer from the code. (Developer-facing.)
- Editing or deleting one entry in a register no longer restamps every other entry in it, and a repaired balance is timestamped the same way as every other write. Nothing looks different on screen — it keeps change-detection honest for the cloud-sync work. (Developer-facing.)
- A finished loan is no longer described internally as "on track". No screen showed that label, but it meant the opposite of what it read, so the state is now named "repaid". (Developer-facing.)
- A member's ledger no longer shows money coming back to you as money going out. In the **All Accounts** view a loan repayment landed in the *Debit* column, a loan you issued landed in *Credit*, and a transfer between two of that member's own accounts pushed the balance down — so a member who lent money and was repaid looked steadily poorer. Each row is now read from one sign (money in / money out), and a transfer between the member's own accounts appears in both columns and leaves the balance untouched, the same way the group ledger already showed it.
- The running-balance column in a member's ledger is now formatted like every other amount: **70,000 BDT** instead of `70000BDT`. Grouping and digits now follow your locale setting, as they already did for the debit and credit columns beside it.
- The Recycle Bin's headline figure no longer adds up unlike things. It used to total transaction amounts, account balances and ledger values into one number; now it describes the tab you are looking at (Transactions → Total Amount, Accounts → Total Balances, Ledgers → Total Value), and the All Items tab shows how many kinds of things are in the bin instead of a meaningless sum.
- Deleted items in the Recycle Bin no longer show a minus sign in front of every amount. A deleted account holding 70,000 used to be listed as **-70,000**; each row now shows the amount with a label saying what kind of record it is.
- Deleted ledgers and ledger entries are now reachable in the Recycle Bin: they have their own **Ledgers** tab and are labelled "Ledger" / "Ledger Entry" instead of being called "Account" while no tab could show them.
- A member's **Total Income** and **Total Expenses** now measure the same thing. Money coming back from a loan counts as income, and every kind of money going out counts as an expense — so the two figures finally agree with the balance shown next to them. Before, only money *you* had lent out appeared (as an expense) while repayments received were ignored, which made anyone who lent and was repaid look steadily poorer.
- Downloading a group's ledger as a PDF now exports the **whole** ledger, not just the rows shown on screen. The export used to stop at the first page (10 entries) and its Opening Balance / Total Debit / Total Credit described only that page, so a statement for a year of history silently contained one screenful of it.
- Loan repayment progress now counts **every loan you have with that borrower**, including ones already settled. Someone who repaid an earlier loan in full and then borrowed again used to see 0% repaid — contradicting the amount still owed right beside it; a fully settled ledger now reads 100% instead of a dash, and the Loans card and the ledger's progress bar finally state the same figure.
- Member reports now close at the **end of the range you chose**, not at today's balance. A report for a range that ended earlier used to show the current balance, so its own arithmetic didn't add up (Opening + Credit − Debit ≠ Closing) because activity after the range was pulled in.
- Recording a loan repayment bigger than the borrower still owes is now refused instead of quietly accepted: the form tells you how much is actually outstanding and stays open, so nothing is saved. Previously the extra was dropped from the loan record while the transaction was still written at the full amount, so the history claimed more had been repaid than was ever lent.
- Editing a transaction can no longer save an invalid amount or an empty description. The Edit window now explains what is wrong with the field, stays open, and closes only once the change has really been saved. Previously a cleared or non-numeric amount could be written straight into the account's balance and quietly spoil every total that used that account.
- Amounts accept up to two decimals (for example 100.50) when you add a transaction, not just whole numbers, and Add and Edit now accept exactly the same input. The two windows used to disagree about what an amount may contain, and decimals typed while adding were silently dropped.
- The unit-test command (`npm test`) now exits clean on its own: it no longer picks up the browser end-to-end specs, which previously made the test gate report 21 spurious failures (developer-facing only — the 113 unit tests themselves were always passing).

## [1.17.3] - 2026-10-30

### Added
- Tapping the header cloud button with an expired Google session now opens the sign-in popup directly instead of silently failing — Settings → Sync now is no longer the only way back in.

### Fixed
- Starting balances typed during setup no longer vanish on the next reload: the wizard now records them as an "Opening Balance" transaction the same way the normal Add Account flow does, so boot recalculation keeps them (they previously read 0 everywhere after one reload — including the Linked Accounts list, which could show 0 BDT for accounts the dashboard counted as real money).
- Google sign-in/sync can no longer hang forever when the popup closes without answering (unauthorized origin, blocker): every popup wait now times out (60s interactive, 10s silent, 15s script load) and Settings shows an actionable error instead of a stuck progress bar.
- Google sessions stretch while the app is in use: the real token lifetime is honored and activity triggers a silent renewal before expiry, so Sync stops asking to sign in every hour; long-idle reopens still need one tap.
- Identical device and cloud copies no longer raise a sync-conflict dialog (unconfirmed uploads used to triple-differ against a stale fingerprint): the fingerprint heals silently and a healed conflict dismisses its own dialog. Genuine both-sides changes still ask.

## [1.17.2] - 2026-10-17

### Changed
- Full app icon set: detailed 192/512 icons, apple-touch icon, browser favicons and horizontal logo, all wired into the manifest.

## [1.17.1] - 2026-10-17

### Fixed
- Privacy Policy and Terms of Service now show the real support contact instead of a placeholder.

## [1.17.0] - 2026-10-17

### Added
- Google Drive sync (opt-in, Settings → Backup & Storage): sign in with Google to auto-back up the database to your own Drive and pick it up on other devices. Includes boot import on fresh devices, "New data available" prompt for open tabs, and a keep-mine/use-other-device choice (remote kept as a restore point) when both sides changed.
- Settings reorganized into five collapsed cards (Preferences, Appearance, Dashboard, Backup & Storage, About) with live status badges — one shared section kit powers both the page and the modal.
- Backup & Storage: Sign out erases the device (after a final backup attempt with a warned choice on failure) and returns to the setup wizard so another Google account can sign in; Drive backup untouched. Header cloud button is now also visible to signed-out guests as a sign-in entry point.
- Database Error screen lists every auto-backup with its date/time and restores the exact slot picked; Start Fresh works without the engine and reports per-store results.

### Fixed
- Nested collapsed sections (e.g. Google Drive Sync inside Backup & Storage) no longer leak a clipped line of content when closed.
- Primary Member picker matches the app's modal-picker pattern (was a native dropdown) with helper text explaining new transactions belong to that member; removed the dead Numpad Max Digits setting (written, never read).
- Splash progress bar stays through the fade-out and shows 100% Ready instead of freezing on "Starting…".
- Google re-auth after token expiry always offers the account chooser (was auto-closing); background silent renewals back off per session instead of spamming blocked popups; all Drive requests time out so Sync-now always finishes or fails cleanly.
- Boot and origin-storage hangs fail fast with actionable messages; engine download reports a dead dev server instead of stalling startup.

## [1.16.1] - 2026-10-14

### Fixed
- Recent-transaction rows: descriptions wrap up to three lines while date and amount stay single-line; the date column got breathing room so it no longer touches the description.
- Collapsed sidebar footer avatar sits dead-center (removed the stray flex gap to the hidden label).

## [1.16.0] - 2026-10-14

### Added
- Text size setting gains an XL preset alongside bigger Small/Medium/Large — dashboard numbers and transaction-form descriptions, names, counts and balances follow it (buttons, inputs and icons stay fixed by design).
- Ledger, tag, loan, member-profile and other-ledger row text (dates, descriptions, amounts, balances, headers) now follows the text-size setting too.

### Fixed
- Light-mode readability: secondary text darkened and gold hardened so small text, currency suffixes and colored numbers all clear AA contrast (micro `BDT` labels no longer fade via opacity).
- Ledger tables: desktop Date/Type/Account/Debit/Credit/Balance columns have fixed breathing room (numbers 130px), titles sit centered over their columns, row cells are vertically centered, amounts are semibold, empty debit/credit cells show a bare dash with no stray currency suffix, and the `BDT` suffix stays proportionally smaller with spacing from the amount.

## [1.15.0] - 2026-10-14

### Added
- Dashboard Recent Transactions starts at your Settings → Dashboard limit (default raised 10 → 15) with a "Load more (N remaining)" button adding one page at a time, same pattern as ledger lists; the limit resets when the search query changes. This also wires up the previously unused `dashboardTxLimit` setting.
- Settings → Dashboard → Sections gains Metric Cards, Month Summary and Quick Actions toggles, so every dashboard section can be hidden individually.

### Fixed
- Dashboard panels no longer stretch to the tallest column — each panel fits its own content height.

## [1.14.2] - 2026-10-14

### Fixed
- Transaction picker rows collapsed after a tap (count/balance dropped under the name) — the flex-row rule never matched because the CSS module hashed the global `.anim-target` class; selectors now use `:global()`, and a higher-specificity rule keeps clicked rows intact.
- Transaction member rows show the member name left with the account count right; account rows show the name with its type beneath on the left and the balance alone, single-line, on the right (long names wrap to two lines max).
- The selected account button in the transaction form now shows the account's current balance next to its name.
- Picker back button is a proper chevron icon instead of a text arrow.

## [1.14.1] - 2026-10-03

### Fixed
- Transaction member/account picker rows ran the account count and balance stuck against the name in tiny text — rows now space out (animation wrapper is a flex row), count larger, balance semibold in primary text.

## [1.14.0] - 2026-10-03

### Added
- Ledger sort order: every ledger (Member, Group, Loan, Other, Tag) now shows newest transactions first with "Newest first / Oldest first" pills in the filter card (desktop + mobile); running balances unchanged.

### Changed
- Ledger Date column is wider (mobile 55→95px, desktop 90→130px) and shows date-only in dd-mm-yyyy format (e.g. 03-10-2026) — no time, consistent across ledgers, reports and PDFs.

## [1.13.1] - 2026-10-03

### Fixed
- Ledger filter card closed after ~500ms idle before anything could be selected (Account + Loan ledgers) — card now stays open until outside-click, Escape, or the More toggle.
- Transaction detail modal footer icons sat high in their circles — icon wrapper now centers them, hover pill gap fixed (mobile buttons included).

## [1.13.0] - 2026-10-02

### Added
- Loan ledger header unified with the accounts ledger: title + count, expanding Download PDF / More circle buttons, filter drawer with type icon pills, date pills and Clear Filters.

## [1.12.0] - 2026-10-02

### Added
- Settings reorganized: collapsible sections, Backup & Storage merged with latest-first history.
- Groups list: rename any group from its detail view (pencil button, desktop + mobile) with empty/duplicate validation; sort chips (Created / Name A–Z / Highest balance / Most accounts) matching the ledger filter style.

### Fixed
- Member ledger header buttons (Download PDF, Show filters) had clipped/misplaced icons — the icon wrapper broke the button flex layout and the centering rules never matched (CSS Modules hashed a global class); icons now centered, hover expand verified.

## [1.11.0] - 2026-10-02

### Added
- Tap feedback on every button: one-shot click animations (pop, spin, twist, ring, nudge) with reduced-motion support — header gear spins, theme icon swaps in, plus twists, bell rings, back nudges.
- Text size option in Settings → Appearance (Small/Medium/Large): scales app type instantly, persists across reloads.
- Collapsible desktop sidebar: arrow folds to an icon rail, hovering peeks the full bar, choice persists; content glides to reclaim the space.
- Sidebar nav icons refreshed (Members, Groups, Loans) with matching mobile bottom-nav glyphs.

### Fixed
- Dashboard "New Transaction" icon and label wrapped to two lines after the animation rollout (single wrapper collapsed the flex gap; split into two spans sharing one key).
- Big amounts clipped on the left in Recent Transactions and ledger tables (dashboard cell now grows; ledger cells right-aligned with ellipsis).
- Sidebar and Settings page ignored the text size setting (fixed px mapped to fluid type tokens).

## [1.10.0] - 2026-10-02

### Added
- Splash screen now shows the app version (e.g. v1.10.0) bottom-center while loading.

## [1.9.0] - 2026-10-02

### Added
- Typography overhaul: Manrope headings, Inter tabular figures for money (replacing JetBrains Mono, kept only for numpad/dates/IDs), Anek Bangla for Bengali — all fonts self-hosted, offline-safe.
- Appearance theming: light/dark mode (header sun/moon toggle, System/Light/Dark in Settings), 6 accent colors, and per-mode background presets (Obsidian/Midnight/Forest/Plum + Paper/Sky/Sand/Mint). Persisted in settings, applied pre-paint with no flash; light mode ships a retuned semantic ramp and deeper glass for readability.
- Settings → Appearance section (theme 3-way + accent swatches + background dots) in both the Settings modal and the Settings page.

### Fixed
- Dashboard "+ New Transaction" label washed out on hover in light mode (ghost-button hover stomped the gradient; variant hover now re-asserts it).
- Account card text unreadable in light mode (cards keep dark bank gradients, ink pinned white); solid-violet buttons without adaptive text fixed under gold/teal accents.

## [1.8.0] - 2026-10-02

### Added
- Member-wise whole report (`/member/:id/report`, via the new Report button on member profiles): cover summary + one table per account + loan ledgers grouped by counterparty + owned Other Ledgers, with period presets, account picker, PDF/CSV/Print export. Balances derive from full history so filtered views stay correct.

## [1.7.0] - 2026-10-02

### Added
- Header search is now **global** — visible on every page (was dashboard-only) with a grouped results dropdown across Transactions, Accounts, Members, Loans, Groups, Tags and Other Ledgers (↑/↓ + Enter + Esc, click opens detail or navigates). Ledger-local searches still filter only their own ledger.

## [1.6.0] - 2026-10-02

### Added
- Loan ledger header now shows an **"Owed to"** per-lender breakdown (borrowed + outstanding each) when 2+ lenders fund one borrower — collapsed by default, smooth slide toggle, whole block clickable.
- Repayment form splits **"Paying Off"** (which lender's balance drops, oldest-first with spillover) from **"Credit To"** (any account the money lands in, prefills with the lender).
- Loan ledger header shows **available balance** of the borrower account (internal accounts only) and a **rename** pencil reusing the account editor.
- E2E `14-loan-rename` regression spec (create loan → open ledger → rename → header asserts).

### Fixed
- Clicking any loan card froze the app (rename refetch looped against the parent's loading skeleton); header name now derives live from the account store with no refetch.

## [1.5.0] - 2026-08-27

### Added
- **Setup wizard** — new `/setup` full-page 5-step flow (Welcome → Family → Money → How it works → Try it) with progress dots + teal bar, glass `r20 blur24` panel, `Skip → Dashboard`, and `setupComplete` flag in `AppSettings`. Family step saves `Member`s, Money step saves `Account`s, Try step offers `Start empty` or `Load sample family` (2 members, 2 accounts). Re-playable from `Settings → About → Replay setup wizard`.
- How it works now covers all 6 areas: `Dashboard`, `Ledger`, `Loans`, `Groups`, `Other Ledgers`, `Tags` — each with icon + one-line description, so new users learn where Loans/Groups/Other Ledgers/Tags live in the sidebar.

### Changed
- Other Ledgers index owner groups: better spacing (`gap 12` header, `16px` section gap, thin `1px` line bottom) and `28px` avatar — groups now appear as bordered glass containers.

### Fixed
- Other Ledgers delete now uses the app’s standard `Modal`/`BottomSheet` confirmation (centered, `Cancel` + coral `Delete`, `30-day Recycle Bin` copy) instead of `window.confirm` — for ledgers (index card + detail header + mobile) and entries (edit modal).

## [1.4.0] - 2026-08-27

### Added
- **Other Ledgers v1** — new section `/other-ledgers` with ledger index and detail — create ledger (name 3–50, starting date, owner Member or Other person, opening balance), grouped by owner on the index (avatar + count · total per owner), two entry points (global + picker with ledger dropdown and per-ledger + pre-locked), `Date|Description|Debit|Credit|Balance` table with running balance from full history, search, `SegmentedTabs` All/Debit/Credit, `MobileLedger` on mobile, PDF export, Recycle Bin, and `OPFS` persistence. Schema `other_ledgers` + `other_ledger_entries` (incl. `linkedTransactionId` NULL for future dual-post V2 — see `docs/plans/OTHER_LEDGERS_FUTURE_V2.md`).
- Loan ledger now grouped into **Internal** and **External** glass containers (same as Other Ledgers) with sort via picker `Alphabetically / Last transaction / Last repayment` — avatars now use the same `ledgerGradient` as Other Ledgers.
- Group ledger page now mirrors the Other Ledger detail — same header (`LedgerSearch` + `Download PDF` hover-expand + filters) and `MobileLedger` structure.

### Changed
- Other Ledger index header: title removed, short search + Entry + New Ledger in one right-aligned line; ledger count left.
- Other Ledger detail header: second back button removed (banner back remains), `Download PDF` and `+ Add Entry` now `30px` circles expanding to pills on hover (same as account ledger `pdfBtn`), filter redesigned to glass pills with icons, three header icons now same `30px` size.
- Entry form: description field taller (`textarea rows=3 minHeight 88px`), Date now `DatePicker` (`Popover` + `Calendar` `PPP`) same as transaction wizard, Tag now centered `pickerOverlay/pickerModal` (was absolute dropdown).

### Fixed
- Header breadcrumb for `Groups/<id>` and `Other Ledgers/<id>` now shows names (`Groups/<Group Name>`, `Other Ledgers/<House Rent>`) instead of raw UUIDs — `AppLayout` now reads `OtherLedgerStore` + `getAccountGroupsWithMembers()`.

## [1.3.0] - 2026-08-26

### Added
- Dedicated Settings page `/settings` with sub-navigation — General, Dashboard, Activity, Backup, Storage, About — like any other page (not a modal), gear `18px` in header right navigates there.
- Dashboard visibility toggles in Settings → Dashboard — show/hide *Where Your Money is*, *Recent Transactions*, *Active Loans*; hidden panels free space via `data-cols` `3fr 6fr 3fr → 1fr 1fr → 1fr`.
- Activity log in Settings → Activity — last `1000` user actions, paginated `10` per page in `320px` scroll container (`logContainer`), `Prev/Next`.
- App log backdoor in Settings → About — `Detailed logs` switch (`Verbose` → `Detailed logs`), `Export Logs` NDJSON download, `Clear Logs`, paginated `10` per page with `level/cat`.

### Changed
- Dashboard action bar now shows two buttons only — *New Transaction* + *Quick Loan* share `50/50` (`flex:1`); Settings entry removed (header gear is entry).
- Settings page duplicate title removed — header already shows `Back + Settings` breadcrumb.

## [1.2.0] - 2026-08-26

### Added
- Unified search: dashboard searches **all** transactions (`description + amount + type + account + member + tags + date`) via shared `matchesTx`, debounced `200ms`, with violet `Highlight` (`<mark>`). Each ledger (`MemberProfile`, `GroupLedger`, `LoanDetail`, `TagLedger`) has its own ledger-scoped search (same fields, highlighted) with pagination fixed (search **before** slice so no hidden hits). Groups/Loans/Members/Recycle lists decoupled from global `useSearchStore` (`effectiveSearch = mobileSearch` only) and highlight their names.
- Shared search utils: `highlight.tsx` + `search.ts` + `useDebouncedValue.ts`; token `--color-primary-mark` `/0.28`.
- Single app logo: header `MoneyFlows` gradient transplanted into sidebar `brandSlot`; header off-dashboard shows `Back + breadcrumb` (header owns navigation, sidebar owns brand).
- Splash `36px` now matches sidebar `22px` logo (`135deg primary→income` gradient `Money` + `500` secondary `Flows`).

### Changed
- Playwright harness: `@playwright/test 1.54`, `playwright.config.ts` with `reuseExistingServer`, `workers:4`, `auth.setup.ts` tiny deterministic DB (`12` txs) via `seedTinyB64`, `storageState` reuse — `12s` parallel vs `2min` MCP serial.
- Layout gaps tightened so every section gets more room: outer frame `24→16`, header→content & content children `24→12`, dashboard duplicate date column removed (desktop hides `txType` badge, keeps `shortDate`).
- Header search hidden off-dashboard (`isDashboard && searchWrap`), blank center `flex:1` filler keeps `right` at edge.

## [1.1.0] - 2026-08-24

### Added
- **Account editing and deletion** (T-102/T-103): pencil action on every account card
  (desktop + mobile selector) opens an edit modal — rename, change type, or delete.
  Deletion is a soft-delete into the Recycle Bin with an inline confirm that shows how
  many transactions/loan movements reference the account; restorable for 30 days.
- Deleted-account fallback: ledgers, reports and detail views now render
  "(deleted account)" instead of raw IDs for history rows.

### Fixed
- Add-Account: new account's balance now shows immediately after saving (accounts store
  is refreshed instead of waiting for the next remount).

## [1.0.0] - 2026-08-24

First stable release. Family finance ledger with unified loan tracking, mobile-first
glassmorphism UI, local-first SQLite persistence hardened with OPFS storage, automatic
restore points and folder sync, PWA support, and a full regression test suite.

### Added
- **OPFS-backed storage layer** (`src/infrastructure/database/storage/`): database and
  auto-backup snapshots persist as real files in the Origin Private File System, with a
  one-time migration from the legacy localStorage copy (kept as transition mirror) and an
  automatic fallback for browsers without OPFS.
- Boot **watchdog**: hung startups show a Database Error screen with *Restore Latest
  Backup* / *Start Fresh* actions instead of an endless splash.
- Storage health row in Settings → backend type, last save time, failure warning.
- App version footer in Settings plus a "What's New" modal shown once per release,
  re-openable anytime from Settings.
- Vitest suite (19 tests) covering loan-ledger balance math, storage adapters, digests,
  and the no-mutation contract for shared sort helpers.
- Unified loan system: per-debtor stacks, repayment progress, ledger with running
  balance from full history, PDF export.
- Mobile-first UI across all screens (bottom sheets, bottom nav, responsive tables).
- Data safety: ring-buffer restore points on save, integrity digests, optional folder
  sync via the File System Access API.

### Changed
- Service worker uses a **network-first** strategy for pages and scripts with offline
  cache fallback; only content-hashed `/assets/*` stay cache-first (`moneyflows-v2`).
- Loan ledger running balance is computed from the **full transaction history**, then
  filtered for display; negative intermediates render as-is.
- Persistence is **write-coalesced** (per-tick flush + explicit op-end flush) instead of
  serializing the database after every SQL statement.
- Snapshot digests use SHA-256 where `crypto.subtle` exists, falling back to a
  deterministic FNV fingerprint on insecure origins.

### Fixed
- **BUG-7**: deleting transactions could permanently freeze an installed PWA on the
  splash screen (quota-swallowing saves + invisible blocking dialog during recovery).
- Loan-ledger row-wise Balance mismatch — shared array was sorted in place before
  balances were computed; totals also lied under filters.
- Edit-modal hooks-order crash; hardcoded member fallback now honors the primary-member
  setting; counterparty creation errors surface inline.

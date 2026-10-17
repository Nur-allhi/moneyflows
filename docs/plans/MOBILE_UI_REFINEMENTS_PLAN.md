# Mobile UI Refinements Plan

**Source:** Playwright audit on 2026-10-17 (viewport 390×844, fresh guest profile, screens: wizard, dashboard, members, member detail + linked accounts, loans, other ledgers index/detail + entry sheets, settings, More sheet, light mode).
**Scope rule:** every change must satisfy `docs/DESIGN_IDENTITY.md` (§17 checklist) and the repo code rules (CSS modules + tokens only, ≤300 LOC, min-not-max).
**Status legend:** open / in-progress / done / deferred.

## Context bugs (tracked in `docs/BUGS.md`)

- **BUG-19 — fixed** (`eff4d6c`): wizard starting balances wiped on reload; now recorded as `Opening Balance` transactions.
- **BUG-20 — closed 2026-10-17 (resolved-by-BUG-19):** not reproducible on current code (dashboard/members list/profile hero/mobile modal/desktop dropdown all agree, before and after reload); regression guard in `e2e/flows/03-accounts.spec.ts`. No action needed from this plan.

## Refined work list (ranked)

### M-01 · Other Ledgers index — broken mobile header map — **done** (`feature/mobile-refinements`)
- Observed: "N ledgers" count label collides with the search field at 390px (overlaps its left border); `+ Entry` renders even with **zero ledgers** (dead CTA — there is nothing to add to); empty state is a single tiny left-aligned line ("No ledgers yet. Create your first register.") lost under two cramped right-aligned buttons.
- Target: `src/otherLedgers/presentation/screens/OtherLedgersIndex.tsx` + its CSS module.
- Acceptance: count label sits above the search row (stacked), no overlap at 320/360/390px; `+ Entry` hidden (or visually demoted) when `ledgers.length === 0`; empty state centered with a clear single primary CTA (`New Ledger`); tap targets ≥44px.

### M-02 · Detail screens — header shows no page title — **done** (`feature/mobile-refinements`)
- Observed: member profile (`/member/:id`) and other-ledger detail (`/other-ledgers/:id`) render a back arrow + icon pills with an **empty header center**; list screens (Members, Loans, Settings, other-ledgers index) all show a title. You can't tell which member/ledger you're in from the header.
- Target: header title/breadcrumb logic in `src/App.tsx` (title map built from route segments) and `src/presentation/components/Header.tsx` mobile rules.
- Acceptance: every detail route shows its subject name (member/ledger/group/tag/loan) in the mobile header; long names ellipsize; no layout shift vs. list screens.

### M-03 · Emoji used as UI icons — **done** (`feature/mobile-refinements`)
- Observed (violates DESIGN_IDENTITY §2 "no emoji icons"): wizard feature chips 💳 📒 🔒 and step cards 👥 etc.; dashboard/member/loans empty states 📋 💳 💵; other-ledger detail header "🔔"-labeled button; "↗ Net" glyph on dashboard.
- Target: `SetupWizard.tsx`, `Dashboard.tsx`, `MemberProfile`/`LedgerSection`, `LoansScreen` empty states, `OtherLedgerDetail.tsx`, existing `labels.ts` icon maps → replace with inline SVG set (same stroke style as BottomNav icons, 24 viewBox, 1.8 stroke).
- Acceptance: `grep` for emoji codepoints in `src/presentation/**` and `src/otherLedgers/**` returns zero UI matches; DESIGN_IDENTITY §17 pass.

### M-04 · Other Ledger detail — orphaned empty-state buttons — **done** (`feature/mobile-refinements`)
- Observed: with zero entries, a `+` FAB and a trash button float mid-screen, unanchored and disconnected from any row; hint text uncentered, huge dead space below the table header.
- Target: `src/otherLedgers/presentation/screens/OtherLedgerDetail.tsx`.
- Acceptance: empty state is a composed block (illustration/icon + hint + one primary "Add first entry" button); delete affordance lives with content rows (or a toolbar), not floating; ≥44px targets.

### M-05 · Zero values rendered in danger red — **done** (`feature/mobile-refinements`)
- Observed: "TOTAL OUTSTANDING 0 BDT" in red on Loans; dashboard "TOTAL IN BANKS / ACTIVE LOANS" turn red when 0. Danger color is interpreted as an alarm, not a zero.
- Target: `LoansScreen.tsx` summary tile + dashboard summary tiles color rules.
- Acceptance: 0 balances/loans render in neutral (secondary) tone; danger red reserved for negative owed values; income/expense green/red (typed semantics) unchanged.

### M-06 · Touch targets below 44px — **done** (`feature/mobile-refinements`)
- Observed: ledger delete trash icon buttons (~30px) — on index cards (corner) and detail (floating circle); memory aid: UNGuideline `touch-target-size`.
- Target: `OtherLedgersIndex.tsx`, `OtherLedgerDetail.tsx` (+ CSS).
- Acceptance: all icon-only interactive elements ≥44×44 hit area (padding can extend beyond visual size).

### M-07 · Validation constraints leak into visible copy — **done** (`feature/mobile-refinements`)
- Observed: "Ledger Name (3–50)" field label, "Description (1–200)" placeholder, and "Opening Balance" label not styled like sibling uppercase labels (STARTING DATE / MEMBER).
- Target: `CreateLedgerModal.tsx`, `AddEntryModal.tsx`, `RenameLedgerModal.tsx` (inline `style={{}}` there also violates DESIGN_IDENTITY §2/§14 — fix while touching, per "touch when next edited" spirit since M-01..M-04 bring us there).
- Acceptance: user-facing labels/placeholders carry guidance, not validation ranges; errors stay in validation surfaces; label casing consistent.

### M-08 · Setup wizard — duplicated progress + dead space — **done** (`feature/mobile-refinements`)
- Observed: dots row **and** a segmented progress bar stacked above the card; step-0 card sits ~200px below the top (poor vertical centering) with the dots row left-aligned.
- Target: `SetupWizard.tsx` + `SetupWizard.module.css`.
- Acceptance: exactly ONE progress indicator (keep the funded bar, drop dots or merge); card vertically centered on📱 at all four steps; dots+bar rows visually consistent left/right alignment.

### M-09 · Member profile — "All Accounts (0)" badge suspicious — **done** (`feature/mobile-refinements`)
- Observed: ledger toolbar shows "All Accounts **0**" while "Linked Accounts **2**" in the same session. May be a count of shown/filtered rows by design — verify intent before changing anything.
- Target: `src/presentation/screens/memberProfile/LedgerSection.tsx`.
- Acceptance: badge shows a truthful count (accounts or visible rows); if by design, rename label so the two badges can't be misread as contradiction.

## Execution order (proposed)

M-01 → M-02 → M-04 + M-06 + M-07 (same touch zone) → M-03 (sweep) → M-05 → M-08 → M-09 (verify-only).

Gates per ticket: typecheck, scoped eslint `--max-warnings 0`, `npx vitest run src`, build, DESIGN_IDENTITY §17, Playwright re-check at 390×844.

---

**Revision:** 2026-10-17 — audited names only, no code touched yet. Update statuses as each M-xx lands.

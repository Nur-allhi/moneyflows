# MoneyFlows — Design Identity

**Status:** Canonical · **Version:** 1.0 · 2026-08-26
**Source of truth:** `DESIGN_FILES/*.html` (pixel spec) → `DESIGN.md` (derived tokens) → **this file** (enforceable rules).
If any detail conflicts, `DESIGN_FILES/*.html` wins, then `DESIGN.md`, then this document.

> Every future component, modal, dropdown, icon, or screen **MUST** pass the checklist in §10 before merge. Design identity is not optional — it is the reason the app feels familiar as it scales.

---

## 1. Design DNA

**Obsidian glassmorphism.** Panels float on `oklch(14% 0.015 260)` obsidian with `radial-gradient(ellipse 70% 60% at 50% 20%, oklch(65% 0.04 250 /0.35))` glow. Every container is `oklch(22% 0.02 260 /0.55)` + `blur(20px)` + `1px oklch(100% 0 0 /0.10)` + `radius 12px`. Accents are sparse (max 2/screen): **violet** = interaction, **teal/coral/gold/purple** = semantics (income/expense/cash/loans). Numerics are `JetBrains Mono tabular-nums`. Motion is `0.15-0.35s ease`.

---

## 2. Tokens — The Only Values Allowed

All values come from `src/presentation/styles/tokens.css:1-89`. Do not invent colors, spacing, radii, or shadows.

| Family | Tokens | Notes |
|--------|--------|-------|
| **Color — base** | `--color-bg`, `--color-bg-glow`, `--color-surface`, `--color-surface-hover`, `--color-border`, `--color-text`, `--color-text-secondary` | `oklch` only. `surface-hover` = `oklch(100% 0 0 /0.08)`. |
| **Color — accents** | `--color-primary` (violet `62% 0.22 290`), `--color-primary-glow` (`/0.12`), `--color-income`/`--color-teal` `65% 0.15 170`, `--color-expense`/`--color-coral` `62% 0.18 30`, `--color-cash`/`--color-warning` `75% 0.15 85`, `--color-purple` `55% 0.18 290`, `--color-success` `65% 0.15 150`, `--color-danger` `58% 0.18 30` | Alias pairs are intentional. Use semantic alias (`--color-income` for money in, `--color-expense` for money out). |
| **Gradient — interaction** | `linear-gradient(135deg, var(--color-primary), oklch(55% 0.22 290))` | Used for: active `SegmentedTabs` `SegmentedTabs.module.css:56-60`, `btnSave` `Modal.module.css:135`, `FAB` `FAB.module.css:9-13`, `submitBtn` `TransactionFormModal.module.css:297` |
| **Gradients — account/counterparty** | `ACCOUNT_TYPE_GRADIENT` / `ACCOUNT_TYPE_GRADIENT_THREE` / `ACCOUNT_TYPE_ACCENT` in `src/presentation/constants/labels.ts:13-40` | Bank `#1a237e→#283593`, Savings `#004d40→#00695c`, Mobile `#d81b60→#e91e63`, Cash `#37474f→#455a64`, Business/Counterparty `#4a148c→#6a1b9a`. Never hardcode stops elsewhere. |
| **Spacing** | `--space-1:4` `--space-2:8` `--space-3:12` `--space-4:16` `--space-5:20` `--space-6:24` `--space-8:32` `--space-10:40` `--space-12:48` `--space-16:64` | No `10px`/`13px` literals — round to nearest space token. |
| **Radii** | `--radius-sm:8` `--radius-md:12` `--radius-lg:16` `--radius-xl:20` `--radius-pill:9999` | Panels `md`, cards `sm`, mobile panels `lg` `glassmorphism.css:191-195`. Pills/chips `pill`. |
| **Shadows** | `--shadow-sm: 0 2px 8px /0.3`, `--shadow-md: 0 4px 16px /0.35`, `--shadow-lg: 0 8px 32px /0.4`, `--shadow-glow: 0 0 24px var(--color-primary-glow)` | Accent glows `0 0 28px /0.15` for metric cards `Dashboard.module.css:53-60`. |
| **Typography scales** | `--font-display: 'Inter','Outfit'`, `--font-body: 'Inter','Hind Siliguri'`, `--font-mono: 'JetBrains Mono'` · `h1 clamp 1.5-2.5rem 700 -0.02em` → `h6 0.81-0.94rem 600` · `.text-label uppercase 0.68-0.81rem 500 0.05em muted` · `.text-mono 1-1.35rem 500 -0.02em` · fluid `text-3xs(7-8px)..7xl(20-28px)` | `typography.css:1-66` `tokens.css:53-77`. Import `Hind Siliguri + Inter + Outfit + JetBrains Mono` `typography.css:1`. |
| **Breakpoints** | `360 / 390 / 430 / 600 / 820 / 1024 / 1366 / 1440 / 1920` — behavior flip at `768` | `tokens.css:43-51` `DESIGN.md:263-273`. See §9. |
| **Motion** | `--transition-fast:0.2s ease`, `--transition-normal:0.3s ease`, `--transition-slow:0.4s ease`, `--animation-shimmer:1.5s ease-in-out infinite` | `tokens.css:78-82`. Details in §8. |
| **Scrollbar** | `6px pill thumb oklch(100% 0 0 /0.12) → /0.2 hover` | `reset.css:38-59` |
| **Tailwind aliases banned** | `tailwind.css:5-33` duplicates (`--color-card`, `--color-input`, `--color-ring`). New code reads `tokens.css` only. |

**Rule:** No hex, no `rgba()` literals outside tokens, no hardcoded spacing/radii. Grep for `#[0-9a-f]` and `style={{` in review.

---

## 3. Principles

1. **Glass floats.** Every container is `surface blur + border`. Hover = glow, not color swap.
2. **Violet = interaction.** Violet/primary is reserved for active, focus, hover glow, CTAs. Teal = income, coral = expense, gold = cash, purple = loans — never decoration. Max 2 accents per screen (`brand-spec.md:42`).
3. **Mono owns money.** Every amount uses `JetBrains Mono tabular-nums` via `formatAmount()` `src/presentation/utils/format.ts` + `AmountInput` `FormField.tsx:74-91`. Body text never renders numbers.
4. **Label is an uppercase whisper.** `11px 500 0.08em var(--color-text-secondary)` above every field/metric `FormField.module.css:9-14`.
5. **Sheets on mobile, modals on desktop — same chrome.** `≤768 BottomSheet slideUp 0.35s + handle 36×4` vs `>768 Modal fadeIn 0.25s 520px blur24 radius20` — identical header/title/close/footer.
6. **Rows glow, never zebra.** Hover `oklch(100% 0 0 /0.04) + 0 0 20px var(--color-primary-glow)` `LedgerTable.module.css:97-100`.
7. **Everything expands.** Filter trays `grid 0fr→1fr 0.3s`, search bars `max-height 0→200 0.3s`, icon buttons `36→90 pill` — never instant pop.

---

## 4. Surfaces

**Base recipe — copy verbatim:**

```css
.panel {
  background: var(--color-surface);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  transition: box-shadow var(--transition-normal), background var(--transition-normal);
}
.panel:hover { box-shadow: var(--shadow-glow); background: var(--color-surface-hover); }
@media (max-width: 768px) { border-radius: var(--radius-lg); backdrop-filter: blur(16px); }
```

| Surface | Implementation | Ref |
|---------|----------------|-----|
| `GlassPanel` / `.glass-panel` | Above recipe + `glowViolet/gold/purple: 0 0 24px /0.12` + `padSm/Md/Lg: space-3/4/5` | `GlassPanel.tsx:1-48` `GlassPanel.module.css:1-56` `glassmorphism.css:1-29` |
| `.glass-card` | `+ padding var(--space-4)` `shadow-md → glow`, mobile `padding 20px` | `glassmorphism.css:15-29,191-202` |
| `.glass-input` | `rgba(255,255,255,0.03) blur12 radius-sm pad space-3/4 0.875rem body` | `glassmorphism.css:31-57` |
| Sidebar/Header | Same surface `220px / 16px pad 12/14` `blur20 radius-md shadow-lg` | `Sidebar.module.css:1-13` `Header.module.css:1-11` |

---

## 5. Typography

- **Headings:** `font-display 600-700` `h1 1.5-2.5rem -0.02em`, `h2 1.25-1.75rem`, down to `h6 0.81-0.94rem` — all `var(--color-text)` `typography.css:3-39`.
- **Body:** `.text-body font-body base/1.5 text`, `.text-secondary muted`, `.text-label uppercase 0.68-0.81rem 500 0.05em muted` `typography.css:41-65`.
- **Money:** `.text-mono font-mono 1-1.35rem 500 -0.02em tabular-nums` · Ledger `13px mono tabular` + `currencyLabel 8px body 0.55 0.04em` `LedgerTable.module.css:182-199` · Dashboard `text-7xl mono 1.2 -0.01em` `Dashboard.module.css:35-42`.
- **Global body:** `font-body base 1.5 + bg + bg-glow fixed min-h 100vh antialiased -webkit-tap-transparent smooth-scroll` `reset.css:9-36`.
- **Formatting:** Use `formatAmount(n, locale, currency)` and `shortDate(iso, locale)` from `src/presentation/constants/dates.ts` + `src/presentation/utils/format.ts` — hardcoded `'BDT'` / `Intl.NumberFormat('en-IN')` is banned `FRONTEND_SPEC.md:32`.

---

## 6. Interactive States — All Four Required

Every interactive element **MUST** implement hover, focus-visible, active, disabled. Missing any one is a defect.

| State | Token | Example refs |
|-------|-------|--------------|
| **hover** | `background: var(--color-surface-hover)` + `box-shadow: 0 0 20px var(--color-primary-glow)` + `border-color: var(--color-primary)` if bordered; cards `translateY(-2px)` | `AccountCard.module.css:22-25` `Sidebar.module.css:45-49` `Modal.module.css:74-78` |
| **focus-visible** | `outline: 2px solid var(--color-primary); outline-offset: 2px` (inset `-1px` inside inputs) | `FormField.module.css:47-50` `Modal.module.css:86-88` `Header.module.css:107-110` |
| **active** | `background: rgba(255,255,255,0.08)` or `transform: scale(0.92)` for FAB/icons | `FAB.module.css:20-23` `Sidebar.module.css:57-59` |
| **disabled** | `opacity: 0.5; cursor: not-allowed; pointer-events: none` | `glassmorphism.css:54-57` `button.tsx:7` |
| **selected/active** | `linear-gradient(135deg, var(--color-primary), oklch(55% 0.22 290)) color #fff + shadow-glow` + Sidebar `left-border 2px violet + /0.08 bg` + Avatar `inset -3px border 2px` | `SegmentedTabs.module.css:56-60` `Sidebar.module.css:66-70` `Avatar.module.css:46-53` |

`will-change: box-shadow | transform | background-position` only on animated nodes `GlassPanel.module.css:9`.

### Feedback states

- **Loading:** Never spinners on glass. Shimmer `linear-gradient(90deg, surface 25%, rgba(255,255,255,0.08) 50%, surface 75%) size 200% animation shimmer 1.5s` — 9 variants `.skeleton-text/title/metric/row/card/summary/stack/profile/wizard` `glassmorphism.css:59-117`.
- **Empty/Error:** Centered `flex gap12 pad40 icon 40 0.4 / 32 0.5` + `.retry-btn pad10/20 radius-sm border surface 13/500 hover glow focus 2px offset2 active /0.08 disabled 0.5` `glassmorphism.css:119-189`.

---

## 7. Navigation

| Element | Spec | File |
|---------|------|------|
| **Sidebar** | `220px blur20 radius12 shadow 0 8px 32px /0.5 pad 24/0` · item `flex gap12 pad10/20 13/500 muted left-border 2px transparent transition fast` · active `violet text + border + /0.08 bg` · icon `24×20` | `Sidebar.module.css:1-79` |
| **Header** | `flex gap16 pad16/24 surface blur20 radius-md` · search `max400 pad8/36 bg surface border radius-sm 13 focus glow` · add `36 circle gradient` · notif/back `36 circle border /0.04` · mobile `@768: bg none, 40px pills, hide search/date` | `Header.module.css:1-206,257-351` |
| **BottomNav** | `fixed bottom h64 safe blur20 border-top z200 flex space-around` · item `44 min 10/400 muted gap2 stacked` · active `primary` · icon `20` · hidden `@769` | `BottomNav.module.css:1-57` |
| **FAB** | `fixed bottom calc(80+safe) right16 56 circle gradient shadow 0 4px 20px /0.3 icon 28 -2 active scale 0.92` · hidden `@769` | `FAB.module.css:1-35` |
| **SegmentedTabs** | `bg /0.05 radius10 pad3 gap3` · tab `flex1 pad10/14 text-md 500 radius8 muted nowrap` · active `gradient+glow+popIn 0.25s scale0.92→1.04` | `SegmentedTabs.module.css:1-67` |
| **PageTransition** | `pageEnter 0.3s ease-out translateX24 opacity0→1` on route change | `PageTransition.module.css:1-14` |

---

## 8. Forms

- **Wrapper:** Every field uses `FormField` `FormField.tsx:12-20` — label `11px uppercase 0.08em muted 500` `FormField.module.css:9-14` + error `11px var(--color-expense)` `FormField.module.css:135-139` cleared on edit.
- **Input chrome:** `FormField.module.css:input` — `100% pad14/16 surface blur12 border radius10 body 15px / textarea 60px` · hover `border primary` · focus `border primary` + outline `focus-visible 2px inset` · disabled `0.5`.
- **Select (deprecated native):** Native `FormSelect` with `selectWrapper clip-path triangle 10×6 muted` `FormField.module.css:67-78` is **deprecated** — new pickers use the modal picker pattern below.
- **Amount:** `AmountInput` `FormField.tsx:74-91` — `amountWrap flex blur12 radius10 focus-within border primary + 0 0 0 3px /0.15` · prefix `currency display 13/600 muted 0.02em` · input `mono 24/600 tabular` `FormField.module.css:95-128`.
- **SettingsModal:** `body 8/24 gap16 scroll` · `fieldLabel 12 uppercase 0.08em` · `input/select 12/14 pad14 blur12 radius10 14` · `actionBtn flex1 12/14 radius10 13/600 hover primary+glow` · `restoreBtn 6/14 radius8 hover warning glow` · mobile `100vw/dvh radius0` `SettingsModal.module.css:1-311`.
- **TransactionForm:** Dual layout `mobileLayout block / desktopLayout none @768 flip` `TransactionFormModal.module.css:1-8` · submit `100% 16 gradient 16/600 radius10 hover 0.9 glow` `TransactionFormModal.module.css:292-326` · type strip `gap6 btn flex1 8/12 radius8 13/500 transparent → gradient active` `TransactionFormModal.module.css:768-807`.

---

## 9. Modals, Sheets, Overlays, Dropdowns

### Responsive pair (mandatory)

```tsx
const isMobile = window.innerWidth < 768;
isMobile
  ? <BottomSheet isOpen onClose={onClose} title="...">{content}</BottomSheet>
  : <Modal isOpen onClose={onClose} title="...">{content}</Modal>
```

Like `TransactionDetailModal.tsx:195-247`. Escape closes, overlay click closes, `handleFormFocus` on body `Modal.tsx:60`.

| Pattern | Spec | Ref |
|---------|------|-----|
| **Modal** | `overlay fixed inset bg 0.55 blur4 z300 fadeIn 0.2s` · `modal 520/90vw/85vh oklch 16% /0.75 blur24 border /0.10 radius20 shadow 24/80 + 1px /0.06 fadeIn 0.25s translateY16 scale0.97→1` · header `20/24 title 20/600 -0.01em` · close `32 circle border /0.04 muted 16 → hover /0.1 text+glow` · body `16/24 gap16 scroll` · footer `gap10 pad0/24/20 btnCancel /0.06 vs btnSave gradient 13 radius10` | `Modal.module.css:1-142` `Modal.tsx:48-70` |
| **BottomSheet** | `overlay 0.6 blur4 z300` · `sheet fixed bottom bg radius20/20 border 1px max90% flex column slideUp 0.35s` · handle `36×4 /0.2 margin10 auto12` · header `0/16/16 title18/600` · body `0/16/20 gap12` | `BottomSheet.tsx:27-39` `BottomSheet.module.css:1-67` |
| **TransactionForm overlay** | `overlay fixed blur4 /0.55` · `modal centered 520/90vw/85vh blur24 radius20 + modalFadeIn 0.25s` | `TransactionFormModal.module.css:329-365` |
| **Closing animation** | `sheet slideDown 0.3s / overlay fadeOut 0.25s / modal modalFadeOut 0.25s scale0.97+16px` `ModalRenderer closing exit 0.25s` — never instant unmount | `TransactionFormModal.module.css:504-529` `ModalRenderer.module.css:18-21` |
| **Splash** | `fixed inset z9999 flex center bg+radial glow + fadeOut 0.5s` · wordmark `36/700 -0.02em cursor 3×36 blink 0.8s step-end` | `SplashScreen.module.css:1-52` |

### Dropdowns / Pickers / Popovers

**New dropdowns MUST use the modal picker pattern** — the native `FormSelect` chevron is deprecated.

| Picker | Spec | Ref |
|--------|------|-----|
| **SelectAccountModal trigger** | `14/10 bg blur12 radius10 border 14 arrow 12 muted` | `TransactionFormModal.module.css:549-620` |
| **Picker overlay** | `fixed inset bg /0.45 blur4 z350 fadeIn 0.2s` | `TransactionFormModal.module.css:625-640` |
| **Picker modal** | `360/85vw/70vh blur24 radius16 shadow 0 24px 80px /0.5 + pickerSlideIn 0.2s 8px scale0.97` · header `border` · item `12/14 radius10 hover /0.06 active /0.12` | `TransactionFormModal.module.css:640-766` |
| **Calendar (shadcn)** | `DayPicker ghost variant cell radius-md today muted selected primary` | `calendar.tsx:31-133` |
| **Popover (shadcn)** | `popover bg 22% /0.95 blur border radius` | `tailwind.css:13-14` `popover.tsx` |
| **Placement** | `position: fixed/absolute z300-350 max-height 70vh scroll min-width 360 (account picker) or 280 (generic)` — never clipped by parent overflow. | — |

### Dropdown recipe

```tsx
const [open, setOpen] = useState(false);
<button className={styles.trigger} onClick={() => setOpen(true)}>
  {value ?? 'Select...'} <span className={styles.arrow}>▾</span>
</button>
{open && <>
  <div className={styles.overlay} onClick={() => setOpen(false)} />
  <div className={styles.picker} role="listbox">
    {items.map(i => <button key={i.id} role="option" className={styles.pickerItem} onClick={() => { onChange(i); setOpen(false); }}>{i.label}</button>)}
  </div>
</>}
```
CSS: `trigger pad14/10 blur12 radius10 14 border` → hover `primary` focus `outline 2px offset2`, `overlay fixed inset bg 0.55 blur4 z350`, `picker 360/85vw blur24 radius16 shadow`.

---

## 10. Ledger, Cards, Progress

| Component | Spec | Ref |
|-----------|------|-----|
| **LedgerTable** | Container `surface blur20 border radius-lg overflow hidden + fillHeight flex1` · virtual `height var(--total-height) absolute top var(--row-top)` · header `grid 55 55 1fr 55 55 55 gap8 pad12/14 10 uppercase 0.08em 600 border-bottom` desktop `90 pad10/20` · row `same grid pad10/14 13 align start border-bottom /0.04 transition fast pointer hover glow+/0.04` · cells `date 12 muted tabular / desc 500 / typeCell 11/600 uppercase center (teal/coral/primary)` · amounts `debit expense / credit income 13 mono + currencyLabel 8 body 0.55` · empty `40/20 center 13 muted` | `LedgerTable.module.css:1-219` `config.ts:15-17 ROW 54/56 OVERSCAN 3` |
| **MobileLedger** | Compact single-column treatment — same tokens, reduced grid | `MobileLedger.module.css` |
| **AccountCard** | `min180 h130 radius14 pad12 flex column relative overflow hidden pointer transform fast bg --card-bg ::before border overlay cardIcon 16/0.6 hover translateY -2px glow selected glow+inset 2px primary name14/600 -0.01em type10 uppercase 0.08em 0.65 balance mono 16/600 tabular chip 32×22 gold #ffd700→#ffecb3 actions top8 right8 gap4 btn24 circle` | `AccountCard.module.css:1-133` |
| **LoanCard** | `flex gap10 pad16 surface blur12 border radius14 pointer hover primary glow top space-between avatar 40 gradient #4a148c→#6a1b9a name text-lg/600 badge text-sm uppercase primary amount mono text-xl/700 expense meta text-base muted` | `LoanCard.module.css:1-93` |
| **ProgressBar** | `gap6 header 12 muted track 100% h12 bg /0.06 radius999 overflow fill w var(--progress-width) gradient income→150 radius999 width 0.6s + ::after 20px /0.2 gloss` | `ProgressBar.module.css:1-42` |
| **LedgerSearch** | `relative input surface blur12 radius10 pad 10/36 13 focus glow clear 12 circle` + `filter chips pill 5/14 radius999 13/500 /0.06 → active primary` | `LedgerSearch.module.css` `MemberProfile.module.css:700-800` |

---

## 11. Icons

- **Source:** Inline SVGs `stroke currentColor 1.8 round/round` always. No external icon library.
- **Sizes:** `16` default inline, `12` clear, `18` header, `20` nav/sidebar, `24` FAB/detail hero, `28` FAB icon `FAB.module.css:26`. Avatar `24(10px)/36(13px)/48(16px)/72(24px)` `Avatar.module.css:55-77`.
- **Color:** `currentColor` inherits `muted → text on hover`, violet on active. Never hardcoded fill except avatar/loan gradients.
- **Tx semantics:** Emoji only for `TX_TYPE_ICON` `labels.ts:48-58` (`💵 income/lend`, `💸 expense/loan_issue`, `🤝 transfer`). New tx types add one emoji there.
- **Expand-to-label:** Icon-only actions expand: `36→90 pill + label opacity0→1 max0→60 0.3s` hover `TransactionDetailModal.module.css:92-123` — use for `Ledger/Edit/Delete` like `TransactionDetailModal.tsx:224-242`.
- **Banned:** Font-icon, mixed stroke widths `2` vs `1.8`, image icons.

---

## 12. Motion

| Animation | Spec | Ref |
|-----------|------|-----|
| `overlayFadeIn` | `0.2s ease opacity 0→1` | `Modal.module.css:15-18` |
| `slideUp` | `0.35s ease-out translateY100→0` (sheet enter) | `BottomSheet.module.css:36-39` `TransactionFormModal.module.css:31-34` |
| `modalFadeIn` | `0.25s translateY16 scale0.97→1` (desktop modal, picker) | `Modal.module.css:39-42` `TransactionFormModal.module.css:362-365,763-766` |
| `popIn` | `0.25s scale0.92→1.04→1` (segmented active) | `SegmentedTabs.module.css:63-66` |
| `pageEnter` | `0.3s ease-out translateX24 opacity0→1` | `PageTransition.module.css:5-13` |
| `shimmer` | `1.5s ease-in-out -200%→200% bg-pos` | `glassmorphism.css:59-62` |
| `blink` | `0.8s step-end 50% 0` (splash cursor) | `SplashScreen.module.css:50-52` |
| **Close** | `slideDown 0.3s / fadeOut 0.25s / modalFadeOut 0.25s scale→0.97` + `modalExit 0.25s` | `TransactionFormModal.module.css:516-529` |
| `grid 0fr→1fr 0.3s` | Filter tray / slideField expand | `TransactionFormModal.module.css:219-226` |
| `max-height 0→200 + opacity 0.3s/0.2s` | Search/tray reveal | `MemberProfile.module.css:919-943` |

Rules: Durations `0.2 fast / 0.25 modal / 0.3 page / 0.35 sheet / 0.6 progress` only. Easing `ease` or `ease-out` for entry. Add `will-change` only on animated nodes.

---

## 13. Responsive

- **Single breakpoint `768px`:** Sidebar/ FAB/ desktop ledger → BottomNav/ sheet/ mobile ledger. Header swaps `search/date/notif` for `40px pills` `Header.module.css:257-351`.
- **Grid collapses:** `3-col 1fr 320px → 1fr @1024`, `4-col metrics → 2 @1000 → 1 @600`, launcher `3→2→1 @800/500` `DESIGN.md:251-263`.
- **Validate at:** `360×800 / 390×844 / 430×932 / 600×960 / 820×1180 / 1024×768 / 1366×768 / 1440×900 / 1920×1080` — no horizontal overflow `DESIGN.md:286` `FRONTEND_SPEC.md:29`.
- **Safe areas:** `padding-bottom: calc(80px + env(safe-area-inset-bottom))` on mobile `reset.css:92-97`.

---

## 14. Content & Architecture Constraints

- **Formatting:** `formatAmount(n, locale, currency)` `src/presentation/utils/format.ts` · `shortDate(iso, locale)` `src/presentation/constants/dates.ts` (`Intl.DateTimeFormat`) · `displayType()`/`displayTxType()` `labels.ts:60-78`. Hardcoded `'BDT'` / `'en-IN'` / manual month arrays are banned — grep in CI.
- **Constants:** Defaults/bounds in `src/presentation/constants/config.ts` (description length, numpad digits, row heights `ROW_HEIGHT 54 DESKTOP 56 OVERSCAN 3`).
- **Styling:** CSS Modules + CSS custom properties only. No `style={{}}` except shadcn primitives `src/components/ui/*.tsx`. No runtime CSS-in-JS `FRONTEND_SPEC.md:32`.
- **Architecture:** UI never imports `sql.js` directly. Data via `IDatabaseService` + Zustand stores (`useMemberStore`, `useAccountStore`, `useTransactionStore`, `useLoanStore`, `useSettingsStore`) `AGENTS.md:3.4`.
- **Modals:** Lazy registry `src/presentation/modals/registry.ts:1-36` keyed `transaction-form | transaction-detail | transaction-edit | delete-confirm | edit-member | add-account | edit-account | settings | select-account`. Typed — no `any`.

---

## 15. Recipes — Copy-Paste Starters

### New filter chips
```css
.chip { padding: 5px 14px; border-radius: var(--radius-pill); background: oklch(100% 0 0 /0.06);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 500; border: 1px solid var(--color-border); }
.chipActive { background: linear-gradient(135deg, var(--color-primary), oklch(55% 0.22 290)); color: #fff; box-shadow: var(--shadow-glow); }
```

### New metric/card glow
```tsx
<GlassPanel glow="violet" padding="md">{children}</GlassPanel>
```

### New empty state
```tsx
<div className="empty-state"><span className="empty-state-icon">◯</span><span className="empty-state-text">No items yet</span></div>
```

---

## 16. Deprecated / Banned

| Pattern | Status | Replacement |
|---------|--------|-------------|
| `FormSelect` native + pseudo chevron `FormField.module.css:67-78` | **Deprecated** | Modal picker `SelectAccountModal` |
| Inline `style={{ color: ... }}` for gradients | **Banned** | `--card-bg` / `--icon-bg` CSS prop `AccountCard.tsx` `LoanStack.tsx` |
| Hardcoded `Intl.NumberFormat('en-IN')` / `'BDT'` | **Banned** | `formatAmount` + `locale` from `useSettingsStore` |
| Hex colors in components | **Banned** | `var(--color-*)` |
| Spinners on glass | **Banned** | `.skeleton*` + `.empty-state` / `.error-state` |
| `style={{}}` per-element | **Banned** (except shadcn) | CSS Module class or CSS prop |

---

## 17. Review Checklist — Required Before Merge

Copy into every UI PR description. All boxes must be checked:

- [ ] Reads as glass on obsidian at `360px` and `1920px` — no horizontal overflow
- [ ] Only `var(--color/space/radius/shadow/font)` — no hex, no literal spacing
- [ ] Money uses `formatAmount` + `JetBrains Mono tabular-nums`, labels uppercase `0.08em`
- [ ] All 4 states: `hover glow + surface-hover`, `focus-visible 2px violet`, `active /0.08 or scale 0.92`, `disabled 0.5`
- [ ] Modal/sheet pair at `768` or overlay `bg 0.55 blur4 z300` with `0.2-0.35s` enter + `0.25s` exit
- [ ] Dropdown is modal picker (trigger `14/10 blur12` → overlay `z350` → `360/85vw blur24 picker`) — not native select
- [ ] Icons `16/18/20` `stroke 1.8 round`, emoji only via `TX_TYPE_ICON`
- [ ] Motion uses `0.2/0.25/0.3/0.35/0.6s ease` + shimmer/pill expand — no spinner
- [ ] Dated lists use `shortDate`, loading uses `.skeleton*`, empty/error use `.empty-state/.error-state/.retry-btn`
- [ ] No `style={{}}`, no direct `sql.js` import, no hardcoded currency/locale
- [ ] `typecheck` + `lint --max-warnings 0` + `build` + `detect_changes()` done

---

*This identity exists so the 6th and 60th screen feel like the same app. Prefer familiarity over novelty. When in doubt, copy an existing `*.module.css` pattern rather than inventing one.*

# Theme (Light/Dark) + Accent Color — Plan (A1 + B1)

**Approved:** 2026-10-02 · **Branch:** `feature/theme-accent` off `dev` · **Phase 16:** T-132…T-137 in `docs/TICKETS.md`
**Decision:** A1 (`data-theme` token override + header toggle) + B1 (curated OKLCH accent palette in Settings). See proposal in session 2026-10-02.

## 1. Goal

- Header: 1-tap light/dark toggle (sun/moon 36px circle, same chrome as `notifBtn`).
- Settings: theme 3-way (System / Light / Dark) + accent swatch grid (6 curated hues).
- Persist in `AppSettings` (existing zustand `moneyflows_settings`); instant apply, no reload; default stays dark + violet (current look).

## 2. Architecture

```
tokens.css (:root dark defaults + [data-theme="light"] + [data-accent="<id>"])
   ▲
useTheme() hook — resolves theme (system → matchMedia) + accent, sets
document.documentElement.dataset.theme / .dataset.accent, subscribes to OS changes
   ▲
App.tsx (call once) · Header.tsx (toggle) · SettingsModal/Page (pickers)
```

- Only **interaction** tokens switch (`--color-primary`, `--color-primary-deep`, `--color-primary-glow`, `--color-primary-mark`). Semantics (`income/expense/cash/purple`) are fixed.
- New token `--color-primary-deep` replaces every hardcoded gradient tail `oklch(55% 0.22 290)` (~15 files: FAB, BottomNav, SegmentedTabs, Modal, LoansScreen, ErrorBoundary).

## 3. Accent palette (OKLCH, dark+light safe)

| id | primary | deep | glow |
|----|---------|------|------|
| `violet` (default) | `62% 0.22 290` | `55% 0.22 290` | `/0.12` |
| `blue` | `60% 0.18 250` | `52% 0.18 250` | `/0.12` |
| `teal` | `65% 0.15 180` | `55% 0.15 180` | `/0.12` |
| `gold` | `70% 0.15 85` | `60% 0.15 85` | `/0.14` |
| `coral` | `62% 0.18 30` | `54% 0.18 30` | `/0.12` |
| `pink` | `65% 0.20 350` | `56% 0.20 350` | `/0.12` |

Tune in T-132; text-on-accent stays `#fff` (verified contrast for all six).

## 4. Light theme tokens (draft, tune in T-132)

`--color-bg: oklch(96% 0.005 260)`, `--color-surface: oklch(100% 0 0 / 0.72)`, `--color-surface-hover: oklch(90% 0.01 260)`, `--color-border: oklch(30% 0 0 / 0.12)`, `--color-text: oklch(25% 0.01 260)`, `--color-text-secondary: oklch(45% 0.015 260)`, glow radial softer, shadows darker-on-light, scrollbar thumb `/0.25`. Blur/radius/motion unchanged — glass recipe identical.

## 5. Files touched

- `src/presentation/styles/tokens.css` — theme + accent blocks, new token.
- `src/core/domain/AppSettings.ts`, `src/presentation/stores/useSettingsStore.ts` — `theme`, `accentId`.
- `src/presentation/hooks/useTheme.ts` — NEW (≤100 LOC).
- `src/App.tsx` — call hook.
- `src/presentation/components/Header.tsx` (+`.module.css`) — toggle button.
- `src/presentation/components/SettingsModal.tsx`, `src/presentation/screens/SettingsPage*` — Appearance section.
- `docs/DESIGN_IDENTITY.md §2 + §17` — token table + checklist (both themes).
- ~15 `.module.css` gradient-tail swaps (mechanical, part of T-132).

## 6. Non-goals / guardrails

- No Tailwind `dark:` rewrite; no free HEX picker; no full theme presets.
- `labels.ts` account gradients, avatar gradients stay fixed (identity, not interaction).
- `style={{}}` ban holds — theming is CSS-only via `data-*` selectors.
- File ≤300 LOC; gates `typecheck / lint --max-warnings 0 / build / vitest` per ticket.

## 7. Rollout

T-132 → T-133 → (T-134 ∥ T-135) → T-136 → T-137. Merge `feature/theme-accent` → `dev` only with user confirmation (REPO_RULES §3). `dev` → `master` only on release with CHANGELOG + version bump per VERSIONING.md.

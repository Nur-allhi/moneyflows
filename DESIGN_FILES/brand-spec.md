# MoneyFlows — brand spec (extracted from brief + dark glassmorphism spec)

## Color tokens

```css
:root {
  --bg:        oklch(14% 0.015 260);   /* obsidian base */
  --surface:   oklch(22% 0.02 260 / 0.55);  /* frosted glass */
  --fg:        oklch(92% 0.008 260);
  --muted:     oklch(60% 0.02 260);
  --border:    oklch(100% 0 0 / 0.10);

  /* Accent palette */
  --violet:    oklch(62% 0.22 290);
  --teal:      oklch(65% 0.15 170);
  --coral:     oklch(62% 0.18 30);
  --gold:      oklch(75% 0.15 85);
  --purple:    oklch(55% 0.18 290);
  --success:   oklch(65% 0.15 150);
  --danger:    oklch(58% 0.18 30);
}
```

## Typography

- **Display / headings:** `'Outfit', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
- **Body / UI:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- **Monospace / numerics:** `'JetBrains Mono', ui-monospace, monospace`

Heading sizes: 600 weight. Display negative tracking at 32px+.
All-caps labels: `letter-spacing: 0.08em`.

## Glassmorphism system

- Panel background: `rgba(255,255,255,0.04)` to `rgba(255,255,255,0.06)`
- Backdrop blur: `12px` to `24px`
- Border: `1px solid rgba(255,255,255,0.08)`
- Glow (accent): `box-shadow: 0 0 20px rgba(accent, 0.15)`
- Border-radius: `12px` (desktop), `16px` (mobile)

## Layout posture

1. Dark glass panels float over obsidian with subtle radial blue-grey glow
2. Accents used sparingly — max 2 per screen (one eyebrow/chip + one CTA)
3. Thin glowing borders on focused/interactive elements
4. Numerics in tabular monospace with `font-variant-numeric: tabular-nums`
5. Frosted nav/header at top, content panels in responsive grid

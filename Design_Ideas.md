# MoneyFlows: Visual Design Specification & UI/UX Ideas

This document provides a detailed design guide, color system, typography choices, component layouts, and visual concepts to build a premium, state-of-the-art interface for the **MoneyFlows** application.

---

## 🎨 1. Core Visual Concept: "Premium Dark Glassmorphism"

The app will use a **sleek dark mode** base styled with **frosted glass panels (glassmorphism)**, glowing colored borders, subtle neon accents, and soft backlights. This creates a high-end, premium dashboard feel that makes financial data look modern, clean, and engaging.

### Key Visual Rules:
* Use a dark backdrop with a very subtle radial gradient (glowing background circles).
* Apply `backdrop-filter: blur(12px)` on all containers to create depth.
* Use thin, semi-transparent borders (`border: 1px solid rgba(255, 255, 255, 0.08)`).
* Avoid flat primary colors. Use custom **HSL gradients** that glow on hover.

---

## 🎨 2. The Color System (Tailored HSL Palette)

To prevent the design from looking generic, we will use a custom-curated HSL color palette.

| Token | Color Role | HSL Code | Hex Code (Approx.) | Visual Effect |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-main` | Application Background | `hsl(222, 47%, 6%)` | `#080b11` | Deep obsidian blue |
| `--bg-panel` | Card / Panel Base | `hsla(223, 47%, 11%, 0.65)`| `#0d1420a6` | Semi-transparent frosted slate |
| `--accent-violet`| Primary Brand Color | `hsl(262, 83%, 58%)` | `#7c3aed` | Electric Violet (glows) |
| `--accent-teal` | Success / Income / Inflow | `hsl(162, 76%, 45%)` | `#10b981` | Emerald Teal |
| `--accent-coral`| Debt / Expenses / Outflow | `hsl(342, 89%, 48%)` | `#f43f5e` | Crimson Coral |
| `--text-primary`| Headings & Primary Text | `hsl(210, 40%, 98%)` | `#f8fafc` | Pure Ice White |
| `--text-muted`  | Descriptions & Sub-labels | `hsl(215, 15%, 65%)` | `#94a3b8` | Cool Slate Gray |

### Glow Gradients:
* **Violet Glow**: `linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(290, 80%, 55%) 100%)`
* **Success/Teal Glow**: `linear-gradient(135deg, hsl(162, 76%, 45%) 0%, hsl(140, 70%, 50%) 100%)`
* **Outflow/Coral Glow**: `linear-gradient(135deg, hsl(342, 89%, 48%) 0%, hsl(360, 80%, 50%) 100%)`

---

## ✍️ 3. Typography Guide

Use modern geometric typography from Google Fonts to instantly elevate the premium feel:

* **Headings (Headers, Balances, Totals)**: **`Outfit`**
  * *Why*: Extremely clean, geometric, bold, and modern. Makes numbers look beautiful and premium.
* **Body Text (Particulars, Lists, Labels)**: **`Plus Jakarta Sans`**
  * *Why*: High readability in small print, clean proportions, and a friendly, open feel.

### CSS Integration:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

:root {
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
}
```

---

## 📐 4. Screen-by-Screen Layout & UI Wireframes

### A. The Dashboard (`/`)
* **Profile Swapper (Header)**: A horizontal profile selection bar at the top showing avatars for `Efty`, `Efty Business`, `Abbu (Azam)`, and `Ammu (Nahar)`.
* **Top Metric Grid**:
  * Four glowing widgets:
    1. **Total Family Assets** (Sum of all bank, cash, and bKash balances).
    2. **Physical Cash in Hand** (glowing light gold).
    3. **Active Loan Receivables** (glowing electric violet).
    4. **Family Net Worth** (Assets minus any liabilities/outstanding loans).
* **Two-Column Lower Section**:
  * **Left Column (Custom Balance Groups)**: Shows grouped account cards (e.g., "Combined Brac Bank" with Efty's and Azam's Brac bank cards merged).
  * **Right Column (Global Transactions)**: A clean, scrollable feed of the latest 10 transactions across the entire family. Clicking any item triggers the details slide-over.

### B. Member Profile Screen (`/member/:memberId`)
* **Header Card**: A large gradient card displaying the member's name and total consolidated balance.
* **Accounts Carousel (Horizontal Swipe)**:
  * Accounts are styled as **physical credit cards** with custom visual styles based on account type:
    * *bKash Card*: Pink/magenta gradient with bKash icon overlay.
    * *Brac Bank Card*: Royal blue/teal gradient.
    * *Standard Bank Card*: Gold/blue gradient.
    * *Cash Card*: Sleek dark grey carbon-fiber pattern.
  * *Interactivity*: Tap a card to load its ledger underneath instantly with a smooth transition.
* **Detailed Ledger View**:
  * Search bar + Quick Filters (All, Inflow, Outflow, Loans).
  * Ledger table with columns: `Date`, `Description`, `Debit (-)`, `Credit (+)`, `Running Balance`.

### C. Stacked Loans View (`/loans/:debtorId`)
* **Overview Card**: Shows debtor's name (e.g. BTC) and a progress bar showing how much of their total loans have been repaid.
* **The Loan "Stacks" (Folder/Stack Design)**:
  * Multiple loans are shown as cards visually stacked on top of each other (like folders in a file drawer).
  * *Visual indicator*: Shows a shadow effect underneath to give a physical 3D "layered papers" depth.
  * *Hover micro-interaction*: Hovering over a stack expands the layers slightly, showing dates and individual amounts. Clicking expands the stack fully.

---

## 🎨 5. Component Design Specifications

### A. Glassmorphic Card Container CSS
```css
.glass-panel {
  background: hsla(223, 47%, 11%, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
}

.glass-panel:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px 0 rgba(124, 58, 237, 0.15); /* violet glow on hover */
}
```

### B. Float Input Fields
Inputs in forms will have a subtle border that glows violet on focus, with placeholders that float to the top margin of the input field when active.

### C. The "Transaction Wizard" Dialog
A centered modal/overlay dialog (same on both mobile and desktop).
* Segmented control tabs at the top: `[ Income | Expense | Transfer | Loan ]`.
* Dynamically displays field options based on tab selection:
  * Choosing **Transfer** displays `Source Account` and `Destination Account` dropdowns.
  * Choosing **Loan** displays a `Borrower` list (including shortcut buttons to add new debtors like Mainul/BTC directly).

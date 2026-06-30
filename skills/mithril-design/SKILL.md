---
name: mithril-design
description: Mithril's design system for building polished crypto-finance apps — dark theme, color tokens, the signature soft-neumorphic style, and component patterns (cards, tabs, charts, data rows, the "trade with a sentence" UI). Use when building, styling, or reviewing a Mithril app, dashboard, or template so it looks on-brand and professional instead of generic.
---

# Mithril Design System

Build crypto-finance apps that look like they belong next to the templates at [mithril.money](https://mithril.money) — **dark, calm, data-first**, with a signature soft-neumorphic option. The goal: an agent-built app should look designed, not defaulted.

## Tokens

**Base — two flavors (pick one per app, don't mix):**
- **Classic dark** (most templates): `--bg #0a0a0a`, `--panel #111114`, `--border #222`, text `gray-200`, muted `gray-400/500`.
- **Soft neumorphic** (signature): `--bg #1a1e25`, **no borders** — shape everything with dual shadows (below). Text `#eef2f6`, muted `#9aa6b4`.

**Accent (one per app — don't rainbow):**
- **Emerald** `#34d399` — primary actions, positive/up, APY, success.
- **Indigo** `#6366f1` — secondary interactive (stake buttons, links).
- **Red** `#ef4444` — errors, negative/down, liquidation.

**Type:** `ui-sans-serif`; tight tracking on large headings (`-0.02em`, weight 800); `ui-monospace` for code, addresses, and numbers.

## The neumorphic recipe (the signature look)

On the mid-dark base (`#1a1e25`) shape elements with a **dark + light shadow pair** (the base must be mid-dark, never near-black, or the shadows vanish):

```css
:root{ --sd:#0f1218; --sl:#262c37; }
/* raised (cards, buttons, tabs-active) */
box-shadow: 6px 6px 14px var(--sd), -6px -6px 14px var(--sl);
/* inset (inputs, code wells, tab track, pills) */
box-shadow: inset 4px 4px 9px var(--sd), inset -4px -4px 9px var(--sl);
```
Buttons are raised; **pressed = inset on `:active`**. Primary button = emerald gradient, still raised. **Keep text high-contrast** — that's neumorphism's one trap; never trade readability for softness.

## Component patterns

- **Cards** — `rounded-2xl`, raised; hover `translateY(-3px)`.
- **Tabs** — inset track holding raised "on" chips. Tabs must *change the content below*, not just highlight.
- **Code / inputs** — inset wells. **Wrap long content** (`white-space: pre-wrap`); never truncate a command. Put any Copy button in a **top gutter**, never overlapping the text.
- **Data rows** — label left (muted), value right (white or emerald), thin separators, generous line-height.
- **Charts** — `recharts`; emerald bars/lines on dark; **put value labels on the bars** (don't bury numbers in a hover tooltip).
- **"Trade with a sentence"** — a user chat bubble → a structured result card (market · side · size · confirm), the core Mithril interaction.
- **Stat block** — big number (weight 700) over a small uppercase muted label.

## Rules (a reviewer's checklist)

1. **Contrast first** — body text ≥ AA on the base. The soft look never wins over readability.
2. **One accent.** Emerald leads; indigo supports. No confetti palettes.
3. **Real data > placeholders.** Show live numbers; if a value is illustrative, label it "example."
4. **Errors in plain English** with a fix (see the `mithril-dex` / `mithril-yield` skills) — never a raw code.
5. **Reflow on mobile** to one column; never let a multi-column grid squish a column to a sliver.
6. **Whitespace + rounded corners** carry the calm. Don't crowd.

Live, forkable examples of every pattern: **[mithril-templates](https://github.com/Stanislav-petrov-stw/mithril-templates)**. Wire Mithril data into your build with the **[MCP & Skills](https://github.com/Stanislav-petrov-stw/mithril-skills)**.

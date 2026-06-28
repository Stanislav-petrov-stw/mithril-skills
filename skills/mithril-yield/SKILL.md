---
name: mithril-yield
description: Read DeFi yield and staking opportunities (lending, staking, liquidity, vaults) across many chains through Mithril's keyless yield API. Use when an agent needs to find, compare, or rank yield opportunities by APY and TVL.
---

# Mithril Yield — DeFi yields across chains

Keyless, read-only yield data — **lending, staking, liquidity, and vault** opportunities across many chains. No API key needed.

- **Endpoint:** `GET https://build.mithril.money/api/public/yield`

### List opportunities
`?resource=yields&type=lending&network=ethereum&limit=50&page=1`

- `type` — yield category (e.g. `lending`, `staking`, ...); filtered to an allow-list
- `network` — chain (e.g. `ethereum`)
- `limit` — 1–100 · `page` — 1–50

### One opportunity
`?resource=yield&id=<integrationId>` (e.g. `ethereum-eth-lido-staking`)

```bash
# top lending yields on Ethereum
curl -s "https://build.mithril.money/api/public/yield?resource=yields&type=lending&network=ethereum&limit=20"

# details for one opportunity
curl -s "https://build.mithril.money/api/public/yield?resource=yield&id=ethereum-eth-lido-staking"
```

Each opportunity carries APY, TVL, token, protocol, and metadata — great for yield dashboards, scanners, and comparison agents.

## Safety rules for agents

- **Read-only + keyless** — safe to call freely.
- Entering / exiting positions (`resource=enter|exit`) prepares transactions the **user signs in their own wallet** — Mithril never custodies funds. Confirm any position change with the user first.

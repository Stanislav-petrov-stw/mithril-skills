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

## Error handling — always explain in plain English

When `resource=enter|exit` fails, **explain it in one plain sentence and suggest a fix** — never surface a raw code like `InvalidArgumentError`. Always name the **asset + chain** so the user knows exactly what to change.

| Cause | Tell the user (cause + fix) |
|---|---|
| **Wrong chain** — e.g. an Ethereum `0x…` wallet for a Solana pool → `InvalidArgumentError` / invalid address | "This pool is on **Solana**, but your wallet is Ethereum-family — connect a Solana wallet, or pick a pool on your wallet's chain." |
| Pool paused (`status.enter === false`) | "This pool has paused new deposits right now — try another pool." |
| Below the pool minimum (`args.enter.args.amount.minimum`) | "The minimum deposit for this pool is X — increase the amount." |
| Insufficient balance | "You don't have enough {asset} for this deposit — lower the amount or add funds." |
| Not enough gas token | "You need a little {chain} gas token to cover the network fee." |

Check `status.enter` and the token's `network` **before** preparing a deposit — that lets you tell the user about a chain mismatch or a paused pool without a failed round-trip.

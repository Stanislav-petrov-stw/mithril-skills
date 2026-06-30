# Mithril Skills

Agent-native **skills** + an **MCP portal** for [Mithril](https://mithril.money) — one normalized API for crypto trading across 8 DEXes, prediction markets, and DeFi yield. Built so an AI agent (or a vibecoder's app) can read markets and trade through a single interface instead of integrating each venue separately.

> Mithril routes calls to the exchanges — it **never custodies funds**. You bring your own API key.

## Skills

| Skill | What it does |
|---|---|
| [`mithril-dex`](skills/mithril-dex/) | Perp trading across Hyperliquid, Paradex, Extended, Pacifica, Hibachi, Aftermath, Carbon, Avantis |
| [`mithril-prediction-markets`](skills/mithril-prediction-markets/) | Polymarket + Kalshi — keyless market data + authenticated trading |
| [`mithril-yield`](skills/mithril-yield/) | DeFi yields (lending / staking / LP / vaults) across chains — keyless |
| [`mithril-design`](skills/mithril-design/) | Mithril's design system — dark + soft-neumorphic tokens + component patterns, so agent-built apps look on-brand |

More integrations land on a conveyor belt — **CEX, FX, stocks, commodities, RWA** — each a new branded Mithril skill that also joins the unified MCP portal.

## Quickstart

1. Get a Mithril API key at [mithril.money](https://mithril.money) — a free tier lets you test.
2. Open any skill's `SKILL.md` — it is the complete interface (endpoint, auth, operations, examples).
3. **Reads are keyless or cheap; writes move real funds** — always confirm an order with the user before placing it.

## The MCP

The [`mcp/`](mcp/) server is the portal — connect once and an agent gets every skill through a single connection (Claude Desktop, Cursor, Claude Code). Bring your own key, or use Mithril credits.

## What's coming

- **Credit metering** — test free, buy Mithril credits to scale. Reads cheap, writes paid.
- **More integrations** — CEX, FX, stocks, commodities, RWA — each a new skill that auto-joins the MCP.

## License

MIT — see [LICENSE](LICENSE).

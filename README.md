# Mithril Skills

Agent-native **skills** + an **MCP portal** for [Mithril](https://mithril.money) — one normalized API for crypto trading across 8 DEXes, prediction markets, and DeFi yield. Built so an AI agent (or a vibecoder's app) can read markets and trade through a single interface instead of integrating each venue separately.

> Mithril routes calls to the exchanges — it **never custodies funds**. You bring your own API key.

**Live:** [mcp.mithril.money](https://mcp.mithril.money) · **Fork a template:** [26 open-source crypto apps](https://github.com/Stanislav-petrov-stw/mithril-templates)

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

The [`mcp/`](mcp/) server is the portal — connect once and an agent gets **every skill through a single connection** (Claude Desktop, Cursor, Claude Code). Market, prediction-price, and yield **reads are keyless**; trading uses your own Mithril key.

### Connect it

```bash
git clone https://github.com/Stanislav-petrov-stw/mithril-skills
cd mithril-skills/mcp
npm install && npm run build
```

Add it to your agent's MCP config (Claude Desktop `claude_desktop_config.json`, Cursor, or Claude Code), pointing at the built file with its **absolute** path:

```json
{
  "mcpServers": {
    "mithril": {
      "command": "node",
      "args": ["/absolute/path/to/mithril-skills/mcp/dist/index.js"],
      "env": { "MITHRIL_API_KEY": "" }
    }
  }
}
```

- **Keyless** — leave `env` empty and you get live markets, prediction prices, and DeFi yields immediately.
- **Trade** — set `MITHRIL_API_KEY` to your `mt_live_…` key from [mithril.money](https://mithril.money) (or `MITHRIL_SESSION_TOKEN` to pay with Mithril credits).

Restart your agent; it lists **13 tools** across DEX trading, prediction markets, yield, and the design system. Reads work out of the box — try *"list the top DeFi yields"* or *"show Hyperliquid markets."*

## What's coming

- **Credit metering** — test free, buy Mithril credits to scale. Reads cheap, writes paid.
- **More integrations** — CEX, FX, stocks, commodities, RWA — each a new skill that auto-joins the MCP.

## License

MIT — see [LICENSE](LICENSE).

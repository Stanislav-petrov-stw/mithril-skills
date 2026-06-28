# Mithril MCP

**One MCP server — the portal to the whole Mithril network.** Connect once and an AI agent can trade perps across 8 DEXes, read prediction markets, and scan DeFi yield through a single connection. A **client** of the Mithril API — bring your own key; Mithril never custodies funds.

## Install

```bash
cd mcp
npm install
npm run build
```

## Configure (Claude Desktop / Claude Code / Cursor)

```json
{
  "mcpServers": {
    "mithril": {
      "command": "node",
      "args": ["/absolute/path/to/mithril-skills/mcp/dist/index.js"],
      "env": { "MITHRIL_API_KEY": "mt_live_..." }
    }
  }
}
```

Get a key at [mithril.money](https://mithril.money). The keyless tools (prediction markets, yield) work without one.

## Tools

| Group | Tools | Key |
|---|---|---|
| **DEX** (perps) | `mithril_dex_get_markets`, `…get_balance`, `…get_positions`, `…get_fills`, `…place_limit_order`\*, `…place_market_order`\*, `…cancel_order`\*, `…set_leverage`\*, `…close_all_positions`\* | your key |
| **Prediction markets** | `mithril_predictions_get_markets` (Polymarket, Kalshi) | keyless |
| **Yield** | `mithril_yield_list`, `mithril_yield_get` | keyless |

\* Write tools move real funds and are flagged `destructive` — your MCP client will ask you to confirm before they run.

## What's next

Every new Mithril integration (CEX, FX, stocks, commodities, RWA) joins this same portal automatically — connect once, get the whole growing network. Credit metering (test free, buy Mithril credits to scale; reads cheap, writes paid) lands next.

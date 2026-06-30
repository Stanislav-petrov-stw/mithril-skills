# Mithril MCP

**One MCP server — the portal to the whole Mithril network.** Connect once and an AI agent can trade perps across 8 DEXes, read prediction markets, and scan DeFi yield through a single connection. A **client** of the Mithril API — never touches the trading backend. Mithril never custodies funds.

## Install

```bash
cd mcp
npm install
npm run build
```

## Two ways to connect

### 1. Metered — use Mithril credits (recommended)

Set `MITHRIL_SESSION_TOKEN` to your Mithril session. Every call is metered in credits (reads free up to a daily allotment, writes flat) and runs server-side — *buy credits, trade.* No exchange key to manage.

```json
{
  "mcpServers": {
    "mithril": {
      "command": "node",
      "args": ["/absolute/path/to/mithril-skills/mcp/dist/index.js"],
      "env": { "MITHRIL_SESSION_TOKEN": "<your Mithril session token>" }
    }
  }
}
```

### 2. Bring your own key

Set `MITHRIL_API_KEY` to your own `mt_live_` key — authenticated calls go straight to the API, no credits involved.

```json
{ "env": { "MITHRIL_API_KEY": "mt_live_..." } }
```

Keyless tools (predictions, yield) work in either mode. Get a session token or a key at [mithril.money](https://mithril.money).

## Tools

| Group | Tools | Notes |
|---|---|---|
| **DEX** (perps) | `mithril_dex_get_markets`, `…get_balance`, `…get_positions`, `…get_fills`, `…place_limit_order`\*, `…place_market_order`\*, `…cancel_order`\*, `…set_leverage`\*, `…close_all_positions`\* | |
| **Prediction markets** | `mithril_predictions_get_markets` (Polymarket, Kalshi) | keyless |
| **Yield** | `mithril_yield_list`, `mithril_yield_get` | keyless |
| **Design** | `mithril_design_system` | keyless — returns Mithril's design system so an agent builds on-brand apps |

\* Write tools move real funds and are flagged `destructive` — your MCP client confirms before they run.

## What's next

Every new Mithril integration (CEX, FX, stocks, commodities, RWA) joins this same portal automatically — connect once, get the whole growing network.

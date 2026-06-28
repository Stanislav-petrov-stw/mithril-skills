#!/usr/bin/env node
/**
 * Mithril MCP — one portal for crypto trading across DEX perps, prediction
 * markets, and DeFi yield, via the Mithril API.
 *
 * This is a CLIENT of api.mithril.money (additive — it never touches Mithril's
 * trading backend). Bring your own key; Mithril never custodies funds. Every new
 * Mithril integration (CEX, FX, stocks, commodities, RWA) joins this same portal.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = "https://api.mithril.money/api/v1";
const PUBLIC = "https://build.mithril.money/api/public";

function apiKey(): string {
  const k = process.env.MITHRIL_API_KEY;
  if (!k) {
    throw new Error(
      "MITHRIL_API_KEY is not set. Get a key at https://mithril.money and add it to your MCP server config (env.MITHRIL_API_KEY). Keyless tools (predictions, yield) work without it.",
    );
  }
  return k;
}

async function callMithril(body: Record<string, unknown>): Promise<string> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey() },
    body: JSON.stringify(body),
  });
  return res.text();
}

async function getPublic(path: string): Promise<string> {
  const res = await fetch(`${PUBLIC}${path}`);
  return res.text();
}

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const errored = (m: string) => ({
  content: [{ type: "text" as const, text: `Error: ${m}` }],
  isError: true,
});
async function guard(fn: () => Promise<string>) {
  try {
    return text(await fn());
  } catch (e) {
    return errored(e instanceof Error ? e.message : String(e));
  }
}

const server = new McpServer({ name: "mithril", version: "0.1.0" });

const credentialId = z
  .string()
  .describe("The connected exchange account id (manage connections in the Mithril portal).");
const marketSym = z.string().describe("Market symbol in {BASE}-USD-PERP form, e.g. BTC-USD-PERP.");

/* ---------------- DEX — perps across 8 venues (your key) ---------------- */

server.registerTool(
  "mithril_dex_get_markets",
  {
    title: "DEX · list markets",
    description:
      "List all tradeable perpetual markets on a DEX, normalized across Hyperliquid, Paradex, Extended, Pacifica, Hibachi, Aftermath, Carbon, Avantis.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => callMithril({ operation: "getAllMarkets", credentialId })),
);

server.registerTool(
  "mithril_dex_get_balance",
  {
    title: "DEX · balance",
    description: "Get account balance and margin on a DEX.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => callMithril({ operation: "getBalance", credentialId })),
);

server.registerTool(
  "mithril_dex_get_positions",
  {
    title: "DEX · positions",
    description: "Get open positions (size, entry, unrealized PnL, liquidation price) on a DEX.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => callMithril({ operation: "getPositions", credentialId })),
);

server.registerTool(
  "mithril_dex_get_fills",
  {
    title: "DEX · fills",
    description: "Get recent fills / trade history on a DEX.",
    inputSchema: { credentialId, market: marketSym.optional() },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId, market }) =>
    guard(() => callMithril({ operation: "getFills", credentialId, market })),
);

server.registerTool(
  "mithril_dex_place_limit_order",
  {
    title: "DEX · place limit order",
    description: "Place a maker/limit order. MOVES REAL FUNDS — confirm with the user first.",
    inputSchema: {
      credentialId,
      market: marketSym,
      side: z.enum(["buy", "sell"]),
      price: z.number().positive(),
      size: z.number().positive(),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  ({ credentialId, market, side, price, size }) =>
    guard(() =>
      callMithril({ operation: "placeLimitOrder", credentialId, market, side, price, size }),
    ),
);

server.registerTool(
  "mithril_dex_place_market_order",
  {
    title: "DEX · place market order",
    description: "Place a taker/market order. MOVES REAL FUNDS — confirm with the user first.",
    inputSchema: {
      credentialId,
      market: marketSym,
      side: z.enum(["buy", "sell"]),
      size: z.number().positive(),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  ({ credentialId, market, side, size }) =>
    guard(() => callMithril({ operation: "placeMarketOrder", credentialId, market, side, size })),
);

server.registerTool(
  "mithril_dex_cancel_order",
  {
    title: "DEX · cancel order",
    description: "Cancel a resting order by id.",
    inputSchema: { credentialId, market: marketSym, orderId: z.string() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  ({ credentialId, market, orderId }) =>
    guard(() => callMithril({ operation: "cancelOrder", credentialId, market, orderId })),
);

server.registerTool(
  "mithril_dex_set_leverage",
  {
    title: "DEX · set leverage",
    description: "Change leverage for a market. Affects risk — confirm with the user first.",
    inputSchema: { credentialId, market: marketSym, leverage: z.number().positive() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  ({ credentialId, market, leverage }) =>
    guard(() => callMithril({ operation: "setLeverage", credentialId, market, leverage })),
);

server.registerTool(
  "mithril_dex_close_all_positions",
  {
    title: "DEX · close all positions",
    description: "Flatten ALL positions on the venue. MOVES REAL FUNDS — confirm with the user first.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => callMithril({ operation: "closeAllPositions", credentialId })),
);

/* ---------------- Prediction markets — keyless public data ---------------- */

server.registerTool(
  "mithril_predictions_get_markets",
  {
    title: "Predictions · markets",
    description:
      "Get current prediction markets and prices from Polymarket or Kalshi. Keyless public data — no API key needed.",
    inputSchema: { venue: z.enum(["polymarket", "kalshi"]) },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ venue }) => guard(() => getPublic(`/predictions?venue=${venue}`)),
);

/* ---------------- Yield — keyless public data ---------------- */

server.registerTool(
  "mithril_yield_list",
  {
    title: "Yield · list opportunities",
    description:
      "List DeFi yield opportunities (lending, staking, etc.) across chains, with APY and TVL. Keyless public data.",
    inputSchema: {
      type: z.string().optional().describe("Yield category, e.g. lending, staking."),
      network: z.string().optional().describe("Chain, e.g. ethereum."),
      limit: z.number().int().min(1).max(100).optional(),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ type, network, limit }) =>
    guard(() => {
      const p = new URLSearchParams({ resource: "yields" });
      if (type) p.set("type", type);
      if (network) p.set("network", network);
      if (limit) p.set("limit", String(limit));
      return getPublic(`/yield?${p.toString()}`);
    }),
);

server.registerTool(
  "mithril_yield_get",
  {
    title: "Yield · one opportunity",
    description:
      "Get details (APY, TVL, protocol) for one yield opportunity by id, e.g. ethereum-eth-lido-staking. Keyless public data.",
    inputSchema: { id: z.string() },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ id }) => guard(() => getPublic(`/yield?resource=yield&id=${encodeURIComponent(id)}`)),
);

const transport = new StdioServerTransport();
await server.connect(transport);

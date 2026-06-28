#!/usr/bin/env node
/**
 * Mithril MCP — one portal for crypto trading across DEX perps, prediction
 * markets, and DeFi yield, via the Mithril API.
 *
 * Two modes (a CLIENT of Mithril either way — never touches the trading backend):
 *
 *   1. METERED (recommended) — set MITHRIL_SESSION_TOKEN to your Mithril session.
 *      Every call routes through https://build.mithril.money/api/meter, which
 *      debits Mithril credits (reads free up to a daily allotment, writes flat)
 *      and runs the call server-side. "Buy credits, trade." No exchange key to
 *      manage.
 *
 *   2. BYO-KEY — set MITHRIL_API_KEY to your own mt_live_ key. Authenticated
 *      calls go straight to api.mithril.money; no credits involved.
 *
 * Keyless reads (predictions, yield) work in either mode (and with no env at all
 * in BYO mode). Bring your own key OR your credits; Mithril never custodies funds.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const METER_URL = "https://build.mithril.money/api/meter";
const API_URL = "https://api.mithril.money/api/v1";
const PUBLIC_BASE = "https://build.mithril.money/api/public";

const SESSION = process.env.MITHRIL_SESSION_TOKEN; // metered (credits)
const API_KEY = process.env.MITHRIL_API_KEY; // BYO key (direct)
const METERED = !!SESSION;

const PUBLIC_OPS = new Set(["getPredictions", "getYields", "getYield"]);

/** Route an operation through the active mode. */
async function dispatch(operation: string, params: Record<string, unknown>): Promise<string> {
  if (METERED) {
    const res = await fetch(METER_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SESSION}` },
      body: JSON.stringify({ operation, ...params }),
    });
    return res.text();
  }
  if (PUBLIC_OPS.has(operation)) return directPublic(operation, params);
  if (!API_KEY) {
    throw new Error(
      "No credentials. Set MITHRIL_SESSION_TOKEN to use Mithril credits, or MITHRIL_API_KEY to use your own key. Get either at https://mithril.money.",
    );
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ operation, ...params }),
  });
  return res.text();
}

/** BYO-mode keyless reads: hit the public proxy directly. */
async function directPublic(op: string, params: Record<string, unknown>): Promise<string> {
  let path: string;
  if (op === "getPredictions") {
    path = `/predictions?venue=${encodeURIComponent(String(params.venue ?? ""))}`;
  } else if (op === "getYields") {
    const p = new URLSearchParams({ resource: "yields" });
    if (params.type) p.set("type", String(params.type));
    if (params.network) p.set("network", String(params.network));
    if (params.limit) p.set("limit", String(params.limit));
    path = `/yield?${p.toString()}`;
  } else if (op === "getYield") {
    path = `/yield?resource=yield&id=${encodeURIComponent(String(params.id ?? ""))}`;
  } else {
    return JSON.stringify({ error: "unknown_public_op", op });
  }
  const res = await fetch(`${PUBLIC_BASE}${path}`);
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

const server = new McpServer({ name: "mithril", version: "0.2.0" });

const credentialId = z
  .string()
  .describe("The connected exchange account id (manage connections in the Mithril portal).");
const marketSym = z.string().describe("Market symbol in {BASE}-USD-PERP form, e.g. BTC-USD-PERP.");

/* ---------------- DEX — perps across 8 venues ---------------- */

server.registerTool(
  "mithril_dex_get_markets",
  {
    title: "DEX · list markets",
    description:
      "List all tradeable perpetual markets on a DEX, normalized across Hyperliquid, Paradex, Extended, Pacifica, Hibachi, Aftermath, Carbon, Avantis.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => dispatch("getAllMarkets", { credentialId })),
);

server.registerTool(
  "mithril_dex_get_balance",
  {
    title: "DEX · balance",
    description: "Get account balance and margin on a DEX.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => dispatch("getBalance", { credentialId })),
);

server.registerTool(
  "mithril_dex_get_positions",
  {
    title: "DEX · positions",
    description: "Get open positions (size, entry, unrealized PnL, liquidation price) on a DEX.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => dispatch("getPositions", { credentialId })),
);

server.registerTool(
  "mithril_dex_get_fills",
  {
    title: "DEX · fills",
    description: "Get recent fills / trade history on a DEX.",
    inputSchema: { credentialId, market: marketSym.optional() },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ credentialId, market }) => guard(() => dispatch("getFills", { credentialId, market })),
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
    guard(() => dispatch("placeLimitOrder", { credentialId, market, side, price, size })),
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
    guard(() => dispatch("placeMarketOrder", { credentialId, market, side, size })),
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
    guard(() => dispatch("cancelOrder", { credentialId, market, orderId })),
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
    guard(() => dispatch("setLeverage", { credentialId, market, leverage })),
);

server.registerTool(
  "mithril_dex_close_all_positions",
  {
    title: "DEX · close all positions",
    description: "Flatten ALL positions on the venue. MOVES REAL FUNDS — confirm with the user first.",
    inputSchema: { credentialId },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  ({ credentialId }) => guard(() => dispatch("closeAllPositions", { credentialId })),
);

/* ---------------- Prediction markets — keyless ---------------- */

server.registerTool(
  "mithril_predictions_get_markets",
  {
    title: "Predictions · markets",
    description:
      "Get current prediction markets and prices from Polymarket or Kalshi. Keyless public data.",
    inputSchema: { venue: z.enum(["polymarket", "kalshi"]) },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ venue }) => guard(() => dispatch("getPredictions", { venue })),
);

/* ---------------- Yield — keyless ---------------- */

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
  ({ type, network, limit }) => guard(() => dispatch("getYields", { type, network, limit })),
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
  ({ id }) => guard(() => dispatch("getYield", { id })),
);

const transport = new StdioServerTransport();
await server.connect(transport);

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
    return readOk(res);
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
  return readOk(res);
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
  return readOk(res);
}

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const errored = (m: string) => ({
  content: [{ type: "text" as const, text: `Error: ${m}` }],
  isError: true,
});

/**
 * Turn a raw Mithril API / gateway error into ONE plain-English sentence that
 * says what went wrong and what to do — so the agent can relay it to a human
 * instead of surfacing a bare code like "INVALID_API_KEY" or "SCOPE_VIOLATION".
 */
function humanize(raw: string): string {
  let code = "", msg = "";
  try {
    const j = JSON.parse(raw);
    code = String(j.code ?? j.error ?? "");
    msg = String(j.message ?? (typeof j.error === "string" ? j.error : "") ?? "");
  } catch {
    msg = raw;
  }
  const k = `${code} ${msg}`.toLowerCase();
  if (/insufficient_credits|out of credits/.test(k))
    return "You're out of Mithril credits. Buy a credit pack at https://mithril.money to continue (reads are free up to a daily limit; writes cost credits).";
  if (/session_required/.test(k))
    return "This action needs a signed-in user. Provide the user's Mithril session (MITHRIL_SESSION_TOKEN), or use your own key (MITHRIL_API_KEY).";
  if (/metered_execution_unconfigured/.test(k))
    return "The credit-metered trade path isn't switched on yet. Use your own key (MITHRIL_API_KEY) for now.";
  if (/invalid_api_key|invalid.*key|unauthorized|\b401\b/.test(k))
    return "Your API key was rejected. Check MITHRIL_API_KEY (it should start with mt_live_) or regenerate it at https://mithril.money.";
  if (/origin_not_allowed/.test(k))
    return "This app key isn't allowed from here. Add your origin to the key's allowed origins in the Mithril portal.";
  if (/scope_violation/.test(k))
    return "That credential doesn't belong to this session/app. Use the credentialId created for this user.";
  if (/email_required/.test(k))
    return "This app needs the user to verify their email (magic link) before connecting a wallet.";
  if (/tier_insufficient/.test(k))
    return "Your plan tier doesn't include this operation. Upgrade at https://mithril.money.";
  if (/credential.*not found|invalid credentialid|no credential|missing credential/.test(k))
    return "That credentialId wasn't found. List the user's connected accounts and pass a valid credentialId.";
  if (/insufficient.*(balance|margin|funds)/.test(k))
    return "Not enough balance or margin on the exchange for this order. Lower the size or add funds.";
  if (/market.*not found|invalid market|unknown market/.test(k))
    return "That market wasn't found. Use the {BASE}-USD-PERP format (e.g. BTC-USD-PERP) and make sure it's listed on this venue.";
  if (/(min|minimum).*(size|notional|order|amount)|too small|below.*min/.test(k))
    return "The order is below the venue's minimum size. Increase the amount.";
  if (/leverage/.test(k) && /max|exceed|invalid|too high/.test(k))
    return "That leverage isn't allowed for this market. Use a lower value.";
  if (/operation_not_allowed|unknown.?operation|unsupported|not allowed/.test(k))
    return `That operation isn't available here${msg ? ` (${msg})` : ""}. Check the operation name and that the venue supports it.`;
  if (/rate.?limit|too many requests|\b429\b/.test(k))
    return "Rate limited — wait a moment and try again.";
  if (/timeout|timed out|econn|network|fetch failed/.test(k))
    return "The exchange didn't respond in time. Try again; if it keeps failing the venue may be down.";
  // Readable fallback — a sentence, not a bare blob.
  return (msg || raw || "Something went wrong.") + (code && code !== msg ? ` (${code})` : "");
}

/** A response is an error if the HTTP status is not ok, OR the body is an error envelope. */
function bodyIsError(body: string, ok: boolean): boolean {
  if (!ok) return true;
  try {
    const j = JSON.parse(body);
    if (j && (j.error || j.code) && j.success !== true) return true;
  } catch {
    /* non-JSON 200 body — treat as success */
  }
  return false;
}

/** Read a fetch response, throwing a humanized error on any failure envelope. */
async function readOk(res: Response): Promise<string> {
  const body = await res.text();
  if (bodyIsError(body, res.ok)) throw new Error(humanize(body));
  return body;
}

async function guard(fn: () => Promise<string>) {
  try {
    return text(await fn());
  } catch (e) {
    return errored(humanize(e instanceof Error ? e.message : String(e)));
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

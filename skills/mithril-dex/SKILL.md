---
name: mithril-dex
description: Trade perpetual futures across 8 decentralized exchanges (Hyperliquid, Paradex, Extended, Pacifica, Hibachi, Aftermath, Carbon, Avantis) through one unified Mithril API. Use when an agent needs to read markets, balances, or positions, or place and manage perp orders on a DEX — without integrating each exchange separately.
---

# Mithril DEX — unified perpetuals trading

One API, eight DEXes. Mithril normalizes market data, balances, positions, and order placement across **Hyperliquid, Paradex, Extended, Pacifica, Hibachi, Aftermath, Carbon, and Avantis**, so an agent learns one interface instead of eight.

## The interface

- **Endpoint:** `POST https://api.mithril.money/api/v1` (single endpoint; always POST)
- **Auth:** header `X-API-Key: mt_live_...` — your Mithril API key. You bring your own; Mithril never custodies funds.
- **Body:** `{ "operation": "<name>", "credentialId": "<uuid>", ... }`
- **`credentialId`** is required for every exchange operation (even reads) — it selects which connected exchange account to use.
- **Market format:** `{BASE}-USD-PERP` (e.g. `BTC-USD-PERP`, `ETH-USD-PERP`)

## Operations

### Read — safe, no funds move
| Operation | Returns |
|---|---|
| `getAllMarkets` | every tradeable market on the venue (normalized) |
| `getBalance` | account balance + margin |
| `getPositions` | open positions (size, entry, uPnL, liq price) |
| `getFills` | recent fills / trade history |
| `getCandles` | OHLCV candles for a market |
| `getFundingHistory` | funding-rate history |

### Write — moves funds / changes state; confirm with the user first
| Operation | Effect |
|---|---|
| `placeLimitOrder` | place a maker / limit order |
| `placeMarketOrder` | place a taker / market order |
| `cancelOrder` | cancel a resting order |
| `setLeverage` | change leverage for a market |
| `closeAllPositions` | flatten all positions on the venue |

(See the full Mithril API reference for the complete operation list.)

## Examples

Read markets + balance:
```bash
curl -s https://api.mithril.money/api/v1 \
  -H "X-API-Key: $MITHRIL_KEY" -H "Content-Type: application/json" \
  -d '{"operation":"getAllMarkets","credentialId":"'"$CRED"'"}'

curl -s https://api.mithril.money/api/v1 \
  -H "X-API-Key: $MITHRIL_KEY" -H "Content-Type: application/json" \
  -d '{"operation":"getBalance","credentialId":"'"$CRED"'"}'
```

Place a limit order:
```json
{ "operation": "placeLimitOrder", "credentialId": "<uuid>",
  "market": "BTC-USD-PERP", "side": "buy", "price": 60000, "size": 0.01 }
```

## Safety rules for agents

- **Reads are free to call; writes move real money.** Always surface the order (market, side, size, price) and get explicit user confirmation before any `place*`, `cancel*`, `setLeverage`, or `closeAllPositions`.
- **You bring your own key.** Mithril routes the call to the exchange; it never holds the user's funds.
- **Errors** return `{ "success": false, "error": "...", "code": "..." }` — surface `code` to the user; do not retry blindly on a 4xx.

**Venues:** Hyperliquid · Paradex · Extended · Pacifica · Hibachi · Aftermath · Carbon · Avantis

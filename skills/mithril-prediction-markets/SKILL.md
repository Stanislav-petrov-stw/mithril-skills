---
name: mithril-prediction-markets
description: Read and trade prediction markets (Polymarket, Kalshi) through Mithril. Use when an agent needs live prediction-market prices/odds (keyless, no API key) or to place authenticated prediction-market orders with a Mithril key.
---

# Mithril Prediction Markets — Polymarket + Kalshi

## Public market data — keyless, no API key

- **Endpoint:** `GET https://build.mithril.money/api/public/predictions?venue=polymarket|kalshi`
- Returns current markets + prices for the venue. CORS-enabled, cached, no auth. Ideal for dashboards, scanners, and read-only agents.

```bash
curl -s "https://build.mithril.money/api/public/predictions?venue=polymarket"
curl -s "https://build.mithril.money/api/public/predictions?venue=kalshi"
```

`venue` is a strict allow-list (`polymarket`, `kalshi`); an unknown venue returns the valid list.

## Authenticated trading — your Mithril key

To place orders, use the main Mithril API (same shape as the `mithril-dex` skill):

- **Endpoint:** `POST https://api.mithril.money/api/v1`
- **Auth:** header `X-API-Key: mt_live_...`
- **Body:** `{ "operation": "<name>", "credentialId": "<uuid>", ... }` with venue `kalshi` or `polymarket`.

(See the Mithril API reference for the prediction-market operation names.)

## Safety rules for agents

- **Public-data reads are keyless and safe** — call them freely.
- **Authenticated orders move real money** — surface the market + size + price and confirm with the user before placing.
- You bring your own key; Mithril never custodies funds.

## Error handling — always explain in plain English

**Translate any error into one sentence** that says what went wrong and what to do — never surface a raw code. Don't retry blindly on a 4xx.

| Code / cause | Tell the user (cause + fix) |
|---|---|
| `INVALID_API_KEY` / 401 | "Your API key was rejected — check it or regenerate it at mithril.money." |
| credential not found | "That account isn't connected — connect it (or pass the right credentialId)." |
| market / event not found | "I couldn't find that market — check the ticker on Kalshi / Polymarket." |
| insufficient balance | "Not enough balance for this order — lower the size or add funds." |
| min size / too small | "The order is below the venue's minimum — increase the amount." |
| rate limit / 429 | "Rate-limited — wait a moment and try again." |

State the cause, then the next step — e.g. not "INSUFFICIENT_BALANCE" but "Not enough USDC on Polymarket for this order — reduce the size or deposit more."

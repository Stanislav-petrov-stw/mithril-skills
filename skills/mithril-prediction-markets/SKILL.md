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

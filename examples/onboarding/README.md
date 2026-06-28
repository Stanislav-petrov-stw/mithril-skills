# Mithril Onboarding — "sign in, you're ready"

The frictionless onboarding experience: **email / Google / Apple login → an embedded wallet → a trade-only agent wallet provisioned automatically → fund with a card → trade.** No seed phrase, no API keys, no on-chain bridge for the user to navigate.

It's the human-facing twin of the [Mithril MCP](../../mcp) credit-metered flow.

## Run it

```bash
npm install
npm run dev
```

Open the app and click **"walk the demo"** to step through the full flow with no setup. Sign-in uses [Privy](https://privy.io) (the app id our wallet templates already use) — real email/Google/Apple login when the Privy app allows the origin.

## How it works

1. **Login** (Privy) → an embedded wallet, no seed phrase.
2. **Provision** — the proven Hyperliquid/Pacifica agent-wallet flow runs hidden:
   `status → registerCredentialFromSignature` (Call 1, returns EIP-712 `typed_data`)
   → **one signature** → Call 2 → a server-custodied, **trade-only** `credentialId`.
   (Verified end-to-end against the live API — a throwaway wallet → a real credentialId.)
3. **Fund** — card / Venmo / PayPal / Cash App via an on-ramp (peer.xyz no-KYC, or Stripe). Funds land in the user's own wallet.
4. **Trade** — metered in Mithril credits via the agent key.

## Going live

Set `VITE_ONBOARD_API` to a backend endpoint that holds the **Mithril platform key** and runs the two `registerCredentialFromSignature` calls server-side (the client only signs). That endpoint + the platform key are the one remaining piece (pending the multi-tenant key-scoping confirmation). Until then, the app walks the flow in demo mode.

> Custody-safe by design: the agent key is **trade-only** (cannot withdraw); funds stay in the user's wallet; KYC + card are handled by the on-ramp provider.

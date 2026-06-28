import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSignTypedData } from "wagmi";

type Step = "signin" | "provisioning" | "ready" | "fund" | "done";

// Set VITE_ONBOARD_API to the backend onboarding endpoint (which holds the
// Mithril platform key and runs registerCredentialFromSignature server-side).
// Until that + the platform key land, the app walks the flow in demo mode.
const ONBOARD_API = (import.meta.env.VITE_ONBOARD_API as string) || "";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function App() {
  const { authenticated, login } = usePrivy();
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [step, setStep] = useState<Step>("signin");
  const [cred, setCred] = useState("");
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (authenticated && step === "signin") void provision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  async function post(body: Record<string, unknown>) {
    const r = await fetch(ONBOARD_API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`onboard ${r.status}`);
    return r.json();
  }

  // The proven flow: status -> register-init (typed_data) -> sign once ->
  // register-complete (credentialId). Falls back to a walk-through if the
  // backend isn't wired yet.
  async function provision() {
    setStep("provisioning");
    try {
      if (!ONBOARD_API || !address) throw new Error("demo");
      await post({ step: "status", exchange: "hyperliquid", walletAddress: address });
      const init = await post({ step: "register-init", exchange: "hyperliquid", walletAddress: address });
      const signature = await signTypedDataAsync({
        domain: init.typed_data.domain,
        types: init.typed_data.types,
        primaryType: init.typed_data.primaryType,
        message: init.typed_data.message,
      });
      const done = await post({
        step: "register-complete",
        exchange: "hyperliquid",
        walletAddress: address,
        signature,
        agent_address: init.agent_address,
        nonce: init.nonce,
      });
      setCred(done.credentialId);
    } catch {
      setDemo(true);
      await wait(2200);
      setCred("47fa8f2f-…(demo)");
    }
    setStep("ready");
  }

  async function startDemo() {
    setDemo(true);
    setStep("provisioning");
    await wait(2200);
    setCred("47fa8f2f-…(demo)");
    setStep("ready");
  }

  return (
    <div className="page">
      <div className="card">
        {step === "signin" && (
          <div className="scr">
            <div className="brand"><span className="mark" /> Mithril</div>
            <h1>Trade perps in 30 seconds.</h1>
            <p className="sub">No seed phrase. No exchange keys. No paperwork.</p>
            <input className="input" placeholder="you@email.com" />
            <button className="btn primary" onClick={login}>Get started →</button>
            <div className="or"><span /> or <span /></div>
            <button className="btn google" onClick={login}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
            <button className="btn apple" onClick={login}><svg width="13" height="16" viewBox="0 0 814 1000" fill="#fff" style={{ marginTop: -2 }}><path d="M788 340c-6 4-130 75-130 230 0 179 157 242 162 244-1 4-25 86-83 170-50 73-103 146-183 146s-101-47-193-47c-90 0-122 48-195 48s-124-68-178-151C61 758 0 558 0 404c0-247 161-378 319-378 84 0 154 55 207 55 50 0 129-59 224-59 36 0 165 3 250 127zM573 116c40-47 68-112 68-177 0-9-1-18-2-25-65 3-142 44-188 98-37 42-69 107-69 173 0 10 2 20 2 23 4 1 11 2 18 2 58 0 131-39 171-94z"/></svg>Continue with Apple</button>
            <div className="demo-link" onClick={startDemo}>▶ walk the demo (no sign-in)</div>
          </div>
        )}

        {step === "provisioning" && (
          <div className="scr center">
            <div className="spinner" />
            <h2>Setting up your account…</h2>
            <div className="steps">
              <div>✓ Creating your wallet</div>
              <div>✓ Connecting Hyperliquid &amp; Pacifica</div>
              <div className="hl">Securing your trading agent…</div>
            </div>
          </div>
        )}

        {step === "ready" && (
          <div className="scr">
            <div className="emoji">🎉</div>
            <h1>You're ready.</h1>
            <p className="sub">Account created — no keys to copy, nothing to back up.</p>
            <div className="account">
              <div className="label">YOUR TRADING ACCOUNT</div>
              <div className="balance">$0.00</div>
              <div className="venues">● Hyperliquid &nbsp; ● Pacifica &nbsp; <span className="hl">connected</span></div>
              <div className="cred">agent {cred}</div>
            </div>
            <button className="btn primary" onClick={() => setStep("fund")}>Add funds →</button>
            {demo && <div className="badge-demo">demo mode — wire VITE_ONBOARD_API for the live flow</div>}
          </div>
        )}

        {step === "fund" && (
          <div className="scr">
            <h1 className="sm">Add funds</h1>
            <div className="amounts"><div>$50</div><div className="sel">$100</div><div>$250</div></div>
            <button className="fund-opt" onClick={() => setStep("done")}>
              <div className="row"><b>Venmo · PayPal · Cash App</b><span className="pill green">NO KYC · 60s</span></div>
              <div className="muted">Pay with an app you already have · peer.xyz</div>
            </button>
            <button className="fund-opt" onClick={() => setStep("done")}>
              <div className="row"><b>Debit / credit card</b><span className="muted sm">Stripe</span></div>
              <div className="muted">Visa · Mastercard · Apple Pay</div>
            </button>
            <div className="foot">Funds land in your wallet — you control them.</div>
          </div>
        )}

        {step === "done" && (
          <div className="scr">
            <div className="emoji">🚀</div>
            <h1>Funded — let's trade.</h1>
            <div className="account"><div className="balance">$100.00</div><div className="hl sm">ready on Hyperliquid</div></div>
            <div className="explain">Behind the scenes: embedded wallet + a <b>trade-only</b> agent key + an on-ramp. You never touched a seed phrase or an API key.</div>
            <button className="btn primary" onClick={() => { setStep("signin"); setDemo(false); }}>↺ replay</button>
          </div>
        )}
      </div>
    </div>
  );
}

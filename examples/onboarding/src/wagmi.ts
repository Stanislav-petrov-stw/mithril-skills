import { createConfig } from "@privy-io/wagmi";
import { arbitrum, mainnet } from "viem/chains";
import { http } from "wagmi";

// Hyperliquid's approve-agent is an off-chain EIP-712 signature; the chain set
// here is just what wagmi needs to be configured. Arbitrum is HL's deposit chain.
export const wagmiConfig = createConfig({
  chains: [arbitrum, mainnet],
  transports: {
    [arbitrum.id]: http(),
    [mainnet.id]: http(),
  },
});

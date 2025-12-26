import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { metaMask, injected } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

const SEPOLIA_RPC = "https://eth-sepolia.g.alchemy.com/v2/5XldVmdd6OZqqTfjv_xo8jlMdmieKkfH";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
  connectors: [
    metaMask(),
    injected({ shimDisconnect: true }),
  ],
});

export const queryClient = new QueryClient();



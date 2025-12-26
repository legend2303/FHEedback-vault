import React from "react";
import ReactDOM from "react-dom/client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  RainbowKitProvider,
  getDefaultWallets,
  midnightTheme,
} from "@rainbow-me/rainbowkit";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ErrorBoundary from "./ErrorBoundary";
import FeedbackApp from "./FeedbackApp";

/* ================= CONSTANTS ================= */

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "90fe9a73bf6a7f22d4a304490d83b7c9";

/* ================= QUERY CLIENT CONFIG ================= */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/* ================= WAGMI CONFIG - MULTI-WALLET SUPPORT ================= */

const { wallets } = getDefaultWallets({
  appName: "Encrypted Feedback",
  projectId: PROJECT_ID,
});

// This configuration supports:
// ✅ MetaMask (most popular)
// ✅ Rainbow Wallet
// ✅ Coinbase Wallet
// ✅ Walletconnect (connects to 500+ wallets)
// ✅ Ledger
// ✅ Trezor
// ✅ Argent
// ✅ Uniswap Wallet
// ✅ And any EVM-compatible wallet via WalletConnect

const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  wallets, // Includes all default wallets + WalletConnect for other EVM wallets
  ssr: false,
});

/* ================= RENDER ================= */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={midnightTheme()}>
          <ErrorBoundary>
            <FeedbackApp />
          </ErrorBoundary>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

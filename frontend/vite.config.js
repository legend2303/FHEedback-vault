import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],

  define: {
    global: "globalThis",
    "process.env": {},
  },

  resolve: {
    alias: {
      // 🔥 FIX keccak ESM/CJS issue - use absolute path to js.js (browser version)
      keccak: path.resolve(__dirname, "node_modules/keccak/js.js"),

      buffer: "buffer",
      util: "util",
      events: "events",
      process: "process/browser",
      // Avoid UMD entry causing ESM default import error
      "fetch-retry": path.resolve(__dirname, "node_modules/fetch-retry/index.js"),
      "@zama-fhe/relayer-sdk": "@zama-fhe/relayer-sdk/web",
    },
  },

  optimizeDeps: {
    include: [
      "buffer",
      "process",
      "util",
      "events",
      "keccak",
      "wagmi",
      "@tanstack/react-query",
      "viem",
      // Optional peer deps for wallet connectors (prebundle for smoother dev)
      "@coinbase/wallet-sdk",
      "@metamask/sdk",
      "@safe-global/safe-apps-sdk",
      "@safe-global/safe-apps-provider",
      "@gemini-wallet/core",
    ],
    exclude: [
      "@zama-fhe/relayer-sdk",
    ],

    // 🔥 Force CJS → ESM conversion
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },

  assetsInclude: ["**/*.wasm"],

  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          fhe: ["@zama-fhe/relayer-sdk"],
          wagmi: ["wagmi"],
          viem: ["viem"],
          reactQuery: ["@tanstack/react-query"],
          ethers: ["ethers"],
        },
      },
    },
  },

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});

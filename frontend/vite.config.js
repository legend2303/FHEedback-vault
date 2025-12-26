import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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
      buffer: "buffer",
      util: "util",
      events: "events",
      process: "process/browser",
      "@zama-fhe/relayer-sdk": "@zama-fhe/relayer-sdk/web",
    },
  },

  optimizeDeps: {
    include: [
      "buffer",
      "process",
      "util",
      "events",
    ],
    exclude: [
      "keccak",
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

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});

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
      "@zama-fhe/relayer-sdk",
    ],
  },

  assetsInclude: ["**/*.wasm"],

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});

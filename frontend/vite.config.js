import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.wasm"],
  resolve: {
    conditions: ["browser"]
  },
  optimizeDeps: {
    include: ["@zama-fhe/relayer-sdk/web"]
  },
  build: {
    target: "esnext"
  },
  css: false
});

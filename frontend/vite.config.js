import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window"
  },
  server: {
    headers: {
      "Content-Security-Policy":
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data:;",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    },
    middlewareMode: false,
    fs: {
      allow: [".."]
    },
    mime: {
      ".wasm": "application/wasm"
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      supported: {
        bigint: true
      }
    }
  },
  build: {
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.wasm')) {
            return 'wasm/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});

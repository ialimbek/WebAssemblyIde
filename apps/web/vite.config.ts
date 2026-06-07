import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const analyze = process.env.ANALYZE === "true";
const pureWebBuild = process.env.CODEMBLY_TARGET === "web";

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    pureWebBuild &&
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,wasm}"],
          runtimeCaching: [
            {
              urlPattern: /monaco-editor|vendor-monaco/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "codembly-monaco" },
            },
          ],
        },
      }),
    analyze && visualizer({ open: true, gzipSize: true, brotliSize: true }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@webassembly-ide/shared": path.resolve(
        __dirname,
        "../../packages/shared/src",
      ),
      "@webassembly-ide/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@webassembly-ide/editor": path.resolve(
        __dirname,
        "../../packages/editor/src",
      ),
      "@webassembly-ide/ide-core": path.resolve(
        __dirname,
        "../../packages/ide-core/src",
      ),
      "@webassembly-ide/agent-runtime": path.resolve(
        __dirname,
        "../../packages/agent-runtime/src",
      ),
      "@webassembly-ide/agent-tools": path.resolve(
        __dirname,
        "../../packages/agent-tools/src",
      ),
      "@webassembly-ide/command-bus": path.resolve(
        __dirname,
        "../../packages/command-bus/src",
      ),
      "@webassembly-ide/performance-core": path.resolve(
        __dirname,
        "../../packages/performance-core/src",
      ),
      "@webassembly-ide/settings": path.resolve(
        __dirname,
        "../../packages/settings/src",
      ),
      "@webassembly-ide/notifications": path.resolve(
        __dirname,
        "../../packages/notifications/src",
      ),
      "@webassembly-ide/i18n": path.resolve(
        __dirname,
        "../../packages/i18n/src",
      ),
      "@webassembly-ide/accessibility": path.resolve(
        __dirname,
        "../../packages/accessibility/src",
      ),
      "@webassembly-ide/terminal-runtime": path.resolve(
        __dirname,
        "../../packages/terminal-runtime/src",
      ),
      "@webassembly-ide/wasm-shared": path.resolve(
        __dirname,
        "../../packages/wasm-shared/dist",
      ),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
    minify: "terser",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ["console.log", "console.info"],
      },
      mangle: { safari10: true },
      format: { comments: false },
    },
    rollupOptions: {
      external: pureWebBuild ? ["@tauri-apps/api", "@tauri-apps/api/core"] : [],
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/monaco-editor")) return "vendor-monaco";
          if (id.includes("node_modules/isomorphic-git")) return "vendor-git";
          if (id.includes("node_modules/@tauri-apps/api")) return "vendor-tauri";
          if (id.includes("node_modules/marked")) return "vendor-marked";
        },
      },
    },
  },
  // Same for the dev server (esbuild deps optimization).
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  // Don't bundle the .wasm — copy it to dist and let WebAssembly.instantiate
  // fetch it at runtime via the URL produced by new URL("...", import.meta.url).
  assetsInclude: ["**/*.wasm"],
});

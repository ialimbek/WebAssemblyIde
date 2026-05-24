import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
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
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});

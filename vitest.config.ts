import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    passWithNoTests: true,
    include: [
      "packages/**/*.test.ts",
      "packages/**/*.spec.ts",
      "apps/**/*.test.ts",
      "apps/**/*.spec.ts",
    ],
    exclude: ["node_modules", "dist", "crates", "services"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // tests/integration/** needs live Supabase credentials and network access — run separately
    // via `npm run test:integration` (vitest.integration.config.ts), not as part of this fast,
    // dependency-free unit suite.
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/integration/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

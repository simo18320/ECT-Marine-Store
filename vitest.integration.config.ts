import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate from vitest.config.ts (the fast, network-free unit suite run by `npm test`) because
// these tests hit the real Supabase project directly — they need live credentials and a network
// connection, and are slower/less deterministic than pure rules.ts tests. Run with `npm run
// test:integration`. See docs/implementation-plan.md Phase 9: "webhook/RLS are integration tested".
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup-env.ts"],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover the dependency-free logic in src/lib plus the checkout
// server action with its Supabase client and mailers stubbed out. The browser
// flow lives in tests/e2e and runs under Playwright instead.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.js"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

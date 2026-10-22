import { defineConfig, devices } from "@playwright/test";

// The browser suite drives a real store: it needs a running app and a Supabase
// project with at least one product and one active delivery zone. Point
// E2E_BASE_URL at that store, otherwise the specs skip themselves.
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  // Checkout writes an order, so the specs run one at a time.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

import { defineConfig } from "@playwright/test";
import process from "node:process";

const baseURL = "http://127.0.0.1:3310";

/**
 * API-focused E2E: hits core-api with `request` (no browser UI in this repo yet).
 * Server is started via `scripts/e2e-server.mjs` (db push, seed, listen).
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: process.env.CI === "true",
  retries: process.env.CI === "true" ? 1 : 0,
  workers: 1,
  use: {
    baseURL,
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: `${baseURL}/ready`,
    reuseExistingServer: process.env.CI !== "true",
    timeout: 120_000,
  },
  reporter: process.env.CI === "true" ? "github" : "list",
});

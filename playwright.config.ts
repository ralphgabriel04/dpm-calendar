import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for DPM Calendar (Next.js 14, App Router).
 *
 * Base URL resolution:
 *   - Defaults to http://localhost:3000 (the Next dev server).
 *   - Override with E2E_BASE_URL to test against a deployed/preview URL.
 *
 * Web server:
 *   - When E2E_BASE_URL is NOT set, Playwright boots `npm run dev` locally.
 *   - When E2E_BASE_URL IS set, we assume the target app is already running
 *     (deployed preview, staging, etc.) and do NOT spawn a dev server. This
 *     also prevents CI from hanging trying to start a dev server with no DB.
 *
 * NOTE: These specs require a running app + a seeded database to pass. Several
 * are intentionally marked test.fixme()/test.skip() until seeded auth/DB exist
 * (see docs/E2E.md). They are written to be correct and list-able now.
 */

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Each test gets a reasonable per-test budget.
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  // Fail the build on CI if test.only was committed by mistake.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limit workers on CI for stability; let Playwright auto-detect locally.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  // Only spin up a local dev server when no external base URL is provided.
  // When E2E_BASE_URL is set (CI against a deployed URL, or a separately
  // started server), we skip this entirely so nothing hangs without a DB.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

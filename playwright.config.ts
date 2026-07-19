import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, PORT, dbEnv } from "./e2e/config";

/**
 * Playwright e2e configuration.
 *
 * The app is server-rendered from MongoDB. `global-setup` provisions a
 * disposable Mongo (Docker locally, or a service container in CI) and seeds
 * deterministic game/user data; the `webServer` below builds and starts the
 * real Next.js app against that database.
 *
 * Ordering note: Playwright starts the webServer BEFORE globalSetup runs, so
 * the app boots before Mongo exists. That's fine because the app only opens
 * DB connections lazily per-request and `webServer.url` is the DB-free
 * holding page - keep that URL pointing at a page that doesn't touch the
 * database.
 *
 * Tests run on desktop and mobile viewports across Chromium and WebKit to
 * cover the responsive `lg:` (1024px) layout split and cross-engine behaviour.
 */

export default defineConfig({
    testDir: "./e2e",
    testMatch: "**/*.spec.ts",
    globalSetup: "./e2e/global-setup.ts",
    globalTeardown: "./e2e/global-teardown.ts",

    // Tests within a file run serially (they may reset shared game state).
    // Separate files can run in parallel across workers: read-only specs share
    // seed documents, and mutating specs write only to per-project copies (see
    // projectGameId in e2e/helpers.ts), so there is no cross-worker write
    // contention.
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [["list"], ["html", { open: "never" }]]
        : [["list"]],

    // The app's client polls the server every 5s; an assertion that has to
    // wait out one stale poll cycle needs more than the 5s default to
    // converge, so give expect() room for a full cycle plus slack.
    expect: {
        timeout: 10_000,
    },

    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "Desktop Chrome",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "Mobile Chrome",
            use: { ...devices["Pixel 5"] },
        },
        {
            name: "Desktop Safari",
            use: { ...devices["Desktop Safari"] },
        },
        {
            name: "Mobile Safari",
            use: { ...devices["iPhone 13"] },
        },
    ],

    webServer: {
        command: `npm run build && npm run start -- --port ${PORT}`,
        url: BASE_URL,
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
        // Forward the shared DB/session config to the Next.js app server.
        env: { ...dbEnv },
    },
});

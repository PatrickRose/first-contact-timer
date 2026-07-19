import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, dbEnv } from "./e2e/config";

/**
 * Playwright e2e configuration.
 *
 * The app is server-rendered from MongoDB, so `global-setup` provisions a
 * disposable Mongo (Docker locally, or a service container in CI), seeds
 * deterministic game/user data, and the `webServer` below builds and starts
 * the real Next.js app against that database.
 *
 * Tests run on both a desktop and a mobile viewport (Chromium only) to cover
 * the responsive `lg:` (1024px) layout split.
 */

export default defineConfig({
    testDir: "./e2e",
    testMatch: "**/*.spec.ts",
    globalSetup: "./e2e/global-setup.ts",
    globalTeardown: "./e2e/global-teardown.ts",

    // Tests within a file run serially (they may reset shared game state);
    // separate files still run in parallel across workers, and each file owns
    // its own game ids so there is no cross-file contention.
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [["list"], ["html", { open: "never" }]]
        : [["list"]],

    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
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
    ],

    webServer: {
        command: "npm run build && npm run start",
        url: BASE_URL,
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
        // Forward the shared DB/session config to the Next.js app server.
        env: { ...dbEnv },
    },
});

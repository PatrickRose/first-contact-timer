import { test, expect } from "@playwright/test";
import { ADMIN_USERNAME, DEFAULT_PASSWORD } from "./seed";

test.describe("admin", () => {
    test("unauthenticated admin redirects to login", async ({ page }) => {
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/admin\/login$/);
        await expect(page.getByLabel("Username")).toBeVisible();
    });

    test("log in and create a game", async ({
        page,
        browserName,
    }, testInfo) => {
        // The e2e server runs over http://localhost, and the iron-session
        // cookie is Secure (production build). WebKit refuses to store Secure
        // cookies over plain http (Chromium treats localhost as secure), so the
        // session can't be established here. This is a test-server artifact
        // only - production runs over HTTPS. Auth is covered by the Chromium
        // projects.
        test.skip(
            browserName === "webkit",
            "WebKit drops Secure cookies over http://localhost",
        );

        await page.goto("/admin/login");

        await page.getByLabel("Username").fill(ADMIN_USERNAME);
        await page.getByLabel("Password").fill(DEFAULT_PASSWORD);

        // Log in and confirm the request succeeded (the session cookie is set).
        const [loginResponse] = await Promise.all([
            page.waitForResponse((response) =>
                response.url().includes("/api/login"),
            ),
            page.getByRole("button", { name: "Login" }).click(),
        ]);
        expect(loginResponse.status()).toBe(200);

        // The protected dashboard is now reachable, proving the session works
        // (the middleware would otherwise bounce us back to /admin/login).
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/admin\/?$/);
        await expect(
            page.getByRole("heading", { name: "Dashboard" }),
        ).toBeVisible();

        // Go to the create-game form. Unique id per project/run so reruns and
        // the second viewport project don't collide on a duplicate _id.
        await page.goto("/admin/game/create");
        const gameId = `e2e-created-${testInfo.project.name
            .replace(/\s+/g, "-")
            .toLowerCase()}-${Date.now()}`;

        await page.getByLabel("Game ID").fill(gameId);
        await page.locator("#first-contact").check();
        await page.getByRole("button", { name: "Create Game" }).click();

        // Success banner links to the new game.
        const status = page.getByRole("status");
        await expect(status).toBeVisible();
        await expect(status).toContainText(gameId);

        await status.getByRole("link", { name: `/game/${gameId}` }).click();
        await expect(page).toHaveURL(new RegExp(`/game/${gameId}$`));
        await expect(page.getByRole("main")).toBeVisible();
    });
});

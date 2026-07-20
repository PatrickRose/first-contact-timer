import { test, expect, type Page } from "./fixtures";
import { projectGameId } from "./helpers";
import { ADMIN_USERNAME, DEFAULT_PASSWORD, games } from "./seed";

// The e2e server runs over http://localhost with a Secure iron-session cookie
// (production build). WebKit refuses to store Secure cookies over plain http
// (Chromium treats localhost as secure), so any admin flow that needs a session
// is skipped there - it's a test-server artifact only. Auth is covered by the
// Chromium projects.
async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto("/admin/login");
    await page.getByLabel("Username").fill(ADMIN_USERNAME);
    await page.getByLabel("Password").fill(DEFAULT_PASSWORD);

    const [loginResponse] = await Promise.all([
        page.waitForResponse((response) =>
            response.url().includes("/api/login"),
        ),
        page.getByRole("button", { name: "Login" }).click(),
    ]);
    expect(loginResponse.status()).toBe(200);
}

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
        test.skip(
            browserName === "webkit",
            "WebKit drops Secure cookies over http://localhost",
        );

        await loginAsAdmin(page);

        // The protected dashboard is now reachable, proving the session works
        // (the middleware would otherwise bounce us back to /admin/login).
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/admin\/?$/);
        await expect(
            page.getByRole("heading", { name: "Dashboard" }),
        ).toBeVisible();

        // Go to the create-game form. Unique id per project AND per run so
        // reruns and the other viewport projects don't collide on a duplicate
        // _id.
        await page.goto("/admin/game/create");
        const gameId = `${projectGameId("e2e-created", testInfo)}-${Date.now()}`;

        await page.getByLabel("Game ID").fill(gameId);
        await page.getByRole("radio", { name: "First Contact: 2035" }).check();
        await page.getByRole("button", { name: "Create Game" }).click();

        // Success banner links to the new game.
        const status = page.getByRole("status");
        await expect(status).toBeVisible();
        await expect(status).toContainText(gameId);

        await status.getByRole("link", { name: `/game/${gameId}` }).click();
        await expect(page).toHaveURL(new RegExp(`/game/${gameId}$`));
        await expect(page.getByRole("main")).toBeVisible();
    });

    test("lists games with search, pagination and share links", async ({
        page,
        browserName,
    }) => {
        test.skip(
            browserName === "webkit",
            "WebKit drops Secure cookies over http://localhost",
        );

        await loginAsAdmin(page);

        await page.goto("/admin/game");
        await expect(
            page.getByRole("heading", { name: "Games" }),
        ).toBeVisible();

        // A known seeded game is listed.
        await expect(
            page.getByText(games.firstContact, { exact: true }),
        ).toBeVisible();

        // The filler games guarantee more than one page regardless of what
        // other (parallel) specs have upserted, so Previous is disabled (a
        // non-link span) and Next is an available link on the first page.
        await expect(page.getByText("← Previous")).toBeVisible();
        await expect(
            page.getByRole("link", { name: "← Previous" }),
        ).toHaveCount(0);
        const nextLink = page.getByRole("link", { name: "Next →" });
        await expect(nextLink).toBeVisible();

        await nextLink.click();
        await expect(page).toHaveURL(/[?&]page=2\b/);
        // Previous is now an active link (we left page 1).
        await expect(
            page.getByRole("link", { name: "← Previous" }),
        ).toBeVisible();

        // Search by code narrows to the paused game. Its unique code can't
        // collide with filler ids or namespaced games from other specs. The
        // input is debounced, so wait for the resulting navigation to land
        // (which also drops the page param, resetting to page 1).
        await page.getByPlaceholder("Search by code…").fill(games.paused);
        await expect(page).toHaveURL(new RegExp(`search=${games.paused}`));
        await expect(
            page.getByRole("button", { name: "Links & QR" }),
        ).toHaveCount(1);
        await expect(
            page.getByText(games.paused, { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText(games.firstContact, { exact: true }),
        ).toHaveCount(0);
        // The paused seed game reports its state (and turn/phase) from the
        // frozen turn: turn 1, phase 1 ("Team Time"), paused.
        await expect(
            page.getByText("Turn 1 · Team Time (Phase 1) · Paused"),
        ).toBeVisible();

        // Open the share modal and confirm all three view links + QR codes.
        // (Scope queries to the dialog; the Headless UI dialog role sits on a
        // zero-size relative wrapper, so assert visibility on its content.)
        await page.getByRole("button", { name: "Links & QR" }).click();
        const dialog = page.getByRole("dialog");

        // Only the player code ends exactly at the game id; control/press add a
        // suffix, so each regex matches exactly one <code>.
        await expect(
            dialog.getByText(new RegExp(`/game/${games.paused}$`)),
        ).toBeVisible();
        await expect(
            dialog.getByText(new RegExp(`/game/${games.paused}/control$`)),
        ).toBeVisible();
        await expect(
            dialog.getByText(new RegExp(`/game/${games.paused}/press$`)),
        ).toBeVisible();
        // react-qr-code renders an <svg> per view.
        await expect(dialog.locator("svg")).toHaveCount(3);
    });
});

import { test, expect } from "./fixtures";
import { games } from "./seed";
import { openTab, projectGameId } from "./helpers";

const NEWS_LABEL = "Enter breaking news headline here:";

test.describe("press tools", () => {
    test("can submit breaking news on an active game", async ({
        page,
        resetGame,
    }, testInfo) => {
        // Submitting mutates the game, so use a per-project copy.
        const gameId = projectGameId(games.firstContact, testInfo);
        await resetGame(games.firstContact, gameId);

        await page.goto(`/game/${gameId}/press`);
        await openTab(page, "Press Tools");

        const textarea = page.getByLabel(NEWS_LABEL);
        await expect(textarea).toBeVisible();
        await textarea.fill("Aliens spotted over the capital");

        // Assert on the POST response: it proves the headline was persisted and
        // echoed back (race-free, unlike the polled UI). The banner that would
        // show it is desktop-only, so checking the response works on every
        // viewport.
        const [response] = await Promise.all([
            page.waitForResponse(
                (r) =>
                    new URL(r.url()).pathname
                        .replace(/\/+$/, "")
                        .endsWith("/press/api") &&
                    r.request().method() === "POST" &&
                    // PressForm posts to a trailing-slash URL, so skip the 308
                    // redirect Next issues and capture the real response.
                    (r.status() < 300 || r.status() >= 400),
            ),
            page.getByRole("button", { name: "Submit breaking news" }).click(),
        ]);
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(
            body.breakingNews.some((item: { newsText: string }) =>
                item.newsText.includes("Aliens spotted over the capital"),
            ),
        ).toBe(true);

        // And the form clears on success.
        await expect(textarea).toHaveValue("");
    });

    test("submit is disabled while the game is paused", async ({ page }) => {
        await page.goto(`/game/${games.paused}/press`);
        await openTab(page, "Press Tools");

        await expect(
            page.getByRole("button", {
                name: "Game is paused, please wait until active before posting",
            }),
        ).toBeDisabled();
    });

    test("multi-press game shows a team picker", async ({ page }) => {
        await page.goto(`/game/${games.multipress}/press`);

        await expect(page.getByText(/choose the press team/i)).toBeVisible();

        // Pick the first press team, which leads to that team's press view.
        await page.getByRole("link", { name: /Business Times/ }).click();
        await expect(page).toHaveURL(
            new RegExp(`/game/${games.multipress}/press/1$`),
        );

        await openTab(page, "Press Tools");
        await expect(page.getByLabel(NEWS_LABEL)).toBeVisible();
    });
});

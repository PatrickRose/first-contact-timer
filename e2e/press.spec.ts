import { test, expect } from "@playwright/test";
import { games } from "./seed";
import { openTab } from "./helpers";

test.describe("press tools", () => {
    test("can submit breaking news on an active game", async ({ page }) => {
        await page.goto(`/game/${games.firstContact}/press`);
        await openTab(page, "Press Tools");

        const textarea = page.locator('textarea[name="breaking-news"]');
        await expect(textarea).toBeVisible();

        await textarea.fill("Aliens spotted over the capital");

        const submit = page.getByRole("button", {
            name: "Submit breaking news",
        });
        await expect(submit).toBeEnabled();
        await submit.click();

        // On a successful round-trip the form clears its textarea.
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
        await expect(
            page.locator('textarea[name="breaking-news"]'),
        ).toBeVisible();
    });
});

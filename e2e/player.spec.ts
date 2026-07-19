import { test, expect } from "@playwright/test";
import { games } from "./seed";
import { isMobileLayout } from "./helpers";

test.describe("player display", () => {
    test("renders the current turn and phase", async ({ page }) => {
        await page.goto(`/game/${games.firstContact}`);

        // Turn/phase heading is present in both layouts.
        await expect(
            page.getByRole("heading", { name: /Turn 1: Team Time/ }),
        ).toBeVisible();

        // Every phase from the setup is listed in the phase counter. The same
        // titles appear in hidden mobile/desktop variants, so pick a visible one.
        for (const phase of ["Team Time", "Action Phase", "Debrief"]) {
            await expect(
                page
                    .getByText(phase, { exact: false })
                    .filter({ visible: true })
                    .first(),
            ).toBeVisible();
        }
    });

    test("shows the layout appropriate to the viewport", async ({ page }) => {
        await page.goto(`/game/${games.firstContact}`);
        await expect(
            page.getByRole("heading", { name: /Turn 1: Team Time/ }),
        ).toBeVisible();

        const mobileTimer = page.locator("p.text-6xl").first();
        const desktopTimer = page.locator("p.text-8xl").first();
        const gameTab = page.getByRole("button", { name: "Game", exact: true });

        if (await isMobileLayout(page)) {
            // Mobile: bottom tab bar + condensed timer, no desktop timer.
            await expect(gameTab).toBeVisible();
            await expect(mobileTimer).toBeVisible();
            await expect(desktopTimer).toBeHidden();
        } else {
            // Desktop: large timer, tab bar collapsed away.
            await expect(desktopTimer).toBeVisible();
            await expect(gameTab).toBeHidden();
        }
    });

    test("mobile tab switching does not crash and swaps content", async ({
        page,
    }) => {
        test.skip(
            !(await isMobileLayout(page)),
            "Tab bar only exists on mobile widths",
        );

        await page.goto(`/game/${games.firstContact}`);

        const turnHeading = page.getByRole("heading", {
            name: /Turn 1: Team Time/,
        });
        await expect(turnHeading).toBeVisible();

        // Switch to the Defcon component tab: the home content should hide.
        await page.getByRole("button", { name: "Defcon", exact: true }).click();
        await expect(turnHeading).toBeHidden();

        // Switch back to the Game tab: the home content should return.
        await page.getByRole("button", { name: "Game", exact: true }).click();
        await expect(turnHeading).toBeVisible();
    });

    test("aftermath theme renders", async ({ page }) => {
        await page.goto(`/game/${games.aftermath}`);
        await expect(page.getByRole("main")).toBeVisible();
        await expect(
            page.getByText("Team Time").filter({ visible: true }).first(),
        ).toBeVisible();
    });

    test("paused game shows the paused banner", async ({ page }) => {
        await page.goto(`/game/${games.paused}`);
        await expect(
            page.getByText("GAME PAUSED").filter({ visible: true }).first(),
        ).toBeVisible();
    });
});

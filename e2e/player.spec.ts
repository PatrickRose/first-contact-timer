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

        const mobileTimer = page.getByTestId("turn-timer-mobile");
        const desktopTimer = page.getByTestId("turn-timer-desktop");
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

        const pageErrors: Error[] = [];
        page.on("pageerror", (error) => pageErrors.push(error));

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

        // No "X is not a function" from a bad effect cleanup (see the
        // regression test below). Filtered to that signature so unrelated
        // transient page errors don't make this flaky.
        expect(
            pageErrors.filter((e) => /is not a function/i.test(e.message)),
        ).toEqual([]);
    });

    test("mobile tab switching survives a Promise-returning scrollTo", async ({
        page,
    }) => {
        test.skip(
            !(await isMobileLayout(page)),
            "Tab bar only exists on mobile widths",
        );

        // Regression guard for the production mobile-tab-switch crash
        // (commit 641bcb3). On the real mobile browser where it was found,
        // window.scrollTo returns a Promise; GameTabSwitcher's scroll-to-top
        // effect used an implicit-return arrow, so that Promise became the
        // effect's "cleanup" and React called it as a function on the next tab
        // switch -> "TypeError: ... is not a function". Playwright's engines
        // return undefined from scrollTo, so we reproduce the production
        // condition explicitly and assert no uncaught error is thrown.
        await page.addInitScript(() => {
            window.scrollTo = (() =>
                Promise.resolve()) as unknown as typeof window.scrollTo;
        });

        const pageErrors: Error[] = [];
        page.on("pageerror", (error) => pageErrors.push(error));

        await page.goto(`/game/${games.firstContact}`);
        await expect(
            page.getByRole("heading", { name: /Turn 1: Team Time/ }),
        ).toBeVisible();

        // Two switches: the second is where the bad cleanup would be invoked
        // during effect teardown.
        await page.getByRole("button", { name: "Defcon", exact: true }).click();
        await page.getByRole("button", { name: "Game", exact: true }).click();

        // Liveness first: with the bug the crash on the second switch blanks
        // the tree / drops the tab bar, so the Game content wouldn't restore.
        await expect(
            page.getByRole("heading", { name: /Turn 1: Team Time/ }),
        ).toBeVisible();

        // Then the specific crash signature: React calling the returned Promise
        // as the cleanup -> "TypeError: ... is not a function". Checked after the
        // visibility assertion so an asynchronously-delivered error isn't missed.
        expect(
            pageErrors.filter((e) => /is not a function/i.test(e.message)),
        ).toEqual([]);
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

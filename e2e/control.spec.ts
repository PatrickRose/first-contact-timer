import { test, expect } from "@playwright/test";
import { games } from "./seed";
import { openTab } from "./helpers";
import { closeDb, resetGame } from "./db";

test.describe("control tools", () => {
    // Control actions mutate the game (pause, phase/turn, light level), so
    // restore a pristine copy before each test to keep them independent.
    test.beforeEach(async ({ page }) => {
        await resetGame(games.lightLevel);
        await page.goto(`/game/${games.lightLevel}/control`);
        // On mobile the control panel lives behind the "Control Tools" tab.
        await openTab(page, "Control Tools");
        await expect(
            page.getByRole("heading", { name: "Control Tools" }),
        ).toBeVisible();
    });

    test.afterAll(async () => {
        await closeDb();
    });

    test("pause and resume toggles the control", async ({ page }) => {
        const pause = page.getByRole("button", { name: "Pause the game" });
        await expect(pause).toBeVisible();

        await pause.click();

        const resume = page.getByRole("button", {
            name: "Continue the game from this state",
        });
        await expect(resume).toBeVisible();
        await expect(pause).toBeHidden();

        // No control error should appear.
        await expect(
            page.getByText("There was an issue running the Control command"),
        ).toBeHidden();
    });

    test("phase and turn navigation buttons work", async ({ page }) => {
        for (const name of [
            "Go back a turn",
            "Go back a phase",
            "Go forward a phase",
        ]) {
            const button = page.getByRole("button", { name });
            await expect(button).toBeVisible();
            await button.click();
            await expect(
                page.getByText(
                    "There was an issue running the Control command",
                ),
            ).toBeHidden();
        }
    });

    test("QR code can be shown and hidden", async ({ page }) => {
        const show = page.getByRole("button", { name: "Show QR code" });
        await show.click();

        await expect(
            page.getByRole("button", { name: "Hide QR code" }),
        ).toHaveAttribute("aria-expanded", "true");
        await expect(
            page.locator("code", { hasText: `/game/${games.lightLevel}` }),
        ).toBeVisible();

        await page.getByRole("button", { name: "Hide QR code" }).click();
        await expect(
            page.getByRole("button", { name: "Show QR code" }),
        ).toBeVisible();
    });

    test("light level can be increased and set", async ({ page }) => {
        await expect(page.getByText("5 / 10")).toBeVisible();

        await page.getByRole("button", { name: "+", exact: true }).click();
        await expect(page.getByText("6 / 10")).toBeVisible();

        const input = page.locator('input[type="number"]');
        await input.fill("8");
        await page.getByRole("button", { name: "Set", exact: true }).click();
        await expect(page.getByText("8 / 10")).toBeVisible();
    });
});

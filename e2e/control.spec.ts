import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { games } from "./seed";
import { openTab, projectGameId } from "./helpers";

test.describe("control tools", () => {
    // Control actions mutate the game (pause, phase/turn, light level). Use a
    // per-project copy and reset it before each test so the four projects stay
    // independent even when they run in parallel locally.
    let gameId: string;

    test.beforeEach(async ({ page, resetGame }, testInfo) => {
        gameId = projectGameId(games.lightLevel, testInfo);
        await resetGame(games.lightLevel, gameId);
        await page.goto(`/game/${gameId}/control`);
        // On mobile the control panel lives behind the "Control Tools" tab.
        await openTab(page, "Control Tools");
        await expect(
            page.getByRole("heading", { name: "Control Tools" }),
        ).toBeVisible();
    });

    // Click a control action and return the ApiResponse the POST responded
    // with. Asserting on the response is race-free (unlike the polled UI) and
    // proves the action actually took effect server-side.
    async function runControlAction(page: Page, name: string) {
        const [response] = await Promise.all([
            page.waitForResponse(
                (r) =>
                    new URL(r.url()).pathname.endsWith("/control/api") &&
                    r.request().method() === "POST",
            ),
            page.getByRole("button", { name }).click(),
        ]);
        expect(response.ok()).toBeTruthy();
        return response.json();
    }

    test("pause and resume toggles the control", async ({ page }) => {
        const pause = page.getByRole("button", { name: "Pause the game" });
        await expect(pause).toBeVisible();

        const paused = await runControlAction(page, "Pause the game");
        expect(paused.active).toBe(false);

        await expect(
            page.getByRole("button", {
                name: "Continue the game from this state",
            }),
        ).toBeVisible();

        const resumed = await runControlAction(
            page,
            "Continue the game from this state",
        );
        expect(resumed.active).toBe(true);
        await expect(pause).toBeVisible();

        await expect(
            page.getByText("Control command failed", { exact: false }),
        ).toBeHidden();
    });

    test("phase and turn navigation changes turn and phase", async ({
        page,
    }) => {
        // Reset state is turn 1, phase 1 (of 3).
        const forwardPhase = await runControlAction(page, "Go forward a phase");
        expect(forwardPhase).toMatchObject({ turnNumber: 1, phase: 2 });

        const forwardTurn = await runControlAction(page, "Go forward a turn");
        expect(forwardTurn).toMatchObject({ turnNumber: 2, phase: 1 });

        const backPhase = await runControlAction(page, "Go back a phase");
        expect(backPhase).toMatchObject({ turnNumber: 1, phase: 3 });

        const backTurn = await runControlAction(page, "Go back a turn");
        expect(backTurn).toMatchObject({ turnNumber: 1, phase: 1 });
    });

    test("QR code can be shown and hidden", async ({ page }) => {
        const show = page.getByRole("button", { name: "Show QR code" });
        await show.click();

        await expect(
            page.getByRole("button", { name: "Hide QR code" }),
        ).toHaveAttribute("aria-expanded", "true");
        await expect(
            page.locator("code", { hasText: `/game/${gameId}` }),
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

        await page.getByRole("spinbutton").fill("8");
        await page.getByRole("button", { name: "Set", exact: true }).click();
        await expect(page.getByText("8 / 10")).toBeVisible();
    });
});

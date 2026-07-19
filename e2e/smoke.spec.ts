import { test, expect } from "./fixtures";

test.describe("smoke", () => {
    test("holding page renders", async ({ page }) => {
        await page.goto("/");

        await expect(
            page.getByRole("heading", { name: "Megadmin Timer" }),
        ).toBeVisible();
        await expect(
            page.getByText("This is a holding page", { exact: false }),
        ).toBeVisible();
    });

    test("unknown game id shows a not-found page", async ({ page }) => {
        await page.goto("/game/does-not-exist");
        await expect(
            page.getByText("This page could not be found.", { exact: false }),
        ).toBeVisible();
    });
});

import { expect, type Page, type TestInfo } from "@playwright/test";

/**
 * A game id namespaced to the running project. Mutating specs use this so the
 * four projects (Desktop/Mobile x Chrome/Safari) each mutate their own copy of
 * a seeded game instead of racing on one shared document.
 */
export function projectGameId(baseId: string, testInfo: TestInfo): string {
    const slug = testInfo.project.name.replace(/\s+/g, "-").toLowerCase();
    return `${baseId}-${slug}`;
}

/**
 * The layout is responsive via Tailwind's `lg:` (1024px) breakpoint: below it
 * the bottom tab bar (GameTabSwitcher) shows and the sidebar hides. Detected
 * from the project's viewport width, which is what drives that CSS.
 */
export function isMobileLayout(page: Page): boolean {
    return (page.viewportSize()?.width ?? 0) < 1024;
}

/**
 * Wait until React has hydrated and the client is live, proven by the 1s
 * countdown actually ticking (only client-side JS changes that text).
 *
 * Interacting with a controlled input before hydration silently loses the
 * input: the fill sets the DOM value but no React onChange fires, and the
 * next client render resets the field to React's (empty) state - observed as
 * a real race on Desktop Safari, whose larger desktop tree hydrates slowest.
 * Only valid on an ACTIVE game (a paused game's countdown doesn't tick).
 */
export async function waitForCountdownTick(page: Page): Promise<void> {
    const timer = page.getByTestId("turn-timer-desktop");
    const initial = await timer.textContent();
    await expect(timer).not.toHaveText(initial ?? "");
}

/**
 * On mobile the game views are split across a bottom tab bar; the tab's
 * accessible name is its title (e.g. "Game", "Defcon", "Control Tools",
 * "Press"). On desktop everything is shown at once, so switching is a no-op.
 */
export async function openTab(page: Page, tabName: string): Promise<void> {
    if (!isMobileLayout(page)) {
        return;
    }

    const tab = page.getByRole("button", { name: tabName, exact: true });
    await expect(tab).toBeVisible();
    await tab.click();
}

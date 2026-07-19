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
 * The layout is responsive via Tailwind's `lg:` (1024px) breakpoint. The bottom
 * tab bar (GameTabSwitcher) is `lg:hidden`, so its presence is a reliable proxy
 * for "this is the mobile layout".
 */
export async function isMobileLayout(page: Page): Promise<boolean> {
    const width = page.viewportSize()?.width ?? 0;
    return width < 1024;
}

/**
 * On mobile the game views are split across a bottom tab bar; the tab's
 * accessible name is its title (e.g. "Game", "Defcon", "Control Tools",
 * "Press"). On desktop everything is shown at once, so switching is a no-op.
 */
export async function openTab(page: Page, tabName: string): Promise<void> {
    if (!(await isMobileLayout(page))) {
        return;
    }

    const tab = page.getByRole("button", { name: tabName, exact: true });
    await expect(tab).toBeVisible();
    await tab.click();
}

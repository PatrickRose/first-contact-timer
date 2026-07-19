import { expect, type Page } from "@playwright/test";

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

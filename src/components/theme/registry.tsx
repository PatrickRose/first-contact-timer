import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Theme } from "@fc/types/types";
import type { ThemeProps } from "./theme";

// The theme used when a game's persisted theme is missing from the registry.
export const DEFAULT_THEME: Theme = "first-contact";

// Shown while a theme's code-split chunk is being fetched. Without a loading
// fallback a slow or failed chunk fetch would render nothing at all; this keeps
// the page from going blank and mirrors the route-level loading treatment.
function ThemeLoading() {
    return <div>Loading game state, please wait...</div>;
}

// A registry of the available themes. Each entry is code-split with
// next/dynamic so a player only downloads the theme their game uses instead of
// bundling every theme into every game page. Adding a theme means adding one
// entry here (plus its shell component) rather than editing an if/else chain.
export const THEME_REGISTRY: Record<Theme, ComponentType<ThemeProps>> = {
    "first-contact": dynamic(
        () =>
            import("./first-contact/FirstContactTheme").then(
                (mod) => mod.FirstContactTheme,
            ),
        { loading: ThemeLoading },
    ),
    aftermath: dynamic(
        () =>
            import("./aftermath/AftermathTheme").then(
                (mod) => mod.AftermathTheme,
            ),
        { loading: ThemeLoading },
    ),
};

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Theme } from "@fc/types/types";
import type { ThemeProps } from "./theme";

// The theme used when a game's persisted theme is missing from the registry.
export const DEFAULT_THEME: Theme = "first-contact";

// A registry of the available themes. Each entry is code-split with
// next/dynamic so a player only downloads the theme their game uses instead of
// bundling every theme into every game page. Adding a theme means adding one
// entry here (plus its shell component) rather than editing an if/else chain.
export const THEME_REGISTRY: Record<Theme, ComponentType<ThemeProps>> = {
    "first-contact": dynamic(() =>
        import("./first-contact/FirstContactTheme").then(
            (mod) => mod.FirstContactTheme,
        ),
    ),
    aftermath: dynamic(() =>
        import("./aftermath/AftermathTheme").then((mod) => mod.AftermathTheme),
    ),
};

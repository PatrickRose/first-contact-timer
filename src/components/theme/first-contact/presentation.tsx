import * as React from "react";
import { SetupInformation } from "@fc/types/types";
import type { CurrentTurnPresentation } from "../shared/CurrentTurn";
import type { BreakingNewsPresentation } from "../shared/BreakingNews";
import type { NewsFeedPresentation } from "../shared/NewsFeed";

// All of the first-contact theme's presentation choices live here, next to the
// first-contact shell. Adding a new theme means adding a sibling module for it
// (and wiring its shell) - the shared components take these values as required
// props, so a new theme cannot silently reuse another theme's look.

export function firstContactCurrentTurn(
    turn: number,
    phaseInformation: SetupInformation["phases"][0],
): CurrentTurnPresentation {
    const backgroundClass = phaseInformation.hidden
        ? "bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark opacity-50"
        : "bg-turn-counter-current";

    const turnText = phaseInformation.hidden
        ? `Turn ${turn}, next phase:`
        : `Turn ${turn}, current phase:`;

    return {
        header: (
            <div>
                <p className="pb-0 mb-0 text-xl">{turnText}</p>
                <p className="pb-0 mb-0 text-2xl">{phaseInformation.title}</p>
            </div>
        ),
        bannerClass: `text-white ${backgroundClass}`,
        timerSizeClass: "text-4xl",
    };
}

// first-contact pins the banner to the bottom of the viewport and renders the
// image at a larger resolution, width-capped.
export const FIRST_CONTACT_BREAKING_NEWS: BreakingNewsPresentation = {
    footerAccentClass: "sticky bottom-0",
    imageWrapperClass: "p-8 max-w-1/4",
    imageSize: 1024,
};

export const FIRST_CONTACT_NEWS_FEED: NewsFeedPresentation = {
    outerClass: "py-4",
    headerAccentClass: "mb-6",
};

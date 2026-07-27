import * as React from "react";
import { SetupInformation } from "@fc/types/types";
import type { CurrentTurnPresentation } from "../shared/CurrentTurn";
import type { BreakingNewsPresentation } from "../shared/BreakingNews";
import type { NewsFeedPresentation } from "../shared/NewsFeed";

// All of the aftermath theme's presentation choices live here, next to the
// aftermath shell. The shared components take these values as required props,
// so this theme's look is fully described in this module.

export function aftermathCurrentTurn(
    phaseInformation: SetupInformation["phases"][0],
): CurrentTurnPresentation {
    const textSize = phaseInformation.hidden ? "text-xl" : "text-4xl";

    return {
        header: (
            <div>
                <p
                    className={`pb-0 mb-0 text-2xl font-semibold uppercase ${textSize}`}
                >
                    {phaseInformation.title}
                </p>
            </div>
        ),
        bannerClass: "bg-aftermath-alert text-aftermath",
        timerSizeClass: "text-5xl",
    };
}

// aftermath lets the banner flow and clips overflow; the image is smaller.
export const AFTERMATH_BREAKING_NEWS: BreakingNewsPresentation = {
    footerAccentClass: "overflow-hidden",
    imageWrapperClass: "p-8",
    imageSize: 128,
};

export const AFTERMATH_NEWS_FEED: NewsFeedPresentation = {
    outerClass: "",
    headerAccentClass: "",
};

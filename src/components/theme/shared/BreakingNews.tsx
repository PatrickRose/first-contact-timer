import * as React from "react";
import { Game, NewsItem } from "@fc/types/types";
import { BreakingNewsText } from "./NewsFeed";
import Image from "next/image";
import { getIconForPressItem, getTitleForPressItem } from "@fc/lib/press";

// The theme-specific presentation for the breaking-news banner. Supplied
// explicitly by each theme shell so the shared component never branches on the
// active theme.
export interface BreakingNewsPresentation {
    // Positioning/overflow classes appended to the shared banner classes
    // (e.g. first-contact pins to the bottom, aftermath clips overflow).
    footerAccentClass: string;
    // Wrapper classes around the banner image.
    imageWrapperClass: string;
    // Rendered image resolution.
    imageSize: number;
}

interface BreakingNewsProps extends BreakingNewsPresentation {
    newsItem?: NewsItem;
    press: Game["setupInformation"]["press"];
}

export default function BreakingNews({
    newsItem,
    press,
    footerAccentClass,
    imageWrapperClass,
    imageSize,
}: BreakingNewsProps) {
    if (!newsItem) {
        return null;
    }

    if (press == false) {
        return null;
    }

    const footerClass = `${footerAccentClass} w-full bg-linear-to-r from-red-700 to-red-900 text-white mt-4 hidden lg:flex flex-row justify-between`;

    return (
        <footer className={footerClass}>
            <div className="p-8">
                <h3 className="uppercase translate-y-0 text-5xl m-0 font-bold text-left">
                    Breaking news
                </h3>
                <BreakingNewsText item={newsItem} />
            </div>
            <div className={imageWrapperClass}>
                <Image
                    src={getIconForPressItem(newsItem, press)}
                    alt={getTitleForPressItem(newsItem, press) ?? ""}
                    width={imageSize}
                    height={imageSize}
                />
            </div>
        </footer>
    );
}

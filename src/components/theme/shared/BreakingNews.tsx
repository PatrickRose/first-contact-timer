import * as React from "react";
import { Game, NewsItem, Theme } from "@fc/types/types";
import { BreakingNewsText } from "./NewsFeed";
import Image from "next/image";
import { getIconForPressItem, getTitleForPressItem } from "@fc/lib/press";

export default function BreakingNews({
    newsItem,
    press,
    variant = "first-contact",
}: {
    newsItem?: NewsItem;
    press: Game["setupInformation"]["press"];
    // Selects the small layout differences between the themes.
    variant?: Theme;
}) {
    if (!newsItem) {
        return null;
    }

    if (press == false) {
        return null;
    }

    const isFirstContact = variant === "first-contact";

    // first-contact pins the banner to the bottom of the viewport; aftermath
    // lets it flow and clips overflow. The image is rendered at a larger
    // resolution and width-capped in first-contact.
    const footerClass = `${
        isFirstContact ? "sticky bottom-0 " : ""
    }w-full bg-linear-to-r from-red-700 to-red-900 text-white mt-4 ${
        isFirstContact ? "" : "overflow-hidden "
    }hidden lg:flex flex-row justify-between`;
    const imageWrapperClass = isFirstContact ? "p-8 max-w-1/4" : "p-8";
    const imageSize = isFirstContact ? 1024 : 128;

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

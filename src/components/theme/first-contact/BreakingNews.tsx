import * as React from "react";
import { Game, NewsItem } from "@fc/types/types";
import { BreakingNewsText } from "./NewsFeed";
import Image from "next/image";
import { getIconForPressItem, getTitleForPressItem } from "@fc/lib/press";

export default function BreakingNews({
    newsItem,
    press,
}: {
    newsItem?: NewsItem;
    press: Game["setupInformation"]["press"];
}) {
    if (!newsItem) {
        return null;
    }

    if (press == false) {
        return null;
    }

    return (
        <footer
            className={
                "w-full bg-gradient-to-r from-red-700 to-red-900 text-white mt-4 overflow-hidden hidden lg:flex flex-row justify-between"
            }
        >
            <div className="p-8">
                <h3 className="uppercase translate-y-0 text-5xl m-0 font-bold text-left">
                    Breaking news
                </h3>
                <BreakingNewsText item={newsItem} />
            </div>
            <div className="p-8">
                <Image
                    className="w-full h-full"
                    src={getIconForPressItem(newsItem, press)}
                    alt={getTitleForPressItem(newsItem, press) ?? ""}
                    width={128}
                    height={128}
                />
            </div>
        </footer>
    );
}

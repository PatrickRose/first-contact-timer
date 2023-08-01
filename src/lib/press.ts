import { LivePress, NewsItem } from "../types/types";

import Icon_NewsFeed from "../../public/GNNLogo.png";
import Icon_Press from "../../public/newspaper-regular.svg";
import { ImageProps } from "next/image";

export function calculatePressTabIcon(pressInfo: LivePress): ImageProps["src"] {
    // Default press icon
    if (pressInfo === undefined) {
        return Icon_NewsFeed;
    }

    if (Array.isArray(pressInfo)) {
        return Icon_Press;
    }

    return pressInfo.logo === undefined ? Icon_NewsFeed : pressInfo.logo;
}

export function getIconForPressItem(
    item: NewsItem,
    press: LivePress
): ImageProps["src"] {
    if (press === undefined) {
        return Icon_NewsFeed;
    }

    if (Array.isArray(press)) {
        const relevantPress = press[item.pressAccount - 1];

        return relevantPress?.logo ?? Icon_NewsFeed;
    }

    return press.logo ?? Icon_NewsFeed;
}

export function getTitleForPressItem(
    item: NewsItem,
    press: LivePress
): string | null {
    if (Array.isArray(press)) {
        const relevantPress = press[item.pressAccount - 1];

        return relevantPress?.name ?? null;
    }

    return null;
}

export function getPressFeedTitle(press: LivePress): string {
    if (Array.isArray(press)) {
        return "Press Feed";
    }

    if (press === undefined) {
        return "GNN News Feed";
    }

    return `${press.name} News Feed`;
}

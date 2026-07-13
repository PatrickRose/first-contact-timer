import { describe, expect, test } from "@jest/globals";
import {
    calculatePressTabIcon,
    getIconForPress,
    getIconForPressItem,
    getPressFeedTitle,
    getTitleForPressItem,
} from "@fc/lib/press";
import { LivePress, NewsItem } from "@fc/types/types";

import Icon_NewsFeed from "@fc/public/GNNLogo.png";
import Icon_Press from "@fc/public/newspaper-regular.svg";

const singlePressWithLogo: LivePress = {
    name: "INC",
    logo: "/inc.png",
};

const singlePressWithoutLogo: LivePress = {
    name: "Town Crier",
};

const multiplePress: LivePress = [
    {
        name: "Business Times",
        logo: "/BusinessTimes.png",
    },
    {
        name: "Th3 Undergr0und",
    },
];

function makeNewsItem(pressAccount: number): NewsItem {
    return {
        newsText: "Something happened",
        date: "2023-01-01T00:00:00.000Z",
        turn: 1,
        phase: 1,
        pressAccount,
    };
}

describe("calculatePressTabIcon", () => {
    test("returns the default news feed icon when press is undefined", () => {
        expect(calculatePressTabIcon(undefined)).toBe(Icon_NewsFeed);
    });

    test("returns the press icon when there are multiple presses", () => {
        expect(calculatePressTabIcon(multiplePress)).toBe(Icon_Press);
    });

    test("returns the press logo for a single press with a logo", () => {
        expect(calculatePressTabIcon(singlePressWithLogo)).toBe("/inc.png");
    });

    test("returns the default news feed icon for a single press without a logo", () => {
        expect(calculatePressTabIcon(singlePressWithoutLogo)).toBe(
            Icon_NewsFeed,
        );
    });
});

describe("getIconForPress", () => {
    test("returns the default icon when press is undefined", () => {
        expect(getIconForPress(1, undefined)).toBe(Icon_NewsFeed);
    });

    test("returns the logo of the matching press in an array (1-indexed)", () => {
        expect(getIconForPress(1, multiplePress)).toBe("/BusinessTimes.png");
    });

    test("returns the default icon when the matching press in an array has no logo", () => {
        expect(getIconForPress(2, multiplePress)).toBe(Icon_NewsFeed);
    });

    test("returns the default icon when the press number is out of range", () => {
        expect(getIconForPress(3, multiplePress)).toBe(Icon_NewsFeed);
    });

    test("returns the logo for a single press", () => {
        expect(getIconForPress(1, singlePressWithLogo)).toBe("/inc.png");
    });

    test("returns the default icon for a single press without a logo", () => {
        expect(getIconForPress(1, singlePressWithoutLogo)).toBe(Icon_NewsFeed);
    });
});

describe("getIconForPressItem", () => {
    test("uses the press account of the news item", () => {
        expect(getIconForPressItem(makeNewsItem(1), multiplePress)).toBe(
            "/BusinessTimes.png",
        );
    });

    test("falls back to the default icon for an unknown press account", () => {
        expect(getIconForPressItem(makeNewsItem(5), multiplePress)).toBe(
            Icon_NewsFeed,
        );
    });
});

describe("getTitleForPressItem", () => {
    test("returns the name of the matching press in an array (1-indexed)", () => {
        expect(getTitleForPressItem(makeNewsItem(2), multiplePress)).toBe(
            "Th3 Undergr0und",
        );
    });

    test("returns null when the press account is out of range", () => {
        expect(getTitleForPressItem(makeNewsItem(3), multiplePress)).toBeNull();
    });

    test("returns null for a single press", () => {
        expect(
            getTitleForPressItem(makeNewsItem(1), singlePressWithLogo),
        ).toBeNull();
    });

    test("returns null when press is undefined", () => {
        expect(getTitleForPressItem(makeNewsItem(1), undefined)).toBeNull();
    });
});

describe("getPressFeedTitle", () => {
    test("returns the generic title when there are multiple presses", () => {
        expect(getPressFeedTitle(multiplePress)).toBe("Press Feed");
    });

    test("returns the GNN title when press is undefined", () => {
        expect(getPressFeedTitle(undefined)).toBe("GNN News Feed");
    });

    test("returns the press name for a single press", () => {
        expect(getPressFeedTitle(singlePressWithLogo)).toBe("INC News Feed");
    });
});

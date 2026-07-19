import type { LivePress, NewsItem, Theme } from "@fc/types/types";
import Image from "next/image";
import * as React from "react";
import { useEffect, useState } from "react";
import {
    getIconForPressItem,
    getPressFeedTitle,
    getTitleForPressItem,
} from "@fc/lib/press";

export function BreakingNewsText({ item }: { item: NewsItem }) {
    return (
        <div>
            {item.newsText
                ?.replace("\n\n", "\n")
                .split("\n")
                .map((val, key) => {
                    return (
                        <p className="py-2 text-left text-4xl mt-4" key={key}>
                            {val}
                        </p>
                    );
                })}
        </div>
    );
}

export function NewsFeedNewsText({ item }: { item: NewsItem }) {
    return (
        <div>
            {item.newsText
                .replace("\n\n", "\n")
                .split("\n")
                .map((val, key) => {
                    return (
                        <p className="py-2 text-left text-xl" key={key}>
                            {val}
                        </p>
                    );
                })}
        </div>
    );
}

function NewsItem({ item, press }: { item: NewsItem; press: LivePress }) {
    // Default this to an empty string
    // We can't trust that it'll be the same when we re-render
    const [formattedDate, setFormattedDate] = useState<string>("");

    useEffect(() => {
        // We do it this way to make sure we don't have a mismatch
        // when rendering
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormattedDate(new Date(item.date).toLocaleString());
    }, [item.date]);

    const pressName = getTitleForPressItem(item, press);

    return (
        <div className="flex pt-1">
            <div className="flex flex-col px-2 justify-center">
                <Image
                    src={getIconForPressItem(item, press)}
                    alt=""
                    width={60}
                    height={60}
                />
            </div>
            <div className="flex flex-col flex-1 px-2 pt-2">
                <div className="text-gray-500 text-left text-sm">
                    Turn {item.turn}, phase {item.phase} | {formattedDate}
                </div>
                <NewsFeedNewsText item={item} />
                {pressName !== null ? (
                    <div className="text-gray-500 text-left text-sm">
                        Posted by {pressName}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export function NewsFeed({
    newsItems,
    press,
    showPressFilter = true,
    variant = "first-contact",
}: {
    newsItems: NewsItem[];
    press: LivePress;
    // Whether the press-account filter is offered. Defaults to true so the
    // aftermath theme (which never opted out) keeps showing it.
    showPressFilter?: boolean;
    // Selects the small layout differences between the themes without forking
    // the component.
    variant?: Theme;
}) {
    const pressFeedTitle = getPressFeedTitle(press);

    const [filter, setFilter] = useState<number | null>(null);

    const itemsToShow =
        filter === null
            ? newsItems
            : newsItems.filter((val) => val.pressAccount == filter);

    const onChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedVal = ev.target.value;

        if (selectedVal === "NONE") {
            setFilter(null);
        } else {
            const newValue = Number.parseInt(selectedVal, 10);

            if (!isNaN(newValue)) {
                setFilter(newValue);
            }
        }
    };

    const isFirstContact = variant === "first-contact";
    const outerClass = isFirstContact ? "py-4" : "";
    const headerClass = `text-2xl mt-2 ${
        isFirstContact ? "mb-6 " : ""
    }uppercase text-center`;

    return (
        <div className={outerClass}>
            <h3 className={headerClass}>{pressFeedTitle}</h3>
            {showPressFilter && Array.isArray(press) ? (
                <div className="flex">
                    <div className="flex-1" />
                    <label htmlFor="pressSelect" className="sr-only">
                        Filter Press Account
                    </label>
                    {/*
                     * Controlled select: the current filter is driven by `value`
                     * on the <select>, not `selected` on each <option> (which
                     * React warns about at runtime for a controlled input).
                     */}
                    <select
                        className="text-black"
                        id="pressSelect"
                        onChange={onChange}
                        value={filter == null ? "NONE" : filter}
                    >
                        <option value="NONE">All Press</option>
                        {press.map((val, key) => (
                            <option key={key} value={key + 1}>
                                {val.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}
            {itemsToShow.map((item, index) => (
                <div className="py-2" key={index}>
                    <hr className="border-b-1 border-gray-500" />
                    <NewsItem item={item} press={press} />
                </div>
            ))}
        </div>
    );
}

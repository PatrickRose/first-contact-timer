import { NewsItem } from "../types/types";
import Image from "next/image";
import GNNLogo from "../../public/GNNLogo.png";
import * as React from "react";

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

function NewsItem({ item }: { item: NewsItem }) {
    return (
        <div className="flex pt-1 pb-0">
            <div className="flex flex-col px-2">
                <div>
                    <Image src={GNNLogo} alt="" width={60} />
                </div>
            </div>
            <div className="flex flex-col flex-1 px-2 pt-2">
                <div className="text-gray-500 text-left text-sm">
                    Turn {item.turn}, phase {item.phase} |{" "}
                    {new Date(item.date).toLocaleString()}
                </div>
                <NewsFeedNewsText item={item} />
            </div>
        </div>
    );
}

export function NewsFeed({ newsItems }: { newsItems: NewsItem[] }) {
    return (
        <div className="py-4 pb-24">
            <h3 className="text-2xl mt-2 mb-6 uppercase text-center">
                GNN News Feed
            </h3>
            {newsItems.map((item, index) => (
                <div className="py-2" key={index}>
                    <hr className="border-b-1 border-gray-500" />
                    <NewsItem item={item} />
                </div>
            ))}
        </div>
    );
}

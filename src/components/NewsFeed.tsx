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
                        <p className="py-2" key={key}>
                            {val}
                        </p>
                    );
                })}
        </div>
    );
}

function NewsItem({ item }: { item: NewsItem }) {
    return (
        <div className="flex p-4">
            <div className="flex flex-col justify-center px-2">
                <div>
                    <Image src={GNNLogo} alt="" width={50} />
                </div>
            </div>
            <div className="flex flex-col flex-1 px-2">
                <div>{new Date(item.date).toLocaleString()}</div>
                <p className="italic text-xs">
                    Posted on Turn {item.turn}, phase {item.phase}
                </p>
                <BreakingNewsText item={item} />
            </div>
        </div>
    );
}

export function NewsFeed({ newsItems }: { newsItems: NewsItem[] }) {
    return (
        <div>
            {newsItems.map((item, index) => (
                <div className="py-2" key={index}>
                    <NewsItem item={item} />
                    <hr />
                </div>
            ))}
        </div>
    );
}

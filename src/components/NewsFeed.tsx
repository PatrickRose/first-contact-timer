import { NewsItem } from "../types/types";
import Image from "next/image";
import GNNLogo from "../../public/GNNLogo.png";
import * as React from "react";

export function BreakingNewsText({item}: {item: NewsItem}) {
    return <div>
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
    </div>;
}

function NewsItem({ item }: { item: NewsItem }) {
    return (
        <div className="flex">
            <Image src={GNNLogo} alt="" width={50}/>
            <div className="flex flex-col flex-1">
                <div>{new Date(item.date).toLocaleString()}</div>
                <BreakingNewsText item={item} />
            </div>
        </div>
    );
}

export function NewsFeed({ newsItems }: { newsItems: NewsItem[] }) {
    return (
        <div>
            {newsItems.map((item, index) => (
                <NewsItem item={item} key={index} />
            ))}
        </div>
    );
}

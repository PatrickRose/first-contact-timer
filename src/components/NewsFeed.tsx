import { NewsItem } from "../types/types";
import Image from "next/image";
import GNNLogo from "../../public/GNNLogo.png";

function NewsItem({ item }: { item: NewsItem }) {
    return (
        <div className="flex">
            <Image src={GNNLogo} alt="" width={50} />
            <div className="flex flex-col flex-1">
                <span>{new Date(item.date).toLocaleString()}</span>
                <span>{item.newsText}</span>
            </div>
        </div>
    );
}

export function NewsFeed({ newsItems }: { newsItems: NewsItem[] }) {
    return (
        <div>
            <h3 className="text-3xl mt-2 mb-6 uppercase text-center">News<br/>Feed</h3>
            {newsItems.map((item, index) => (
                <NewsItem item={item} key={index} />
            ))}
        </div>
    );
}

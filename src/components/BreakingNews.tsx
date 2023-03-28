import * as React from "react";
import { NewsItem } from "../types/types";
import { BreakingNewsText } from "./NewsFeed";

export default function BreakingNews({ newsItem }: { newsItem?: NewsItem }) {
    if (!newsItem) {
        return null;
    }

    return (
        <footer className={"w-full bg-red-600 text-white mt-4 overflow-hidden hidden lg:flex flex-row justify-between"}>
            <div className="p-8">
                <h3 className="uppercase translate-y-0 text-4xl m-2 font-bold">Breaking news</h3>
                <BreakingNewsText item={newsItem} />
            </div>
            <div 
                className="w-64 h-64 p-8"
            >
                <img 
                    className="w-full h-full"
                    src="/GNNLogo.png" 
                />
            </div>
        </footer>
    );
}

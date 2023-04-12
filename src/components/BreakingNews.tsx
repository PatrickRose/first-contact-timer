import * as React from "react";
import { NewsItem } from "../types/types";
import { BreakingNewsText } from "./NewsFeed";
import Image from "next/image";
import GNNLogo from "../../public/GNNLogo.png";

export default function BreakingNews({ newsItem }: { newsItem?: NewsItem }) {
    if (!newsItem) {
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
            <div className="w-64 h-64 p-8">
                <Image className="w-full h-full" src={GNNLogo} alt="" />
            </div>
        </footer>
    );
}

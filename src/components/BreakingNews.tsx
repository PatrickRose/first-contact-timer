import * as React from "react";
import { NewsItem } from "../types/types";
import {BreakingNewsText} from "./NewsFeed";

export default function BreakingNews({ newsItem }: { newsItem?: NewsItem }) {
    if (!newsItem) {
        return null;
    }

    return (
        <footer className={"bg-red-600 text-white mt-4"}>
            <h3>Breaking news</h3>
            <BreakingNewsText item={newsItem} />
        </footer>
    );
}

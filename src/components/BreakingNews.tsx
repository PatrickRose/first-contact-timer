import * as React from "react";
import { NewsItem } from "../types/types";

export default function BreakingNews({ newsItem }: { newsItem?: NewsItem }) {
    if (!newsItem) {
        return null;
    }

    return (
        <footer className={"bg-red-600 text-white mt-4"}>
            <h3>Breaking news</h3>
            <div>
                {newsItem.newsText
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
        </footer>
    );
}

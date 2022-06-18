import * as React from 'react';
import {BreakingNews as BreakingNewsType} from "../types/types";

type BreakingNewsProps = {
    content: BreakingNewsType
}

export default function BreakingNews({content}: BreakingNewsProps) {
    const values = Object.entries(content).filter(([_, val]) => val !== null);

    let animationDuration = '';

    switch (values.length) {
        case 1:
            animationDuration = "marquee-1";
            break;
        case 2:
            animationDuration = "marquee-2";
            break;
        case 3:
            animationDuration = "marquee-3";
            break;
    }

    if (values.length > 0) {
        return (
            <footer className="bg-red-600 text-white mt-4">
                <div className="w-100 px-2 flex flex-col h-72 overflow-hidden">
                    <p className={`text-4xl py-2 ${animationDuration} flex`}>
                        {values.map(([key, val]) => <span className="min-w-full px-4" key={key}>+++ BREAKING NEWS +++ {val}</span>)}
                    </p>
                </div>
            </footer>
        );
    }

    return <React.Fragment />;
}

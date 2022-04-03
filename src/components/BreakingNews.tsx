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
                <div className="w-100 px-2 flex flex-col h-24 overflow-hidden">
                    <h3 className="text-2xl pb-2 uppercase">Breaking news</h3>
                    <p className={`text-xl py-2 ${animationDuration} flex`}>
                        {values.map(([key, val]) => <span className="min-w-full" key={key}>{val}</span>)}
                    </p>
                </div>
            </footer>
        );
    }

    return <React.Fragment />;
}

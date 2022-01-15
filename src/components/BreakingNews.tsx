import * as React from 'react';

type BreakingNewsProps = {
    content?: string
}

export default function BreakingNews({content}: BreakingNewsProps) {
    if (content !== undefined) {
        return (
            <footer className="bg-red-600 text-white mt-4">
                <div className="w-100 px-2 flex flex-col h-24 overflow-hidden">
                    <h3 className="text-2xl pb-2">Breaking news</h3>
                    <p className="text-xl py-2 animate-marquee">{content}</p>
                </div>
            </footer>
        );
    }

    return <React.Fragment />;
}

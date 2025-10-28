import type { RunningHotCorps } from "@fc/types/types";
import Image from "next/image";
import { corpImages, corpNames } from "./RunningHot/helpers";

export function RunningHotCorps({ sharePrice }: RunningHotCorps) {
    const corps = Object.entries(sharePrice);

    // Sort the corps so that higher share price appears at the top
    corps.sort((a, b) => b[1] - a[1]);

    return (
        <div className="mt-4">
            <h2 className="text-center text-3xl">Share Prices</h2>
            <div className="m-8">
                {corps.map(([key, val]) => {
                    const corpName =
                        corpNames[key as keyof RunningHotCorps["sharePrice"]];
                    const image =
                        corpImages[key as keyof RunningHotCorps["sharePrice"]];

                    return (
                        <div
                            key={key}
                            className="flex justify-center text-center p-2 border-2 m-1 rounded-lg"
                        >
                            <div className="flex justify-center items-center">
                                <Image
                                    src={image}
                                    alt={corpName}
                                    height={64}
                                    width={64}
                                />
                            </div>
                            <div className="flex-1 flex justify-center items-center text-center px-2 text-2xl">
                                {corpName}
                            </div>
                            <div className="flex justify-center items-center text-center text-4xl px-2">
                                {val}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

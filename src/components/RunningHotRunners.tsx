import type {
    GangNames,
    RunningHotCorps,
    RunningHotRunners,
} from "@fc/types/types";
import Image from "next/image";
import { gangImages, gangNames } from "./RunningHot/helpers";

export function RunningHotRunners(runners: RunningHotRunners) {
    const gangs: Record<GangNames, number> = {
        Dancers: 0,
        Facers: 0,
        G33ks: 0,
        Gruffsters: 0,
    };

    Object.values(runners.rep).forEach(({ gang, reputation }) => {
        gangs[gang] += reputation;
    });

    const allGangs = Object.entries(gangs).sort(([_, a], [__, b]) => b - a);

    return (
        <div className="mt-4">
            <h2 className="text-center text-3xl">Runner Reputation</h2>
            <div className="m-8">
                {allGangs.map(([key, val]) => {
                    const gangName = gangNames[key as GangNames];
                    const image = gangImages[key as GangNames];

                    return (
                        <div
                            key={key}
                            className="flex justify-center text-center p-2 border-2 m-1 rounded-lg"
                        >
                            <div className="flex justify-center items-center">
                                <Image
                                    src={image}
                                    alt={gangName}
                                    height={64}
                                    width={64}
                                />
                            </div>
                            <div className="flex-1 flex justify-center items-center text-center px-2 text-2xl">
                                {gangName}
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

import * as React from "react";
import { Game, SetupInformation } from "@fc/types/types";
import { lengthOfPhase } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";
import { TurnComponentMapper } from "@fc/lib/ComponentMapper";
import Image from "next/image";
import ArrowIcon from "@fc/public/aftermath-arrow.svg";

type PhaseListProps = {
    turn: number;
    phase: number;
    timestamp: number;
    active: boolean;
    setupInformation: SetupInformation;
    components: Game["components"];
};

export function PhaseCount({
    thisPhase,
    phaseLength,
    activePhase,
    phaseInformation,
}: {
    thisPhase: number;
    phaseLength: number;
    activePhase: number;
    phaseInformation: SetupInformation["phases"][0];
}) {
    const backgroundClass =
        thisPhase == activePhase
            ? "bg-aftermath-alert text-aftermath delay-250 border-aftermath-alert"
            : thisPhase > activePhase
              ? "text-white border-white"
              : "opacity-40 text-white border-white";

    const subTextClass = thisPhase == activePhase ? "block" : "hidden";

    if (phaseInformation.hidden) {
        return null;
    }

    return (
        <div>
            <PhaseArrow
                firstPhase={thisPhase == 1}
                thisPhase={thisPhase}
                activePhase={activePhase}
            />
            <div
                className={`md:flex flex-1 flex-col p-4 mb-4 text-3xl transition duration-500 border-2 text-center uppercase font-semibold w-[250px] ${backgroundClass}`}
            >
                {phaseInformation.title}
                <p className={`${subTextClass} lg:block text-lg font-medium`}>
                    {phaseLength} minutes
                </p>
            </div>
        </div>
    );
}

export function PhaseArrow({
    firstPhase,
    thisPhase,
    activePhase,
}: {
    firstPhase: boolean;
    thisPhase: number;
    activePhase: number;
}) {
    const opacity = thisPhase > activePhase ? "" : "opacity-30";

    if (thisPhase == 1) {
        return null;
    }

    return (
        <div
            className={`text-center text-3xl mt-0 mb-2 lg:my-6 w-[20px] h-[16px] lg:w-[40px] lg:h-[40px] mx-auto ${opacity}`}
        >
            <Image
                className="h-full w-auto float-right"
                src={ArrowIcon}
                alt=""
                width={54}
                height={54}
            />
        </div>
    );
}

export default function PhaseList(props: PhaseListProps) {
    const { turn, phase, timestamp, active, setupInformation } = props;

    const text = setupInformation.phases[phase - 1]?.title;

    return (
        <React.Fragment>
            <div className="flex-1 mt-4 ">
                {setupInformation.phases.map((val, key) => {
                    let phaseLength = lengthOfPhase(
                        key + 1,
                        turn,
                        setupInformation,
                    );

                    if (isLeft(phaseLength)) {
                        throw new Error(phaseLength.left);
                    }
                    return (
                        <PhaseCount
                            thisPhase={key + 1}
                            phaseLength={phaseLength.right}
                            activePhase={phase}
                            phaseInformation={val}
                            key={key}
                        />
                    );
                })}
            </div>
        </React.Fragment>
    );
}

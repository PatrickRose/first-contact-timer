import * as React from "react";
import { SetupInformation, Theme } from "@fc/types/types";

interface CurrentTurnCounterProps {
    turn: number;
    phase: number;
    timestamp: number;
    active: boolean;
    phaseInformation: SetupInformation["phases"][0];
    // Selects the per-theme header treatment.
    variant?: Theme;
}

const CurrentTurnTimer = function CurrentTurnTimer(props: {
    timestamp: number;
    sizeClass: string;
}) {
    const formatter = new Intl.NumberFormat("en-GB", {
        minimumIntegerDigits: 2,
    });

    const { timestamp, sizeClass } = props;
    const minutes = Math.floor(Number(timestamp / 60));
    const seconds = timestamp % 60;

    return (
        <React.Fragment>
            <p className={`${sizeClass} py-2 text-right`}>
                {`${formatter.format(minutes)}:${formatter.format(seconds)}`}
            </p>
        </React.Fragment>
    );
};

function FirstContactContent({
    turn,
    phaseInformation,
    timestamp,
}: {
    turn: number;
    phaseInformation: SetupInformation["phases"][0];
    timestamp: number;
}) {
    const backgroundClass = phaseInformation.hidden
        ? "bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark opacity-50"
        : "bg-turn-counter-current";

    const turnText = phaseInformation.hidden
        ? `Turn ${turn}, next phase:`
        : `Turn ${turn}, current phase:`;

    const phaseText = phaseInformation.title;

    return (
        <div
            className={`lg:hidden flex flex-1 flex-row items-center justify-between p-3 transition duration-500 text-white delay-250 ${backgroundClass}`}
        >
            <div>
                <p className="pb-0 mb-0 text-xl">{turnText}</p>
                <p className="pb-0 mb-0 text-2xl">{phaseText}</p>
            </div>
            <CurrentTurnTimer timestamp={timestamp} sizeClass="text-4xl" />
        </div>
    );
}

function AftermathContent({
    phaseInformation,
    timestamp,
}: {
    phaseInformation: SetupInformation["phases"][0];
    timestamp: number;
}) {
    const backgroundClass = "bg-aftermath-alert text-aftermath";

    const textSize = phaseInformation.hidden ? "text-xl" : "text-4xl";

    const phaseText = phaseInformation.title;

    return (
        <div
            className={`lg:hidden flex flex-1 flex-row items-center justify-between p-3 transition duration-500 delay-250 ${backgroundClass}`}
        >
            <div>
                <p
                    className={`pb-0 mb-0 text-2xl font-semibold uppercase ${textSize}`}
                >
                    {phaseText}
                </p>
            </div>
            <CurrentTurnTimer timestamp={timestamp} sizeClass="text-5xl" />
        </div>
    );
}

export default function CurrentTurn(props: CurrentTurnCounterProps) {
    const { turn, timestamp, phaseInformation, variant = "first-contact" } =
        props;

    return (
        <React.Fragment>
            <div className="flex lg:flex-wrap flex-col lg:flex-row mt-0 bg-black">
                {variant === "aftermath" ? (
                    <AftermathContent
                        phaseInformation={phaseInformation}
                        timestamp={timestamp}
                    />
                ) : (
                    <FirstContactContent
                        turn={turn}
                        phaseInformation={phaseInformation}
                        timestamp={timestamp}
                    />
                )}
            </div>
        </React.Fragment>
    );
}

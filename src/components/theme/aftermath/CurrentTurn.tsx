import * as React from "react";
import { Game, SetupInformation } from "@fc/types/types";

interface CurrentTurnCounterProps {
    turn: number;
    phase: number;
    timestamp: number;
    active: boolean;
    phaseInformation: SetupInformation["phases"][0];
}

const CurrentTurnTimer = function CurrentTurnTimer(props: {
    timestamp: number;
}) {
    const formatter = new Intl.NumberFormat("en-GB", {
        minimumIntegerDigits: 2,
    });

    const { timestamp } = props;
    const minutes = Math.floor(Number(timestamp / 60));
    const seconds = timestamp % 60;

    return (
        <React.Fragment>
            <p className="text-5xl py-2 text-right">
                {`${formatter.format(minutes)}:${formatter.format(seconds)}`}
            </p>
        </React.Fragment>
    );
};

export default function CurrentTurn(props: CurrentTurnCounterProps) {
    const { turn, phase, timestamp, active, phaseInformation } = props;

    const backgroundClass =
        phaseInformation.hidden && false
            ? "bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark opacity-50"
            : "bg-aftermath-alert text-aftermath";

    const textClass = "";

    const textSize = phaseInformation.hidden ? "text-xl" : "text-4xl";

    const phaseText = phaseInformation.title;

    return (
        <React.Fragment>
            <div className="flex lg:flex-wrap flex-col lg:flex-row mt-0 bg-black">
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
                    <CurrentTurnTimer timestamp={timestamp} />
                </div>
            </div>
        </React.Fragment>
    );
}

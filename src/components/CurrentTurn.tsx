import * as React from "react";
import { Phase } from "../types/types";
import {
    lengthOfPhase,
    PHASE_LISTS,
    isBreatherPhase,
    PHASE_TITLES,
    nextPhase,
} from "../server/turn";

interface CurrentTurnCounterProps {
    turn: number;
    phase: Phase;
    timestamp: number;
    active: boolean;
}

const CurrentTurnTimer = function CurrentTurnTimer(props: {
    timestamp: number;
    active: boolean;
    mobile: boolean;
}) {
    const formatter = new Intl.NumberFormat("en-GB", {
        minimumIntegerDigits: 2,
    });

    const { timestamp, active, mobile } = props;
    const minutes = Math.floor(Number(timestamp / 60));
    const seconds = timestamp % 60;

    return (
        <React.Fragment>
            <p className="text-4xl py-2 text-right">
                {`${formatter.format(minutes)}:${formatter.format(seconds)}`}
            </p>
        </React.Fragment>
    );
};

export default function CurrentTurn(props: CurrentTurnCounterProps) {
    const { turn, phase, timestamp, active } = props;

    const backgroundClass = isBreatherPhase(phase)
        ? "bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark opacity-50"
        : "bg-turn-counter-current";

    const textClass = isBreatherPhase(phase) ? "" : "";

    const turnText = isBreatherPhase(phase)
        ? `Turn ${turn}, next phase:`
        : `Turn ${turn}, current phase:`;

    const phaseText = isBreatherPhase(phase)
        ? `${PHASE_TITLES[nextPhase(phase)]}`
        : `${PHASE_TITLES[phase]}`;

    return (
        <React.Fragment>
            <div className="flex lg:flex-wrap flex-col lg:flex-row mt-0 bg-black">
                <div
                    className={`lg:hidden flex flex-1 flex-row items-center justify-between p-3 transition duration-500 text-white delay-250 ${backgroundClass}`}
                >
                    <div>
                        <p className={`pb-0 mb-0 text-xl ${textClass}`}>
                            {turnText}
                        </p>
                        <p className={`pb-0 mb-0 text-2xl ${textClass}`}>
                            {phaseText}
                        </p>
                    </div>
                    <CurrentTurnTimer
                        timestamp={timestamp}
                        active={active}
                        mobile={true}
                    />
                </div>
            </div>
        </React.Fragment>
    );
}

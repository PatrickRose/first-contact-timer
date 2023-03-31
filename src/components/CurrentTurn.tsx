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

const BUFFER: React.ReactNode = null;

const PHASE_LABELS: Record<Phase, React.ReactNode> = {
    1: <PhaseLabel title={PHASE_TITLES[1]} />,
    2: BUFFER,
    3: <PhaseLabel title={PHASE_TITLES[3]} />,
    4: BUFFER,
    5: <PhaseLabel title={PHASE_TITLES[5]} />,
    6: BUFFER,
    7: <PhaseLabel title={PHASE_TITLES[7]} />,
    8: BUFFER,
    9: <PhaseLabel title={PHASE_TITLES[9]} />,
    10: BUFFER,
};

function PhaseLabel({ title }: { title: string }) {
    return title;
}

export function CurrentPhaseCount({
    phase,
    length,
    active,
    timestamp,
    turn
}: {
    phase: Phase;
    length: number;
    active: Phase;
    timestamp: number;
    turn: number;
}) {

    const backgroundClass =
        phase == active
            ? "bg-turn-counter-current text-white delay-250"
            :  phase == active + 1 || phase == 10
                ? "bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark text-white delay-250"
                : "hidden";

    if (PHASE_LABELS[phase] === null) {
        return null;
    }

    const text = (phase == active + 1 || phase == 10)
        ? `Turn ${turn} Next Phase`
        : `Turn ${turn}`;

    return (
        <div
            className={`lg:hidden flex flex-1 flex-row items-center justify-between p-3 transition duration-500 ${backgroundClass}`}
        >
            <div>
                <p className="text-xl pb-0 mb-0">{text}:</p>
                <p className="text-3xl pt-0 mt-0">{PHASE_LABELS[phase]}</p>
            </div>
            <CurrentTurnTimer timestamp={timestamp} active={active} mobile={true} />
        </div>
    );
}

export default function CurrentTurn(props: CurrentTurnCounterProps) {
    const { turn, phase, timestamp, active } = props;

    return (
        <React.Fragment>
            
            <div className="flex lg:flex-wrap flex-col lg:flex-row mt-0">
                {PHASE_LISTS.map((val) => {
                    return (
                        <React.Fragment key={val}>
                            <CurrentPhaseCount
                                phase={val}
                                length={lengthOfPhase(val, turn)}
                                active={phase}
                                key={val}
                                timestamp={timestamp}
                                turn={turn}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </React.Fragment>
    );
}

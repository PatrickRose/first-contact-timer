import * as React from "react";
import { Phase } from "../types/types";
import {
    lengthOfPhase,
    PHASE_LISTS,
    isBreatherPhase,
    PHASE_TITLES,
    nextPhase,
} from "../server/turn";

interface TurnCounterProps {
    turn: number;
    phase: Phase;
    timestamp: number;
    active: boolean;
}

const TurnTimer = function TurnTimer(props: {
    timestamp: number;
    active: boolean;
}) {
    const formatter = new Intl.NumberFormat("en-GB", {
        minimumIntegerDigits: 2,
    });

    const { timestamp, active } = props;
    const minutes = Math.floor(Number(timestamp / 60));
    const seconds = timestamp % 60;

    let paused;

    if (!active) {
        paused = (
            <p className="py-3 px-6 bg-red-200 text-red-800 rounded alert alert-danger">
                GAME PAUSED
            </p>
        );
    } else {
        paused = <React.Fragment />;
    }

    return (
        <React.Fragment>
            <p className="text-8xl font-bold py-8">
                {`${formatter.format(minutes)}:${formatter.format(seconds)}`}
            </p>
            {paused}
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
    return <p className="flex-1 text-3xl">{title}</p>;
}

export function PhaseCount({
    phase,
    length,
    active,
}: {
    phase: Phase;
    length: number;
    active: Phase;
}) {
    const backgroundClass =
        phase == active
            ? "bg-first-contact text-white delay-250"
            : "bg-white text-black";

    const visibleOnPhone = [
        active - 2,
        active - 1,
        active,
        active + 1,
        active + 2,
        active + 3,
    ].includes(phase);
    const visibleOnTablet = [active - 3, active + 4].includes(phase);

    const visibleClass = `${visibleOnPhone ? "flex" : "hidden"} ${
        visibleOnTablet ? "md:flex" : ""
    } ${!visibleOnPhone && !visibleOnTablet ? "lg:flex" : ""}`;

    if (PHASE_LABELS[phase] === null) {
        return null;
    }

    return (
        <div
            className={`${visibleClass} flex-1 flex-col border border-first-contact p-3 transition duration-500 ${backgroundClass}`}
        >
            {PHASE_LABELS[phase]}
            <p>{length} minutes</p>
        </div>
    );
}

export default function TurnCounter(props: TurnCounterProps) {
    const { turn, phase, timestamp, active } = props;

    const text = isBreatherPhase(phase)
        ? `You're in turn ${turn}. ${PHASE_TITLES[nextPhase(phase)]} starts in:`
        : `You're in turn ${turn}, ${PHASE_TITLES[phase]}`;

    return (
        <React.Fragment>
            <div className="flex lg:flex-wrap mt-4 border border-first-contact">
                {PHASE_LISTS.map((val) => {
                    return (
                        <React.Fragment key={val}>
                            <PhaseCount
                                phase={val}
                                length={lengthOfPhase(val, turn)}
                                active={phase}
                                key={val}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
            <h1 className="text-5xl mt-4">{text}</h1>
            <TurnTimer timestamp={timestamp} active={active} />
        </React.Fragment>
    );
}

import * as React from "react";
import { Game, SetupInformation } from "@fc/types/types";
import { TurnComponentMapper } from "@fc/lib/ComponentMapper";

type TurnCounterProps = {
    turn: number;
    phase: number;
    timestamp: number;
    active: boolean;
    setupInformation: SetupInformation;
    components: Game["components"];
};

const TurnTimer = function TurnTimer(props: {
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

    let paused;

    if (!active) {
        const pausedClass = mobile ? "lg:hidden" : "hidden lg:block";

        paused = (
            <p
                className={`${pausedClass} pt-10 px-6 bg-zinc-600 text-white rounded-sm alert alert-danger text-6xl`}
            >
                GAME PAUSED
            </p>
        );
    } else {
        paused = <React.Fragment />;
    }

    const textClass = mobile
        ? "lg:hidden text-6xl py-2"
        : "hidden lg:block text-big-time leading-[12rem] font-semibold py-0";

    return (
        <React.Fragment>
            <p className={`${textClass}`}>
                {`${formatter.format(minutes)}:${formatter.format(seconds)}`}
            </p>
            {paused}
        </React.Fragment>
    );
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
            ? "bg-turn-counter-current text-white delay-250 border-yellow-300"
            : thisPhase > activePhase
              ? "bg-turn-counter-future text-white border-black"
              : "bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark text-white border-black";

    const subTextClass = thisPhase == activePhase ? "block" : "hidden";

    if (phaseInformation.hidden) {
        return null;
    }

    return (
        <div
            className={`md:flex flex-1 flex-col  p-3 transition duration-500 border-4 ${backgroundClass}`}
        >
            {phaseInformation.title}
            <p className={`${subTextClass} lg:block`}>{phaseLength} minutes</p>
        </div>
    );
}

export default function TurnCounter(props: TurnCounterProps) {
    const { turn, phase, timestamp, active, setupInformation } = props;

    const text = setupInformation.phases[phase - 1]?.title;
    const textSize = setupInformation.phases[phase - 1]?.hidden
        ? "text-4xl lg:text-5xl"
        : "text-6xl lg:text-8xl";

    return (
        <React.Fragment>
            <div className="flex flex-col items-center flex-1 ">
                <h3 className="lg:hidden text-2xl mt-2 mb-6 uppercase text-center">
                    Game Timer
                </h3>
                {props.components.map((component, key) => (
                    <TurnComponentMapper key={key} component={component} />
                ))}
                <div>
                    <h1 className="text-3xl lg:text-4xl mt-4 mb-4 lg:mb-8 uppercase ">
                        Aftermath Turn {turn}
                    </h1>
                    <h2
                        className={`font-semibold mt-4 mb-4 uppercase w-7/8 m-auto ${textSize}`}
                    >
                        {text}
                    </h2>
                    <TurnTimer
                        timestamp={timestamp}
                        active={active}
                        mobile={true}
                    />
                    <TurnTimer
                        timestamp={timestamp}
                        active={active}
                        mobile={false}
                    />
                </div>
            </div>
        </React.Fragment>
    );
}

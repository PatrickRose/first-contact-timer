import * as React from "react";
import { Game, SetupInformation } from "@fc/types/types";
import { lengthOfPhase } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";
import { TurnComponentMapper } from "@fc/lib/ComponentMapper";
import Image from "next/image";

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
                className={`${pausedClass} py-3 px-6 bg-zinc-600 text-white rounded-sm alert alert-danger text-3xl`}
            >
                GAME PAUSED
            </p>
        );
    } else {
        paused = <React.Fragment />;
    }

    const textClass = mobile
        ? "lg:hidden text-6xl py-2"
        : "hidden lg:block text-8xl py-8";

    return (
        <React.Fragment>
            <p className={`${textClass}`}>
                {`${formatter.format(minutes)}:${formatter.format(seconds)}`}
            </p>
            {paused}
        </React.Fragment>
    );
};

function getClassFromStyles(
    timerStyles: SetupInformation["timerStyles"],
    thisPhase: number,
    activePhase: number,
): string {
    const timerStyle: SetupInformation["timerStyles"] = timerStyles ?? {
        activePhase: {
            background: "bg-turn-counter-current",
            border: "border-yellow-300",
            text: "text-white",
        },
        futurePhase: {
            background: "bg-turn-counter-future ",
            border: "border-black",
            text: "text-white",
        },
        pastPhase: {
            background:
                "bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark",
            border: "border-black",
            text: "text-white",
        },
    };

    const styles =
        activePhase == thisPhase
            ? timerStyle.activePhase
            : activePhase < thisPhase
              ? timerStyle.futurePhase
              : timerStyle.pastPhase;

    return `${styles.border} ${styles.text} ${styles.background} ${activePhase == thisPhase ? "delay-500" : ""}`;
}

export function PhaseCount({
    thisPhase,
    phaseLength,
    activePhase,
    phaseInformation,
    timerStyles,
}: {
    thisPhase: number;
    phaseLength: number;
    activePhase: number;
    phaseInformation: SetupInformation["phases"][0];
    timerStyles: SetupInformation["timerStyles"];
}) {
    const backgroundClass = getClassFromStyles(
        timerStyles,
        thisPhase,
        activePhase,
    );

    const subTextClass = thisPhase == activePhase ? "block" : "hidden";

    if (phaseInformation.hidden) {
        return null;
    }

    return (
        <div
            className={`md:flex flex-1 flex-col p-3 transition duration-500 border-4 ${backgroundClass}`}
        >
            {phaseInformation.logo ? (
                <Image
                    src={phaseInformation.logo}
                    alt={phaseInformation.title}
                    height={100}
                    width={100}
                    style={{ height: "auto", width: "auto" }}
                />
            ) : null}
            {phaseInformation.title}
            <p className={`${subTextClass} lg:block`}>{phaseLength} minutes</p>
        </div>
    );
}

export default function TurnCounter(props: TurnCounterProps) {
    const { turn, phase, timestamp, active, setupInformation } = props;

    const text = setupInformation.phases[phase - 1]?.title;

    return (
        <React.Fragment>
            <h3 className="lg:hidden text-2xl mt-2 mb-6 uppercase text-center">
                Game Timer
            </h3>
            {props.components.map((component, key) => (
                <TurnComponentMapper key={key} component={component} />
            ))}
            <h1 className="text-4xl lg:text-5xl mt-4 mb-8 uppercase ">
                Turn {turn}: {text}
            </h1>
            <TurnTimer timestamp={timestamp} active={active} mobile={true} />
            <div className="flex lg:flex-wrap flex-row  mt-4">
                {setupInformation.phases.map((val, key) => {
                    const phaseLength = lengthOfPhase(
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
                            timerStyles={props.setupInformation.timerStyles}
                        />
                    );
                })}
            </div>
            <TurnTimer timestamp={timestamp} active={active} mobile={false} />
        </React.Fragment>
    );
}

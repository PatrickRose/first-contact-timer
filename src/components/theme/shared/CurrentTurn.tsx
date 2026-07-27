import * as React from "react";

// The theme-specific presentation for the sticky current-turn banner. Each
// theme shell builds this explicitly (see its presentation module) so a new
// theme must supply its own values - the shared component never guesses which
// theme it is rendering.
export interface CurrentTurnPresentation {
    // The left-hand content block (turn/phase labels). Structurally different
    // between themes, so the shell owns it entirely.
    header: React.ReactNode;
    // Colour/background classes appended to the shared banner layout classes.
    bannerClass: string;
    // Font-size class for the countdown timer.
    timerSizeClass: string;
}

interface CurrentTurnCounterProps extends CurrentTurnPresentation {
    timestamp: number;
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

export default function CurrentTurn({
    timestamp,
    header,
    bannerClass,
    timerSizeClass,
}: CurrentTurnCounterProps) {
    return (
        <React.Fragment>
            <div className="flex lg:flex-wrap flex-col lg:flex-row mt-0 bg-black">
                <div
                    className={`lg:hidden flex flex-1 flex-row items-center justify-between p-3 transition duration-500 delay-250 ${bannerClass}`}
                >
                    {header}
                    <CurrentTurnTimer
                        timestamp={timestamp}
                        sizeClass={timerSizeClass}
                    />
                </div>
            </div>
        </React.Fragment>
    );
}

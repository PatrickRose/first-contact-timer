import * as React from "react";
import { Phase } from "../types/types";
import { lengthOfPhase, PHASE_LISTS } from "../server/turn";

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

const BUFFER: React.ReactNode = <p className="text-md flex-1">Buffer</p>;

const PHASE_LABELS: Record<Phase, React.ReactNode> = {
  1: <PhaseLabel title="Team Time" />,
  2: BUFFER,
  3: <PhaseLabel title="2" />,
  4: BUFFER,
  5: <PhaseLabel title="3" />,
  6: BUFFER,
  7: <PhaseLabel title="4" />,
  8: BUFFER,
  9: <PhaseLabel title="Press" />,
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

  const visibleOnPhone = [active - 1, active, active + 1, active + 2].includes(
    phase
  );
  const visibleOnTablet = [active - 2, active + 3].includes(phase);

  const visibleClass = `${visibleOnPhone ? "flex" : "hidden"} ${
    visibleOnTablet ? "md:flex" : ""
  } ${!visibleOnPhone && !visibleOnTablet ? "lg:flex" : ""}`;

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

  const text = `You're in turn ${turn}, phase ${phase}`;

  return (
    <React.Fragment>
      <h1 className="text-5xl">{text}</h1>
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
              {val == Math.max(...PHASE_LISTS) / 2 ? (
                <div className="hidden lg:flex lg:basis-full" />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      <TurnTimer timestamp={timestamp} active={active} />
    </React.Fragment>
  );
}

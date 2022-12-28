import * as React from 'react';
import {Phase} from "../types/types";
import {lengthOfPhase, PHASE_LISTS} from "../server/turn";

interface TurnCounterProps {
    turn: number,
    phase: Phase,
    timestamp: number,
    active: boolean
}

const TurnTimer = function TurnTimer(props: { timestamp: number, active: boolean }) {
  const formatter = new Intl.NumberFormat(
    'en-GB',
    {
      minimumIntegerDigits: 2
    }
  );

  const { timestamp, active } = props;
  const minutes = Math.floor(Number(timestamp / 60));
  const seconds = timestamp % 60;

  let paused;

  if (!active) {
      paused = <p className="py-3 px-6 bg-red-200 text-red-800 rounded alert alert-danger">
              GAME PAUSED
          </p>;
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

const breather: React.ReactNode = <p className="text-md flex-1">Breather</p>;

const PHASE_LABELS: Record<Phase, React.ReactNode> = {
    1: <PhaseLabel title="Team Time" />,
    2: breather,
    3: <PhaseLabel title="2" />,
    4: breather,
    5: <PhaseLabel title="3" />,
    6: breather,
    7: <PhaseLabel title="4" />,
    8: breather,
    9: <PhaseLabel title="Press" />,
    10: breather,
}

function PhaseLabel({title}: { title: string }) {
    return <p className="flex-1 text-3xl">{title}</p>
}

export function PhaseCount({phase, length, active}: {phase: Phase, length: number, active: Phase}) {
    const backgroundClass = phase == active ? 'bg-first-contact text-white delay-250' : 'bg-white text-black';

    const visible = [active-1, active, active+1].includes(phase);

    const visibleClass = visible ? 'flex' : 'hidden md:flex'

    return <div className={`${visibleClass} flex-col border border-first-contact p-3 transition duration-500 ${backgroundClass}`}>
        {PHASE_LABELS[phase]}
        <p>{length} minutes</p>
    </div>
}

export default function TurnCounter(props: TurnCounterProps) {
  const {
    turn, phase, timestamp, active
  } = props;

  const text = `You're in turn ${turn}, phase ${phase}`;



  return (
    <React.Fragment>
      <h1 className="text-5xl">
        {text}
      </h1>
        <div className="flex mt-4 border border-first-contact">
            {PHASE_LISTS.map((val) => <PhaseCount phase={val} length={lengthOfPhase(val, turn)} active={phase} key={val} />)}
        </div>
      <TurnTimer timestamp={timestamp} active={active} />
    </React.Fragment>
  );
}

import * as React from 'react';
import {Phase} from "../types/types";

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
      <TurnTimer timestamp={timestamp} active={active} />
    </React.Fragment>
  );
}

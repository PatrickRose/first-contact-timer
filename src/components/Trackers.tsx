import type { Trackers } from "@fc/types/types";
import { useId } from "react";

function BarProgressBar({ value }: { value: number }) {
    return (
        <div className="h-64 border-2 flex">
            <div
                className="bg-white transition-[width]"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function CircleProgressBar({ value }: { value: number }) {
    const id = useId();

    const style =
        value <= 50
            ? `rotate(${(value / 100) * 360}deg)`
            : `rotate(${((100 - value) / 100) * 360}deg)`;

    return (
        <>
            <style>
                {`#${id.replaceAll(":", "\\:")}:before { transform: ${style};}`}
            </style>
            <div
                id={id}
                data-progress={value}
                className={`border-2 h-64 w-64 rounded-full bg-gradient-to-r from-black to-white from-50% to-50% circular-progress ${value > 50 ? "circular-progress-50" : ""}`}
            ></div>
        </>
    );
}

function Tracker(props: Trackers["trackers"][0]) {
    let component = null;
    const value = Math.max(0, Math.min(100, props.value));

    switch (props.type) {
        case "bar":
            component = <BarProgressBar value={value} />;
            break;
        case "circle":
            component = <CircleProgressBar value={value} />;
            break;
    }

    return (
        <div className="flex flex-col m-4">
            <div>{props.label}</div>
            {component}
        </div>
    );
}

export default function Trackers(props: Trackers) {
    return (
        <div className="grid grid-flow-row auto-rows-max">
            {props.trackers.map((tracker, key) => (
                <Tracker key={key} {...tracker} />
            ))}
        </div>
    );
}

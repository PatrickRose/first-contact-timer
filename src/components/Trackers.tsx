import type { Trackers } from "@fc/types/types";
import { useId } from "react";

function BarProgressBar({ value, max }: { value: number; max: number }) {
    return (
        <div className="h-64 border-2 flex">
            <div
                className="bg-white transition-[width]"
                style={{ width: `${(100 * value) / max}%` }}
            >
                <span className="sr-only">
                    {value} / {max}
                </span>
            </div>
        </div>
    );
}

function CircleProgressBar({ value, max }: { value: number; max: number }) {
    const id = useId();
    const percent = (100 * value) / max;

    const style =
        percent <= 50
            ? `rotate(${(percent / 100) * 360}deg)`
            : `rotate(${(percent / 100) * 180}deg)`;

    return (
        <>
            <style>
                {`#${id.replaceAll(":", "\\:")}:before { transform: ${style};}`}
            </style>
            <div
                id={id}
                data-progress={value}
                className={`border-2 h-64 w-64 rounded-full bg-linear-to-r from-black to-white from-50% to-50% circular-progress ${percent > 50 ? "circular-progress-50" : ""}`}
            >
                <span className="sr-only">
                    {value} / {max}
                </span>
            </div>
        </>
    );
}

function Tracker(props: Trackers["trackers"][0] & { label: string }) {
    let component = null;
    const value = Math.max(0, Math.min(props.max, props.value));

    switch (props.type) {
        case "bar":
            component = <BarProgressBar value={value} max={props.max} />;
            break;
        case "circle":
            component = <CircleProgressBar value={value} max={props.max} />;
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
            {Object.entries(props.trackers).map(([key, tracker]) => (
                <Tracker key={key} label={key} {...tracker} />
            ))}
        </div>
    );
}

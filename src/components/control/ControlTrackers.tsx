import { ControlButtonRootProps } from "@fc/components/ControlTools";
import {
    AddTracker,
    DeleteTracker,
    SetTracker,
    Trackers,
} from "@fc/types/types";
import { useId, useState } from "react";
import { ApiResponseDecode } from "@fc/types/io-ts-def";

function TrackerWrapper(
    props: ControlButtonRootProps & Trackers["trackers"][0] & { label: string },
) {
    const setError = props.setError;
    const setAPIResponse = props.setAPIResponse;
    const [newValue, setNewValue] = useState(props.value);
    const htmlId = useId();
    const [updating, setUpdating] = useState(false);

    const sendUpdate = (toSend: SetTracker | DeleteTracker) => {
        setUpdating(true);

        return fetch(`/game/${props.id}/control/api/trackers`, {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    response.text().then((text) => setError(text));
                    return;
                }

                return response.json();
            })
            .then((body) => {
                if (!ApiResponseDecode.is(body)) {
                    setError(
                        "Did not get an API response back, got " +
                            JSON.stringify(body),
                    );
                    return;
                }

                setAPIResponse(body);
                setError(undefined);
            })
            .finally(() => {
                setUpdating(false);
            });
    };

    const triggerClick = async () => {
        const toSend: SetTracker = {
            tracker: props.label,
            value: newValue,
        };

        await sendUpdate(toSend);
    };

    const triggerDelete = async () => {
        const toSend: DeleteTracker = {
            tracker: props.label,
            action: "delete",
        };

        await sendUpdate(toSend);
    };

    return (
        <div className="flex-col p-2 border-2 m-1 my-3 rounded-lg">
            <div className="flex justify-center text-center">
                <div className="flex-1 flex justify-center items-center text-center px-2 text-2xl">
                    {props.label}
                </div>
                <div className="flex justify-center items-center text-center text-4xl px-2">
                    {props.value} / {props.max}
                </div>
            </div>
            <div className="flex py-2">
                <label
                    htmlFor={htmlId}
                    className="px-2 flex items-center w-1/4 justify-end"
                >
                    New value for {props.label}
                </label>
                <input
                    id={htmlId}
                    className="flex-1"
                    type="number"
                    value={newValue}
                    onChange={(input) =>
                        setNewValue(Number.parseInt(input.target.value, 10))
                    }
                    min={0}
                    max={props.max}
                />
                <button
                    type="button"
                    onClick={triggerClick}
                    disabled={updating}
                    className={`border-2 p-4 ${updating ? "text-gray-300" : ""}`}
                >
                    {updating ? "Updating" : "Update value"}
                </button>
                <button
                    type="button"
                    onClick={triggerDelete}
                    disabled={updating}
                    className={`border-2 p-4 ${updating ? "text-gray-300" : ""}`}
                >
                    {updating ? "Updating" : "Delete tracker"}
                </button>
            </div>
        </div>
    );
}

function CreateTracker(props: ControlButtonRootProps) {
    const htmlId = useId();
    const [trackerName, setTrackerName] = useState<string>("");
    const [maxValue, setMaxValue] = useState<number>(5);
    const [useCircle, setUseCircle] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const submit = () => {
        setSubmitting(true);

        const toSend: AddTracker = {
            tracker: trackerName,
            trackerDefinition: {
                value: 0,
                type: useCircle ? "circle" : "bar",
                max: maxValue,
            },
        };

        return fetch(`/game/${props.id}/control/api/trackers`, {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    response.text().then((text) => props.setError(text));
                    return;
                }

                return response.json();
            })
            .then((body) => {
                if (!ApiResponseDecode.is(body)) {
                    props.setError(
                        "Did not get an API response back, got " +
                            JSON.stringify(body),
                    );
                    return;
                }

                props.setAPIResponse(body);
                props.setError(undefined);
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <div className="flex-col p-2 border-2 m-1 my-3 rounded-lg">
            <div className="flex justify-center text-center">
                <div className="flex-1 flex justify-center items-center text-center px-2 text-2xl">
                    Add new tracker
                </div>
            </div>
            <div className="flex py-2">
                <label
                    htmlFor={`${htmlId}_name`}
                    className="px-2 flex items-center w-1/3"
                >
                    Tracker name
                </label>
                <input
                    id={`${htmlId}_name`}
                    className="flex-1"
                    value={trackerName}
                    onChange={(input) => setTrackerName(input.target.value)}
                />
            </div>
            <div className="flex py-2">
                <label
                    htmlFor={`${htmlId}_max`}
                    className="px-2 flex items-center w-1/3"
                >
                    Maximum value{" "}
                    {trackerName ? `for "${trackerName ?? ""}"` : ""}
                </label>
                <input
                    id={`${htmlId}_max`}
                    className="flex-1"
                    type="number"
                    value={maxValue}
                    onChange={(input) =>
                        setMaxValue(Number.parseInt(input.target.value, 10))
                    }
                    min={5}
                />
            </div>
            <div className="flex py-2">
                <label
                    htmlFor={`${htmlId}_circle`}
                    className="px-2 flex items-center w-1/3"
                >
                    Use circle tracker?
                </label>
                <input
                    id={`${htmlId}_circle`}
                    type="checkbox"
                    checked={useCircle}
                    onChange={(input) => setUseCircle(input.target.checked)}
                    min={0}
                />
            </div>
            <button onClick={submit} className="border-2 p-4 flex-1">
                {submitting ? "Submitting..." : "Submit"}
            </button>
        </div>
    );
}

export default function ControlTrackers(
    props: ControlButtonRootProps & Exclude<Trackers, "componentType">,
) {
    return (
        <div>
            <h2 className="text-3xl">Trackers</h2>
            <div className="m-8">
                {Object.entries(props.trackers).map(([key, tracker]) => (
                    <TrackerWrapper
                        key={key}
                        label={key}
                        id={props.id}
                        setAPIResponse={props.setAPIResponse}
                        setError={props.setError}
                        {...tracker}
                    />
                ))}
                <CreateTracker
                    id={props.id}
                    /* Using a key means the form will reset on submit */
                    key={Object.keys(props.trackers).length}
                    setAPIResponse={props.setAPIResponse}
                    setError={props.setError}
                />
            </div>
        </div>
    );
}

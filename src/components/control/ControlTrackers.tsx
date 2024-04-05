import { ControlButtonRootProps } from "@fc/components/ControlTools";
import { SetRunnerRep, SetTracker, Trackers } from "@fc/types/types";
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

    const triggerClick = () => {
        setUpdating(true);

        const toSend: SetTracker = {
            tracker: props.label,
            value: newValue,
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
                <label htmlFor={htmlId} className="px-2 flex items-center">
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
            </div>
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
            </div>
        </div>
    );
}

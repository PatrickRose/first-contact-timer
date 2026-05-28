import { ControlButtonRootProps } from "@fc/components/ControlTools";
import { LightLevel, SetLightLevel } from "@fc/types/types";
import { useState } from "react";
import { ApiResponseDecode } from "@fc/types/io-ts-def";

export default function ControlLightLevel({
    value,
    max,
    id,
    setAPIResponse,
    setError,
}: ControlButtonRootProps & Omit<LightLevel, "componentType">) {
    const [draft, setDraft] = useState(value);
    const [submitting, setSubmitting] = useState(false);

    const send = (next: number) => {
        const clamped = Math.max(0, Math.min(max, next));
        setSubmitting(true);

        const toSend: SetLightLevel = { value: clamped };

        return fetch(`/game/${id}/control/api/light-level`, {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: { "Content-Type": "application/json" },
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
                setDraft(clamped);
            })
            .finally(() => setSubmitting(false));
    };

    const buttonClass =
        "border-2 p-4 text-2xl w-16 disabled:text-gray-500 disabled:border-gray-500";

    return (
        <div className="first-contact-container lg:p-4 lg:bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark">
            <h2 className="text-3xl mt-2 mb-6 uppercase text-center">
                Light Level
            </h2>
            <div className="flex items-center justify-center gap-4 mb-6">
                <button
                    type="button"
                    className={buttonClass}
                    onClick={() => send(value - 1)}
                    disabled={submitting || value <= 0}
                >
                    −
                </button>
                <div className="text-4xl font-semibold min-w-[5rem] text-center">
                    {value} / {max}
                </div>
                <button
                    type="button"
                    className={buttonClass}
                    onClick={() => send(value + 1)}
                    disabled={submitting || value >= max}
                >
                    +
                </button>
            </div>
            <div className="flex items-center justify-center gap-2">
                <input
                    type="number"
                    className="text-xl bg-black text-white border-2 p-2 w-24 text-center"
                    value={draft}
                    min={0}
                    max={max}
                    onChange={(e) =>
                        setDraft(Number.parseInt(e.target.value, 10))
                    }
                />
                <button
                    type="button"
                    className="border-2 p-2 text-xl disabled:text-gray-500 disabled:border-gray-500"
                    onClick={() => send(draft)}
                    disabled={submitting || Number.isNaN(draft)}
                >
                    {submitting ? "Updating..." : "Set"}
                </button>
            </div>
        </div>
    );
}

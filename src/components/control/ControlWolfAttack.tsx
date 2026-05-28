import { ControlButtonRootProps } from "../ControlTools";
import { useState } from "react";
import { ApiResponseDecode } from "@fc/types/io-ts-def";
import { SetWolfAttack } from "@fc/types/types";

export function ControlWolfAttack({
    inProgress,
    alert,
    setAPIResponse,
    id,
}: {
    inProgress: boolean;
    alert?: { text: string; label: string; emoji: string };
} & ControlButtonRootProps) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const label = alert?.label ?? "Wolf attack";
    const emoji = alert?.emoji ?? "🐺";

    const submit = async () => {
        setIsSubmitting(true);

        const toSend: SetWolfAttack = {
            newStatus: !inProgress,
        };

        return fetch(`/game/${id}/control/api/wolf`, {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    response.text().then((text) => console.error(text));
                    return;
                }

                return response.json();
            })
            .then((body) => {
                if (!ApiResponseDecode.is(body)) {
                    console.error(JSON.stringify(body));
                    return;
                }

                setAPIResponse(body);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <div className="first-contact-container lg:p-4 lg:bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark">
            <h2 className="text-3xl mt-2 mb-6 uppercase text-center">
                {emoji} {label} {emoji}
            </h2>
            <div className="flex flex-col">
                {isSubmitting ? (
                    <p>Updating {label.toLowerCase()} status...</p>
                ) : (
                    <button className="w-full border-2 p-4" onClick={submit}>
                        {inProgress ? "End" : "Begin"} {label.toLowerCase()}
                    </button>
                )}
            </div>
        </div>
    );
}

import { ControlButtonRootProps } from "../ControlTools";
import { useState } from "react";
import { ApiResponseDecode } from "@fc/types/io-ts-def";
import { SetWolfAttack } from "@fc/types/types";

export function ControlWolfAttack({
    inProgress,
    setAPIResponse,
    setError,
    id,
}: { inProgress: boolean } & ControlButtonRootProps) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
        <div className="first-contact-container lg:p-4 pb-24 lg:pb-4 lg:bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark">
            <h2 className="text-3xl mt-2 mb-6 uppercase text-center">
                🐺Wolf Attack🐺
            </h2>
            <div className="flex flex-col">
                {isSubmitting ? (
                    <p>Updating wolf attack status...</p>
                ) : (
                    <button className="w-full border-2 p-4" onClick={submit}>
                        {inProgress ? "End wolf attack" : "Begin wolf attack"}
                    </button>
                )}
            </div>
        </div>
    );
}

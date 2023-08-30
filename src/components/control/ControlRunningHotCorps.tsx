import { ControlButtonRootProps } from "../ControlTools";
import { RunningHotCorps, SetSharePrice } from "../../types/types";
import { corpImages, corpNames } from "../RunningHot/helpers";
import Image from "next/image";
import { useState } from "react";
import { ApiResponseDecode } from "../../types/io-ts-def";

function CorpField({
    id,
    setError,
    setAPIResponse,
    corpName,
    currentVal,
}: ControlButtonRootProps & {
    corpName: keyof RunningHotCorps["sharePrice"];
    currentVal: RunningHotCorps["sharePrice"]["GenEq"];
}) {
    const [updating, setUpdating] = useState<boolean>(false);

    const onClick = (changeAmount: number) => {
        setUpdating(true);

        const toSend: SetSharePrice = {
            corpName: corpName,
            diff: changeAmount,
        };

        return fetch(`/game/${id}/control/api/shareprice`, {
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
                <div className="flex-0">
                    <Image
                        src={corpImages[corpName]}
                        alt={corpNames[corpName]}
                        height={64}
                        width={64}
                    />
                </div>
                <div className="flex-1 flex justify-center items-center text-center px-2 text-2xl">
                    {corpNames[corpName]}
                </div>
                <div className="flex justify-center items-center text-center text-4xl px-2">
                    {currentVal}
                </div>
            </div>
            <div className="flex justify-center">
                {updating ? (
                    <span>Updating share price...</span>
                ) : (
                    [-3, -2, -1, 1, 2, 3].map((val) => {
                        return (
                            <button
                                onClick={() => onClick(val)}
                                className="border-2 p-4 flex-1"
                                key={val}
                            >
                                {val < 0 ? val : `+${val}`}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export function ControlRunningHotCorps(
    props: ControlButtonRootProps & Exclude<RunningHotCorps, "componentType">,
) {
    const corps = [
        "GenEq",
        "Gordon",
        "MCM",
        "ANT",
        "DTC",
    ] satisfies (keyof RunningHotCorps["sharePrice"])[];

    return (
        <div>
            <h2 className="text-3xl">Share Prices</h2>
            <div className="m-8">
                {corps.map((val) => (
                    <CorpField
                        key={val}
                        id={props.id}
                        setAPIResponse={props.setAPIResponse}
                        setError={props.setError}
                        corpName={val}
                        currentVal={props.sharePrice[val]}
                    />
                ))}
            </div>
        </div>
    );
}

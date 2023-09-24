import { ControlButtonRootProps } from "../ControlTools";
import { GangNames, RunningHotRunners, SetRunnerRep } from "@fc/types/types";
import {
    ALL_GANGS,
    corpImages,
    corpNames,
    gangImages,
    gangNames,
} from "../RunningHot/helpers";
import Image from "next/image";
import { useState } from "react";
import { ApiResponseDecode } from "@fc/types/io-ts-def";

function GangField({
    id,
    setError,
    setAPIResponse,
    runnerName,
    runnerRep,
}: ControlButtonRootProps & {
    runnerName: string;
    runnerRep: number;
}) {
    const [updating, setUpdating] = useState<boolean>(false);

    const onClick = (changeAmount: number) => {
        setUpdating(true);

        const toSend: SetRunnerRep = {
            runnerName,
            diff: changeAmount,
        };

        return fetch(`/game/${id}/control/api/runnerrep`, {
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
        <div className="flex-col p-2 border-t-2 m-1 my-3">
            <div className="flex justify-center text-center p-2">
                <div className="flex-1 flex justify-center items-center text-center px-2 text-2xl">
                    {runnerName}
                </div>
                <div className="flex justify-center items-center text-center text-4xl px-2">
                    {runnerRep}
                </div>
            </div>
            <div className="flex justify-center">
                {updating ? (
                    <span>Updating reputation...</span>
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

function GangWrapper({
    id,
    setError,
    setAPIResponse,
    gangName,
    runners,
}: ControlButtonRootProps & {
    gangName: GangNames;
    runners: RunningHotRunners["rep"];
}) {
    const currentVal = Object.values(runners).reduce(
        (previousValue, { reputation }) => previousValue + reputation,
        0,
    );

    return (
        <div className="flex-col p-2 border-2 m-1 my-3 rounded-lg">
            <div className="flex justify-center text-center">
                <div className="flex-0">
                    <Image
                        src={gangImages[gangName]}
                        alt={gangNames[gangName]}
                        height={64}
                        width={64}
                    />
                </div>
                <div className="flex-1 flex justify-center items-center text-center px-2 text-2xl">
                    {gangNames[gangName]}
                </div>
                <div className="flex justify-center items-center text-center text-4xl px-2">
                    Total: {currentVal}
                </div>
            </div>
            {Object.entries(runners).map(([key, value]) => {
                return (
                    <GangField
                        key={key}
                        id={id}
                        setAPIResponse={setAPIResponse}
                        setError={setError}
                        runnerName={key}
                        runnerRep={value.reputation}
                    />
                );
            })}
        </div>
    );
}

export function ControlRunningHotRunners(
    props: ControlButtonRootProps & Exclude<RunningHotRunners, "componentType">,
) {
    const gangs: Record<GangNames, RunningHotRunners["rep"]> = {
        Dancers: {},
        Facers: {},
        G33ks: {},
        Gruffsters: {},
    };

    Object.entries(props.rep).forEach(([key, val]) => {
        gangs[val.gang][key] = val;
    });

    return (
        <div>
            <h2 className="text-3xl">Runner Reputation</h2>
            <div className="m-8">
                {ALL_GANGS.map((val) => (
                    <GangWrapper
                        key={val}
                        id={props.id}
                        setAPIResponse={props.setAPIResponse}
                        setError={props.setError}
                        gangName={val}
                        runners={gangs[val]}
                    />
                ))}
            </div>
        </div>
    );
}

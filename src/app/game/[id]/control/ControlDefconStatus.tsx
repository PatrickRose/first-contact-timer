"use client";

import {DefconAPIBody, DefconComponent, DefconCountry, DefconStatus} from "../../../../types/types";
import {ApiResponseDecode} from "../../../../types/io-ts-def";
import * as React from "react";
import {useState} from "react";
import {
    BACKGROUNDS,
    CountryDefcon as CountryDefconDisplay,
    DefconStateInfo
} from "../../../../components/DefconStatuses";
import {ControlButtonProps, ControlButtonRootProps} from "../../../../components/ControlTools";

type CountryDefconProps = {
    stateName: keyof DefconComponent["countries"];
    country: DefconCountry;
    triggerUpdate: (
        countryName: CountryDefconProps["stateName"],
        status: DefconCountry["status"]
    ) => Promise<void>;
};

function DefconState({
                         defconNumber,
                         active,
                         onClick,
                     }: {
    defconNumber: DefconStatus;
    active: boolean;
    onClick: () => void;
}) {
    const backgroundDef = BACKGROUNDS[defconNumber];
    const background: string[] = [
        active ? backgroundDef.activeBorder : backgroundDef.inactiveBorder,
    ];

    if (active) {
        background.push("delay-250");

        background.push(backgroundDef.background);
    }

    return (
        <button
            onClick={onClick}
            className={`p-2 text-center items-center flex flex-col transition duration-500 border-4 ${background.join(
                " "
            )}`}
        >
            <span className="hidden lg:block">Defcon</span>
            <span>{defconNumber}</span>
        </button>
    );
}

function CountryDefcon({
                           stateName,
                           country,
                           triggerUpdate,
                       }: CountryDefconProps) {
    const [updatingTo, setUpdatingTo] = useState<DefconStatus | null>(null);

    const {status, shortName, countryName} = country;

    const onClick = (newStatus: DefconStatus) => {
        setUpdatingTo(newStatus);
        triggerUpdate(stateName, newStatus).finally(() => setUpdatingTo(null));
    };

    return (
        <div className={`flex mx-1 bg-black`}>
            <div
                className={`flex-1 justify-center items-center content-center pt-2 pr-4 border-2 transition duration-500 ${BACKGROUNDS[status].activeBackground}`}
            >
                <DefconStateInfo inner={country.shortName} />
                <DefconStateInfo inner={country.countryName} flex={true} />
            </div>
            {updatingTo === null ? (
                <React.Fragment>
                    <DefconState
                        defconNumber="hidden"
                        active={status == "hidden"}
                        onClick={() => onClick("hidden")}
                    />
                    <DefconState
                        defconNumber={3}
                        active={status == 3}
                        onClick={() => onClick(3)}
                    />
                    <DefconState
                        defconNumber={2}
                        active={status == 2}
                        onClick={() => onClick(2)}
                    />
                    <DefconState
                        defconNumber={1}
                        active={status == 1}
                        onClick={() => onClick(1)}
                    />
                </React.Fragment>
            ) : (
                <div className="flex-1">
                    Updating to defcon level {updatingTo}...
                </div>
            )}
        </div>
    );
}

export function ControlDefconStatus({
                                        defcon,
                                        id,
                                        setAPIResponse,
                                        setError,
                                    }: { defcon: DefconComponent } & ControlButtonRootProps) {
    const triggerUpdate: CountryDefconProps["triggerUpdate"] = async (
        countryName: CountryDefconProps["stateName"],
        status: DefconStatus
    ): Promise<void> => {
        const apiReqBody: DefconAPIBody = {
            newStatus: status,
            stateName: countryName,
        };

        return fetch(`/game/${id}/control/api/defcon`, {
            method: "post",
            body: JSON.stringify(apiReqBody),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((body) => {
                if (body.ok) {
                    return body.json();
                } else {
                    return Promise.reject(body);
                }
            })
            .then((result) => {
                if (ApiResponseDecode.is(result)) {
                    setAPIResponse(result);
                    setError(undefined);
                } else {
                    return Promise.reject(result);
                }
            })
            .catch((error) => {
                if (error instanceof Response) {
                    error
                        .json()
                        .then((body) => {
                            if (body.error) {
                                setError(body.error);
                            }
                        })
                        .catch((e: Error) => {
                            setError(`${e}`);
                        });
                } else if (error.error) {
                    setError(error.error);
                } else {
                    setError("Unknown error");
                }
            });
    };

    return (
        <div className="flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(defcon.countries).map(([country, status]) => {
                    return (
                        <CountryDefcon
                            key={country}
                            stateName={country}
                            country={status}
                            triggerUpdate={triggerUpdate}
                        />
                    );
                })}
            </div>
        </div>
    );
}

import { ApiResponse, ControlAPI, Game } from "../types/types";
import {
    FontAwesomeIcon,
    FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import { faBackward } from "@fortawesome/free-solid-svg-icons/faBackward";
import { faFastBackward } from "@fortawesome/free-solid-svg-icons/faFastBackward";
import { faForward } from "@fortawesome/free-solid-svg-icons/faForward";
import { faFastForward } from "@fortawesome/free-solid-svg-icons/faFastForward";
import { faPause } from "@fortawesome/free-solid-svg-icons/faPause";
import { faPlay } from "@fortawesome/free-solid-svg-icons/faPlay";
import React, { useState } from "react";
import { ApiResponseDecode } from "../types/io-ts-def";
import { ControlComponentMapper } from "../lib/ComponentMapper";

type ControlButtonMainProps = {
    icon: FontAwesomeIconProps["icon"];
    title: string;
};

export type ControlButtonRootProps = {
    id: Game["_id"];
    setAPIResponse: (newAPIResponse: ApiResponse) => void;
    setError: (error: string | undefined) => void;
};
export type ControlButtonProps = ControlButtonMainProps &
    ControlButtonRootProps & {
        action: ControlAPI["action"];
    };

const CONTROL_BUTTONS: Record<
    ControlAPI["action"],
    {
        props: ControlButtonMainProps;
        visibleForState: (
            game: Game["setupInformation"],
            apiResponse: ApiResponse
        ) => boolean;
        order: number;
    }
> = {
    "back-phase": {
        props: {
            icon: faBackward,
            title: "Go back a phase",
        },
        visibleForState: function () {
            return true;
        },
        order: 2,
    },
    "back-turn": {
        props: {
            icon: faFastBackward,
            title: "Go back a turn",
        },
        visibleForState: function () {
            return true;
        },
        order: 1,
    },
    "forward-phase": {
        props: {
            icon: faForward,
            title: "Go forward a phase",
        },
        visibleForState: function () {
            return true;
        },
        order: 4,
    },
    "forward-turn": {
        props: {
            icon: faFastForward,
            title: "Go forward a turn",
        },
        visibleForState: function (
            game: Game["setupInformation"],
            { phase }: ApiResponse
        ) {
            return phase != game.phases.length;
        },
        order: 5,
    },
    pause: {
        props: {
            icon: faPause,
            title: "Pause the game",
        },
        visibleForState: function (_, { active }) {
            return active;
        },
        order: 3,
    },
    play: {
        props: {
            icon: faPlay,
            title: "Continue the game from this state",
        },
        visibleForState: function (_, { active }) {
            return !active;
        },
        order: 3,
    },
};

function ControlButton({
    id,
    icon,
    title,
    setAPIResponse,
    action,
    setError,
}: ControlButtonProps) {
    const [buttonPressed, setButtonPressed] = useState<boolean>(false);

    const handleClick = () => {
        setButtonPressed(true);

        const body: ControlAPI = {
            action,
        };

        fetch(`/game/${id}/control/api`, {
            body: JSON.stringify(body),
            method: "post",
        })
            .then((response) => response.json())
            .then((result) => {
                if (!ApiResponseDecode.is(result)) {
                    setError("Invalid API Response");
                }

                setAPIResponse(result);
            })
            .catch((error) => console.error(error))
            .finally(() => setButtonPressed(false));
    };

    return (
        <button
            type="button"
            className="bg-turn-counter-future border-black hover:bg-turn-counter-current hover:border-yellow-300  border-4 rounded p-3 px-5 disabled:opacity-75 "
            onClick={handleClick}
            title={title}
            disabled={buttonPressed}
        >
            <FontAwesomeIcon icon={icon} size="lg" />
            <span className="sr-only">{title}</span>
        </button>
    );
}

export default function ControlTools({
    game,
    apiResponse,
    setApiResponse,
}: {
    game: Game;
    apiResponse: ApiResponse;
    setApiResponse: (apiResponse: ApiResponse) => void;
}) {
    const actions = Object.entries(CONTROL_BUTTONS)
        .filter(([_, val]) =>
            val.visibleForState(game.setupInformation, apiResponse)
        )
        .sort(([_, a], [__, b]) => {
            return a.order - b.order;
        });

    const [error, setError] = useState<string>();

    return (
        <div className="container py-4 lg:p-4 pb-24 lg:pb-4 lg:bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark">
            <h2 className="text-2xl mt-2 mb-6 uppercase text-center">
                Control Tools
            </h2>
            <div className="flex w-full pb-4 justify-around">
                {actions.map(([key, { props }]) => {
                    return (
                        <ControlButton
                            key={key}
                            icon={props.icon}
                            title={props.title}
                            id={game._id}
                            setAPIResponse={setApiResponse}
                            action={key as keyof typeof CONTROL_BUTTONS}
                            setError={setError}
                        />
                    );
                })}
            </div>
            <div className="flex w-full p-4 justify-around">
                {error !== undefined ? (
                    <div className="bg-red-600 text-white mt-4 p-4">
                        <p>
                            There was an issue running the Control command -
                            wait and try again. If it persists, grab Paddy.
                        </p>
                        <p>
                            Message was:{" "}
                            <code className="bg-black px-2">{error}</code>
                        </p>
                    </div>
                ) : null}
            </div>
            {apiResponse.components.map((component, key) => (
                <ControlComponentMapper
                    key={key}
                    component={component}
                    id={game._id}
                    setAPIResponse={setApiResponse}
                    setError={setError}
                />
            ))}
        </div>
    );
}

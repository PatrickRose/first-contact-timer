import { ApiResponse, ControlAPI, Game } from "@fc/types/types";
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
import QRCode from "react-qr-code";
import { ApiResponseDecode } from "@fc/types/io-ts-def";
import { ControlComponentMapper } from "@fc/lib/ComponentMapper";

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
            apiResponse: ApiResponse,
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
            { phase }: ApiResponse,
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
            .then(async (response) => {
                if (!response.ok) {
                    // Include the response body - the control routes return
                    // useful error messages.
                    const body = await response.text().catch(() => "");
                    setError(
                        `Control command failed (HTTP ${response.status})${
                            body ? `: ${body}` : ""
                        }`,
                    );
                    return;
                }

                const result = await response.json();

                if (!ApiResponseDecode.is(result)) {
                    setError("Invalid API Response");
                    return;
                }

                setError(undefined);
                setAPIResponse(result);
            })
            .catch((error) => setError(String(error)))
            .finally(() => setButtonPressed(false));
    };

    return (
        <button
            type="button"
            className="bg-turn-counter-future border-black hover:bg-turn-counter-current hover:border-yellow-300  border-4 rounded-sm p-3 px-5 disabled:opacity-75 "
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
        .filter((val) =>
            val[1].visibleForState(game.setupInformation, apiResponse),
        )
        .sort((a, b) => {
            return a[1].order - b[1].order;
        });

    const [error, setError] = useState<string>();
    const [showQR, setShowQR] = useState<boolean>(false);
    const [playerUrl] = useState<string>(() =>
        typeof window !== "undefined"
            ? `${window.location.origin}/game/${game._id}`
            : "",
    );

    return (
        <div className="first-contact-container py-4 lg:p-4 lg:bg-linear-to-b from-turn-counter-past-light to-turn-counter-past-dark">
            <h2 className="text-2xl mt-2 mb-6 uppercase text-center">
                Control Tools
            </h2>
            <div className="flex w-full justify-around">
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
            <div className="flex flex-col items-center w-full p-4">
                <button
                    type="button"
                    className="bg-turn-counter-future border-black hover:bg-turn-counter-current hover:border-yellow-300 border-4 rounded-sm p-2 px-4"
                    onClick={() => setShowQR((prev) => !prev)}
                    aria-expanded={showQR}
                >
                    {showQR ? "Hide QR code" : "Show QR code"}
                </button>
                {showQR && playerUrl !== "" ? (
                    <div className="mt-4 max-w-xs mx-auto flex flex-col items-center">
                        <div className="bg-white p-4">
                            <QRCode value={playerUrl} />
                        </div>
                        <code className="mt-2 bg-black text-white px-2 py-1 text-sm break-all text-center">
                            {playerUrl}
                        </code>
                    </div>
                ) : null}
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

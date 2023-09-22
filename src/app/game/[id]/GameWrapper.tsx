"use client";

import { ApiResponse, Game } from "@fc/types/types";
import React, { useEffect, useState } from "react";
import { toApiResponse } from "@fc/server/turn";
import useInterval from "../../../lib/useInterval";
import { ApiResponseDecode } from "@fc/types/io-ts-def";
import ControlTools from "../../../components/ControlTools";
import PressForm from "./press/PressForm";
import { FirstContactTheme } from "../../../components/theme/first-contact/FirstContactTheme";
import { AftermathTheme } from "../../../components/theme/aftermath/FirstContactTheme";

const triggersAudio: (keyof ApiResponse)[] = ["active", "turnNumber", "phase"];

type GameWrapperProps = {
    game: Game;
} & (
    | {
          mode: "Player" | "Control";
      }
    | {
          mode: "Press";
          pressAccount: number;
      }
);
export default function GameWrapper(props: GameWrapperProps) {
    const { game, mode } = props;
    const [apiResponse, setAPIResponse] = useState<ApiResponse>(
        toApiResponse(game),
    );

    const [audio, setAudio] = useState<HTMLAudioElement>();

    useEffect(() => setAudio(new Audio("/turn-change.mp3")), []);
    const [fetching, setFetching] = useState<boolean>(false);

    const delay = Math.min(apiResponse.phaseEnd * 1000, 5000);
    useInterval(
        () => {
            if (fetching) {
                return;
            }

            setFetching(true);

            fetch(`/game/${game._id}/api`, {
                cache: "no-cache",
                headers: { accept: "application/json" },
            })
                .then((response) => response.json())
                .then((body) => {
                    if (ApiResponseDecode.is(body)) {
                        setAPIResponse(body);

                        if (
                            triggersAudio.some(
                                (val) => body[val] != apiResponse[val],
                            )
                        ) {
                            audio?.play().catch((e) => console.log(e));
                        }
                    } else {
                        throw new Error("Body did not match API");
                    }
                })
                .catch((error) => console.error(error))
                .finally(() => setFetching(false));
        },
        delay == 0 ? 100 : delay,
    );

    useInterval(() => {
        if (!apiResponse.active) {
            return;
        }

        const phaseEnd = apiResponse.phaseEnd;

        if (phaseEnd == 0) {
            return;
        }

        const newPhaseEnd = Math.max(phaseEnd - 1, 0);
        setAPIResponse({ ...apiResponse, phaseEnd: newPhaseEnd });
    }, 1000);

    let child: React.ReactNode = null;
    let manageTabTitle: string | null = null;

    switch (mode) {
        case "Control":
            child = (
                <ControlTools
                    game={game}
                    apiResponse={apiResponse}
                    setApiResponse={setAPIResponse}
                />
            );
            manageTabTitle = "Control Tools";
            break;
        case "Press":
            child = (
                <PressForm
                    game={game}
                    apiResponse={apiResponse}
                    setApiResponse={setAPIResponse}
                    pressAccount={props.pressAccount}
                />
            );
            manageTabTitle = "Press Tools";
            break;
    }

    if (game.setupInformation.theme === "aftermath") {
        return (
            <AftermathTheme
                game={game}
                apiResponse={apiResponse}
                childComponent={child}
                manageTabTitle={manageTabTitle}
            />
        );
    }

    return (
        <FirstContactTheme
            game={game}
            apiResponse={apiResponse}
            childComponent={child}
            manageTabTitle={manageTabTitle}
        />
    );
}
